# Database integration tests

The domain test suite checks pure TypeScript and lightweight migration contracts without a database. The integration path below actually applies every SQL migration, in filename order, and verifies the resulting schema, privileges, Row Level Security, `SECURITY DEFINER` search paths, cross-app WeChat resolution, private-tournament visibility, safe registration responses, and admin-only review metadata.

Use a new disposable database. Migrations are intentionally not rerun against an already-migrated database.

## Local Supabase database

Start a fresh local Supabase stack, copy its direct PostgreSQL connection URL, then run:

```powershell
$env:SUPABASE_TEST_DB_URL='postgresql://postgres:postgres@127.0.0.1:54322/postgres'
pnpm test:integration
```

## Bare local PostgreSQL

For a clean local PostgreSQL database without Supabase's `auth` schema, enable the minimal test bootstrap:

```powershell
$env:SUPABASE_TEST_DB_URL='postgresql://postgres:password@127.0.0.1:5432/rift_command_test'
$env:RIFT_TEST_BOOTSTRAP='1'
pnpm test:integration
```

The runner refuses remote hosts by default. A remote disposable test database requires the explicit `RIFT_INTEGRATION_ALLOW_REMOTE=true` acknowledgement. Never point this command at production.

## GitHub Actions

The separate `integration` job starts `postgres:17-alpine`, enables the bootstrap that reproduces Supabase-style default grants for `anon`, `authenticated`, and `service_role`, applies migration 001 through the latest file, then runs both catalog and role-switched behavior checks. The regular `verify` job remains independent so lint, TypeScript, domain tests, and the application build stay easy to diagnose.
