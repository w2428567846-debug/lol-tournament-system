import type { Tournament, TournamentDetail } from '@/types';

type TournamentRecord = Record<string, unknown>;

export function mapTournament(row: TournamentRecord): Tournament {
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    description: String(row.description ?? ''),
    status: row.status as Tournament['status'],
    visibility: row.visibility as Tournament['visibility'],
    registrationType: row.registration_type as Tournament['registrationType'],
    timezone: String(row.timezone ?? 'Asia/Shanghai'),
    registrationStartAt: String(row.registration_start_at),
    registrationEndAt: String(row.registration_end_at),
    playerLimit: row.player_limit == null ? null : Number(row.player_limit),
    teamLimit: row.team_limit == null ? null : Number(row.team_limit),
    startAt: String(row.start_at),
    endAt: String(row.end_at),
    format: row.format as Tournament['format'],
    defaultBestOf: Number(row.default_best_of) as Tournament['defaultBestOf'],
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    rules: row.rules == null ? undefined : String(row.rules),
  };
}

export function mapTournamentDetail(row: TournamentRecord): TournamentDetail {
  const tournament = mapTournament(row);
  const participants = Array.isArray(row.participants) ? row.participants : [];

  return {
    ...tournament,
    approvedCount: Number(row.approved_count ?? 0),
    pendingCount: Number(row.pending_count ?? 0),
    waitlistedCount: Number(row.waitlisted_count ?? 0),
    participantsRestricted: Boolean(row.participants_restricted ?? false),
    participants: participants.map((participant) => {
      const item = participant as TournamentRecord;
      return {
        gameId: String(item.game_id),
        primaryRole: item.primary_role as TournamentDetail['participants'][number]['primaryRole'],
        rank: String(item.rank),
        valuation: item.valuation == null ? null : Number(item.valuation),
        teamName: item.team_name == null ? null : String(item.team_name),
        matchesPlayed: Number(item.matches_played ?? 0),
        wins: Number(item.wins ?? 0),
        losses: Number(item.losses ?? 0),
        kills: Number(item.kills ?? 0),
        deaths: Number(item.deaths ?? 0),
        assists: Number(item.assists ?? 0),
        placement: item.placement == null ? null : Number(item.placement),
      };
    }),
  };
}
