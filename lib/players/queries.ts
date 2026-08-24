import { isSupabaseConfigured } from '@/lib/supabase/config';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { PlayerRole, PlayerTournamentPerformance, PublicPlayerRosterEntry } from '@/types';

type JsonRow = Record<string, unknown>;

function numberValue(value: unknown) {
  return Number(value ?? 0);
}

function nullableNumber(value: unknown) {
  return value == null ? null : Number(value);
}

function mapHistory(value: unknown): PlayerTournamentPerformance[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const row = item as JsonRow;
    return {
      tournamentName: String(row.tournament_name),
      tournamentSlug: String(row.tournament_slug),
      teamName: row.team_name == null ? null : String(row.team_name),
      valuation: nullableNumber(row.valuation),
      rank: String(row.rank),
      primaryRole: row.primary_role as PlayerRole,
      matchesPlayed: numberValue(row.matches_played),
      wins: numberValue(row.wins),
      losses: numberValue(row.losses),
      kills: numberValue(row.kills),
      deaths: numberValue(row.deaths),
      assists: numberValue(row.assists),
      placement: nullableNumber(row.placement),
    };
  });
}

function mapPlayer(row: JsonRow): PublicPlayerRosterEntry {
  return {
    gameId: String(row.game_id),
    rank: String(row.rank),
    primaryRole: row.primary_role as PlayerRole,
    secondaryRole: (row.secondary_role ?? null) as PlayerRole | null,
    valuation: nullableNumber(row.valuation),
    latestTeamName: row.latest_team_name == null ? null : String(row.latest_team_name),
    tournamentsPlayed: numberValue(row.tournaments_played),
    matchesPlayed: numberValue(row.matches_played),
    wins: numberValue(row.wins),
    losses: numberValue(row.losses),
    kills: numberValue(row.kills),
    deaths: numberValue(row.deaths),
    assists: numberValue(row.assists),
    history: mapHistory(row.history),
  };
}

export async function getPublicPlayerRoster() {
  if (!isSupabaseConfigured()) return { players: [] as PublicPlayerRosterEntry[], configurationMissing: true };

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc('get_public_player_roster');
  if (error) throw new Error(`PUBLIC_PLAYER_ROSTER_FAILED:${error.message}`);
  const rows = Array.isArray(data) ? data as JsonRow[] : [];
  return { players: rows.map(mapPlayer), configurationMissing: false };
}
