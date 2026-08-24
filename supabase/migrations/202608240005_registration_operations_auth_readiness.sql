begin;

alter table public.tournament_registrations
  add column reviewed_by_account_id uuid references public.accounts(id) on delete set null,
  add column reviewed_at timestamptz,
  add column review_note text;

alter table public.tournament_registrations
  add constraint registration_review_note_length check (
    review_note is null or char_length(review_note) <= 500
  ),
  add constraint registration_pending_review_metadata_empty check (
    status <> 'PENDING'
    or (
      reviewed_by_account_id is null
      and reviewed_at is null
      and review_note is null
    )
  );

create table public.registration_review_events (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.tournament_registrations(id) on delete cascade,
  from_status public.registration_status not null,
  to_status public.registration_status not null,
  actor_account_id uuid references public.accounts(id) on delete set null,
  note text check (note is null or char_length(note) <= 500),
  created_at timestamptz not null default now()
);

create index registration_review_events_registration_created_idx
on public.registration_review_events (registration_id, created_at);

create or replace function public.is_admin_review_transition_allowed(
  p_from_status public.registration_status,
  p_to_status public.registration_status
)
returns boolean
language sql
immutable
set search_path = public, pg_temp
as $$
  select case p_from_status
    when 'PENDING' then p_to_status in ('APPROVED', 'WAITLISTED', 'REJECTED')
    when 'WAITLISTED' then p_to_status in ('APPROVED', 'REJECTED')
    when 'APPROVED' then p_to_status in ('WAITLISTED', 'REJECTED')
    else false
  end;
$$;

create or replace function public.restrict_player_registration_update()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  tournament_row public.tournaments%rowtype;
  important_fields_changed boolean;
begin
  if old.account_id <> public.current_account_id() and not public.is_admin() then
    raise exception 'REGISTRATION_OWNERSHIP_REQUIRED';
  end if;

  select * into tournament_row
  from public.tournaments
  where id = old.tournament_id
  for update;

  if not found then raise exception 'TOURNAMENT_NOT_FOUND'; end if;

  if new.tournament_id is distinct from old.tournament_id
    or new.account_id is distinct from old.account_id
    or new.created_at is distinct from old.created_at
  then
    raise exception 'REGISTRATION_IDENTITY_IMMUTABLE';
  end if;

  if public.is_admin() then
    if tournament_row.status not in ('REGISTRATION', 'REGISTRATION_CLOSED') then
      raise exception 'ROSTER_LOCKED';
    end if;

    if new.status is not distinct from old.status
      or not public.is_admin_review_transition_allowed(old.status, new.status)
    then
      raise exception 'INVALID_ADMIN_REVIEW_TRANSITION';
    end if;

    if new.game_name is distinct from old.game_name
      or new.game_tag is distinct from old.game_tag
      or new.rank_snapshot is distinct from old.rank_snapshot
      or new.primary_role is distinct from old.primary_role
      or new.secondary_role is distinct from old.secondary_role
      or new.group_nickname_snapshot is distinct from old.group_nickname_snapshot
      or new.note is distinct from old.note
    then
      raise exception 'ADMIN_REVIEW_FIELDS_IMMUTABLE';
    end if;

    new.reviewed_by_account_id := public.current_account_id();
    new.reviewed_at := now();
    new.review_note := nullif(btrim(new.review_note), '');
    return new;
  end if;

  if tournament_row.status <> 'REGISTRATION'
    or now() < tournament_row.registration_start_at
    or now() > tournament_row.registration_end_at
  then
    raise exception 'ROSTER_LOCKED';
  end if;

  if new.reviewed_by_account_id is distinct from old.reviewed_by_account_id
    or new.reviewed_at is distinct from old.reviewed_at
    or new.review_note is distinct from old.review_note
  then
    raise exception 'REVIEW_METADATA_IMMUTABLE';
  end if;

  important_fields_changed :=
    new.game_name is distinct from old.game_name
    or new.game_tag is distinct from old.game_tag
    or new.rank_snapshot is distinct from old.rank_snapshot
    or new.primary_role is distinct from old.primary_role
    or new.secondary_role is distinct from old.secondary_role;

  if old.status = 'REJECTED' and new.status = 'PENDING' then
    new.reviewed_by_account_id := null;
    new.reviewed_at := null;
    new.review_note := null;
    return new;
  end if;

  if new.status = 'CANCELLED' then
    if old.status not in ('PENDING', 'APPROVED', 'WAITLISTED')
      or important_fields_changed
      or new.group_nickname_snapshot is distinct from old.group_nickname_snapshot
      or new.note is distinct from old.note
    then
      raise exception 'INVALID_CANCELLATION';
    end if;
    return new;
  end if;

  if old.status not in ('PENDING', 'APPROVED', 'WAITLISTED') then
    raise exception 'REGISTRATION_NOT_EDITABLE';
  end if;

  if important_fields_changed and old.status in ('APPROVED', 'WAITLISTED') then
    new.status := 'PENDING';
    new.reviewed_by_account_id := null;
    new.reviewed_at := null;
    new.review_note := null;
  elsif new.status <> old.status then
    raise exception 'PLAYER_STATUS_CHANGE_FORBIDDEN';
  end if;

  return new;
