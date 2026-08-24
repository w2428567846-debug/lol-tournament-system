# Database integration tests

The domain test suite checks pure TypeScript and migration contracts without a database. The integration path below actually applies every SQL migration, in filename order, and verifies the resulting schema, privileges, Row Level Security, WeChat identity constraints, and `SECURITY DEFINER` search paths.

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
