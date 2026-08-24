begin;

alter table public.tournaments
  add column timezone text not null default 'Asia/Shanghai';

alter table public.tournaments
  add constraint tournament_timezone_length check (char_length(timezone) between 1 and 64);

create or replace function public.validate_tournament_timezone()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.timezone := coalesce(nullif(btrim(new.timezone), ''), 'Asia/Shanghai');
  perform now() at time zone new.timezone;
  return new;
exception
  when invalid_parameter_value then raise exception 'INVALID_TOURNAMENT_TIMEZONE';
end;
$$;

create trigger tournaments_validate_timezone
before insert or update of timezone on public.tournaments
for each row execute function public.validate_tournament_timezone();

create or replace function public.enforce_solo_only_tournament_mode()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  -- TEAM/BOTH remain valid legacy enum values, but new selections are reserved for a future milestone.
  if tg_op = 'INSERT' and new.registration_type <> 'SOLO' then
    raise exception 'UNSUPPORTED_REGISTRATION_TYPE';
  end if;
  if tg_op = 'UPDATE'
    and new.registration_type is distinct from old.registration_type
    and new.registration_type <> 'SOLO'
  then
    raise exception 'UNSUPPORTED_REGISTRATION_TYPE';
  end if;
  return new;
end;
$$;

create trigger tournaments_enforce_solo_only_mode
before insert or update of registration_type on public.tournaments
for each row execute function public.enforce_solo_only_tournament_mode();

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
  if tournament_row.registration_type <> 'SOLO' then raise exception 'SOLO_REGISTRATION_DISABLED'; end if;
  if tournament_row.visibility = 'PRIVATE' and not private_validated then raise exception 'INVITE_CODE_REQUIRED'; end if;
  if new.status <> 'PENDING' then raise exception 'INVALID_INITIAL_STATUS'; end if;

  return new;
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
  participant_rows jsonb := '[]'::jsonb;
  participants_restricted boolean;
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

  participants_restricted := tournament_row.visibility = 'PRIVATE'
    and auth.uid() is null
    and not public.is_admin();

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
    'created_by', tournament_row.created_by,
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

revoke all on function public.validate_tournament_timezone() from public;
revoke all on function public.enforce_solo_only_tournament_mode() from public;
revoke all on function public.get_tournament_details(text) from public;
grant execute on function public.get_tournament_details(text) to anon, authenticated;

comment on column public.tournaments.timezone is 'IANA timezone used to interpret admin local inputs and render tournament wall times; instants remain timestamptz.';
comment on function public.get_tournament_details(text) is 'Returns counts to link viewers but withholds private tournament participant game IDs from anonymous callers.';

commit;