end;
$$;

create or replace function public.record_registration_review_event()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.status is distinct from old.status then
    insert into public.registration_review_events (
      registration_id,
      from_status,
      to_status,
      actor_account_id,
      note
    ) values (
      new.id,
      old.status,
      new.status,
      public.current_account_id(),
      case
        when new.reviewed_by_account_id is null then old.review_note
        else new.review_note
      end
    );
  end if;
  return new;
end;
$$;

create trigger registrations_record_review_event
after update of status on public.tournament_registrations
for each row execute function public.record_registration_review_event();

alter table public.registration_review_events enable row level security;

create policy registration_review_events_admin_read
on public.registration_review_events
for select to authenticated
using (public.is_admin());

revoke all on table public.registration_review_events from anon, authenticated;
grant select on table public.registration_review_events to authenticated;

create or replace function public.get_my_registration_review_history(p_registration_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  history jsonb;
begin
  if public.current_account_id() is null then raise exception 'AUTH_REQUIRED'; end if;
  if not exists (
    select 1
    from public.tournament_registrations
    where id = p_registration_id and account_id = public.current_account_id()
  ) then
    raise exception 'REGISTRATION_OWNERSHIP_REQUIRED';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'from_status', event.from_status,
        'to_status', event.to_status,
        'note', event.note,
        'created_at', event.created_at
      ) order by event.created_at asc
    ),
    '[]'::jsonb
  ) into history
  from public.registration_review_events event
  where event.registration_id = p_registration_id;

  return history;
end;
$$;

alter table public.wechat_identities
  drop constraint wechat_identity_openid_unique;

alter table public.wechat_identities
  add constraint wechat_identity_app_openid_unique unique (app_id, openid);

