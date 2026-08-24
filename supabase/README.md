# Supabase setup

1. Create a Supabase project.
2. Run every file in `supabase/migrations/` in filename order. The third migration converts the application to direct Chinese-community registration snapshots and moves verified WeChat data into `wechat_identities`.
3. Copy `.env.example` to `.env.local` and add the project URL and publishable/anon key.
4. For temporary email testing only, set `ENABLE_EMAIL_DEV_AUTH=true`. Leave it unset or `false` in production, and disable the Supabase email provider in the production project.
5. Create the first development account through `/register`, then promote it in the SQL editor:

```sql
update public.accounts
set role = 'ADMIN'
where auth_user_id = (select id from auth.users where email = 'your-email@example.com');
```

6. Create a tournament through `/admin/tournaments/new`. Plain private invite codes are bcrypt-hashed automatically by a database trigger.

## WeChat identity

- `wechat_identities` enforces a unique OpenID identity and a unique UnionID when present; `app_id` records which approved WeChat application verified it.
- These values must come only from a verified WeChat OAuth response, never a player form.
- Browser roles cannot select any row from `wechat_identities`; only a safe current-account summary is exposed.
- `upsert_verified_wechat_account(...)` is granted only to Supabase `service_role` for a future trusted OAuth callback service. A service-role key must never be sent to the browser or stored in a `NEXT_PUBLIC_` variable.
- The web app intentionally keeps the WeChat button disabled until both production credentials and a trusted session bridge are configured.

See `docs/WECHAT-AUTH.md` for the integration boundary.
