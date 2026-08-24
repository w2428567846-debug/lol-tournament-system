import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const databaseUrl = process.env.SUPABASE_TEST_DB_URL;

if (!databaseUrl) {
  console.error('SUPABASE_TEST_DB_URL is required. Use a fresh disposable local Supabase/PostgreSQL database.');
  process.exit(1);
}

let parsedUrl;
try {
  parsedUrl = new URL(databaseUrl);
} catch {
  console.error('SUPABASE_TEST_DB_URL must be a valid PostgreSQL URL.');
  process.exit(1);
}

if (!['postgres:', 'postgresql:'].includes(parsedUrl.protocol)) {
  console.error('SUPABASE_TEST_DB_URL must use the postgres or postgresql protocol.');
  process.exit(1);
}

const localHosts = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);
if (!localHosts.has(parsedUrl.hostname) && process.env.RIFT_INTEGRATION_ALLOW_REMOTE !== 'true') {
  console.error('Refusing to migrate a remote database. Set RIFT_INTEGRATION_ALLOW_REMOTE=true only for a disposable test database.');
  process.exit(1);
}

const integrationDirectory = fileURLToPath(new URL('./', import.meta.url));
const migrationDirectory = fileURLToPath(new URL('../../supabase/migrations/', import.meta.url));
const migrations = readdirSync(migrationDirectory)
  .filter((file) => file.endsWith('.sql'))
  .sort((left, right) => left.localeCompare(right));

function runSql(file) {
  console.log(`Applying ${file}`);
  const result = spawnSync('psql', [databaseUrl, '--set=ON_ERROR_STOP=1', '--file', file], {
    stdio: 'inherit',
  });
  if (result.error) {
    console.error(`Unable to run psql: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (process.env.RIFT_TEST_BOOTSTRAP === '1') runSql(`${integrationDirectory}bootstrap.sql`);
for (const migration of migrations) runSql(`${migrationDirectory}${migration}`);
runSql(`${integrationDirectory}verify-schema.sql`);