create or replace function public.upsert_verified_wechat_account(
  p_auth_user_id uuid,
  p_app_id text,
  p_openid text,
  p_unionid text default null,
  p_wechat_nickname text default null,
  p_wechat_avatar_url text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  identity_row public.wechat_identities%rowtype;
  auth_account public.accounts%rowtype;
  identity_match_count integer;
  resolved_account_id uuid;
begin
  if p_auth_user_id is null
    or nullif(btrim(p_app_id), '') is null
    or nullif(btrim(p_openid), '') is null
  then
    raise exception 'VERIFIED_WECHAT_IDENTITY_REQUIRED';
  end if;

  select count(distinct account_id) into identity_match_count
  from public.wechat_identities
  where (app_id = p_app_id and openid = p_openid)
     or (p_unionid is not null and unionid = p_unionid);

  if identity_match_count > 1 then raise exception 'WECHAT_IDENTITY_CONFLICT'; end if;

  select * into identity_row
  from public.wechat_identities
  where (app_id = p_app_id and openid = p_openid)
     or (p_unionid is not null and unionid = p_unionid)
  order by case when app_id = p_app_id and openid = p_openid then 0 else 1 end
  limit 1
  for update;

  select * into auth_account
  from public.accounts
  where auth_user_id = p_auth_user_id
  for update;

  if identity_row.id is not null
    and auth_account.id is not null
    and identity_row.account_id <> auth_account.id
  then
    raise exception 'WECHAT_IDENTITY_ALREADY_LINKED';
  end if;

  if identity_row.id is not null then
    resolved_account_id := identity_row.account_id;
    if exists (
      select 1 from public.accounts
      where id = resolved_account_id
        and auth_user_id is not null
        and auth_user_id <> p_auth_user_id
    ) then
      raise exception 'WECHAT_IDENTITY_ALREADY_LINKED';
    end if;

    update public.accounts
    set auth_provider = 'WECHAT', auth_user_id = p_auth_user_id
    where id = resolved_account_id;

    update public.wechat_identities
    set unionid = coalesce(p_unionid, unionid),
        wechat_nickname = p_wechat_nickname,
        wechat_avatar_url = p_wechat_avatar_url
    where id = identity_row.id;
  elsif auth_account.id is not null then
    resolved_account_id := auth_account.id;
    update public.accounts set auth_provider = 'WECHAT' where id = resolved_account_id;
    insert into public.wechat_identities (
      account_id, app_id, openid, unionid, wechat_nickname, wechat_avatar_url
    ) values (
      resolved_account_id, p_app_id, p_openid, p_unionid, p_wechat_nickname, p_wechat_avatar_url
    );
  else
    insert into public.accounts (auth_provider, auth_user_id)
    values ('WECHAT', p_auth_user_id)
    returning id into resolved_account_id;

    insert into public.wechat_identities (
      account_id, app_id, openid, unionid, wechat_nickname, wechat_avatar_url
    ) values (
      resolved_account_id, p_app_id, p_openid, p_unionid, p_wechat_nickname, p_wechat_avatar_url
    );
  end if;

  return resolved_account_id;
exception
  when unique_violation then raise exception 'WECHAT_IDENTITY_ALREADY_LINKED';
end;
$$;

revoke all on function public.is_admin_review_transition_allowed(public.registration_status, public.registration_status) from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;
do $$
begin
  -- Migration 002 drops this legacy trigger function. Keep the hardening safe for
  -- databases that retained it without making the fresh 001 -> 005 chain fail.
  if to_regprocedure('public.handle_new_user_role()') is not null then
    execute 'revoke all on function public.handle_new_user_role() from public, anon, authenticated';
  end if;
end;
$$;
revoke all on function public.handle_new_auth_user_account() from public, anon, authenticated;
revoke all on function public.hash_tournament_invite_code() from public, anon, authenticated;
revoke all on function public.enforce_tournament_status_transition() from public, anon, authenticated;
revoke all on function public.normalize_registration_game_id() from public, anon, authenticated;
revoke all on function public.enforce_registration_insert() from public, anon, authenticated;
revoke all on function public.enforce_approved_capacity() from public, anon, authenticated;
revoke all on function public.enforce_player_limit_not_below_approved() from public, anon, authenticated;
revoke all on function public.restrict_player_registration_update() from public, anon, authenticated;
revoke all on function public.record_registration_review_event() from public, anon, authenticated;
revoke all on function public.get_my_registration_review_history(uuid) from public;
grant execute on function public.get_my_registration_review_history(uuid) to authenticated;
revoke all on function public.upsert_verified_wechat_account(uuid, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.upsert_verified_wechat_account(uuid, text, text, text, text, text) to service_role;
revoke all on function public.user_owns_registration(uuid) from authenticated;

comment on column public.tournament_registrations.reviewed_by_account_id is 'Internal organizer account reference; application responses expose a safe label instead of this ID.';
comment on table public.registration_review_events is 'Private append-only registration status audit history. Players use the safe own-history RPC; admins may read full rows.';
comment on column public.wechat_identities.openid is 'Verified OAuth OpenID scoped by app_id; never user-entered or exposed to browser roles.';
comment on column public.wechat_identities.unionid is 'Verified OAuth UnionID, globally unique when available for cross-application identity resolution.';

commit;
