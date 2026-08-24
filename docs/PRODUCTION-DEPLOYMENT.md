# Production deployment

Phase 2.5.5 keeps the existing Vinext application, Cloudflare-compatible Worker output, Supabase data model, and visual design. It does not add Phase 3 features or a simulated WeChat identity.

## Recommended architecture

```text
GitHub main
  -> GitHub Actions: verify + integration
  -> OpenAI Sites production: Vinext on Cloudflare Workers
  -> custom HTTPS domain
  -> new production Supabase project
```

The existing OpenAI Sites project is the intended production hosting path. It already packages the Vinext Cloudflare Worker output, supports runtime environment variables and custom domains, and avoids an unnecessary hosting migration. Keep its current owner-only access during setup; changing it to public or shared access is a separate owner-approved go-live action. Direct Cloudflare Workers deployment is also prepared as a fallback if Sites later presents a concrete blocker. The application reaches Supabase through HTTPS, so it needs no raw database socket from the Worker.

## What is already prepared in code

- A Vinext/Cloudflare Vite build and pinned matching `@vinext/cloudflare` deploy adapter.
- `wrangler.jsonc` with the Worker entry, static assets, observability, and `keep_vars` so dashboard-managed variables are not removed by later deploys.
- Supabase browser/server clients using only the public project URL and publishable/anon key.
- Request-level Supabase session refresh through `proxy.ts`.
- Safe same-origin `returnTo` validation and a canonical origin derived from `NEXT_PUBLIC_SITE_URL`.
- A safe `/api/health` response with no secret values or database URL.
- A user-facing error boundary that does not print SQL, provider, token, or internal identifier details.
- A development-only sample-data fallback. Production with missing Supabase configuration shows the setup-required state and never shows sample tournaments as real data.
- Migrations 001 through 007 plus disposable PostgreSQL integration tests.

## Owner actions that cannot be automated here

1. Create and pay for the production Supabase project.
2. Confirm the existing Sites project and choose its production access policy.
3. Add production variables and secrets in the Sites hosting settings.
4. Buy or select a domain, bind it to the Site, and configure the returned DNS records.
5. Configure the Supabase Auth site URL, redirect allowlist, email provider, and later production SMTP.
6. Create the first beta administrator and promote that known account.
7. Later obtain approved WeChat developer credentials and complete the trusted OAuth callback/session bridge.

## Environment variables

Values prefixed with `NEXT_PUBLIC_` are intentionally available to the browser bundle. Never put a database password, Supabase service-role key, WeChat secret, access token, OpenID, or UnionID in one of them.

| Variable | Scope | Production requirement | Purpose |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | public, build and runtime | required | Production Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public, build and runtime | required | Production publishable key or legacy anon key. Security still comes from RLS. |
| `NEXT_PUBLIC_SITE_URL` | public, build and runtime | required | Canonical origin only, for example `https://events.example.com`; no trailing path. |
| `NEXT_PUBLIC_FEATURED_TOURNAMENT_SLUG` | public, build and runtime | optional | Preferred homepage tournament slug. The app chooses an available public tournament if it is empty or not found. |
| `ENABLE_EMAIL_DEV_AUTH` | server | required explicit choice | `true` only for the controlled closed beta; otherwise `false`. |
| `WECHAT_APP_ID` | server | optional until OAuth | Approved WeChat application ID. Leaving it empty keeps WeChat login disabled. |
| `WECHAT_APP_SECRET` | secret, server only | optional until OAuth | WeChat application secret. Never prefix with `NEXT_PUBLIC_`, commit it, or return it from an endpoint. |
| `WECHAT_OAUTH_REDIRECT_URI` | server | optional until OAuth | Exact approved callback URL. Leaving it empty keeps WeChat login disabled. |

For local closed-beta preparation, copy `.env.example` to the ignored `.env.local`. For the existing Sites production project:

1. Add the public values to the Site's production runtime environment settings.
2. Add `ENABLE_EMAIL_DEV_AUTH` as a normal server variable.
3. Add `WECHAT_APP_SECRET` only as an encrypted secret after real OAuth work begins. The three WeChat variables should be absent for this milestone.
4. If production deployment is later automated from GitHub, use GitHub environment variables/secrets and an environment approval gate. Do not add production secrets to the existing verification CI jobs.

## Create a new production Supabase project

Do not link this repository to a database that contains development or sample data.

