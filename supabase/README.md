# Supabase setup

1. Create a Supabase project.
2. Run every file in `supabase/migrations/` in filename order. Migration 003 converts the application to direct Chinese-community registration snapshots, 004 adds production privacy and timezone hardening, and 005 adds review operations, audit history, rejected resubmission, and final WeChat identity constraints.
3. Copy `.env.example` to `.env.local` and add the project URL and publishable/anon key.
4. For temporary email testing only, set `ENABLE_EMAIL_DEV_AUTH=true`. Leave it unset or `false` in production, and disable the Supabase email provider in the production project.
5. Create the first development account through `/register`, then promote it in the SQL editor:

```sql
update public.accounts
set role = 'ADMIN'
where auth_user_id = (select id from auth.users where email = 'your-email@example.com');
```

6. Create a tournament through `/admin/tournaments/new`. Plain private invite codes are bcrypt-hashed automatically by a database trigger.

## Production hardening migration

- `tournaments.timezone` defaults to the IANA timezone `Asia/Shanghai`; existing `timestamptz` instants are preserved and are not shifted by the migration.
- Existing TEAM/BOTH rows remain readable and editable without changing their legacy mode. New tournaments and registration-mode changes may only select SOLO until team registration is implemented.
- Anonymous callers of the SECURITY DEFINER tournament-detail RPC still receive public counts for private link tournaments, but participant game IDs are returned only to authenticated users or admins.
- Apply migration 004 before deploying application code that reads `tournaments.timezone`.

## Registration operations

- Admin review is limited to explicit transitions while a tournament is `REGISTRATION` or `REGISTRATION_CLOSED`.
- Once a tournament reaches `ROSTER_LOCKED` or a later operational phase, normal review and player edits are rejected by database triggers.
- Current review metadata lives on `tournament_registrations`; append-only status events live in the private `registration_review_events` table.
- Rejected players may change their snapshot and return to `PENDING` only during the live registration window.

## WeChat identity

- `wechat_identities` enforces unique `(app_id, openid)` pairs and a unique UnionID when present. OpenID is application-scoped; UnionID is the cross-application key when WeChat supplies it.
- These values must come only from a verified WeChat OAuth response, never a player form.
- Browser roles cannot select any row from `wechat_identities`; only a safe current-account summary is exposed.
- `upsert_verified_wechat_account(...)` is granted only to Supabase `service_role` for a future trusted OAuth callback service. A service-role key must never be sent to the browser or stored in a `NEXT_PUBLIC_` variable.
- The web app intentionally keeps the WeChat button disabled until both production credentials and a trusted session bridge are configured.

See `docs/WECHAT-AUTH.md` for the integration boundary.

Run the disposable-database validation path in `docs/INTEGRATION-TESTS.md` before applying new migrations to production.
