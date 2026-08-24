begin;

create type public.auth_provider as enum ('WECHAT', 'EMAIL_DEV');

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  auth_provider public.auth_provider not null,
  auth_user_id uuid unique references auth.users(id) on delete set null,
  wechat_openid text,
  wechat_unionid text,
  wechat_nickname text check (wechat_nickname is null or char_length(wechat_nickname) <= 100),
  wechat_avatar_url text check (wechat_avatar_url is null or char_length(wechat_avatar_url) <= 1000),
  role public.app_role not null default 'USER',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint wechat_openid_not_blank check (wechat_openid is null or btrim(wechat_openid) <> ''),
  constraint wechat_unionid_not_blank check (wechat_unionid is null or btrim(wechat_unionid) <> ''),
  constraint provider_identity_shape check (
    (auth_provider = 'WECHAT' and wechat_openid is not null)
    or (auth_provider = 'EMAIL_DEV' and auth_user_id is not null and wechat_openid is null and wechat_unionid is null)
  )
);

create unique index accounts_wechat_openid_unique
on public.accounts (wechat_openid)
where wechat_openid is not null;

create unique index accounts_wechat_unionid_unique
on public.accounts (wechat_unionid)
where wechat_unionid is not null;

create trigger accounts_set_updated_at
before update on public.accounts
for each row execute function public.set_updated_at();

insert into public.accounts (auth_provider, auth_user_id, role, created_at)
select 'EMAIL_DEV', auth_user.id, coalesce(user_role.role, 'USER'::public.app_role), auth_user.created_at
from auth.users auth_user
left join public.user_roles user_role on user_role.user_id = auth_user.id
on conflict (auth_user_id) do nothing;

alter table public.player_profiles add column account_id uuid references public.accounts(id) on delete cascade;

update public.player_profiles profile
set account_id = account.id
from public.accounts account
where account.auth_user_id = profile.user_id;

alter table public.player_profiles alter column account_id set not null;
alter table public.player_profiles add constraint player_profiles_account_id_key unique (account_id);

drop policy if exists profiles_read_own_or_admin on public.player_profiles;
drop policy if exists profiles_create_own on public.player_profiles;
drop policy if exists profiles_update_own on public.player_profiles;
drop policy if exists tournaments_admin_insert on public.tournaments;
drop policy if exists user_roles_read_own on public.user_roles;

alter table public.tournaments add column created_by_account_id uuid references public.accounts(id) on delete set null;

update public.tournaments tournament
set created_by_account_id = account.id
from public.accounts account
where account.auth_user_id = tournament.created_by;

alter table public.tournaments drop column created_by;
alter table public.tournaments rename column created_by_account_id to created_by;
alter table public.player_profiles drop column user_id;

create or replace function public.current_account_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select id from public.accounts where auth_user_id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.accounts
    where id = public.current_account_id() and role = 'ADMIN'
  );
$$;

create or replace function public.user_owns_player(target_player_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.player_profiles
    where id = target_player_id and account_id = public.current_account_id()
  );
$$;

