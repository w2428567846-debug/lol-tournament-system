import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';

const migration = readFileSync(new URL('../supabase/migrations/202608240003_community_registration_refactor.sql', import.meta.url), 'utf8');
const hardeningMigration = readFileSync(new URL('../supabase/migrations/202608240004_registration_production_hardening.sql', import.meta.url), 'utf8');
const operationsMigration = readFileSync(new URL('../supabase/migrations/202608240005_registration_operations_auth_readiness.sql', import.meta.url), 'utf8');
const correctnessMigration = readFileSync(new URL('../supabase/migrations/202608240006_database_correctness_hotfix.sql', import.meta.url), 'utf8');

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

test('verified WeChat identity identifiers remain private and use final app-scoped uniqueness', () => {
  assert.match(operationsMigration, /drop constraint wechat_identity_openid_unique/);
  assert.match(operationsMigration, /wechat_identity_app_openid_unique unique \(app_id, openid\)/);
  assert.match(migration, /wechat_identities_unionid_unique/);
  assert.match(migration, /where unionid is not null/);
  assert.match(migration, /revoke all on table public\.wechat_identities from anon, authenticated/);
  assert.match(correctnessMigration, /where app_id = p_app_id and openid = p_openid[\s\S]*where unionid = p_unionid/);
  assert.match(correctnessMigration, /inserted_unionid := case when union_identity\.id is null then p_unionid else null end/);
});

test('review metadata, transition rules, audit history, and rejected resubmission are database-enforced', () => {
  assert.match(operationsMigration, /reviewed_by_account_id uuid references public\.accounts/);
  assert.match(operationsMigration, /reviewed_at timestamptz/);
  assert.match(operationsMigration, /review_note text/);
  assert.match(operationsMigration, /registration_pending_review_metadata_empty/);
  assert.match(operationsMigration, /create table public\.registration_review_events/);
  assert.match(operationsMigration, /when 'PENDING' then p_to_status in \('APPROVED', 'WAITLISTED', 'REJECTED'\)/);
  assert.match(operationsMigration, /when 'WAITLISTED' then p_to_status in \('APPROVED', 'REJECTED'\)/);
  assert.match(operationsMigration, /tournament_row\.status not in \('REGISTRATION', 'REGISTRATION_CLOSED'\)/);
  assert.match(operationsMigration, /old\.status = 'REJECTED' and new\.status = 'PENDING'/);
  assert.match(operationsMigration, /new\.reviewed_by_account_id := null/);
  assert.match(operationsMigration, /grant execute on function public\.get_my_registration_review_history\(uuid\) to authenticated/);
  assert.match(operationsMigration, /revoke all on function public\.enforce_registration_insert\(\) from public, anon, authenticated/);
});

test('roster lock blocks normal admin review while registration-closed allows it', () => {
  assert.match(operationsMigration, /if public\.is_admin\(\) then[\s\S]*tournament_row\.status not in \('REGISTRATION', 'REGISTRATION_CLOSED'\)[\s\S]*raise exception 'ROSTER_LOCKED'/);
  assert.doesNotMatch(operationsMigration, /if public\.is_admin\(\) then return new/);
});

test('every SECURITY DEFINER function pins its search path', () => {
  const migrationDirectory = new URL('../supabase/migrations/', import.meta.url);
  for (const file of readdirSync(migrationDirectory).filter((name) => name.endsWith('.sql'))) {
    const sql = readFileSync(new URL(file, migrationDirectory), 'utf8');
    const functionStarts = [...sql.matchAll(/create(?: or replace)? function\s+/gi)].map((match) => match.index);
    for (const match of sql.matchAll(/security definer/gi)) {
      const start = functionStarts.filter((position) => position < match.index).at(-1);
      assert.notEqual(start, undefined, `${file}: SECURITY DEFINER must belong to a function`);
      const bodyStart = sql.indexOf('as $$', match.index);
      const declaration = sql.slice(start, bodyStart);
      assert.match(declaration, /set search_path = public, pg_temp/i, `${file}: SECURITY DEFINER function must pin search_path`);
    }
  }
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
  assert.match(correctnessMigration, /participants_restricted := tournament_row\.visibility = 'PRIVATE'[\s\S]*viewer_account_id is null[\s\S]*account_id = viewer_account_id/);
  assert.match(correctnessMigration, /if not participants_restricted then[\s\S]*registration\.game_name/);
  assert.match(correctnessMigration, /'approved_count', approved_total/);
  assert.match(correctnessMigration, /'participants_restricted', participants_restricted/);
  assert.doesNotMatch(correctnessMigration, /'created_by'/);
  assert.doesNotMatch(correctnessMigration, /wechat_(openid|unionid)'/);
});

test('fresh-chain privilege hardening tolerates the legacy trigger function already being dropped', () => {
  assert.match(operationsMigration, /to_regprocedure\('public\.handle_new_user_role\(\)'\) is not null/);
  assert.match(correctnessMigration, /revoke all on function public\.upsert_verified_wechat_account[\s\S]*from public, anon, authenticated, service_role/);
  assert.match(correctnessMigration, /revoke select on table public\.tournaments from anon, authenticated/);
  assert.match(correctnessMigration, /revoke select on table public\.tournament_registrations from authenticated/);
  assert.match(correctnessMigration, /get_admin_registration_review_metadata/);
});
