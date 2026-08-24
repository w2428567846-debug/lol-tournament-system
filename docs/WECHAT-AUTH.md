# WeChat authentication architecture

WeChat is the long-term primary identity for Rift Command. Email/password exists only as an explicit development adapter.

## Domain separation

`accounts` is the provider-neutral authorization and business identity:

- `auth_provider`
- application role

`wechat_identities` owns the private verified provider identity:

- WeChat application ID
- verified OpenID
- verified UnionID, when available
- WeChat display metadata

`player_profiles` is optional saved registration defaults. Tournament registrations reference `accounts.id` and keep their own game ID, rank, role and group-nickname snapshots. None of these business tables stores OpenID, UnionID, email, or an authentication-provider subject.

## Required production flow

1. Generate a cryptographically random state value in a trusted server route and store it in an HTTP-only, same-site cookie.
2. Redirect to the approved WeChat OAuth authorization endpoint.
3. In the trusted callback, verify state and exchange the one-time code with WeChat using server-only credentials.
4. Accept OpenID and UnionID only from that verified provider response.
5. Create or resolve the corresponding Supabase Auth session identity in a trusted backend.
6. Call the server-only `upsert_verified_wechat_account(...)` database function with the verified application ID, OpenID and optional UnionID.
7. Issue the normal secure application session and redirect to the original same-origin path.

The unique `(app_id, OpenID)` constraint and partial unique UnionID constraint, plus the linking function's conflict checks, prevent an already-linked WeChat identity from silently creating another Rift Command account. OpenID is scoped to a WeChat application; UnionID is used for cross-application resolution when present. The canonical provider row stores the shared UnionID once, while each additional app persists its own `(app_id, OpenID)` row against the same account. A later login can therefore resolve from that exact app/OpenID even when WeChat omits UnionID. Conflicting email-development and WeChat accounts are never silently merged into separate accounts.

## Provider boundary

`lib/auth/providers/types.ts` defines the verified identity and account-linker contracts. `lib/auth/providers/wechat.ts` is deliberately unconfigured until the exact WeChat application type, approved callback URL, credentials, and trusted session issuer are available.

No form or public API accepts OpenID or UnionID.

The remaining production prerequisites are tracked in `WECHAT-OAUTH-PREREQUISITES.md`.
