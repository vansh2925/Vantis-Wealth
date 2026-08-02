# Ledger — Institutional-grade Personal Finance

A production-ready personal finance & expense analytics SaaS built with
**Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS v4**, **shadcn/ui**,
**Supabase** (Auth, PostgreSQL, RLS, Storage) and a minimal, fast, elegant UI.

> **Status: All phases complete (1–6)** — auth, dashboard, transactions,
> accounts, categories, budgets, goals, recurring, notifications, analytics,
> insights, reports, plus testing and production hardening. Builds cleanly
> (`npm run build`), typechecks, and `npm run test` passes.

---

## Tech Stack

| Layer      | Choice                                                              |
| ---------- | ------------------------------------------------------------------- |
| Framework  | Next.js 16 (App Router, Turbopack)                                  |
| Language   | TypeScript (strict)                                                 |
| Styling    | Tailwind CSS v4 + shadcn/ui (Nova preset)                           |
| Motion     | Framer Motion                                                       |
| Forms      | React Hook Form + Zod                                               |
| Data       | @tanstack/react-query (client caching)                              |
| Charts     | Recharts (installed; used from Phase 5)                             |
| Auth/DB    | Supabase (Auth, PostgreSQL, RLS, Storage, Edge Functions)           |
| Notify     | sonner (toasts); custom theme system (light/dark/system)            |

---

## Folder Architecture

```
src/
  app/
    (auth)/            # public auth pages (login, signup, otp, reset…)
      actions.ts       # server actions: signIn, signUp, OTP, reset
    (app)/             # protected app routes (dashboard, …)
      dashboard/
    layout.tsx         # root layout (providers + fonts)
    page.tsx           # / → redirect to /dashboard
  components/
    auth/              # login/signup/otp/reset forms + shell
    ui/                # shadcn/ui primitives
  contexts/
    auth-context.tsx   # reactive client session state
  db/                  # SQL source of truth
    schema.sql         # tables, FKs, check constraints, indexes
    functions.sql      # triggers + transactional write functions
    seed.sql           # currencies + default categories
    rls.sql            # Row Level Security policies
  lib/
    supabase/          # client / server / session / admin clients
    validations/       # Zod schemas
    auth.ts            # getCurrentUser / requireUser (DAL)
    utils.ts           # cn() helper
  providers/           # theme, react-query, composed app providers
  types/               # database.ts (typed schema) + index.ts (domain)
  proxy.ts             # Next 16 middleware → session refresh + route guard
```

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Supabase

Create a Supabase project, then fill in `.env.local` (copy from `.env.local.example`):

```env
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>   # server-only
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Apply the database schema

In Supabase → SQL Editor, run these **in order**:

```bash
# 1. Tables + indexes
src/db/schema.sql
# 2. Triggers + helper functions (incl. auto-create profile on signup)
src/db/functions.sql
# 3. Currencies + shared default categories
src/db/seed.sql
# 4. Row Level Security policies (MUST run last)
src/db/rls.sql
```

> Each user's `profile` and `settings` rows are created automatically by the
> `handle_new_user()` trigger when they sign up.

### 4. Run

```bash
npm run dev        # http://localhost:3000
```

---

## Security Model

- **Row Level Security on every table.** User-scoped tables expose only rows
  where `user_id = auth.uid()`; shared default categories are world-readable;
  currencies are public reference data.
- **Server-side validation** on all auth actions (Zod) + client-side (RHF).
- **Protected routes** via `src/proxy.ts` (Next 16 middleware) with
  defense-in-depth `requireUser()` checks in protected Server Components.
- **Service role key is server-only** (`lib/supabase/admin.ts` throws if imported
  client-side).
- Transactions are written through `create_transaction()`/`delete_transaction()`
  so balances + `monthly_analytics` stay consistent atomically.

---

## Scripts

| Command             | Description                        |
| ------------------- | ---------------------------------- |
| `npm run dev`       | Start dev server                   |
| `npm run build`     | Production build (typecheck+lint)  |
| `npm run start`     | Serve production build             |
| `npm run lint`      | ESLint                             |
| `npm run typecheck` | TypeScript type check              |
| `npm run test`      | Run Vitest unit tests              |
| `npm run check`     | typecheck + lint + test            |

---

## Phase Roadmap

1. ✅ **Phase 1** — Architecture, Supabase, schema, RLS, auth
2. ✅ **Phase 2** — Auth UI, dashboard layout, sidebar, theme, profile
3. ✅ **Phase 3** — Transactions, categories, accounts, CRUD
4. ✅ **Phase 4** — Budgets, goals, recurring, notifications
5. ✅ **Phase 5** — Analytics, charts, insights, reports
6. ✅ **Phase 6** — Optimization, testing, deployment
