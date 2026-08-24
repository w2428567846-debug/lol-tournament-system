# Chinese community registration migration

Migration `202608240003_community_registration_refactor.sql` is forward-only and must run after the first two migrations.

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
