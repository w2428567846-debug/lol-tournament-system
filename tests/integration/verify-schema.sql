\set ON_ERROR_STOP on

do $$
declare
  insecure_function text;
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
    where oid = 'public.registration_review_events'::regclass
      and relrowsecurity
  ) then
    raise exception 'review history RLS is not enabled';
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
  ) then
    raise exception 'trusted WeChat upsert is executable by authenticated users';
  end if;

  if not has_function_privilege(
    'authenticated',
    'public.get_my_registration_review_history(uuid)',
    'EXECUTE'
  ) then
    raise exception 'safe own-review-history RPC is not executable by authenticated users';
  end if;

  if has_function_privilege('authenticated', 'public.enforce_registration_insert()', 'EXECUTE')
    or has_function_privilege('authenticated', 'public.restrict_player_registration_update()', 'EXECUTE')
    or has_function_privilege('authenticated', 'public.record_registration_review_event()', 'EXECUTE')
  then
    raise exception 'trigger-only registration functions are directly executable';
  end if;

  select p.oid::regprocedure::text into insecure_function
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.prosecdef
    and not coalesce(p.proconfig, '{}'::text[]) @> array['search_path=public, pg_temp']
  limit 1;

  if insecure_function is not null then
    raise exception 'SECURITY DEFINER function has an unsafe search_path: %', insecure_function;
  end if;
end
$$;

select 'integration schema verification passed' as result;
