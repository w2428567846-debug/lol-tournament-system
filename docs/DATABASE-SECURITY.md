# Database security audit

This audit covers migrations 001 through 005 and the effective schema after they run in filename order.

## SECURITY DEFINER findings

- Every `SECURITY DEFINER` function explicitly sets `search_path = public, pg_temp`.
- Trigger-only helpers and the unused registration-ownership helper are not executable by browser roles after migration 005. The pure game-ID normalization helper remains callable because the invoker trigger uses it; it has no table access.
- `upsert_verified_wechat_account(...)` is executable only by `service_role` and must be called from a trusted OAuth callback service.
- `get_my_registration_review_history(uuid)` is the only new player-facing review-history function. It verifies ownership and returns no actor account ID.
- Tournament detail remains a deliberate public RPC, but migration 004 prevents anonymous private-tournament participant disclosure.

The migration contract suite checks the pinned search path for every function declaration. The PostgreSQL integration check also inspects the final `pg_proc.proconfig` values.

## Table and RLS findings

- `wechat_identities` has no browser-role table access. OpenID and UnionID never enter public application types or responses.
- `registration_review_events` has RLS enabled. Direct reads are admin-only; players use the ownership-checking safe RPC.
- `tournament_registrations.reviewed_by_account_id` is internal. The UI maps its presence to the label `管理员` and never serializes the UUID.
- Player updates and cancellations are ownership-checked and limited to the live registration window.
- Admin reviews are limited to explicit transitions during `REGISTRATION` and `REGISTRATION_CLOSED`; roster lock is enforced in PostgreSQL.

## Residual risks

- Production security still depends on protecting the Supabase service-role key and WeChat application secret outside the repository and browser bundle.
- The trusted OAuth callback must validate state, provider response, approved application ID, redirect target, and session issuance.
- Migration integration tests require a disposable database and are intentionally not part of default CI until a PostgreSQL service is provisioned.
- Audit events are append-only through application permissions, but a database owner or service administrator can still alter them; external tamper-evident logging is a later operational decision.
