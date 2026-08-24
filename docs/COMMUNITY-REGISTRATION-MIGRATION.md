# Chinese community registration migration

Migration `202608240003_community_registration_refactor.sql` is forward-only and must run after the first two migrations.

Production hardening continues in forward migration `202608240004_registration_production_hardening.sql`; do not edit or replace the earlier files after they have been applied.

Registration operations and authentication readiness continue in forward migration `202608240005_registration_operations_auth_readiness.sql`.

Database correctness continues in forward migration `202608240006_database_correctness_hotfix.sql`. The only historical correction is inside migration 005: its revoke of `handle_new_user_role()` is conditional because migration 002 already drops that function. Without this narrow correction a genuinely fresh 001-to-latest installation cannot reach migration 006. Migrations 001 through 004 remain unchanged.

The final pre-OAuth privacy rule is a forward migration in `202608250007_final_pre_oauth_cleanup.sql`. It does not rewrite migrations 001 through 006.

Hosted Supabase `pgcrypto` compatibility is a forward migration in `202608250008_supabase_pgcrypto_search_path.sql`. It pins the trusted `extensions` schema for invite-code hashing and verification without rewriting migrations 001 through 007.

## Existing data conversion

- `player_profiles.riot_id` is split at the final `#` into `game_name` and `game_tag`.
- `player_profiles.rank` becomes `current_rank`.
- The international `server` and `riot_id` columns are removed after conversion.
- Every existing `tournament_registrations.player_id` is resolved to its profile's `account_id`.
- Existing registrations copy the profile's game ID, rank, roles and group nickname into snapshot columns before the profile foreign key is removed.
- Existing WeChat fields on `accounts` move into private `wechat_identities` rows with the temporary application marker `legacy-primary`. Before enabling a real callback for an existing WeChat deployment, reconcile that marker with the actual WeChat application ID.

The migration stops if an existing registration cannot be resolved to an account or valid game ID. Fix that source row instead of weakening the new non-null and uniqueness constraints.

## New invariants

- An account can have at most one registration per tournament.
- A normalized game-name/tag pair can have at most one registration per tournament.
- Only `APPROVED` rows consume `tournaments.player_limit`.
- Approval takes a row lock on the tournament, preventing concurrent approvals from exceeding capacity.
- Player changes after approval return the registration to `PENDING` when game ID, rank or role changes.
- Player edits and cancellations are rejected outside the live registration period and after roster lock.
- Registration history no longer depends on mutable saved profile data.

## Production hardening behavior

- Adds `tournaments.timezone` with `Asia/Shanghai` as the default. The migration preserves every existing absolute `timestamptz` value; it does not guess whether older manually entered values were previously shifted.
- New admin local times are converted with the tournament IANA timezone before storage. Editing renders the stored instant back into the same timezone.
- Keeps TEAM/BOTH enum values and legacy rows, but rejects new TEAM/BOTH tournaments and changes into those modes until the future team-registration milestone.
- Migration 006 replaces the tournament-detail SECURITY DEFINER RPC so anonymous viewers and authenticated nonparticipants receive counts but an empty participant list.
- Migration 007 narrows registered-viewer access: only PENDING, APPROVED, and WAITLISTED registrations remain eligible. REJECTED and CANCELLED accounts receive counts but an empty participant list; application admins retain access.
- Migration 008 keeps invite-code hashing and verification compatible with Supabase's `extensions` schema while preserving an explicit `SECURITY DEFINER` search path.

## Registration operations behavior

- Adds current reviewer, review time, and review note metadata without exposing internal account IDs to player-facing responses.
- Restricts admin status changes to explicit pending, approved, waitlisted, and rejected transitions; cancelled and rejected rows cannot be silently approved.
- Allows review during `REGISTRATION_CLOSED`, but blocks every normal review once the roster is locked.
- Keeps an append-only private status-event table and a safe own-registration history RPC.
- Allows a rejected player to correct and resubmit only while registration is open.
- Replaces global OpenID uniqueness with `(app_id, openid)` uniqueness while preserving partial UnionID uniqueness.

## Database correctness hotfix behavior

- Resolves a verified UnionID across approved WeChat applications to one account and persists the second app-scoped OpenID. Later login through that second app works even when UnionID is absent.
- Stores the shared UnionID once on its canonical identity row so partial UnionID uniqueness remains meaningful; all provider rows still point to the same account.
- Removes `created_by`, account UUIDs, normalized duplicate-check values, and reviewer UUIDs from player/public response shapes.
- Replaces inherited default function grants with an explicit RPC allowlist and removes browser execution from trigger-only functions.
