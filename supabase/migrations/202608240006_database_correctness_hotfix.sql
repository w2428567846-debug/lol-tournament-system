begin;

-- Keep one canonical UnionID value while persisting every verified app-scoped
-- OpenID. When another app resolves through the same UnionID, its provider row
-- points at the same account and leaves unionid null because the partial unique
-- index intentionally stores that cross-app key once.
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
  exact_identity public.wechat_identities%rowtype;
  union_identity public.wechat_identities%rowtype;
  auth_account public.accounts%rowtype;
  resolved_account public.accounts%rowtype;
  inserted_unionid text;
begin
  p_app_id := nullif(btrim(p_app_id), '');
  p_openid := nullif(btrim(p_openid), '');
  p_unionid := nullif(btrim(p_unionid), '');

  if p_auth_user_id is null or p_app_id is null or p_openid is null then
    raise exception 'VERIFIED_WECHAT_IDENTITY_REQUIRED';
  end if;

  select * into exact_identity
  from public.wechat_identities
  where app_id = p_app_id and openid = p_openid
  for update;

  if p_unionid is not null then
    select * into union_identity
    from public.wechat_identities
    where unionid = p_unionid
    for update;
  end if;

  if exact_identity.id is not null
    and union_identity.id is not null
    and exact_identity.account_id <> union_identity.account_id
  then
    raise exception 'WECHAT_IDENTITY_CONFLICT';
  end if;

  select * into auth_account
  from public.accounts
  where auth_user_id = p_auth_user_id
  for update;

  if exact_identity.id is not null then
    select * into resolved_account from public.accounts where id = exact_identity.account_id for update;
  elsif union_identity.id is not null then
    select * into resolved_account from public.accounts where id = union_identity.account_id for update;
  elsif auth_account.id is not null then
    resolved_account := auth_account;
  else
    insert into public.accounts (auth_provider, auth_user_id)
    values ('WECHAT', p_auth_user_id)
    returning * into resolved_account;
  end if;

  if auth_account.id is not null and auth_account.id <> resolved_account.id then
    raise exception 'WECHAT_IDENTITY_ALREADY_LINKED';
  end if;

  if resolved_account.auth_user_id is not null
    and resolved_account.auth_user_id <> p_auth_user_id
  then
    raise exception 'WECHAT_IDENTITY_ALREADY_LINKED';
  end if;

  if p_unionid is not null and exists (
    select 1
    from public.wechat_identities
    where account_id = resolved_account.id
      and unionid is not null
      and unionid <> p_unionid
  ) then
    raise exception 'WECHAT_IDENTITY_CONFLICT';
  end if;

  update public.accounts
  set auth_provider = 'WECHAT', auth_user_id = p_auth_user_id
  where id = resolved_account.id;

  if exact_identity.id is not null then
    if exact_identity.account_id <> resolved_account.id then
      raise exception 'WECHAT_IDENTITY_CONFLICT';
    end if;

    update public.wechat_identities
    set unionid = case
          when p_unionid is null then unionid
          when union_identity.id is null or union_identity.id = exact_identity.id then p_unionid
          else unionid
        end,
        wechat_nickname = p_wechat_nickname,
        wechat_avatar_url = p_wechat_avatar_url
    where id = exact_identity.id;
  else
    inserted_unionid := case when union_identity.id is null then p_unionid else null end;
    insert into public.wechat_identities (
      account_id,
      app_id,
      openid,
      unionid,
      wechat_nickname,
      wechat_avatar_url
    ) values (
      resolved_account.id,
      p_app_id,
      p_openid,
      inserted_unionid,
      p_wechat_nickname,
      p_wechat_avatar_url
    );
  end if;

  return resolved_account.id;
exception
  when unique_violation then raise exception 'WECHAT_IDENTITY_ALREADY_LINKED';
end;
$$;

