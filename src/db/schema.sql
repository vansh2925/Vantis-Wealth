-- ═══════════════════════════════════════════════════════════════════════
-- Finance App — PostgreSQL Schema
-- Run order: 1. schema.sql → 2. functions.sql → 3. seed.sql → 4. rls.sql
-- Execute from Supabase Dashboard → SQL Editor, or:
--   psql "$DATABASE_URL" -f src/db/schema.sql
-- ═══════════════════════════════════════════════════════════════════════

-- Guarantee a single source of truth for ids.
create extension if not exists "pgcrypto";

-- ────────────────────────────────────────────────────────────────────────
-- CURRENCIES (shared, public reference data)
-- ────────────────────────────────────────────────────────────────────────
create table if not exists public.currencies (
  code            text primary key,            -- ISO 4217 e.g. 'INR'
  name            text not null,               -- 'Indian Rupee'
  symbol          text not null,               -- '₹'
  decimal_places  int  not null default 2,
  position        text not null default 'prefix',  -- 'prefix' | 'suffix'
  created_at      timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────────────────
-- PROFILES (1:1 with auth.users)
-- ────────────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  full_name     text,
  avatar_url    text,
  currency_code text not null default 'INR' references public.currencies (code),
  bio           text,
  onboarded     boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────────────────
-- SETTINGS (per-user preferences)
-- ────────────────────────────────────────────────────────────────────────
create table if not exists public.settings (
  user_id                uuid primary key references auth.users (id) on delete cascade,
  currency_code          text not null default 'INR' references public.currencies (code),
  theme                  text not null default 'system',       -- 'light'|'dark'|'system'
  language               text not null default 'en',
  week_start             text not null default 'monday',
  date_format            text not null default 'YYYY-MM-DD',
  number_format          text not null default 'en-IN',        -- locale for Intl
  show_income            boolean not null default true,
  show_expense           boolean not null default true,
  notify_budget_alerts   boolean not null default true,
  notify_goal_reached    boolean not null default true,
  notify_bills_upcoming  boolean not null default true,
  notify_recurring       boolean not null default true,
  monthly_budget_limit   numeric(14,2),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────────────────
-- CATEGORIES
-- Default categories have user_id = NULL (shared across the app).
-- Custom categories have user_id set. RLS exposes both to the owner.
-- ────────────────────────────────────────────────────────────────────────
create table if not exists public.categories (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users (id) on delete cascade,
  parent_id      uuid references public.categories (id) on delete cascade,  -- sub-categories
  type           text not null check (type in ('income','expense')),
  name           text not null,
  icon           text not null default 'circle',
  color          text not null default '#10b981',
  is_custom      boolean not null default true,
  is_default     boolean not null default false,
  sort_order     int  not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (user_id, type, name)
);

-- ────────────────────────────────────────────────────────────────────────
-- ACCOUNTS
-- ────────────────────────────────────────────────────────────────────────
create table if not exists public.accounts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  name          text not null,
  type          text not null default 'checking'
                check (type in ('cash','checking','savings','credit',
                                'investment','wallet','upi','business','other')),
  balance       numeric(16,2) not null default 0,
  currency_code text not null default 'INR' references public.currencies (code),
  bank_name     text,
  color         text not null default '#3b82f6',
  icon          text not null default 'landmark',
  is_archived   boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────────────────
-- TAGS (user-scoped labels)
-- ────────────────────────────────────────────────────────────────────────
create table if not exists public.tags (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null,
  color      text not null default '#64748b',
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

-- ────────────────────────────────────────────────────────────────────────
-- RECURRING TRANSACTIONS (templates that spawn transactions)
-- ────────────────────────────────────────────────────────────────────────
create table if not exists public.recurring_transactions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  account_id       uuid references public.accounts (id) on delete set null,
  category_id      uuid references public.categories (id) on delete set null,
  type             text not null check (type in ('income','expense')),
  amount           numeric(16,2) not null check (amount > 0),
  currency_code    text not null default 'INR' references public.currencies (code),
  merchant         text,
  note             text,
  frequency        text not null check (frequency in ('daily','weekly','monthly','yearly')),
  interval_every   int  not null default 1,
  day_of_month     int,                          -- for monthly
  start_date       date not null,
  end_date         date,
  last_run_date    date,
  next_run_date    date,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────────────────
-- TRANSACTIONS
-- Transfers are stored as one row with both source (account_id) and
-- destination (transfer_account_id); type = 'transfer'.
-- ────────────────────────────────────────────────────────────────────────
create table if not exists public.transactions (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users (id) on delete cascade,
  account_id          uuid references public.accounts (id) on delete set null,
  transfer_account_id uuid references public.accounts (id) on delete set null,
  category_id         uuid references public.categories (id) on delete set null,
  recurring_id        uuid references public.recurring_transactions (id) on delete set null,
  type                text not null check (type in ('income','expense','transfer')),
  amount              numeric(16,2) not null check (amount > 0),  -- always positive; sign via type
  currency_code       text not null default 'INR' references public.currencies (code),
  merchant            text,
  note                text,
  date                date not null default current_date,
  status              text not null default 'cleared' check (status in ('cleared','pending')),
  attachment_url      text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Many-to-many: transactions ⇄ tags
create table if not exists public.transaction_tags (
  transaction_id uuid not null references public.transactions (id) on delete cascade,
  tag_id         uuid not null references public.tags (id) on delete cascade,
  primary key (transaction_id, tag_id)
);

-- ────────────────────────────────────────────────────────────────────────
-- BUDGETS
-- One row per (month, category) allocation. category_id NULL = overall
-- monthly budget for that month.
-- ────────────────────────────────────────────────────────────────────────
create table if not exists public.budgets (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  category_id   uuid references public.categories (id) on delete cascade,
  month         date not null,               -- first day of month
  amount        numeric(16,2) not null check (amount >= 0),
  currency_code text not null default 'INR' references public.currencies (code),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id, category_id, month)
);

-- ────────────────────────────────────────────────────────────────────────
-- SAVINGS GOALS
-- ────────────────────────────────────────────────────────────────────────
create table if not exists public.savings_goals (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  name           text not null,
  target_amount  numeric(16,2) not null check (target_amount > 0),
  current_amount numeric(16,2) not null default 0,
  currency_code  text not null default 'INR' references public.currencies (code),
  target_date    date,
  icon           text not null default 'piggy-bank',
  color          text not null default '#10b981',
  is_archived    boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────────────────
-- NOTES
-- ────────────────────────────────────────────────────────────────────────
create table if not exists public.notes (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  transaction_id uuid references public.transactions (id) on delete cascade,
  title          text not null,
  body           text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────────────────
-- ATTACHMENTS (storage-backed)
-- ────────────────────────────────────────────────────────────────────────
create table if not exists public.attachments (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  transaction_id uuid references public.transactions (id) on delete cascade,
  filename       text not null,
  storage_path   text not null,   -- bucket/object key in Supabase Storage
  mime_type      text,
  size_bytes     bigint,
  created_at     timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────────────────
-- NOTIFICATIONS
-- ────────────────────────────────────────────────────────────────────────
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  type       text not null check (type in ('budget_alert','goal_reached',
                                           'bill_upcoming','recurring_reminder','system')),
  title      text not null,
  body       text,
  data       jsonb,             -- flexible payload e.g. { categoryId, percent }
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────────────────
-- MONTHLY ANALYTICS (materialized rollup for fast dashboard reads)
-- Populated by a function called from writes; see functions.sql.
-- ────────────────────────────────────────────────────────────────────────
create table if not exists public.monthly_analytics (
  user_id         uuid not null references auth.users (id) on delete cascade,
  month           date not null,                 -- first day of month
  total_income    numeric(16,2) not null default 0,
  total_expense   numeric(16,2) not null default 0,
  net_savings     numeric(16,2) not null default 0,
  savings_rate    numeric(5,2)  not null default 0,  -- 0–100
  budget_used     numeric(16,2) not null default 0,
  net_worth       numeric(16,2) not null default 0,
  updated_at      timestamptz not null default now(),
  primary key (user_id, month)
);

-- ────────────────────────────────────────────────────────────────────────
-- AUDIT LOGS (immutable, append-only)
-- ────────────────────────────────────────────────────────────────────────
create table if not exists public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users (id) on delete set null,
  action      text not null,          -- 'CREATE','UPDATE','DELETE','LOGIN',...
  entity_type text not null,          -- 'transaction','budget',...
  entity_id   uuid,
  old_data    jsonb,
  new_data    jsonb,
  ip_address  inet,
  created_at  timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════════════════
-- INDEXES (query hot paths)
-- ═══════════════════════════════════════════════════════════════════════
create index if not exists idx_transactions_user_date     on public.transactions (user_id, date desc);
create index if not exists idx_transactions_account       on public.transactions (account_id);
create index if not exists idx_transactions_category      on public.transactions (category_id);
create index if not exists idx_transactions_type          on public.transactions (user_id, type);
create index if not exists idx_transactions_merchant      on public.transactions (user_id, merchant);
create index if not exists idx_txn_tags_tag               on public.transaction_tags (tag_id);
create index if not exists idx_categories_user            on public.categories (user_id);
create index if not exists idx_accounts_user              on public.accounts (user_id);
create index if not exists idx_budgets_user_month         on public.budgets (user_id, month);
create index if not exists idx_goals_user                 on public.savings_goals (user_id);
create index if not exists idx_recurring_user_next        on public.recurring_transactions (user_id, next_run_date)
                                                           where is_active;
create index if not exists idx_notifications_user_unread  on public.notifications (user_id, is_read);
create index if not exists idx_audit_user_created         on public.audit_logs (user_id, created_at desc);
create index if not exists idx_tags_user                  on public.tags (user_id);
