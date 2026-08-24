-- Keep anonymous public reads independent from authenticated admin checks.
-- The previous combined policy called is_admin() for anon requests even though
-- that helper is intentionally authenticated-only, causing public REST reads
-- to fail with permission denied instead of returning the visible rows.

begin;

drop policy if exists tournaments_read_public_or_admin on public.tournaments;
drop policy if exists tournaments_read_public on public.tournaments;
drop policy if exists tournaments_read_admin on public.tournaments;

create policy tournaments_read_public on public.tournaments
for select to anon, authenticated
using (visibility = 'PUBLIC' and status <> 'DRAFT');

create policy tournaments_read_admin on public.tournaments
for select to authenticated
using (public.is_admin());

comment on policy tournaments_read_public on public.tournaments is
  'Anonymous and authenticated clients may read only published public tournaments without invoking authenticated-only helpers.';

comment on policy tournaments_read_admin on public.tournaments is
  'Authenticated application admins may read every tournament, including drafts and private tournaments.';

commit;