-- Public/player registration responses return operational fields only. Account
-- IDs, normalized duplicate-check fields, and reviewer IDs stay internal.
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

  return jsonb_build_object(
    'id', registration_row.id,
    'tournament_id', registration_row.tournament_id,
    'game_name', registration_row.game_name,
    'game_tag', registration_row.game_tag,
    'rank_snapshot', registration_row.rank_snapshot,
    'status', registration_row.status,
    'primary_role', registration_row.primary_role,
    'secondary_role', registration_row.secondary_role,
    'group_nickname_snapshot', registration_row.group_nickname_snapshot,
    'note', registration_row.note,
    'reviewed_at', registration_row.reviewed_at,
    'review_note', registration_row.review_note,
    'created_at', registration_row.created_at,
    'updated_at', registration_row.updated_at
  );
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
  viewer_account_id uuid := public.current_account_id();
  viewer_is_admin boolean := public.is_admin();
  approved_total integer;
  pending_total integer;
  waitlisted_total integer;
  participant_rows jsonb := '[]'::jsonb;
  participants_restricted boolean;
begin
  select * into tournament_row
  from public.tournaments
  where slug = p_slug and (status <> 'DRAFT' or viewer_is_admin);

  if not found then return null; end if;

  select count(*) filter (where status = 'APPROVED'),
         count(*) filter (where status = 'PENDING'),
         count(*) filter (where status = 'WAITLISTED')
  into approved_total, pending_total, waitlisted_total
  from public.tournament_registrations
  where tournament_id = tournament_row.id;

  participants_restricted := tournament_row.visibility = 'PRIVATE'
    and not viewer_is_admin
    and (
      viewer_account_id is null
      or not exists (
        select 1
        from public.tournament_registrations
        where tournament_id = tournament_row.id
          and account_id = viewer_account_id
      )
    );

  if not participants_restricted then
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
  end if;

  return jsonb_build_object(
    'id', tournament_row.id,
    'name', tournament_row.name,
    'slug', tournament_row.slug,
    'description', tournament_row.description,
    'rules', tournament_row.rules,
    'status', tournament_row.status,
    'visibility', tournament_row.visibility,
    'registration_type', tournament_row.registration_type,
    'timezone', tournament_row.timezone,
    'registration_start_at', tournament_row.registration_start_at,
    'registration_end_at', tournament_row.registration_end_at,
    'player_limit', tournament_row.player_limit,
    'team_limit', tournament_row.team_limit,
    'start_at', tournament_row.start_at,
    'end_at', tournament_row.end_at,
    'format', tournament_row.format,
    'default_best_of', tournament_row.default_best_of,
    'created_at', tournament_row.created_at,
    'updated_at', tournament_row.updated_at,
    'approved_count', approved_total,
    'pending_count', pending_total,
    'waitlisted_count', waitlisted_total,
    'participants_restricted', participants_restricted,
    'participants', participant_rows
  );
end;
$$;

-- Public tournament queries never expose creator account IDs or invite hashes.
-- Admin application screens use the same operational columns; trusted database
-- operators retain full access through service_role.
revoke select on table public.tournaments from anon, authenticated;
grant select (
  id,
  name,
  slug,
  description,
  rules,
  status,
  visibility,
  registration_type,
  registration_start_at,
  registration_end_at,
  player_limit,
  team_limit,
  start_at,
  end_at,
  format,
  default_best_of,
  created_at,
  updated_at,
  timezone
) on table public.tournaments to anon, authenticated;

-- Ordinary authenticated callers cannot select internal reviewer IDs or
-- normalized duplicate-check values. Application admins can retrieve the
-- current reviewer identity through the admin-only function below, while
-- service_role retains direct table access.
revoke select on table public.tournament_registrations from authenticated;
grant select (
  id,
  tournament_id,
  account_id,
  game_name,
  game_tag,
  rank_snapshot,
  status,
  primary_role,
  secondary_role,
  group_nickname_snapshot,
  note,
  reviewed_at,
  review_note,
  created_at,
  updated_at
) on table public.tournament_registrations to authenticated;