create or replace function public.handle_new_auth_user_account()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  requested_provider text := coalesce(new.raw_app_meta_data ->> 'rift_auth_provider', 'EMAIL_DEV');
begin
  if requested_provider = 'WECHAT' then
    insert into public.accounts (
      auth_provider,
      auth_user_id,
      wechat_openid,
      wechat_unionid,
      wechat_nickname,
      wechat_avatar_url
    ) values (
      'WECHAT',
      new.id,
      nullif(new.raw_app_meta_data ->> 'wechat_openid', ''),
      nullif(new.raw_app_meta_data ->> 'wechat_unionid', ''),
      nullif(new.raw_user_meta_data ->> 'wechat_nickname', ''),
      nullif(new.raw_user_meta_data ->> 'wechat_avatar_url', '')
    ) on conflict (auth_user_id) do nothing;
  else
    insert into public.accounts (auth_provider, auth_user_id)
    values ('EMAIL_DEV', new.id)
    on conflict (auth_user_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists auth_user_created_role on auth.users;
drop function if exists public.handle_new_user_role();

create trigger auth_user_created_account
after insert on auth.users
for each row execute function public.handle_new_auth_user_account();

create or replace function public.upsert_verified_wechat_account(
  p_auth_user_id uuid,
  p_wechat_openid text,
  p_wechat_unionid text default null,
  p_wechat_nickname text default null,
  p_wechat_avatar_url text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  identity_account public.accounts%rowtype;
  auth_account public.accounts%rowtype;
  identity_match_count integer;
  resolved_account_id uuid;
begin
  if p_auth_user_id is null or nullif(btrim(p_wechat_openid), '') is null then
    raise exception 'VERIFIED_WECHAT_IDENTITY_REQUIRED';
  end if;

  select count(distinct id) into identity_match_count
  from public.accounts
  where wechat_openid = p_wechat_openid
     or (p_wechat_unionid is not null and wechat_unionid = p_wechat_unionid);

  if identity_match_count > 1 then raise exception 'WECHAT_IDENTITY_CONFLICT'; end if;

  select * into identity_account
  from public.accounts
  where wechat_openid = p_wechat_openid
     or (p_wechat_unionid is not null and wechat_unionid = p_wechat_unionid)
  limit 1
  for update;

  select * into auth_account
  from public.accounts
  where auth_user_id = p_auth_user_id
  for update;

  if identity_account.id is not null and auth_account.id is not null and identity_account.id <> auth_account.id then
    raise exception 'WECHAT_IDENTITY_ALREADY_LINKED';
  end if;

  if identity_account.id is not null then
    if identity_account.auth_user_id is not null and identity_account.auth_user_id <> p_auth_user_id then
      raise exception 'WECHAT_IDENTITY_ALREADY_LINKED';
    end if;
    update public.accounts
    set auth_provider = 'WECHAT',
        auth_user_id = p_auth_user_id,
        wechat_openid = p_wechat_openid,
        wechat_unionid = coalesce(p_wechat_unionid, wechat_unionid),
        wechat_nickname = p_wechat_nickname,
        wechat_avatar_url = p_wechat_avatar_url
    where id = identity_account.id
    returning id into resolved_account_id;
  elsif auth_account.id is not null then
    update public.accounts
    set auth_provider = 'WECHAT',
        wechat_openid = p_wechat_openid,
        wechat_unionid = p_wechat_unionid,
        wechat_nickname = p_wechat_nickname,
        wechat_avatar_url = p_wechat_avatar_url
    where id = auth_account.id
    returning id into resolved_account_id;
  else
    insert into public.accounts (
      auth_provider, auth_user_id, wechat_openid, wechat_unionid, wechat_nickname, wechat_avatar_url
    ) values (
      'WECHAT', p_auth_user_id, p_wechat_openid, p_wechat_unionid, p_wechat_nickname, p_wechat_avatar_url
    ) returning id into resolved_account_id;
  end if;

  return resolved_account_id;
end;
$$;

create or replace function public.register_for_tournament(
  p_tournament_id uuid,
  p_preferred_role public.player_role,
  p_secondary_role public.player_role default null,
  p_note text default null,
  p_invite_code text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  profile_row public.player_profiles%rowtype;
  tournament_row public.tournaments%rowtype;
  registration_row public.tournament_registrations%rowtype;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;

  select * into profile_row
  from public.player_profiles
  where account_id = public.current_account_id();
  if not found then raise exception 'PLAYER_PROFILE_REQUIRED'; end if;

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
    tournament_id, player_id, status, preferred_role, secondary_role, note
  ) values (
    tournament_row.id, profile_row.id, 'PENDING', p_preferred_role, p_secondary_role, nullif(trim(p_note), '')
  ) returning * into registration_row;

  return to_jsonb(registration_row);
exception
  when unique_violation then raise exception 'ALREADY_REGISTERED';
end;
$$;

alter table public.accounts enable row level security;

create policy accounts_read_own_or_admin on public.accounts
for select to authenticated
using (id = public.current_account_id() or public.is_admin());

revoke all on table public.accounts from anon, authenticated;
grant select (id, auth_provider, role, wechat_nickname, wechat_avatar_url, created_at, updated_at)
on public.accounts to authenticated;

create policy profiles_read_own_or_admin on public.player_profiles
for select to authenticated
using (account_id = public.current_account_id() or public.is_admin());

create policy profiles_create_own on public.player_profiles
for insert to authenticated
with check (account_id = public.current_account_id());

create policy profiles_update_own on public.player_profiles
for update to authenticated
using (account_id = public.current_account_id())
with check (account_id = public.current_account_id());

create policy tournaments_admin_insert on public.tournaments
for insert to authenticated
with check (public.is_admin() and created_by = public.current_account_id());

revoke all on function public.current_account_id() from public;
revoke all on function public.upsert_verified_wechat_account(uuid, text, text, text, text) from public;
grant execute on function public.current_account_id() to authenticated;
grant execute on function public.upsert_verified_wechat_account(uuid, text, text, text, text) to service_role;

drop table public.user_roles;

comment on table public.accounts is 'Private provider identity. Never expose WeChat OpenID or UnionID in public queries.';
comment on column public.accounts.wechat_openid is 'Verified WeChat OAuth OpenID; never user-entered.';
comment on column public.accounts.wechat_unionid is 'Verified WeChat OAuth UnionID when available; never user-entered.';

commit;
