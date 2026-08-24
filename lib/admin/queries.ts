import { getAdminClient } from '@/lib/auth/server';
import { mapTournament } from '@/lib/tournaments/mapper';
import type { AdminRegistration, PlayerProfile, RegistrationStatus, Tournament } from '@/types';

type Row = Record<string, unknown>;

async function adminSupabase() {
  const result = await getAdminClient();
  if ('error' in result) return null;
  return result.supabase;
}

export async function getAdminMetrics() {
  const supabase = await adminSupabase();
  if (!supabase) return null;
  const [tournaments, profiles, pending, approved] = await Promise.all([
    supabase.from('tournaments').select('id', { count: 'exact', head: true }),
    supabase.from('player_profiles').select('id', { count: 'exact', head: true }),
    supabase.from('tournament_registrations').select('id', { count: 'exact', head: true }).eq('status', 'PENDING'),
    supabase.from('tournament_registrations').select('id', { count: 'exact', head: true }).eq('status', 'APPROVED'),
  ]);
  return { tournaments: tournaments.count ?? 0, players: profiles.count ?? 0, pending: pending.count ?? 0, approved: approved.count ?? 0 };
}

export async function getAdminTournaments(): Promise<Tournament[]> {
  const supabase = await adminSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase.from('tournaments').select('*').order('start_at', { ascending: false });
  if (error) throw new Error(`ADMIN_TOURNAMENTS_FAILED:${error.message}`);
  return (data ?? []).map((row) => mapTournament(row));
}

export async function getAdminPlayers(): Promise<PlayerProfile[]> {
  const supabase = await adminSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase.from('player_profiles').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(`ADMIN_PLAYERS_FAILED:${error.message}`);
  return (data ?? []).map((row) => ({
    id: String(row.id), userId: String(row.user_id), displayName: String(row.display_name), riotId: String(row.riot_id), server: String(row.server), primaryRole: row.primary_role as PlayerProfile['primaryRole'], secondaryRole: (row.secondary_role ?? null) as PlayerProfile['secondaryRole'], rank: String(row.rank), groupNickname: row.group_nickname == null ? null : String(row.group_nickname), bio: row.bio == null ? null : String(row.bio), createdAt: String(row.created_at), updatedAt: String(row.updated_at),
  }));
}

export async function getAdminRegistrations(filters: { tournamentId?: string; status?: RegistrationStatus; search?: string }) {
  const supabase = await adminSupabase();
  if (!supabase) return [] as AdminRegistration[];
  let query = supabase.from('tournament_registrations').select('*, player_profiles!inner(display_name, riot_id, server), tournaments!inner(id, name, slug)').order('created_at', { ascending: false });
  if (filters.tournamentId) query = query.eq('tournament_id', filters.tournamentId);
  if (filters.status) query = query.eq('status', filters.status);
  const { data, error } = await query;
  if (error) throw new Error(`ADMIN_REGISTRATIONS_FAILED:${error.message}`);

  const registrations = (data ?? []).map((row) => {
    const playerValue = row.player_profiles as unknown;
    const tournamentValue = row.tournaments as unknown;
    const player = (Array.isArray(playerValue) ? playerValue[0] : playerValue) as Row;
    const tournament = (Array.isArray(tournamentValue) ? tournamentValue[0] : tournamentValue) as Row;
    return {
      id: String(row.id), tournamentId: String(row.tournament_id), playerId: String(row.player_id), status: row.status as RegistrationStatus, preferredRole: row.preferred_role as AdminRegistration['preferredRole'], secondaryRole: (row.secondary_role ?? null) as AdminRegistration['secondaryRole'], note: row.note == null ? null : String(row.note), createdAt: String(row.created_at), updatedAt: String(row.updated_at),
      player: { displayName: String(player.display_name), riotId: String(player.riot_id), server: String(player.server) },
      tournament: { id: String(tournament.id), name: String(tournament.name), slug: String(tournament.slug) },
    } satisfies AdminRegistration;
  });

  const needle = filters.search?.trim().toLocaleLowerCase();
  return needle ? registrations.filter((item) => item.player.displayName.toLocaleLowerCase().includes(needle) || item.player.riotId.toLocaleLowerCase().includes(needle)) : registrations;
}
