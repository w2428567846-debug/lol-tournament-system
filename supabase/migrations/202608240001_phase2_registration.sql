create extension if not exists pgcrypto;

create type public.app_role as enum ('USER', 'ADMIN');
create type public.player_role as enum ('TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT');
create type public.tournament_status as enum ('DRAFT', 'REGISTRATION', 'ONGOING', 'FINISHED');
create type public.tournament_visibility as enum ('PUBLIC', 'UNLISTED', 'PRIVATE');
create type public.registration_type as enum ('SOLO', 'TEAM', 'BOTH');
create type public.tournament_format as enum ('GROUP', 'KNOCKOUT', 'GROUP_KNOCKOUT');
create type public.registration_status as enum ('PENDING', 'APPROVED', 'WAITLISTED', 'REJECTED', 'CANCELLED');

create table public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'USER',
  created_at timestamptz not null default now()
);

create table public.player_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 32),
  riot_id text not null check (riot_id ~ '^.{1,16}#[A-Za-z0-9]{2,5}$'),
  server text not null check (server in ('JP1', 'KR', 'TW2', 'SG2', 'NA1', 'EUW1')),
  primary_role public.player_role not null,
  secondary_role public.player_role,
  rank text not null check (char_length(rank) between 1 and 40),
  group_nickname text check (group_nickname is null or char_length(group_nickname) <= 50),
  bio text check (bio is null or char_length(bio) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint different_player_roles check (secondary_role is null or secondary_role <> primary_role)
);

create table public.tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 3 and 100),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text not null default '',
  rules text not null default '',
  status public.tournament_status not null default 'DRAFT',
  visibility public.tournament_visibility not null default 'PUBLIC',
  registration_type public.registration_type not null default 'SOLO',
  registration_start_at timestamptz not null,
  registration_end_at timestamptz not null,
  player_limit integer check (player_limit is null or player_limit > 0),
  team_limit integer check (team_limit is null or team_limit > 0),
  invite_code text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  format public.tournament_format not null,
  default_best_of smallint not null check (default_best_of in (1, 3, 5)),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint valid_registration_window check (registration_start_at < registration_end_at),
  constraint valid_tournament_window check (start_at < end_at),
  constraint registration_before_end check (registration_end_at <= end_at),
  constraint private_invite_required check (visibility <> 'PRIVATE' or invite_code is not null),
  constraint solo_player_limit_required check (registration_type = 'TEAM' or player_limit is not null)
);

create table public.tournament_registrations (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  player_id uuid not null references public.player_profiles(id) on delete cascade,
  status public.registration_status not null default 'PENDING',
  preferred_role public.player_role not null,
  secondary_role public.player_role,
  note text check (note is null or char_length(note) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint unique_player_tournament unique (tournament_id, player_id),
  constraint different_registration_roles check (secondary_role is null or secondary_role <> preferred_role)
);

create index tournaments_public_start_idx on public.tournaments (visibility, status, start_at);
create index registrations_tournament_status_idx on public.tournament_registrations (tournament_id, status);
create index registrations_player_idx on public.tournament_registrations (player_id);
create unique index player_profiles_riot_id_unique_idx on public.player_profiles (lower(riot_id));

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger player_profiles_set_updated_at
before update on public.player_profiles
for each row execute function public.set_updated_at();

create trigger tournaments_set_updated_at
before update on public.tournaments
for each row execute function public.set_updated_at();

create trigger registrations_set_updated_at
before update on public.tournament_registrations
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user_role()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.user_roles (user_id, role) values (new.id, 'USER')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger auth_user_created_role
after insert on auth.users
for each row execute function public.handle_new_user_role();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'ADMIN'
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
    where id = target_player_id and user_id = auth.uid()
  );
$$;

create or replace function public.hash_tournament_invite_code()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.invite_code is not null
    and (tg_op = 'INSERT' or new.invite_code is distinct from old.invite_code)
    and new.invite_code not like '$2%'
  then
    new.invite_code = crypt(new.invite_code, gen_salt('bf'));
  end if;
  return new;
end;
$$;

create trigger tournaments_hash_invite_code
before insert or update of invite_code on public.tournaments
for each row execute function public.hash_tournament_invite_code();

