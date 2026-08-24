import assert from 'node:assert/strict';
import test from 'node:test';
import { localDateTimeToUtc, toTournamentDateTimeLocal } from '../lib/timezone.ts';

test('converts Chinese tournament local time to a stable UTC instant', () => {
  const instant = localDateTimeToUtc('2026-08-30T20:00', 'Asia/Shanghai');
  assert.equal(instant, '2026-08-30T12:00:00.000Z');
  assert.equal(toTournamentDateTimeLocal(instant, 'Asia/Shanghai'), '2026-08-30T20:00');
});

test('editing a stored instant does not depend on the runtime timezone', () => {
  const stored = '2026-08-30T12:00:00.000Z';
  assert.equal(toTournamentDateTimeLocal(stored, 'Asia/Shanghai'), '2026-08-30T20:00');
  assert.equal(toTournamentDateTimeLocal(stored, 'Asia/Tokyo'), '2026-08-30T21:00');
});
