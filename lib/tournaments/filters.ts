import { getTournamentRegistrationPhase } from './domain.ts';
import type { Tournament } from '../../types/index.ts';

export type TournamentListFilter = 'all' | 'registration' | 'ongoing' | 'finished';

export const tournamentListFilters: Array<{ value: TournamentListFilter; label: string }> = [
  { value: 'all', label: '全部赛事' },
  { value: 'ongoing', label: '正在进行' },
  { value: 'registration', label: '报名中' },
  { value: 'finished', label: '已结束' },
];

export function parseTournamentListFilter(value: unknown): TournamentListFilter {
  return value === 'registration' || value === 'ongoing' || value === 'finished' ? value : 'all';
}

export function filterTournaments(tournaments: Tournament[], filter: TournamentListFilter, now = Date.now()) {
  if (filter === 'all') return tournaments;
  if (filter === 'registration') return tournaments.filter((tournament) => getTournamentRegistrationPhase(tournament, now) === 'OPEN');
  if (filter === 'ongoing') return tournaments.filter((tournament) => tournament.status === 'ONGOING');
  return tournaments.filter((tournament) => tournament.status === 'FINISHED');
}
