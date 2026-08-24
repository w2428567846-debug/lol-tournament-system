import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canApproveRegistration,
  canAdminReviewRegistration,
  canPlayerManageRegistration,
  canPlayerResubmitRegistration,
  getTournamentRegistrationPhase,
  isRegistrationWindowOpen,
  isSupportedRegistrationType,
  registrationConsumesCapacity,
  registrationDuplicateReason,
  restrictAnonymousParticipantData,
  statusAfterImportantPlayerEdit,
} from '../lib/tournaments/domain.ts';
import { filterTournaments, parseTournamentListFilter } from '../lib/tournaments/filters.ts';
import { canUseDevelopmentFallback } from '../lib/runtime-mode.ts';

const liveWindow = {
  status: 'REGISTRATION',
  registrationType: 'SOLO',
  registrationStartAt: '2026-08-30T12:00:00.000Z',
  registrationEndAt: '2026-08-30T14:00:00.000Z',
};

test('registration boundaries are inclusive absolute instants', () => {
  assert.equal(isRegistrationWindowOpen(liveWindow, Date.parse(liveWindow.registrationStartAt)), true);
  assert.equal(isRegistrationWindowOpen(liveWindow, Date.parse(liveWindow.registrationEndAt)), true);
  assert.equal(isRegistrationWindowOpen(liveWindow, Date.parse(liveWindow.registrationStartAt) - 1), false);
  assert.equal(isRegistrationWindowOpen(liveWindow, Date.parse(liveWindow.registrationEndAt) + 1), false);
});

test('registration phase distinguishes before, during, after, closed, and locked', () => {
  assert.equal(getTournamentRegistrationPhase(liveWindow, Date.parse(liveWindow.registrationStartAt) - 1), 'NOT_STARTED');
  assert.equal(getTournamentRegistrationPhase(liveWindow, Date.parse('2026-08-30T13:00:00.000Z')), 'OPEN');
  assert.equal(getTournamentRegistrationPhase(liveWindow, Date.parse(liveWindow.registrationEndAt) + 1), 'ENDED');
  assert.equal(getTournamentRegistrationPhase({ ...liveWindow, status: 'REGISTRATION_CLOSED' }, Date.parse('2026-08-30T13:00:00.000Z')), 'CLOSED');
  assert.equal(getTournamentRegistrationPhase({ ...liveWindow, status: 'ROSTER_LOCKED' }, Date.parse('2026-08-30T13:00:00.000Z')), 'ROSTER_LOCKED');
});

test('tournament URL filters are deterministic and invalid values fall back to all', () => {
  const now = Date.parse('2026-08-30T13:00:00.000Z');
  const tournaments = [
    { id: 'open', ...liveWindow },
    { id: 'future', ...liveWindow, registrationStartAt: '2026-08-31T12:00:00.000Z', registrationEndAt: '2026-08-31T14:00:00.000Z' },
    { id: 'live', ...liveWindow, status: 'ONGOING' },
    { id: 'done', ...liveWindow, status: 'FINISHED' },
  ];
  assert.equal(parseTournamentListFilter('unexpected'), 'all');
  assert.deepEqual(filterTournaments(tournaments, 'registration', now).map((item) => item.id), ['open']);
  assert.deepEqual(filterTournaments(tournaments, 'ongoing', now).map((item) => item.id), ['live']);
  assert.deepEqual(filterTournaments(tournaments, 'finished', now).map((item) => item.id), ['done']);
});

test('SOLO is accepted while unfinished TEAM and BOTH modes are rejected', () => {
  assert.equal(isSupportedRegistrationType('SOLO'), true);
  assert.equal(isSupportedRegistrationType('TEAM'), false);
  assert.equal(isSupportedRegistrationType('BOTH'), false);
});

test('duplicate accounts and normalized game IDs are detected independently', () => {
  const registrations = [{ accountId: 'account-a', normalizedGameId: '峡谷玩家#12345' }];
  assert.equal(registrationDuplicateReason(registrations, { accountId: 'account-a', normalizedGameId: '其他玩家#8888' }), 'ACCOUNT_ALREADY_REGISTERED');
  assert.equal(registrationDuplicateReason(registrations, { accountId: 'account-b', normalizedGameId: '峡谷玩家#12345' }), 'GAME_ID_ALREADY_REGISTERED');
});

