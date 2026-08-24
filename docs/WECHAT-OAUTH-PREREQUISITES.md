# WeChat OAuth production prerequisites

The schema and provider adapter boundary are ready, but production OAuth remains intentionally disabled until the Phase 2.6 checklist below is complete.

- [ ] Confirm the WeChat application type and production AppID.
- [ ] Obtain the production AppSecret and store it only in a trusted server secret manager.
- [ ] Approve the production HTTPS domain in WeChat and register the exact callback URL.
- [ ] Implement a trusted server callback; AppSecret and `service_role` must never reach the browser.
- [ ] Generate a cryptographically random OAuth state, bind it to an HTTP-only same-site cookie, verify it once, and reject replay.
- [ ] Exchange the one-time authorization code on the trusted server and handle expired, reused, denied, or invalid codes.
- [ ] Accept verified OpenID and optional UnionID only from the successful provider response; never accept either from form input.
- [ ] Build the Supabase session bridge that resolves or creates the canonical Auth user, calls `upsert_verified_wechat_account(...)`, and issues the application session.
- [ ] Validate `returnTo` as a same-origin relative path before redirecting; reject protocol-relative and external targets.
- [ ] Define safe user-facing errors and private server logs for invalid state, provider denial, code exchange failure, identity conflict, missing OpenID, session failure, and linking failure.
- [ ] Confirm whether UnionID is available for this application/account relationship and test first login, repeat login, cross-app UnionID resolution, OpenID-only repeat login, conflicts, and revoked authorization.

Until these prerequisites are met, email authentication may be enabled only through the explicit development flag. It is not part of the core account model.
