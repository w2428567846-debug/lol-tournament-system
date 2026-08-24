begin;

-- Provider identities are private infrastructure data. Tournament records only
-- reference accounts, so changing the authentication provider never rewrites
-- registration history.
create table public.wechat_identities (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  app_id text not null,
  openid text not null,
  unionid text,
  wechat_nickname text check (wechat_nickname is null or char_length(wechat_nickname) <= 100),
  wechat_avatar_url text check (wechat_avatar_url is null or char_length(wechat_avatar_url) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint wechat_identity_app_id_not_blank check (btrim(app_id) <> ''),
  constraint wechat_identity_openid_not_blank check (btrim(openid) <> ''),
  constraint wechat_identity_unionid_not_blank check (unionid is null or btrim(unionid) <> ''),
  constraint wechat_identity_openid_unique unique (openid)
);

create unique index wechat_identities_unionid_unique
on public.wechat_identities (unionid)
where unionid is not null;

create index wechat_identities_account_idx on public.wechat_identities (account_id);

create trigger wechat_identities_set_updated_at
before update on public.wechat_identities
for each row execute function public.set_updated_at();

insert into public.wechat_identities (
  account_id, app_id, openid, unionid, wechat_nickname, wechat_avatar_url, created_at, updated_at
)
select id, 'legacy-primary', wechat_openid, wechat_unionid, wechat_nickname, wechat_avatar_url, created_at, updated_at
from public.accounts
where auth_provider = 'WECHAT' and wechat_openid is not null
on conflict (openid) do nothing;

drop trigger if exists auth_user_created_account on auth.users;
drop function if exists public.handle_new_auth_user_account();
drop function if exists public.upsert_verified_wechat_account(uuid, text, text, text, text);

drop index if exists public.accounts_wechat_openid_unique;
drop index if exists public.accounts_wechat_unionid_unique;
alter table public.accounts drop constraint if exists provider_identity_shape;
alter table public.accounts drop constraint if exists wechat_openid_not_blank;
alter table public.accounts drop constraint if exists wechat_unionid_not_blank;
alter table public.accounts drop column wechat_openid;
alter table public.accounts drop column wechat_unionid;
alter table public.accounts drop column wechat_nickname;
alter table public.accounts drop column wechat_avatar_url;

create or replace function public.handle_new_auth_user_account()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  requested_provider text := coalesce(new.raw_app_meta_data ->> 'rift_auth_provider', 'EMAIL_DEV');
begin
  insert into public.accounts (auth_provider, auth_user_id)
  values (
    case when requested_provider = 'WECHAT' then 'WECHAT'::public.auth_provider else 'EMAIL_DEV'::public.auth_provider end,
    new.id
  )
  on conflict (auth_user_id) do nothing;
  return new;
end;
$$;

create trigger auth_user_created_account
after insert on auth.users
for each row execute function public.handle_new_auth_user_account();

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
  where openid = p_openid
     or (p_unionid is not null and unionid = p_unionid);

  if identity_match_count > 1 then raise exception 'WECHAT_IDENTITY_CONFLICT'; end if;

  select * into identity_row
  from public.wechat_identities
  where openid = p_openid
     or (p_unionid is not null and unionid = p_unionid)
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

alter table public.wechat_identities enable row level security;
revoke all on table public.wechat_identities from anon, authenticated;
revoke all on function public.upsert_verified_wechat_account(uuid, text, text, text, text, text) from public;
grant execute on function public.upsert_verified_wechat_account(uuid, text, text, text, text, text) to service_role;

create or replace function public.current_account_summary()
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'id', account.id,
    'auth_provider', account.auth_provider,
    'role', account.role,
    'wechat_nickname', identity.wechat_nickname,
    'wechat_avatar_url', identity.wechat_avatar_url,
    'created_at', account.created_at,
    'updated_at', account.updated_at
  )
  from public.accounts account
  left join lateral (
    select wechat_nickname, wechat_avatar_url
    from public.wechat_identities
    where account_id = account.id
    order by updated_at desc
    limit 1
  ) identity on true
  where account.id = public.current_account_id();
$$;

revoke all on function public.current_account_summary() from public;
grant execute on function public.current_account_summary() to authenticated;

