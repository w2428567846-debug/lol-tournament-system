-- Add organizer-managed virtual player valuation and per-tournament performance
-- without turning the value into a payment or real-money field.

begin;

alter table public.tournament_registrations
  add column valuation numeric(4,1),
  add column team_name text,
  add column matches_played integer not null default 0,
  add column wins integer not null default 0,
  add column losses integer not null default 0,
  add column kills integer not null default 0,
  add column deaths integer not null default 0,
  add column assists integer not null default 0,
  add column placement integer;

alter table public.tournament_registrations
  add constraint registration_valuation_range check (
    valuation is null or valuation between 0 and 99.9
  ),
  add constraint registration_team_name_length check (
    team_name is null or char_length(team_name) between 1 and 80
  ),
  add constraint registration_performance_non_negative check (
    matches_played >= 0
    and wins >= 0
    and losses >= 0
    and kills >= 0
    and deaths >= 0
    and assists >= 0
  ),
  add constraint registration_record_within_matches check (
    wins + losses <= matches_played
  ),
  add constraint registration_placement_positive check (
    placement is null or placement >= 1
  );

create or replace function public.restrict_player_registration_update()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  tournament_row public.tournaments%rowtype;
  important_fields_changed boolean;
  organizer_fields_changed boolean;
  review_fields_changed boolean;
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

  important_fields_changed :=
    new.game_name is distinct from old.game_name
    or new.game_tag is distinct from old.game_tag
    or new.rank_snapshot is distinct from old.rank_snapshot
    or new.primary_role is distinct from old.primary_role
    or new.secondary_role is distinct from old.secondary_role;

  organizer_fields_changed :=
    new.valuation is distinct from old.valuation
    or new.team_name is distinct from old.team_name
    or new.matches_played is distinct from old.matches_played
    or new.wins is distinct from old.wins
    or new.losses is distinct from old.losses
    or new.kills is distinct from old.kills
    or new.deaths is distinct from old.deaths
    or new.assists is distinct from old.assists
    or new.placement is distinct from old.placement;

  review_fields_changed :=
    new.reviewed_by_account_id is distinct from old.reviewed_by_account_id
    or new.reviewed_at is distinct from old.reviewed_at
    or new.review_note is distinct from old.review_note;

  if public.is_admin() then
    if important_fields_changed
      or new.group_nickname_snapshot is distinct from old.group_nickname_snapshot
      or new.note is distinct from old.note
    then
      raise exception 'ADMIN_REVIEW_FIELDS_IMMUTABLE';
    end if;

    if new.status is distinct from old.status then
      if organizer_fields_changed then raise exception 'ADMIN_STATS_REVIEW_SEPARATE'; end if;
      if tournament_row.status not in ('REGISTRATION', 'REGISTRATION_CLOSED') then
        raise exception 'ROSTER_LOCKED';
      end if;
      if not public.is_admin_review_transition_allowed(old.status, new.status) then
        raise exception 'INVALID_ADMIN_REVIEW_TRANSITION';
      end if;

      new.reviewed_by_account_id := public.current_account_id();
      new.reviewed_at := now();
      new.review_note := nullif(btrim(new.review_note), '');
      return new;
    end if;

    if organizer_fields_changed then
      if review_fields_changed then raise exception 'REVIEW_METADATA_IMMUTABLE'; end if;
      new.team_name := nullif(btrim(new.team_name), '');
      return new;
    end if;

    raise exception 'INVALID_ADMIN_REVIEW_TRANSITION';
  end if;

  if organizer_fields_changed then raise exception 'ORGANIZER_FIELDS_IMMUTABLE'; end if;

  if tournament_row.status <> 'REGISTRATION'
    or now() < tournament_row.registration_start_at
    or now() > tournament_row.registration_end_at
  then
    raise exception 'ROSTER_LOCKED';
  end if;

  if review_fields_changed then raise exception 'REVIEW_METADATA_IMMUTABLE'; end if;

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