1. In the Supabase dashboard, create a new project named clearly as production. Save the database password in a password manager.
2. Open the project **Connect** dialog and copy the project URL and publishable key. A legacy anon key also works with the existing variable name.
3. Do not copy the service-role key into the repository, `.env.local`, any `NEXT_PUBLIC_` value, Cloudflare public variable, or browser code.
4. From the repository root, initialize the CLI metadata if `supabase/config.toml` is still absent, authenticate, and link the new project:

```powershell
npx supabase@latest init
npx supabase@latest login
npx supabase@latest link --project-ref YOUR_PRODUCTION_PROJECT_REF
```

`supabase init` creates `supabase/config.toml`; it must not replace or rename the existing migration files. Check `git diff` after the command.

5. Confirm that the CLI sees exactly these local migrations in timestamp order:

```text
202608240001_phase2_registration.sql
202608240002_wechat_accounts.sql
202608240003_community_registration_refactor.sql
202608240004_registration_production_hardening.sql
202608240005_registration_operations_auth_readiness.sql
202608240006_database_correctness_hotfix.sql
202608250007_final_pre_oauth_cleanup.sql
```

6. Preview and apply only the pending migrations:

```powershell
npx supabase@latest migration list
npx supabase@latest db push --dry-run
npx supabase@latest db push
npx supabase@latest migration list
```

The final `migration list` must show all seven timestamps in both LOCAL and REMOTE. Never run `db reset --linked` against production and never use `--include-seed` for production.

7. In the Supabase SQL editor, verify RLS without changing the schema:

```sql
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;

select schemaname, tablename, policyname, roles, cmd
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

Every application table containing account, profile, registration, review, invite, or WeChat identity data must have RLS enabled. Browser roles must not receive direct access to `wechat_identities` or internal reviewer/account columns.

8. Put the production project URL and publishable/anon key into the hosting variables, deploy, then request `/api/health`. Expect:

```json
{
  "status": "ok",
  "application": "available",
  "databaseConfiguration": "available"
}
```

The endpoint checks safe configuration presence only. It deliberately does not query the database, expose a URL/key, or prove that every table is reachable. Complete the application smoke test below to verify real connectivity and RLS.

## Migration safety

The production path is the same fresh-chain path used by `pnpm test:integration`: PostgreSQL 17, Supabase-style `anon`, `authenticated`, and `service_role` defaults, migrations sorted by filename from 001 through 007, then schema and behavior verification. Historical migrations remain unchanged.

Run the integration test only against a fresh disposable local database. The runner refuses remote databases unless an explicit test-only override is supplied. Do not set that override for production.

## Temporary closed-beta email login

Email is an explicit temporary adapter. It does not change `accounts`, does not create user-entered WeChat identifiers, and never replaces the future verified WeChat identity.

To enable closed beta:

1. Set `ENABLE_EMAIL_DEV_AUTH=true` in the production Worker server variables.
2. In Supabase **Authentication > Providers**, enable email/password.
3. Set the Supabase Auth site URL to the exact `NEXT_PUBLIC_SITE_URL` value.
4. Add `https://YOUR_DOMAIN/auth/callback` to the allowed redirect URLs.
5. Prefer invite-only distribution, production SMTP, email confirmation, rate limiting, and private-tournament invite codes.
6. Create the first known beta account through the app, then promote only that account in the SQL editor:

```sql
update public.accounts
set role = 'ADMIN'
where auth_user_id = (
  select id from auth.users where email = 'OWNER_EMAIL@example.com'
);
```

To disable beta mode when real WeChat OAuth launches:

1. Set `ENABLE_EMAIL_DEV_AUTH=false` and redeploy.
2. Disable the Supabase email provider after confirming no required beta operator depends on it.
3. Keep existing `EMAIL_DEV` accounts for audit/history or handle their verified migration in a separately reviewed identity-linking plan. Do not relabel them as WeChat accounts.
4. Enable WeChat only after the trusted callback, state validation, provider token exchange, approved AppID check, service-role account linker, and Supabase session issuance are complete.

## Primary Sites deployment

1. Keep the Site owner-only while Supabase and environment values are incomplete.
2. Add the production variables through Sites hosting settings; mark only real secrets as secrets.
3. Build the exact Git commit, save a Sites version with that commit, and deploy it privately for verification.
4. Run the complete smoke test against the Sites production URL.
5. Only after the owner approves the resolved access level, change the Site to public/shared access and deploy the already-verified source state.

## Optional direct Cloudflare Workers deployment

