-- Final pre-OAuth privacy cleanup. Keep private participant previews available
-- only to application admins and accounts with an active tournament entry.

begin;

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

revoke all on function public.get_tournament_details(text) from public, anon, authenticated, service_role;
grant execute on function public.get_tournament_details(text) to anon, authenticated;

comment on function public.get_tournament_details(text) is
  'Safe tournament details. PRIVATE participant previews require application admin or PENDING, APPROVED, or WAITLISTED registration status.';

comment on function public.normalize_game_id_part(text, boolean) is
  'Pure immutable game-ID text normalization with no table access; authenticated EXECUTE is intentional.';

commit;
