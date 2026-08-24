# Database security audit

This audit covers migrations 001 through 006 and the effective schema after they run in filename order.

## SECURITY DEFINER findings

- Every `SECURITY DEFINER` function explicitly sets `search_path = public, pg_temp`.
- Trigger-only helpers, the unused registration-ownership helper, and the game-ID normalization helper are not executable by browser roles after migration 006. Triggers continue to invoke their helpers without exposing them as RPCs.
- `upsert_verified_wechat_account(...)` is executable only by `service_role` and must be called from a trusted OAuth callback service.
- `get_my_registration_review_history(uuid)` is the only new player-facing review-history function. It verifies ownership and returns no actor account ID.
- Tournament detail remains a deliberate public RPC, but migration 006 withholds private-tournament participants from both anonymous callers and authenticated nonparticipants. Application admins and already-registered accounts retain access.
- `get_admin_registration_review_metadata(uuid)` is callable through the authenticated API surface but returns data only after an in-function application-admin check.

The migration contract suite checks the pinned search path for every function declaration. The PostgreSQL integration check also inspects the final `pg_proc.proconfig` values.

## Table and RLS findings

- `wechat_identities` has no browser-role table access. OpenID and UnionID never enter public application types or responses.
- `registration_review_events` has RLS enabled. Direct reads are admin-only; players use the ownership-checking safe RPC.
- Player/admin registration queries explicitly select safe columns. `account_id`, normalized game-ID fields, and `reviewed_by_account_id` are omitted from application responses; ordinary authenticated callers cannot select reviewer or normalized columns directly.
- `tournament_registrations.reviewed_by_account_id` remains available to application admins only through the checked metadata RPC and to trusted database/service operators.
- Player updates and cancellations are ownership-checked and limited to the live registration window.
- Admin reviews are limited to explicit transitions during `REGISTRATION` and `REGISTRATION_CLOSED`; roster lock is enforced in PostgreSQL.

## Residual risks

- Production security still depends on protecting the Supabase service-role key and WeChat application secret outside the repository and browser bundle.
- The trusted OAuth callback must validate state, provider response, approved application ID, redirect target, and session issuance.
- The independent integration CI job uses a disposable PostgreSQL 17 service and emulates Supabase's default API-role grants. A passing run proves the 001-to-latest chain and the final catalog/behavior checks, not compatibility with an already-modified production database.
- Audit events are append-only through application permissions, but a database owner or service administrator can still alter them; external tamper-evident logging is a later operational decision.
