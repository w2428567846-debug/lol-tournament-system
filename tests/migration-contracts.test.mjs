import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const migration = readFileSync(new URL('../supabase/migrations/202608240003_community_registration_refactor.sql', import.meta.url), 'utf8');
const hardeningMigration = readFileSync(new URL('../supabase/migrations/202608240004_registration_production_hardening.sql', import.meta.url), 'utf8');

test('registration snapshots are account-owned and reject duplicate accounts and game IDs', () => {
  assert.match(migration, /unique_account_tournament unique \(tournament_id, account_id\)/);
  assert.match(migration, /unique_game_id_tournament unique/);
  assert.match(migration, /rank_snapshot text/);
  assert.match(migration, /group_nickname_snapshot text/);
});

test('only approved registrations consume capacity under a tournament row lock', () => {
  assert.match(migration, /from public\.tournaments[\s\S]*where id = new\.tournament_id[\s\S]*for update/);
  assert.match(migration, /where tournament_id = new\.tournament_id\s+and status = 'APPROVED'/);
  assert.match(migration, /PLAYER_LIMIT_BELOW_APPROVED/);
  assert.doesNotMatch(migration, /status in \('PENDING', 'APPROVED', 'WAITLISTED'\)/);
});

test('roster lock and important edits are enforced by database triggers', () => {
  assert.match(migration, /raise exception 'ROSTER_LOCKED'/);
  assert.match(migration, /important_fields_changed[\s\S]*new\.status := 'PENDING'/);
  assert.match(migration, /'REGISTRATION_CLOSED'[\s\S]*'ROSTER_LOCKED'[\s\S]*'TEAM_FORMING'[\s\S]*'SCHEDULED'/);
});

test('verified WeChat identity identifiers remain private and unique', () => {
  assert.match(migration, /wechat_identity_openid_unique unique \(openid\)/);
  assert.match(migration, /wechat_identities_unionid_unique/);
  assert.match(migration, /revoke all on table public\.wechat_identities from anon, authenticated/);
});

test('timezone is explicit and stored tournament instants remain timestamptz', () => {
  assert.match(hardeningMigration, /add column timezone text not null default 'Asia\/Shanghai'/);
  assert.match(hardeningMigration, /perform now\(\) at time zone new\.timezone/);
  assert.match(migration, /registration_start_at/);
});

test('new tournament modes and registrations are SOLO-only without deleting legacy enums', () => {
  assert.match(hardeningMigration, /TEAM\/BOTH remain valid legacy enum values/);
  assert.match(hardeningMigration, /new\.registration_type <> 'SOLO'/);
  assert.match(hardeningMigration, /tournament_row\.registration_type <> 'SOLO'/);
  assert.doesNotMatch(hardeningMigration, /drop type public\.registration_type/);
});

test('private anonymous tournament detail withholds participant rows but keeps counts', () => {
  assert.match(hardeningMigration, /participants_restricted := tournament_row\.visibility = 'PRIVATE'[\s\S]*auth\.uid\(\) is null/);
  assert.match(hardeningMigration, /if not participants_restricted then[\s\S]*registration\.game_name/);
  assert.match(hardeningMigration, /'approved_count', approved_total/);
  assert.match(hardeningMigration, /'participants_restricted', participants_restricted/);
  assert.doesNotMatch(hardeningMigration, /wechat_(openid|unionid)/);
});