comment on table public.wechat_identities is 'Private verified WeChat provider identities. Never expose OpenID or UnionID to browser roles.';
comment on column public.wechat_identities.openid is 'Verified OAuth OpenID; globally unique in this single-community product and never user-entered.';
comment on column public.wechat_identities.unionid is 'Verified OAuth UnionID when available; never user-entered.';
comment on table public.accounts is 'Provider-neutral Rift Command accounts used by authorization and tournament business data.';

-- Replace the limited lifecycle enum without mutating the already-applied migration.
drop function if exists public.get_tournament_details(text);
drop function if exists public.register_for_tournament(uuid, public.player_role, public.player_role, text, text);
drop policy if exists tournaments_read_public_or_admin on public.tournaments;

alter table public.tournaments alter column status drop default;
alter type public.tournament_status rename to tournament_status_legacy;
create type public.tournament_status as enum (
  'DRAFT',
  'REGISTRATION',
  'REGISTRATION_CLOSED',
  'ROSTER_LOCKED',
  'TEAM_FORMING',
  'SCHEDULED',
  'ONGOING',
  'FINISHED',
  'CANCELLED'
);
alter table public.tournaments
alter column status type public.tournament_status
using status::text::public.tournament_status;
alter table public.tournaments alter column status set default 'DRAFT';
drop type public.tournament_status_legacy;

create policy tournaments_read_public_or_admin on public.tournaments
for select to anon, authenticated
using ((visibility = 'PUBLIC' and status <> 'DRAFT') or public.is_admin());

create or replace function public.enforce_tournament_status_transition()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.status = old.status then return new; end if;

  if not (
    (old.status = 'DRAFT' and new.status in ('REGISTRATION', 'CANCELLED'))
    or (old.status = 'REGISTRATION' and new.status in ('REGISTRATION_CLOSED', 'CANCELLED'))
    or (old.status = 'REGISTRATION_CLOSED' and new.status in ('REGISTRATION', 'ROSTER_LOCKED', 'CANCELLED'))
    or (old.status = 'ROSTER_LOCKED' and new.status in ('TEAM_FORMING', 'CANCELLED'))
    or (old.status = 'TEAM_FORMING' and new.status in ('SCHEDULED', 'CANCELLED'))
    or (old.status = 'SCHEDULED' and new.status in ('ONGOING', 'CANCELLED'))
    or (old.status = 'ONGOING' and new.status in ('FINISHED', 'CANCELLED'))
  ) then
    raise exception 'INVALID_TOURNAMENT_STATUS_TRANSITION';
  end if;

  return new;
end;
$$;

create trigger tournaments_validate_status_transition
before update of status on public.tournaments
for each row execute function public.enforce_tournament_status_transition();

-- Convert saved profiles into optional Chinese-community registration defaults.
alter table public.player_profiles add column game_name text;
alter table public.player_profiles add column game_tag text;
alter table public.player_profiles rename column rank to current_rank;

update public.player_profiles
set game_name = regexp_replace(riot_id, '#[^#]*$', ''),
    game_tag = substring(riot_id from '#([^#]*)$');

alter table public.player_profiles alter column game_name set not null;
alter table public.player_profiles alter column game_tag set not null;
alter table public.player_profiles
  add constraint player_profile_game_name_length check (char_length(btrim(game_name)) between 1 and 32);
alter table public.player_profiles
  add constraint player_profile_game_tag_format check (game_tag ~ '^[A-Za-z0-9]{1,16}$');

drop index if exists public.player_profiles_riot_id_unique_idx;
alter table public.player_profiles drop column riot_id;
alter table public.player_profiles drop column server;
alter table public.player_profiles drop column display_name;

-- Registration rows become immutable tournament-specific account snapshots.
drop trigger if exists registrations_validate_insert on public.tournament_registrations;
drop trigger if exists registrations_restrict_player_update on public.tournament_registrations;
drop function if exists public.enforce_registration_insert();
drop function if exists public.restrict_player_registration_update();
drop policy if exists registrations_read_own_or_admin on public.tournament_registrations;
drop policy if exists registrations_create_own on public.tournament_registrations;
drop policy if exists registrations_update_own_or_admin on public.tournament_registrations;

alter table public.tournament_registrations add column account_id uuid references public.accounts(id) on delete restrict;
alter table public.tournament_registrations add column game_name text;
alter table public.tournament_registrations add column game_tag text;
alter table public.tournament_registrations add column game_name_normalized text;
alter table public.tournament_registrations add column game_tag_normalized text;
alter table public.tournament_registrations add column rank_snapshot text;
alter table public.tournament_registrations add column group_nickname_snapshot text;
alter table public.tournament_registrations rename column preferred_role to primary_role;

