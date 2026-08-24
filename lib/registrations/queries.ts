import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { AccountRegistration, PlayerProfile } from '@/types';

type RecordValue = Record<string, unknown>;

function mapProfile(row: RecordValue): PlayerProfile {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    displayName: String(row.display_name),
    riotId: String(row.riot_id),
    server: String(row.server),
    primaryRole: row.primary_role as PlayerProfile['primaryRole'],
    secondaryRole: (row.secondary_role ?? null) as PlayerProfile['secondaryRole'],
    rank: String(row.rank),
    groupNickname: row.group_nickname == null ? null : String(row.group_nickname),
    bio: row.bio == null ? null : String(row.bio),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function getAccountOverview(userId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: profileData, error: profileError } = await supabase
    .from('player_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (profileError) throw new Error(`PROFILE_LOAD_FAILED:${profileError.message}`);
  const profile = profileData ? mapProfile(profileData) : null;
  if (!profile) return { profile: null, registrations: [] as AccountRegistration[] };

  const { data: registrationsData, error: registrationsError } = await supabase
    .from('tournament_registrations')
    .select('*, tournaments!inner(name, slug, start_at)')
    .eq('player_id', profile.id)
    .order('created_at', { ascending: false });

  if (registrationsError) throw new Error(`REGISTRATIONS_LOAD_FAILED:${registrationsError.message}`);

  const registrations: AccountRegistration[] = (registrationsData ?? []).map((row) => {
    const tournamentValue = row.tournaments as unknown;
    const tournament = (Array.isArray(tournamentValue) ? tournamentValue[0] : tournamentValue) as RecordValue;
    return {
      id: String(row.id),
      tournamentId: String(row.tournament_id),
      playerId: String(row.player_id),
      status: row.status as AccountRegistration['status'],
      preferredRole: row.preferred_role as AccountRegistration['preferredRole'],
      secondaryRole: (row.secondary_role ?? null) as AccountRegistration['secondaryRole'],
      note: row.note == null ? null : String(row.note),
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
      tournament: {
        name: String(tournament.name),
        slug: String(tournament.slug),
        startAt: String(tournament.start_at),
      },
    };
  });

  return { profile, registrations };
}
