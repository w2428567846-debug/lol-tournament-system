import { getAdminClient } from '@/lib/auth/server';
import { mapRegistration } from '@/lib/registrations/queries';
import { mapTournament } from '@/lib/tournaments/mapper';
import type { AdminRegistration, PlayerProfile, RegistrationStatus, Tournament } from '@/types';

type Row = Record<string, unknown>;

async function adminSupabase() {
  const result = await getAdminClient();
  if ('error' in result) return null;
  return result.supabase;
}

function mapProfile(row: Row): PlayerProfile {
  const gameName = String(row.game_name);
  const gameTag = String(row.game_tag);
  return {
    id: String(row.id),
    accountId: String(row.account_id),
    gameName,
    gameTag,
    gameId: `${gameName}#${gameTag}`,
    primaryRole: row.primary_role as PlayerProfile['primaryRole'],
    secondaryRole: (row.secondary_role ?? null) as PlayerProfile['secondaryRole'],
    currentRank: String(row.current_rank),
    groupNickname: row.group_nickname == null ? null : String(row.group_nickname),
    bio: row.bio == null ? null : String(row.bio),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function getAdminMetrics() {
  const supabase = await adminSupabase();
  if (!supabase) return null;
  const [tournaments, accounts, pending, approved] = await Promise.all([
    supabase.from('tournaments').select('id', { count: 'exact', head: true }),
    supabase.from('accounts').select('id', { count: 'exact', head: true }),
    supabase.from('tournament_registrations').select('id', { count: 'exact', head: true }).eq('status', 'PENDING'),
    supabase.from('tournament_registrations').select('id', { count: 'exact', head: true }).eq('status', 'APPROVED'),
  ]);
  return { tournaments: tournaments.count ?? 0, players: accounts.count ?? 0, pending: pending.count ?? 0, approved: approved.count ?? 0 };
}

export async function getAdminTournaments(): Promise<Tournament[]> {
  const supabase = await adminSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase.from('tournaments').select('*').order('start_at', { ascending: false });
  if (error) throw new Error(`ADMIN_TOURNAMENTS_FAILED:${error.message}`);
  return (data ?? []).map((row) => mapTournament(row));
}

export async function getAdminTournament(id: string): Promise<Tournament | null> {
  const supabase = await adminSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.from('tournaments').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(`ADMIN_TOURNAMENT_FAILED:${error.message}`);
  return data ? mapTournament(data) : null;
}

export async function getAdminPlayers(): Promise<PlayerProfile[]> {
  const supabase = await adminSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase.from('player_profiles').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(`ADMIN_PLAYERS_FAILED:${error.message}`);
  return (data ?? []).map((row) => mapProfile(row));
}

export async function getAdminRegistrations(filters: { tournamentId?: string; status?: RegistrationStatus; search?: string }) {
  const supabase = await adminSupabase();
  if (!supabase) return [] as AdminRegistration[];
  let query = supabase
    .from('tournament_registrations')
    .select('*, tournaments!inner(id, name, slug)')
    .order('created_at', { ascending: false });
  if (filters.tournamentId) query = query.eq('tournament_id', filters.tournamentId);
  if (filters.status) query = query.eq('status', filters.status);
  const { data, error } = await query;
  if (error) throw new Error(`ADMIN_REGISTRATIONS_FAILED:${error.message}`);

  const registrations: AdminRegistration[] = (data ?? []).map((row) => {
    const tournamentValue = row.tournaments as unknown;
    const tournament = (Array.isArray(tournamentValue) ? tournamentValue[0] : tournamentValue) as Row;
    return {
      ...mapRegistration(row),
      tournament: { id: String(tournament.id), name: String(tournament.name), slug: String(tournament.slug) },
    };
  });

  const needle = filters.search?.trim().toLocaleLowerCase('zh-CN');
  return needle ? registrations.filter((item) =>
    item.gameId.toLocaleLowerCase('zh-CN').includes(needle)
    || (item.groupNicknameSnapshot ?? '').toLocaleLowerCase('zh-CN').includes(needle)
  ) : registrations;
}
