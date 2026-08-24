import type { Tournament } from '@/types';

export function isTournamentRegistrationOpen(tournament: Tournament) {
  const now = Date.now();
  return tournament.status === 'REGISTRATION'
    && now >= new Date(tournament.registrationStartAt).getTime()
    && now <= new Date(tournament.registrationEndAt).getTime()
    && (tournament.registrationType === 'SOLO' || tournament.registrationType === 'BOTH');
}