test('approved capacity is enforced and pending does not consume it', () => {
  assert.equal(registrationConsumesCapacity('APPROVED'), true);
  assert.equal(registrationConsumesCapacity('PENDING'), false);
  assert.equal(registrationConsumesCapacity('WAITLISTED'), false);
  assert.equal(canApproveRegistration({ currentStatus: 'PENDING', approvedCount: 8, playerLimit: 8 }), false);
  assert.equal(canApproveRegistration({ currentStatus: 'PENDING', approvedCount: 7, playerLimit: 8 }), true);
});

test('roster lock prevents both player edits and cancellation', () => {
  const locked = {
    tournamentStatus: 'ROSTER_LOCKED',
    registrationStartAt: liveWindow.registrationStartAt,
    registrationEndAt: liveWindow.registrationEndAt,
    registrationStatus: 'APPROVED',
  };
  const duringWindow = Date.parse('2026-08-30T13:00:00.000Z');
  assert.equal(canPlayerManageRegistration(locked, duringWindow), false, 'edit is blocked');
  assert.equal(canPlayerManageRegistration(locked, duringWindow), false, 'cancellation is blocked');
});

test('admin review transitions are explicit and registration-closed remains reviewable', () => {
  assert.equal(canAdminReviewRegistration({ fromStatus: 'PENDING', toStatus: 'APPROVED', tournamentStatus: 'REGISTRATION' }), true);
  assert.equal(canAdminReviewRegistration({ fromStatus: 'WAITLISTED', toStatus: 'APPROVED', tournamentStatus: 'REGISTRATION_CLOSED' }), true);
  assert.equal(canAdminReviewRegistration({ fromStatus: 'APPROVED', toStatus: 'WAITLISTED', tournamentStatus: 'REGISTRATION_CLOSED' }), true);
  assert.equal(canAdminReviewRegistration({ fromStatus: 'CANCELLED', toStatus: 'APPROVED', tournamentStatus: 'REGISTRATION' }), false);
  assert.equal(canAdminReviewRegistration({ fromStatus: 'REJECTED', toStatus: 'APPROVED', tournamentStatus: 'REGISTRATION' }), false);
  assert.equal(canAdminReviewRegistration({ fromStatus: 'PENDING', toStatus: 'APPROVED', tournamentStatus: 'ROSTER_LOCKED' }), false);
});

test('a rejected player can resubmit only while registration is open', () => {
  const rejected = {
    tournamentStatus: 'REGISTRATION',
    registrationStartAt: liveWindow.registrationStartAt,
    registrationEndAt: liveWindow.registrationEndAt,
    registrationStatus: 'REJECTED',
  };
  assert.equal(canPlayerResubmitRegistration(rejected, Date.parse('2026-08-30T13:00:00.000Z')), true);
  assert.equal(canPlayerResubmitRegistration(rejected, Date.parse(liveWindow.registrationEndAt) + 1), false);
  assert.equal(canPlayerResubmitRegistration({ ...rejected, tournamentStatus: 'REGISTRATION_CLOSED' }, Date.parse('2026-08-30T13:00:00.000Z')), false);
  assert.equal(canPlayerResubmitRegistration({ ...rejected, registrationStatus: 'CANCELLED' }, Date.parse('2026-08-30T13:00:00.000Z')), false);
});

test('important approved or waitlisted edits return to pending', () => {
  assert.equal(statusAfterImportantPlayerEdit('APPROVED', true), 'PENDING');
  assert.equal(statusAfterImportantPlayerEdit('WAITLISTED', true), 'PENDING');
  assert.equal(statusAfterImportantPlayerEdit('APPROVED', false), 'APPROVED');
});

test('anonymous participant details are restricted for private tournaments', () => {
  assert.equal(restrictAnonymousParticipantData('PRIVATE'), true);
  assert.equal(restrictAnonymousParticipantData('PUBLIC'), false);
});

test('sample tournament fallback is development-only', () => {
  assert.equal(canUseDevelopmentFallback('development'), true);
  assert.equal(canUseDevelopmentFallback('production'), false);
  assert.equal(canUseDevelopmentFallback(undefined), false);
});
