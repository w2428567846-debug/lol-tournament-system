\set ON_ERROR_STOP on

do $$
declare
  insecure_function text;
  exposed_trigger_function text;
begin
  if to_regclass('public.registration_review_events') is null then
    raise exception 'registration_review_events is missing';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'tournament_registrations'
      and column_name = 'reviewed_by_account_id'
  ) then
    raise exception 'review metadata columns are missing';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'tournament_registrations'
      and column_name = 'valuation'
  ) or not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'tournament_registrations'
      and column_name = 'matches_played'
  ) then
    raise exception 'player valuation or tournament performance columns are missing';
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.tournament_registrations'::regclass
      and conname = 'registration_pending_review_metadata_empty'
  ) then
    raise exception 'pending review metadata protection is missing';
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.wechat_identities'::regclass
      and conname = 'wechat_identity_app_openid_unique'
  ) then
    raise exception 'app-scoped OpenID uniqueness is missing';
  end if;

  if exists (
    select 1 from pg_constraint
    where conrelid = 'public.wechat_identities'::regclass
      and conname = 'wechat_identity_openid_unique'
  ) then
    raise exception 'obsolete global OpenID uniqueness still exists';
  end if;

  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public'
      and indexname = 'wechat_identities_unionid_unique'
      and indexdef ilike '%where (unionid is not null)%'
  ) then
    raise exception 'partial UnionID uniqueness is missing';
  end if;

  if not exists (
    select 1 from pg_class
    where oid = 'public.wechat_identities'::regclass and relrowsecurity
  ) or not exists (
    select 1 from pg_class
    where oid = 'public.registration_review_events'::regclass and relrowsecurity
  ) or not exists (
    select 1 from pg_class
    where oid = 'public.tournament_registrations'::regclass and relrowsecurity
  ) then
    raise exception 'RLS is missing from a sensitive identity or registration table';
  end if;

  if has_table_privilege('anon', 'public.wechat_identities', 'SELECT')
    or has_table_privilege('authenticated', 'public.wechat_identities', 'SELECT')
  then
    raise exception 'WeChat identity table is readable by browser roles';
  end if;

  if has_function_privilege(
    'authenticated',
    'public.upsert_verified_wechat_account(uuid,text,text,text,text,text)',
    'EXECUTE'
  ) or has_function_privilege(
    'anon',
    'public.upsert_verified_wechat_account(uuid,text,text,text,text,text)',
    'EXECUTE'
  ) or not has_function_privilege(
    'service_role',
    'public.upsert_verified_wechat_account(uuid,text,text,text,text,text)',
    'EXECUTE'
  ) then
    raise exception 'trusted WeChat upsert privileges are incorrect';
  end if;

  if not has_function_privilege(
    'authenticated',
    'public.get_my_registration_review_history(uuid)',
    'EXECUTE'
  ) or has_function_privilege(
    'anon',
    'public.get_my_registration_review_history(uuid)',
    'EXECUTE'
  ) then
    raise exception 'safe own-review-history RPC privileges are incorrect';
  end if;

  if not has_function_privilege('authenticated', 'public.current_account_id()', 'EXECUTE')
    or has_function_privilege('anon', 'public.current_account_id()', 'EXECUTE')
    or has_function_privilege('service_role', 'public.current_account_id()', 'EXECUTE')
    or not has_function_privilege('authenticated', 'public.is_admin()', 'EXECUTE')
    or has_function_privilege('anon', 'public.is_admin()', 'EXECUTE')
    or has_function_privilege('service_role', 'public.is_admin()', 'EXECUTE')
    or not has_function_privilege('authenticated', 'public.user_owns_player(uuid)', 'EXECUTE')
    or has_function_privilege('anon', 'public.user_owns_player(uuid)', 'EXECUTE')
    or has_function_privilege('service_role', 'public.user_owns_player(uuid)', 'EXECUTE')
    or not has_function_privilege('authenticated', 'public.current_account_summary()', 'EXECUTE')
    or has_function_privilege('anon', 'public.current_account_summary()', 'EXECUTE')
    or has_function_privilege('service_role', 'public.current_account_summary()', 'EXECUTE')
  then
    raise exception 'account helper privileges are incorrect';
  end if;

  -- This helper is pure immutable text normalization with no table access. It
  -- remains callable only by authenticated clients that share DB normalization.
  if not has_function_privilege('authenticated', 'public.normalize_game_id_part(text,boolean)', 'EXECUTE')
    or has_function_privilege('anon', 'public.normalize_game_id_part(text,boolean)', 'EXECUTE')
    or has_function_privilege('service_role', 'public.normalize_game_id_part(text,boolean)', 'EXECUTE')
  then
    raise exception 'game-ID normalization helper privileges are incorrect';
  end if;

  if not has_function_privilege('anon', 'public.get_tournament_details(text)', 'EXECUTE')
    or not has_function_privilege('authenticated', 'public.get_tournament_details(text)', 'EXECUTE')
    or has_function_privilege('service_role', 'public.get_tournament_details(text)', 'EXECUTE')
  then
    raise exception 'safe tournament details RPC is unavailable to intended viewers';
  end if;

  if not has_function_privilege('anon', 'public.get_public_player_roster()', 'EXECUTE')
    or not has_function_privilege('authenticated', 'public.get_public_player_roster()', 'EXECUTE')
    or has_function_privilege('service_role', 'public.get_public_player_roster()', 'EXECUTE')
  then
    raise exception 'safe public player roster RPC privileges are incorrect';
  end if;

  if has_function_privilege('anon', 'public.register_for_tournament(uuid,text,text,text,public.player_role,public.player_role,text,text,text)', 'EXECUTE')
    or not has_function_privilege('authenticated', 'public.register_for_tournament(uuid,text,text,text,public.player_role,public.player_role,text,text,text)', 'EXECUTE')
  then
    raise exception 'registration RPC privileges are incorrect';
  end if;

  if has_function_privilege('anon', 'public.get_admin_registration_review_metadata(uuid)', 'EXECUTE')
    or not has_function_privilege('authenticated', 'public.get_admin_registration_review_metadata(uuid)', 'EXECUTE')
  then
    raise exception 'admin review metadata RPC privileges are incorrect';
  end if;

  if has_column_privilege('authenticated', 'public.tournament_registrations', 'reviewed_by_account_id', 'SELECT')
    or has_column_privilege('authenticated', 'public.tournament_registrations', 'game_name_normalized', 'SELECT')
    or has_column_privilege('authenticated', 'public.tournament_registrations', 'game_tag_normalized', 'SELECT')
  then
    raise exception 'internal registration columns are readable by authenticated clients';
  end if;

  if has_column_privilege('anon', 'public.tournaments', 'created_by', 'SELECT')
    or has_column_privilege('authenticated', 'public.tournaments', 'created_by', 'SELECT')
    or has_column_privilege('anon', 'public.tournaments', 'invite_code', 'SELECT')
    or has_column_privilege('authenticated', 'public.tournaments', 'invite_code', 'SELECT')
  then
    raise exception 'creator account or invite hash is readable through tournament table privileges';
  end if;

  if not has_column_privilege('anon', 'public.tournaments', 'id', 'SELECT')
    or not has_column_privilege('authenticated', 'public.tournaments', 'name', 'SELECT')
  then
    raise exception 'safe tournament table reads lost required public columns';
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'tournaments'
      and policyname = 'tournaments_read_public'
      and roles @> array['anon'::name, 'authenticated'::name]
      and qual like '%visibility%PUBLIC%status%DRAFT%'
      and qual not like '%is_admin()%'
  ) or not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'tournaments'
      and policyname = 'tournaments_read_admin'
      and roles = array['authenticated'::name]
      and qual = 'is_admin()'
  ) or exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'tournaments'
      and 'anon'::name = any(roles)
      and qual like '%is_admin()%'
  ) then
    raise exception 'public and admin tournament read policies are not safely separated';
  end if;

  if not has_column_privilege('authenticated', 'public.tournament_registrations', 'id', 'SELECT')
    or not has_column_privilege('authenticated', 'public.tournament_registrations', 'account_id', 'SELECT')
    or not has_column_privilege('authenticated', 'public.tournament_registrations', 'valuation', 'SELECT')
    or not has_column_privilege('authenticated', 'public.tournament_registrations', 'matches_played', 'SELECT')
  then
    raise exception 'safe own/admin registration queries lost required columns';
  end if;

  select p.oid::regprocedure::text into exposed_trigger_function
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.prorettype = 'trigger'::regtype
    and (
      has_function_privilege('anon', p.oid, 'EXECUTE')
      or has_function_privilege('authenticated', p.oid, 'EXECUTE')
    )
  limit 1;

  if exposed_trigger_function is not null then
    raise exception 'trigger-only function is directly executable by a browser role: %', exposed_trigger_function;
  end if;

  select p.oid::regprocedure::text into insecure_function
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.prosecdef
    and not (
      coalesce(p.proconfig, '{}'::text[]) @> array['search_path=public, pg_temp']
      or coalesce(p.proconfig, '{}'::text[]) @> array['search_path=extensions, public, pg_temp']
    )
  limit 1;

  if insecure_function is not null then
    raise exception 'SECURITY DEFINER function has an unsafe search_path: %', insecure_function;
  end if;
end
$$;

select 'integration schema verification passed' as result;