-- Newly added safe columns need explicit SELECT grants because migration 006
-- changed the table to column-level reads for authenticated clients.
grant select (
  valuation,
  team_name,
  matches_played,
  wins,
  losses,
  kills,
  deaths,
  assists,
  placement
) on table public.tournament_registrations to authenticated;

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
          and status in ('PENDING', 'APPROVED', 'WAITLISTED')
      )
    );

  if not participants_restricted then
    select coalesce(jsonb_agg(to_jsonb(participant)), '[]'::jsonb)
    into participant_rows
    from (
      select registration.game_name || '#' || registration.game_tag as game_id,
             registration.primary_role,
             registration.rank_snapshot as rank,
             registration.valuation,
             registration.team_name,
             registration.matches_played,
             registration.wins,
             registration.losses,
             registration.kills,
             registration.deaths,
             registration.assists,
             registration.placement
      from public.tournament_registrations registration
      where registration.tournament_id = tournament_row.id and registration.status = 'APPROVED'
      order by registration.valuation desc nulls last, registration.created_at asc
      limit 200
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

create or replace function public.get_public_player_roster()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  roster jsonb;
begin
  with eligible as (
    select registration.*, tournament.name as tournament_name,
           tournament.slug as tournament_slug, tournament.start_at
    from public.tournament_registrations registration
    join public.tournaments tournament on tournament.id = registration.tournament_id
    where registration.status = 'APPROVED'
      and tournament.visibility = 'PUBLIC'
      and tournament.status <> 'DRAFT'
  ),
  latest as (
    select distinct on (account_id) *
    from eligible
    order by account_id, start_at desc, created_at desc
  )
  select coalesce(jsonb_agg(player.item order by player.sort_valuation desc nulls last, player.sort_name), '[]'::jsonb)
  into roster
  from (
    select latest.valuation as sort_valuation,
           latest.game_name as sort_name,
           jsonb_build_object(
             'game_id', latest.game_name || '#' || latest.game_tag,
             'rank', latest.rank_snapshot,
             'primary_role', latest.primary_role,
             'secondary_role', latest.secondary_role,
             'valuation', latest.valuation,
             'latest_team_name', latest.team_name,
             'tournaments_played', totals.tournaments_played,
             'matches_played', totals.matches_played,
             'wins', totals.wins,
             'losses', totals.losses,
             'kills', totals.kills,
             'deaths', totals.deaths,
             'assists', totals.assists,
             'history', history.records
           ) as item
    from latest
    cross join lateral (
      select count(*)::integer as tournaments_played,
             coalesce(sum(matches_played), 0)::integer as matches_played,
             coalesce(sum(wins), 0)::integer as wins,
             coalesce(sum(losses), 0)::integer as losses,
             coalesce(sum(kills), 0)::integer as kills,
             coalesce(sum(deaths), 0)::integer as deaths,
             coalesce(sum(assists), 0)::integer as assists
      from eligible career
      where career.account_id = latest.account_id
    ) totals
    cross join lateral (
      select coalesce(jsonb_agg(jsonb_build_object(
        'tournament_name', career.tournament_name,
        'tournament_slug', career.tournament_slug,
        'team_name', career.team_name,
        'valuation', career.valuation,
        'rank', career.rank_snapshot,
        'primary_role', career.primary_role,
        'matches_played', career.matches_played,
        'wins', career.wins,
        'losses', career.losses,
        'kills', career.kills,
        'deaths', career.deaths,
        'assists', career.assists,
        'placement', career.placement
      ) order by career.start_at desc), '[]'::jsonb) as records
      from eligible career
      where career.account_id = latest.account_id
    ) history
  ) player;

  return roster;
end;
$$;

revoke all on function public.restrict_player_registration_update() from public, anon, authenticated, service_role;
revoke all on function public.get_tournament_details(text) from public, anon, authenticated, service_role;
grant execute on function public.get_tournament_details(text) to anon, authenticated;
revoke all on function public.get_public_player_roster() from public, anon, authenticated, service_role;
grant execute on function public.get_public_player_roster() to anon, authenticated;

comment on column public.tournament_registrations.valuation is
  'Organizer-assigned virtual player value for this tournament; never a payment or real-money amount.';
comment on column public.tournament_registrations.team_name is
  'Team assignment snapshot for this player in this tournament.';
comment on function public.get_public_player_roster() is
  'Safe public roster built only from approved registrations in published PUBLIC tournaments; account IDs are never returned.';

commit;
