# WeChat authentication architecture

WeChat is the long-term primary identity for Rift Command. Email/password exists only as an explicit development adapter.

## Domain separation

`accounts` owns private provider identity and authorization:

- `auth_provider`
- verified `wechat_openid`
- verified `wechat_unionid`, when available
- WeChat display metadata
- application role

`player_profiles` owns League of Legends data and references `accounts.id` through `account_id`. It never stores OpenID, UnionID, email, or an authentication-provider subject.

## Required production flow

1. Generate a cryptographically random state value in a trusted server route and store it in an HTTP-only, same-site cookie.
2. Redirect to the approved WeChat OAuth authorization endpoint.
3. In the trusted callback, verify state and exchange the one-time code with WeChat using server-only credentials.
4. Accept OpenID and UnionID only from that verified provider response.
5. Create or resolve the corresponding Supabase Auth session identity in a trusted backend.
6. Call the server-only `upsert_verified_wechat_account(...)` database function.
7. Issue the normal secure application session and redirect to the original same-origin path.

The unique OpenID and UnionID indexes, plus the linking function's conflict checks, prevent an already-linked WeChat identity from silently creating another Rift Command account. Conflicting email-development and WeChat accounts must be reviewed explicitly; they are never auto-merged.

## Provider boundary

`lib/auth/providers/types.ts` defines the verified identity and account-linker contracts. `lib/auth/providers/wechat.ts` is deliberately unconfigured until the exact WeChat application type, approved callback URL, credentials, and trusted session issuer are available.

No form or public API accepts OpenID or UnionID.
