# Supabase setup

1. Create a Supabase project.
2. Run `supabase/migrations/202608240001_phase2_registration.sql` with the Supabase CLI or SQL editor.
3. Copy `.env.example` to `.env.local` and add the project URL and publishable/anon key.
4. Create the first account through `/register`, then promote it in the SQL editor:

```sql
update public.user_roles
set role = 'ADMIN'
where user_id = (select id from auth.users where email = 'your-email@example.com');
```

5. Insert a tournament as that admin account or through SQL. Plain private invite codes are bcrypt-hashed automatically by a database trigger.

Never place a Supabase service-role key in this project or in any `NEXT_PUBLIC_` variable.