update public.tournament_registrations registration
set account_id = profile.account_id,
    game_name = profile.game_name,
    game_tag = profile.game_tag,
    game_name_normalized = lower(regexp_replace(btrim(profile.game_name), '[[:space:]]+', ' ', 'g')),
    game_tag_normalized = lower(regexp_replace(btrim(profile.game_tag), '[[:space:]]+', '', 'g')),
    rank_snapshot = profile.current_rank,
    group_nickname_snapshot = profile.group_nickname
from public.player_profiles profile
where profile.id = registration.player_id;

alter table public.tournament_registrations alter column account_id set not null;
alter table public.tournament_registrations alter column game_name set not null;
alter table public.tournament_registrations alter column game_tag set not null;
alter table public.tournament_registrations alter column game_name_normalized set not null;
alter table public.tournament_registrations alter column game_tag_normalized set not null;
alter table public.tournament_registrations alter column rank_snapshot set not null;

alter table public.tournament_registrations drop constraint if exists unique_player_tournament;
drop index if exists public.registrations_player_idx;
alter table public.tournament_registrations drop column player_id;

alter table public.tournament_registrations
  add constraint registration_game_name_length check (char_length(btrim(game_name)) between 1 and 32);
alter table public.tournament_registrations
  add constraint registration_game_tag_format check (game_tag ~ '^[A-Za-z0-9]{1,16}$');
alter table public.tournament_registrations
  add constraint registration_rank_length check (char_length(btrim(rank_snapshot)) between 1 and 40);
alter table public.tournament_registrations
  add constraint registration_group_nickname_length check (
    group_nickname_snapshot is null or char_length(group_nickname_snapshot) <= 50
  );
alter table public.tournament_registrations
  add constraint unique_account_tournament unique (tournament_id, account_id);
alter table public.tournament_registrations
  add constraint unique_game_id_tournament unique (
    tournament_id, game_name_normalized, game_tag_normalized
  );

create index registrations_account_idx on public.tournament_registrations (account_id);

create or replace function public.normalize_game_id_part(value text, remove_spaces boolean default false)
returns text
language sql
immutable
set search_path = public, pg_temp
as $$
  select lower(
    case
      when remove_spaces then regexp_replace(btrim(value), '[[:space:]]+', '', 'g')
      else regexp_replace(btrim(value), '[[:space:]]+', ' ', 'g')
    end
  );
$$;

create or replace function public.normalize_registration_game_id()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.game_name := btrim(new.game_name);
  new.game_tag := btrim(new.game_tag);
  new.game_name_normalized := public.normalize_game_id_part(new.game_name, false);
  new.game_tag_normalized := public.normalize_game_id_part(new.game_tag, true);
  return new;
end;
$$;

create trigger aa_registrations_normalize_game_id
before insert or update on public.tournament_registrations
for each row execute function public.normalize_registration_game_id();

create or replace function public.user_owns_registration(target_registration_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.tournament_registrations
    where id = target_registration_id and account_id = public.current_account_id()
  );
$$;

create or replace function public.enforce_registration_insert()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  tournament_row public.tournaments%rowtype;
  private_validated boolean := coalesce(current_setting('app.private_registration_validated', true), 'false') = 'true';
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if new.account_id <> public.current_account_id() then raise exception 'ACCOUNT_OWNERSHIP_REQUIRED'; end if;

  select * into tournament_row from public.tournaments where id = new.tournament_id for update;
  if not found then raise exception 'TOURNAMENT_NOT_FOUND'; end if;
  if tournament_row.status <> 'REGISTRATION'
    or now() < tournament_row.registration_start_at
    or now() > tournament_row.registration_end_at
  then
    raise exception 'REGISTRATION_CLOSED';
  end if;
  if tournament_row.registration_type not in ('SOLO', 'BOTH') then raise exception 'SOLO_REGISTRATION_DISABLED'; end if;
  if tournament_row.visibility = 'PRIVATE' and not private_validated then raise exception 'INVITE_CODE_REQUIRED'; end if;
  if new.status <> 'PENDING' then raise exception 'INVALID_INITIAL_STATUS'; end if;

  return new;
