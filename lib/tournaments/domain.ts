export type RegistrationMode = 'SOLO' | 'TEAM' | 'BOTH';
export type RegistrationState = 'PENDING' | 'APPROVED' | 'WAITLISTED' | 'REJECTED' | 'CANCELLED';
export type TournamentLifecycle = 'DRAFT' | 'REGISTRATION' | 'REGISTRATION_CLOSED' | 'ROSTER_LOCKED' | 'TEAM_FORMING' | 'SCHEDULED' | 'ONGOING' | 'FINISHED' | 'CANCELLED';

// TEAM and BOTH stay in the database enum for legacy rows and a future milestone.
export const CURRENTLY_SUPPORTED_REGISTRATION_TYPES = ['SOLO'] as const;

export function isSupportedRegistrationType(value: string): value is typeof CURRENTLY_SUPPORTED_REGISTRATION_TYPES[number] {
  return CURRENTLY_SUPPORTED_REGISTRATION_TYPES.some((type) => type === value);
}

export function isRegistrationWindowOpen(input: {
  status: TournamentLifecycle;
  registrationType: RegistrationMode;
  registrationStartAt: string;
  registrationEndAt: string;
}, now = Date.now()) {
  return input.status === 'REGISTRATION'
    && isSupportedRegistrationType(input.registrationType)
    && now >= new Date(input.registrationStartAt).getTime()
    && now <= new Date(input.registrationEndAt).getTime();
}

export function registrationConsumesCapacity(status: RegistrationState) {
  return status === 'APPROVED';
}

export function canApproveRegistration(input: { currentStatus: RegistrationState; approvedCount: number; playerLimit: number | null }) {
  if (input.currentStatus === 'APPROVED' || input.playerLimit === null) return true;
  return input.approvedCount < input.playerLimit;
}

export function registrationDuplicateReason(
  registrations: Array<{ accountId: string; normalizedGameId: string }>,
  candidate: { accountId: string; normalizedGameId: string },
) {
  if (registrations.some((registration) => registration.accountId === candidate.accountId)) return 'ACCOUNT_ALREADY_REGISTERED' as const;
  if (registrations.some((registration) => registration.normalizedGameId === candidate.normalizedGameId)) return 'GAME_ID_ALREADY_REGISTERED' as const;
  return null;
}

export function canPlayerManageRegistration(input: {
  tournamentStatus: TournamentLifecycle;
  registrationStartAt: string;
  registrationEndAt: string;
  registrationStatus: RegistrationState;
}, now = Date.now()) {
  return input.tournamentStatus === 'REGISTRATION'
    && now >= new Date(input.registrationStartAt).getTime()
    && now <= new Date(input.registrationEndAt).getTime()
    && ['PENDING', 'APPROVED', 'WAITLISTED'].includes(input.registrationStatus);
}

export function statusAfterImportantPlayerEdit(status: RegistrationState, importantFieldsChanged: boolean) {
  return importantFieldsChanged && (status === 'APPROVED' || status === 'WAITLISTED') ? 'PENDING' as const : status;
}

export function restrictAnonymousParticipantData(visibility: 'PUBLIC' | 'UNLISTED' | 'PRIVATE') {
  return visibility === 'PRIVATE';
}