create or replace function public.enforce_registration_insert()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  tournament_row public.tournaments%rowtype;
  private_validated boolean := coalesce(current_setting('app.private_registration_validated', true), 'false') = 'true';
  active_count integer;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if not public.user_owns_player(new.player_id) then
    raise exception 'PROFILE_OWNERSHIP_REQUIRED';
  end if;

  select * into tournament_row from public.tournaments where id = new.tournament_id for update;
  if not found then raise exception 'TOURNAMENT_NOT_FOUND'; end if;
  if tournament_row.status <> 'REGISTRATION' then raise exception 'REGISTRATION_CLOSED'; end if;
  if now() < tournament_row.registration_start_at or now() > tournament_row.registration_end_at then
    raise exception 'REGISTRATION_CLOSED';
  end if;
  if tournament_row.registration_type not in ('SOLO', 'BOTH') then raise exception 'SOLO_REGISTRATION_DISABLED'; end if;
  if tournament_row.visibility = 'PRIVATE' and not private_validated then raise exception 'INVITE_CODE_REQUIRED'; end if;
  if new.status <> 'PENDING' then raise exception 'INVALID_INITIAL_STATUS'; end if;

  if tournament_row.player_limit is not null then
    select count(*) into active_count
    from public.tournament_registrations
    where tournament_id = tournament_row.id and status in ('PENDING', 'APPROVED', 'WAITLISTED');
    if active_count >= tournament_row.player_limit then raise exception 'PLAYER_LIMIT_REACHED'; end if;
  end if;

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
begin
  if public.is_admin() then return new; end if;
  if not public.user_owns_player(old.player_id) then raise exception 'REGISTRATION_OWNERSHIP_REQUIRED'; end if;
  if old.status not in ('PENDING', 'APPROVED', 'WAITLISTED') or new.status <> 'CANCELLED' then
    raise exception 'ONLY_CANCELLATION_ALLOWED';
  end if;
  if new.tournament_id is distinct from old.tournament_id
    or new.player_id is distinct from old.player_id
    or new.preferred_role is distinct from old.preferred_role
    or new.secondary_role is distinct from old.secondary_role
    or new.note is distinct from old.note
  then
    raise exception 'REGISTRATION_FIELDS_IMMUTABLE';
  end if;
  return new;
end;
$$;

create trigger registrations_restrict_player_update
before update on public.tournament_registrations
for each row execute function public.restrict_player_registration_update();

alter table public.user_roles enable row level security;
alter table public.player_profiles enable row level security;
alter table public.tournaments enable row level security;
alter table public.tournament_registrations enable row level security;

create policy user_roles_read_own on public.user_roles
for select to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy profiles_read_own_or_admin on public.player_profiles
for select to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy profiles_create_own on public.player_profiles
for insert to authenticated
with check (user_id = auth.uid());

create policy profiles_update_own on public.player_profiles
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy tournaments_read_public_or_admin on public.tournaments
for select to anon, authenticated
using ((visibility = 'PUBLIC' and status <> 'DRAFT') or public.is_admin());

create policy tournaments_admin_insert on public.tournaments
for insert to authenticated
with check (public.is_admin() and created_by = auth.uid());

create policy tournaments_admin_update on public.tournaments
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy tournaments_admin_delete on public.tournaments
for delete to authenticated
using (public.is_admin());

create policy registrations_read_own_or_admin on public.tournament_registrations
for select to authenticated
using (public.user_owns_player(player_id) or public.is_admin());

create policy registrations_create_own on public.tournament_registrations
for insert to authenticated
with check (public.user_owns_player(player_id) and status = 'PENDING');

create policy registrations_update_own_or_admin on public.tournament_registrations
for update to authenticated
using (public.user_owns_player(player_id) or public.is_admin())
with check (public.user_owns_player(player_id) or public.is_admin());

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
  participant_rows jsonb;
begin
  select * into tournament_row
  from public.tournaments
  where slug = p_slug and (status <> 'DRAFT' or public.is_admin());

  if not found then return null; end if;

  select count(*) filter (where status = 'APPROVED'),
         count(*) filter (where status = 'PENDING')
  into approved_total, pending_total
  from public.tournament_registrations
  where tournament_id = tournament_row.id;

  select coalesce(jsonb_agg(to_jsonb(participant)), '[]'::jsonb)
  into participant_rows
  from (
    select profile.display_name, profile.primary_role, profile.rank
    from public.tournament_registrations registration
    join public.player_profiles profile on profile.id = registration.player_id
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
    'participants', participant_rows
  );
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

  select * into profile_row from public.player_profiles where user_id = auth.uid();
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

revoke all on function public.is_admin() from public;
revoke all on function public.user_owns_player(uuid) from public;
revoke all on function public.get_tournament_details(text) from public;
revoke all on function public.register_for_tournament(uuid, public.player_role, public.player_role, text, text) from public;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.user_owns_player(uuid) to authenticated;
grant execute on function public.get_tournament_details(text) to anon, authenticated;
grant execute on function public.register_for_tournament(uuid, public.player_role, public.player_role, text, text) to authenticated;

revoke all on public.user_roles from anon;
revoke all on public.player_profiles from anon;
revoke all on public.tournament_registrations from anon;

comment on column public.tournaments.invite_code is 'Bcrypt hash written by trigger; never return this column to non-admin clients.';
