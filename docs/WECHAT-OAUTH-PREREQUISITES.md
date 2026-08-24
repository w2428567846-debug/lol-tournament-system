# WeChat OAuth production prerequisites

The schema and provider adapter boundary are ready, but production OAuth remains intentionally disabled until all items below are available.

- Confirm the exact WeChat application type and approved `app_id`.
- Obtain the production application secret and store it only in a trusted server secret manager.
- Register the exact HTTPS callback domain and callback path with WeChat.
- Decide whether the approved application returns UnionID and under which platform/account relationship.
- Implement a trusted callback service that generates and verifies OAuth state, exchanges the one-time code, validates the returned application identity, and rejects replay.
- Create or resolve the canonical Supabase Auth user in that trusted service, then call `upsert_verified_wechat_account(...)` with the service role. When UnionID matches an existing account, reuse that account's Auth user; do not issue a second Auth user and attempt to merge afterward.
- Issue secure HTTP-only session cookies and allow only validated same-origin return paths.
- Define account-recovery and identity-conflict support procedures. Never resolve conflicts from a nickname, user-entered WeChat ID, or avatar.
- Add end-to-end tests for first login, repeat login, matching UnionID across approved applications, identity conflict, expired code, invalid state, and revoked authorization.

Until these prerequisites are met, email authentication may be enabled only through the explicit development flag. It is not part of the core account model.
