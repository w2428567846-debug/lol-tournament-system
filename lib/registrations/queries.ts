import { createServerSupabaseClient } from '@/lib/supabase/server';
import { canPlayerManageRegistration, canPlayerResubmitRegistration, isRosterFrozen } from '@/lib/tournaments/domain';
import type { AccountRegistration, PlayerProfile, TournamentRegistration } from '@/types';

type RecordValue = Record<string, unknown>;

const PLAYER_PROFILE_COLUMNS = 'id, game_name, game_tag, primary_role, secondary_role, current_rank, group_nickname, bio, created_at, updated_at';
const PLAYER_REGISTRATION_COLUMNS = 'id, tournament_id, game_name, game_tag, rank_snapshot, status, primary_role, secondary_role, group_nickname_snapshot, note, reviewed_at, review_note, valuation, team_name, matches_played, wins, losses, kills, deaths, assists, placement, created_at, updated_at';

function mapProfile(row: RecordValue): PlayerProfile {
  const gameName = String(row.game_name);
  const gameTag = String(row.game_tag);
  return {
    id: String(row.id),
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

export function mapRegistration(row: RecordValue): TournamentRegistration {
  const gameName = String(row.game_name);
  const gameTag = String(row.game_tag);
  return {
    id: String(row.id),
    tournamentId: String(row.tournament_id),
    gameName,
    gameTag,
    gameId: `${gameName}#${gameTag}`,
    rankSnapshot: String(row.rank_snapshot),
    status: row.status as TournamentRegistration['status'],
    primaryRole: row.primary_role as TournamentRegistration['primaryRole'],
    secondaryRole: (row.secondary_role ?? null) as TournamentRegistration['secondaryRole'],
    groupNicknameSnapshot: row.group_nickname_snapshot == null ? null : String(row.group_nickname_snapshot),
    note: row.note == null ? null : String(row.note),
    reviewedAt: row.reviewed_at == null ? null : String(row.reviewed_at),
    reviewNote: row.review_note == null ? null : String(row.review_note),
    reviewerLabel: row.reviewed_at == null ? null : '管理员',
    valuation: row.valuation == null ? null : Number(row.valuation),
    teamName: row.team_name == null ? null : String(row.team_name),
    matchesPlayed: Number(row.matches_played ?? 0),
    wins: Number(row.wins ?? 0),
    losses: Number(row.losses ?? 0),
    kills: Number(row.kills ?? 0),
    deaths: Number(row.deaths ?? 0),
    assists: Number(row.assists ?? 0),
    placement: row.placement == null ? null : Number(row.placement),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function getSavedProfile(accountId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('player_profiles')
    .select(PLAYER_PROFILE_COLUMNS)
    .eq('account_id', accountId)
    .maybeSingle();
  if (error) throw new Error(`PROFILE_LOAD_FAILED:${error.message}`);
  return data ? mapProfile(data) : null;
}

export async function getAccountOverview(accountId: string) {
  const supabase = await createServerSupabaseClient();
  const [profileResult, registrationsResult] = await Promise.all([
    supabase.from('player_profiles').select(PLAYER_PROFILE_COLUMNS).eq('account_id', accountId).maybeSingle(),
    supabase
      .from('tournament_registrations')
      .select(`${PLAYER_REGISTRATION_COLUMNS}, tournaments!inner(name, slug, start_at, status, timezone, registration_start_at, registration_end_at)`)
      .eq('account_id', accountId)
      .order('created_at', { ascending: false }),
  ]);

  if (profileResult.error) throw new Error(`PROFILE_LOAD_FAILED:${profileResult.error.message}`);
  if (registrationsResult.error) throw new Error(`REGISTRATIONS_LOAD_FAILED:${registrationsResult.error.message}`);

  const now = Date.now();
  const registrations: AccountRegistration[] = (registrationsResult.data ?? []).map((row) => {
    const tournamentValue = row.tournaments as unknown;
    const tournament = (Array.isArray(tournamentValue) ? tournamentValue[0] : tournamentValue) as RecordValue;
    const mapped = mapRegistration(row);
    const registrationStartAt = String(tournament.registration_start_at);
    const registrationEndAt = String(tournament.registration_end_at);
    return {
      ...mapped,
      tournament: {
        name: String(tournament.name),
        slug: String(tournament.slug),
        startAt: String(tournament.start_at),
        status: tournament.status as AccountRegistration['tournament']['status'],
        timezone: String(tournament.timezone ?? 'Asia/Shanghai'),
        registrationStartAt,
        registrationEndAt,
      },
      canSelfManage: canPlayerManageRegistration({
        tournamentStatus: tournament.status as AccountRegistration['tournament']['status'],
        registrationStartAt,
        registrationEndAt,
        registrationStatus: mapped.status,
      }, now),
      canResubmit: canPlayerResubmitRegistration({
        tournamentStatus: tournament.status as AccountRegistration['tournament']['status'],
        registrationStartAt,
        registrationEndAt,
        registrationStatus: mapped.status,
      }, now),
      rosterLocked: isRosterFrozen(tournament.status as AccountRegistration['tournament']['status']),
    };
  });

  return {
    profile: profileResult.data ? mapProfile(profileResult.data) : null,
    registrations,
  };
}

export async function getAccountTournamentRegistration(accountId: string, tournamentId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('tournament_registrations')
    .select(PLAYER_REGISTRATION_COLUMNS)
    .eq('account_id', accountId)
    .eq('tournament_id', tournamentId)
    .maybeSingle();
  if (error) throw new Error(`REGISTRATION_LOAD_FAILED:${error.message}`);
  return data ? mapRegistration(data) : null;
}
