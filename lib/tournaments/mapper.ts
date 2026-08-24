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
    registrationStartAt: String(row.registration_start_at),
    registrationEndAt: String(row.registration_end_at),
    playerLimit: row.player_limit == null ? null : Number(row.player_limit),
    teamLimit: row.team_limit == null ? null : Number(row.team_limit),
    startAt: String(row.start_at),
    endAt: String(row.end_at),
    format: row.format as Tournament['format'],
    defaultBestOf: Number(row.default_best_of) as Tournament['defaultBestOf'],
    createdBy: row.created_by == null ? null : String(row.created_by),
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
    participants: participants.map((participant) => {
      const item = participant as TournamentRecord;
      return {
        displayName: String(item.display_name),
        primaryRole: item.primary_role as TournamentDetail['participants'][number]['primaryRole'],
        rank: String(item.rank),
      };
    }),
  };
}
