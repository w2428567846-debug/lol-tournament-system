import type { Tournament } from '@/types';
import { isRegistrationWindowOpen } from '@/lib/tournaments/domain';

export function isTournamentRegistrationOpen(tournament: Tournament, now = Date.now()) {
  return isRegistrationWindowOpen(tournament, now);
}
