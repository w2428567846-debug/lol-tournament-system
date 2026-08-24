-- Hosted Supabase installs pgcrypto in the trusted extensions schema. Keep the
-- privileged-function search path explicit so invite hashing and verification work
-- without making any browser role a direct extension owner.

alter function public.hash_tournament_invite_code()
  set search_path = extensions, public, pg_temp;

alter function public.register_for_tournament(
  uuid,
  text,
  text,
  text,
  public.player_role,
  public.player_role,
  text,
  text,
  text
)
  set search_path = extensions, public, pg_temp;
