# LoopHarvest

## Local Supabase Workflow

This repo now includes the Supabase CLI scaffold under [`supabase/`](/D:/LoopHarvest/supabase). Use the CLI through `npx` so contributors do not need a global install.

Prerequisites:
- Docker Desktop running
- Node/npm available for `npx supabase`

Local commands:

```bash
npx supabase start
npx supabase status
npx supabase db reset
npx supabase stop
```

The local stack uses:
- API: `http://127.0.0.1:54321`
- Studio: `http://127.0.0.1:54323`
- DB: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`

Remote project workflow:

```bash
npx supabase login
npx supabase link --project-ref "$SUPABASE_PROJECT_REF"
npx supabase db pull remote_schema
npx supabase migration list
```

Notes:
- `supabase/config.toml` is configured for the app running on `http://localhost:3000`.
- The existing migration files remain the source of truth for schema changes.
- `supabase/seed.sql` is intentionally present so local resets work before seed data is added.