end;
$$;

create trigger registrations_validate_insert
before insert on public.tournament_registrations
for each row execute function public.enforce_registration_insert();

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
  if public.is_admin() then return new; end if;
  if old.account_id <> public.current_account_id() then raise exception 'REGISTRATION_OWNERSHIP_REQUIRED'; end if;

  select * into tournament_row from public.tournaments where id = old.tournament_id for update;
  if tournament_row.status <> 'REGISTRATION'
    or now() < tournament_row.registration_start_at
    or now() > tournament_row.registration_end_at
  then
    raise exception 'ROSTER_LOCKED';
  end if;

  if new.tournament_id is distinct from old.tournament_id
    or new.account_id is distinct from old.account_id
    or new.created_at is distinct from old.created_at
  then
    raise exception 'REGISTRATION_IDENTITY_IMMUTABLE';
  end if;

  important_fields_changed :=
    new.game_name is distinct from old.game_name
    or new.game_tag is distinct from old.game_tag
    or new.rank_snapshot is distinct from old.rank_snapshot
    or new.primary_role is distinct from old.primary_role
    or new.secondary_role is distinct from old.secondary_role;

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
  elsif new.status <> old.status then
    raise exception 'PLAYER_STATUS_CHANGE_FORBIDDEN';
  end if;

  return new;
end;
$$;

create trigger registrations_restrict_player_update
before update on public.tournament_registrations
for each row execute function public.restrict_player_registration_update();

create or replace function public.enforce_approved_capacity()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  tournament_row public.tournaments%rowtype;
  approved_total integer;
begin
  if new.status <> 'APPROVED' or (tg_op = 'UPDATE' and old.status = 'APPROVED') then return new; end if;

  select * into tournament_row
  from public.tournaments
  where id = new.tournament_id
  for update;

  if tournament_row.player_limit is not null then
    select count(*) into approved_total
    from public.tournament_registrations
    where tournament_id = new.tournament_id
      and status = 'APPROVED'
      and id <> new.id;

    if approved_total >= tournament_row.player_limit then
      raise exception 'APPROVED_CAPACITY_REACHED';
    end if;
  end if;

  return new;
end;
$$;

create trigger zz_registrations_enforce_approved_capacity
before insert or update of status on public.tournament_registrations
for each row execute function public.enforce_approved_capacity();

create or replace function public.enforce_player_limit_not_below_approved()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  approved_total integer;
begin
  if new.player_limit is null or new.player_limit is not distinct from old.player_limit then return new; end if;
  select count(*) into approved_total
  from public.tournament_registrations
  where tournament_id = new.id and status = 'APPROVED';
  if approved_total > new.player_limit then raise exception 'PLAYER_LIMIT_BELOW_APPROVED'; end if;
  return new;
end;
$$;

create trigger tournaments_validate_player_limit
before update of player_limit on public.tournaments
for each row execute function public.enforce_player_limit_not_below_approved();

create policy registrations_read_own_or_admin on public.tournament_registrations
for select to authenticated
using (account_id = public.current_account_id() or public.is_admin());

create policy registrations_create_own on public.tournament_registrations
for insert to authenticated
with check (account_id = public.current_account_id() and status = 'PENDING');

create policy registrations_update_own_or_admin on public.tournament_registrations
for update to authenticated
using (account_id = public.current_account_id() or public.is_admin())
with check (account_id = public.current_account_id() or public.is_admin());