Use this fallback only if direct Cloudflare account control is required. The deploy adapter is pinned to the same `1.0.0-beta.3` release as Vinext.

1. Sign in to Cloudflare and select the intended production account:

```powershell
pnpm exec wrangler login
pnpm exec wrangler whoami
```

2. Add the environment variables described above. Keep secrets out of `wrangler.jsonc`; it is committed source.
3. Validate and deploy:

```powershell
pnpm check:vinext
pnpm build
pnpm deploy:cloudflare
```

4. Record the generated `workers.dev` URL, set it temporarily as `NEXT_PUBLIC_SITE_URL`, update the Supabase Auth site URL/redirect allowlist, and redeploy. Replace it with the final custom domain later.

The deployment command requires the owner's Cloudflare authorization. CI remains verification-only and does not require production credentials.

## Custom domain checklist

1. Add a Custom Domain such as `events.example.com` to the existing Site and copy the returned verification/DNS records.
2. Add those records at the domain's DNS provider and wait for both domain and certificate status to become active.
3. Set `NEXT_PUBLIC_SITE_URL=https://events.example.com` in the Site's production runtime environment and redeploy. For the optional direct-Worker path, set it in both the build environment and Worker variables.
4. In Supabase Auth, update the Site URL and add `https://events.example.com/auth/callback` to allowed redirects. Remove obsolete preview callbacks after the cutover.
5. Keep the future `WECHAT_OAUTH_REDIRECT_URI` identical to the callback registered with WeChat. Do not configure it until real credentials and the trusted bridge exist.
6. Redeploy, clear only appropriate public caches, and repeat the full smoke test on the custom domain.
7. Confirm HTTPS, canonical metadata/Open Graph URLs, sign-up email links, sign-out redirects, private links, and mobile navigation all remain on the custom origin.

No application code hardcodes the current `chatgpt.site` preview URL as the permanent origin.

## Production smoke-test checklist

Use a normal user, a second unrelated user, and an administrator. Test private data with a fresh private/incognito browser as well.

- [ ] `/api/health` returns `status: ok` and `databaseConfiguration: available`, with no URL, key, environment dump, or identifier.
- [ ] Homepage loads real production data or an honest empty state; it never shows development samples.
- [ ] Tournament list loads, filters work, and DRAFT/private tournaments are not leaked.
- [ ] Public tournament detail loads counts and participant preview according to current rules.
- [ ] Login page keeps WeChat disabled while credentials/bridge are absent.
- [ ] With beta enabled, email registration, email verification callback, login, refresh, expiry handling, and sign-out work.
- [ ] With beta disabled, email controls are absent even if Supabase email remains temporarily enabled.
- [ ] Invalid `returnTo` values such as an external URL, `//host`, or backslash form return to `/account`.
- [ ] Account page redirects an expired/invalid session to login and never shows another account's profile or registrations.
- [ ] A private tournament requires its invite code when appropriate; the plain invite code never appears in HTML, JSON, logs, or database reads.
- [ ] Anonymous, unrelated, REJECTED, and CANCELLED viewers see private counts but no participant profile preview.
- [ ] PENDING, APPROVED, WAITLISTED, and admin viewers receive the intended private participant preview.
- [ ] New registration succeeds; duplicate account/game ID, full capacity, closed registration, invalid invite, and validation errors show safe Chinese messages.
- [ ] Registration edit preserves ownership rules and important edits return reviewed entries to PENDING where required.
- [ ] Registration cancellation works only during the allowed window and is blocked after roster lock.
- [ ] Non-admin access to `/admin` is rejected.
- [ ] Admin registration search/filter and single/batch review work without exposing reviewer UUIDs or account IDs.
- [ ] Closing registration blocks new player submissions while still allowing the documented admin review transitions.
- [ ] Roster lock blocks player edits/cancellation and normal admin review changes.
- [ ] Database/network failure shows a safe retry page or safe action error, not SQL text, provider responses, tokens, OpenID, UnionID, or internal IDs.
- [ ] At 320 px and 390 px widths, homepage, list, detail, login, account, private registration, edit/cancel, and admin review have no horizontal overflow; buttons remain reachable and no mobile-only sticky panel covers content.

## Final go-live gate

The codebase is deployable for a controlled email beta after all five automated commands pass and the owner completes production Supabase, hosting variables, administrator creation, and the smoke checklist. Real WeChat OAuth remains intentionally unavailable until approved credentials and a trusted server-side callback/session bridge exist.
