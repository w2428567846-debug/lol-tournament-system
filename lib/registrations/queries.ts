import { createServerSupabaseClient } from '@/lib/supabase/server';
import { canPlayerManageRegistration, canPlayerResubmitRegistration, isRosterFrozen } from '@/lib/tournaments/domain';
import type { AccountRegistration, PlayerProfile, TournamentRegistration } from '@/types';

type RecordValue = Record<string, unknown>;

function mapProfile(row: RecordValue): PlayerProfile {
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

export function mapRegistration(row: RecordValue): TournamentRegistration {
  const gameName = String(row.game_name);
  const gameTag = String(row.game_tag);
  return {
    id: String(row.id),
    tournamentId: String(row.tournament_id),
    accountId: String(row.account_id),
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
    reviewerLabel: row.reviewed_by_account_id == null ? null : '管理员',
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function getSavedProfile(accountId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('player_profiles')
    .select('*')
    .eq('account_id', accountId)
    .maybeSingle();
  if (error) throw new Error(`PROFILE_LOAD_FAILED:${error.message}`);
  return data ? mapProfile(data) : null;
}

export async function getAccountOverview(accountId: string) {
  const supabase = await createServerSupabaseClient();
  const [profileResult, registrationsResult] = await Promise.all([
    supabase.from('player_profiles').select('*').eq('account_id', accountId).maybeSingle(),
    supabase
      .from('tournament_registrations')
      .select('*, tournaments!inner(name, slug, start_at, status, timezone, registration_start_at, registration_end_at)')
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
    .select('*')
    .eq('account_id', accountId)
    .eq('tournament_id', tournamentId)
    .maybeSingle();
  if (error) throw new Error(`REGISTRATION_LOAD_FAILED:${error.message}`);
  return data ? mapRegistration(data) : null;
}