create or replace function public.register_for_tournament(
  p_tournament_id uuid,
  p_game_name text,
  p_game_tag text,
  p_current_rank text,
  p_primary_role public.player_role,
  p_secondary_role public.player_role default null,
  p_group_nickname text default null,
  p_note text default null,
  p_invite_code text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  tournament_row public.tournaments%rowtype;
  registration_row public.tournament_registrations%rowtype;
  violated_constraint text;
begin
  if auth.uid() is null or public.current_account_id() is null then raise exception 'AUTH_REQUIRED'; end if;

  select * into tournament_row from public.tournaments where id = p_tournament_id;
  if not found then raise exception 'TOURNAMENT_NOT_FOUND'; end if;

  if tournament_row.visibility = 'PRIVATE' then
    if p_invite_code is null or tournament_row.invite_code is null
      or crypt(p_invite_code, tournament_row.invite_code) <> tournament_row.invite_code
    then
      raise exception 'INVALID_INVITE_CODE';
    end if;
    perform set_config('app.private_registration_validated', 'true', true);
  end if;

  insert into public.tournament_registrations (
    tournament_id,
    account_id,
    game_name,
    game_tag,
    rank_snapshot,
    primary_role,
    secondary_role,
    group_nickname_snapshot,
    note,
    status
  ) values (
    tournament_row.id,
    public.current_account_id(),
    p_game_name,
    p_game_tag,
    p_current_rank,
    p_primary_role,
    p_secondary_role,
    nullif(btrim(p_group_nickname), ''),
    nullif(btrim(p_note), ''),
    'PENDING'
  ) returning * into registration_row;

  return to_jsonb(registration_row);
exception
  when unique_violation then
    get stacked diagnostics violated_constraint = CONSTRAINT_NAME;
    if violated_constraint = 'unique_account_tournament' then raise exception 'ACCOUNT_ALREADY_REGISTERED'; end if;
    if violated_constraint = 'unique_game_id_tournament' then raise exception 'GAME_ID_ALREADY_REGISTERED'; end if;
    raise;
end;
$$;

create or replace function public.get_tournament_details(p_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  tournament_row public.tournaments%rowtype;
  approved_total integer;
  pending_total integer;
  waitlisted_total integer;
  participant_rows jsonb;
begin
  select * into tournament_row
  from public.tournaments
  where slug = p_slug and (status <> 'DRAFT' or public.is_admin());

  if not found then return null; end if;

  select count(*) filter (where status = 'APPROVED'),
         count(*) filter (where status = 'PENDING'),
         count(*) filter (where status = 'WAITLISTED')
  into approved_total, pending_total, waitlisted_total
  from public.tournament_registrations
  where tournament_id = tournament_row.id;

  select coalesce(jsonb_agg(to_jsonb(participant)), '[]'::jsonb)
  into participant_rows
  from (
    select registration.game_name || '#' || registration.game_tag as game_id,
           registration.primary_role,
           registration.rank_snapshot as rank
    from public.tournament_registrations registration
    where registration.tournament_id = tournament_row.id and registration.status = 'APPROVED'
    order by registration.created_at asc
    limit 12
  ) participant;

  return jsonb_build_object(
    'id', tournament_row.id,
    'name', tournament_row.name,
    'slug', tournament_row.slug,
    'description', tournament_row.description,
    'rules', tournament_row.rules,
    'status', tournament_row.status,
    'visibility', tournament_row.visibility,
    'registration_type', tournament_row.registration_type,
    'registration_start_at', tournament_row.registration_start_at,
    'registration_end_at', tournament_row.registration_end_at,
    'player_limit', tournament_row.player_limit,
    'team_limit', tournament_row.team_limit,
    'start_at', tournament_row.start_at,
    'end_at', tournament_row.end_at,
    'format', tournament_row.format,
    'default_best_of', tournament_row.default_best_of,
    'created_by', tournament_row.created_by,
    'created_at', tournament_row.created_at,
    'updated_at', tournament_row.updated_at,
    'approved_count', approved_total,
    'pending_count', pending_total,
    'waitlisted_count', waitlisted_total,
    'participants', participant_rows
  );
end;
$$;

revoke all on function public.user_owns_registration(uuid) from public;
revoke all on function public.normalize_game_id_part(text, boolean) from public;
revoke all on function public.register_for_tournament(uuid, text, text, text, public.player_role, public.player_role, text, text, text) from public;
revoke all on function public.get_tournament_details(text) from public;
grant execute on function public.user_owns_registration(uuid) to authenticated;
grant execute on function public.normalize_game_id_part(text, boolean) to authenticated;
grant execute on function public.register_for_tournament(uuid, text, text, text, public.player_role, public.player_role, text, text, text) to authenticated;
grant execute on function public.get_tournament_details(text) to anon, authenticated;

comment on table public.tournament_registrations is 'Immutable tournament-specific player snapshots owned by accounts.';
comment on column public.tournament_registrations.rank_snapshot is 'Rank at submission time; later profile changes do not rewrite history.';
comment on column public.tournament_registrations.game_name_normalized is 'Database-normalized value used only for per-tournament duplicate prevention.';
comment on column public.tournaments.player_limit is 'Maximum APPROVED individual registrations; PENDING and WAITLISTED do not consume capacity.';

commit;