create or replace function public.get_admin_registration_review_metadata(p_registration_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  metadata jsonb;
begin
  if public.current_account_id() is null then raise exception 'AUTH_REQUIRED'; end if;
  if not public.is_admin() then raise exception 'ADMIN_REQUIRED'; end if;

  select jsonb_build_object(
    'reviewed_by_account_id', registration.reviewed_by_account_id,
    'reviewed_at', registration.reviewed_at,
    'review_note', registration.review_note
  ) into metadata
  from public.tournament_registrations registration
  where registration.id = p_registration_id;

  return metadata;
end;
$$;

-- Supabase grants new routines to browser roles through default privileges.
-- Revoke explicit role grants as well as PUBLIC, then add back only the
-- intentional callable surface.
revoke all on function public.current_account_id() from public, anon, authenticated, service_role;
grant execute on function public.current_account_id() to authenticated;
revoke all on function public.is_admin() from public, anon, authenticated, service_role;
grant execute on function public.is_admin() to authenticated;
revoke all on function public.user_owns_player(uuid) from public, anon, authenticated, service_role;
grant execute on function public.user_owns_player(uuid) to authenticated;
revoke all on function public.current_account_summary() from public, anon, authenticated, service_role;
grant execute on function public.current_account_summary() to authenticated;
revoke all on function public.normalize_game_id_part(text, boolean) from public, anon, authenticated, service_role;
grant execute on function public.normalize_game_id_part(text, boolean) to authenticated;
revoke all on function public.user_owns_registration(uuid) from public, anon, authenticated, service_role;
revoke all on function public.get_my_registration_review_history(uuid) from public, anon, authenticated, service_role;
grant execute on function public.get_my_registration_review_history(uuid) to authenticated;

revoke all on function public.set_updated_at() from public, anon, authenticated, service_role;
revoke all on function public.handle_new_auth_user_account() from public, anon, authenticated, service_role;
revoke all on function public.hash_tournament_invite_code() from public, anon, authenticated, service_role;
revoke all on function public.enforce_tournament_status_transition() from public, anon, authenticated, service_role;
revoke all on function public.validate_tournament_timezone() from public, anon, authenticated, service_role;
revoke all on function public.enforce_solo_only_tournament_mode() from public, anon, authenticated, service_role;
revoke all on function public.normalize_registration_game_id() from public, anon, authenticated, service_role;
revoke all on function public.enforce_registration_insert() from public, anon, authenticated, service_role;
revoke all on function public.enforce_approved_capacity() from public, anon, authenticated, service_role;
revoke all on function public.enforce_player_limit_not_below_approved() from public, anon, authenticated, service_role;
revoke all on function public.restrict_player_registration_update() from public, anon, authenticated, service_role;
revoke all on function public.record_registration_review_event() from public, anon, authenticated, service_role;
revoke all on function public.is_admin_review_transition_allowed(public.registration_status, public.registration_status) from public, anon, authenticated, service_role;

revoke all on function public.upsert_verified_wechat_account(uuid, text, text, text, text, text) from public, anon, authenticated, service_role;
grant execute on function public.upsert_verified_wechat_account(uuid, text, text, text, text, text) to service_role;
revoke all on function public.register_for_tournament(uuid, text, text, text, public.player_role, public.player_role, text, text, text) from public, anon, authenticated, service_role;
grant execute on function public.register_for_tournament(uuid, text, text, text, public.player_role, public.player_role, text, text, text) to authenticated;
revoke all on function public.get_tournament_details(text) from public, anon, authenticated, service_role;
grant execute on function public.get_tournament_details(text) to anon, authenticated;
revoke all on function public.get_admin_registration_review_metadata(uuid) from public, anon, authenticated, service_role;
grant execute on function public.get_admin_registration_review_metadata(uuid) to authenticated;

comment on function public.upsert_verified_wechat_account(uuid, text, text, text, text, text) is 'Trusted service-only WeChat linker. Persists every app-scoped OpenID and stores a shared UnionID once on the canonical account identity row.';
comment on function public.get_tournament_details(text) is 'Returns public counts. PRIVATE participant details are visible only to admins and accounts registered in that tournament; creator account IDs are omitted.';
comment on function public.get_admin_registration_review_metadata(uuid) is 'Admin-only access to internal current-review identity metadata.';

commit;
