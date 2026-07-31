@AGENTS.md

# Ledger — project conventions

Personal finance SaaS. Next.js 16 App Router, TypeScript strict, Tailwind v4,
shadcn/ui (Nova), Supabase. UI language: minimal, whitespace-heavy, emerald/blue
accents, rounded cards, smooth Framer Motion transitions, dark+light.

## Next 16 gotchas (these are real in this repo)

- Routing middleware is **`src/proxy.ts`** (export `proxy`, Node runtime) — NOT
  `middleware.ts`. Don't reintroduce `middleware.ts`.
- `cookies()` / `headers()` are async — `await cookies()` before use.
- A client component using `useSearchParams()` must be wrapped in `<Suspense>`
  in its page or the static build fails.
- shadcn/ui components live in `src/components/ui/`; they are customized —
  extend, don't regenerate.
- Theming is a **dependency-free** system (`src/contexts/theme-context.tsx` +
  `src/lib/theme-script.ts`). The no-FOUC bootstrap is a raw `<script>` in the
  root layout `<head>`. Do NOT reintroduce `next-themes` — it rendered a raw
  `<script>` in the body and tripped React 19's script-tag warning.

## Data layer

- **SQL source of truth is `src/db/`** (`schema.sql`, `functions.sql`,
  `seed.sql`, `rls.sql` — run in that order). Update these when the schema
  changes, and mirror changes in `src/types/database.ts` (hand-maintained).
- Writes that affect money go through the RPC functions
  `create_transaction()` / `delete_transaction()` so balances + analytics stay
  consistent atomically. Do NOT write `transactions` directly.
- RLS is enforced on every table. Client code uses the anon key; the service
  role key (`src/lib/supabase/admin.ts`) is server-only.
- New-user `profile` + `settings` are created by the `handle_new_user()`
  trigger on `auth.users` — no client-side insert needed.

## Env

- `.env.local` is required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`. Placeholders will throw at
  request time.

## Phasing

Work is delivered in phases and each stops for user approval. Phase 1 (auth,
schema, RLS, arch) is done. Current phase is tracked in the README roadmap.
