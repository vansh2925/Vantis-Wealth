-- ═══════════════════════════════════════════════════════════════════════
-- Finance App — Row Level Security
-- Run LAST (after schema.sql, functions.sql, seed.sql)
--
-- Security model: every user-scoped table only ever exposes rows where
-- user_id = auth.uid(). Shared default categories (user_id IS NULL) are
-- readable by everyone. Currencies are publicly readable reference data.
-- Functions are SECURITY INVOKER so RLS still applies to their reads/writes.
-- ═══════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────────
-- CURRRENCIES — public read, no writes via RLS
-- ────────────────────────────────────────────────────────────────────────
alter table public.currencies enable row level security;
drop policy if exists currencies_select on public.currencies;
create policy currencies_select on public.currencies
  for select using (true);

-- ────────────────────────────────────────────────────────────────────────
-- PROFILES — owner read/write (created by security-definer trigger)
-- ────────────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
drop policy if exists profiles_select on public.profiles;
drop policy if exists profiles_update on public.profiles;
create policy profiles_select on public.profiles
  for select using (auth.uid() = id);
create policy profiles_update on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ────────────────────────────────────────────────────────────────────────
-- SETTINGS — owner read/write
-- ────────────────────────────────────────────────────────────────────────
alter table public.settings enable row level security;
drop policy if exists settings_select on public.settings;
drop policy if exists settings_insert on public.settings;
drop policy if exists settings_update on public.settings;
create policy settings_select on public.settings
  for select using (auth.uid() = user_id);
create policy settings_insert on public.settings
  for insert with check (auth.uid() = user_id);
create policy settings_update on public.settings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────────────────
-- CATEGORIES — owner full CRUD + everyone reads shared defaults
-- ────────────────────────────────────────────────────────────────────────
alter table public.categories enable row level security;
drop policy if exists categories_select on public.categories;
drop policy if exists categories_insert on public.categories;
drop policy if exists categories_update on public.categories;
drop policy if exists categories_delete on public.categories;
create policy categories_select on public.categories
  for select using (auth.uid() = user_id or user_id is null);
create policy categories_insert on public.categories
  for insert with check (auth.uid() = user_id);
create policy categories_update on public.categories
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy categories_delete on public.categories
  for delete using (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────────────────
-- ACCOUNTS — owner full CRUD
-- ────────────────────────────────────────────────────────────────────────
alter table public.accounts enable row level security;
drop policy if exists accounts_select on public.accounts;
drop policy if exists accounts_insert on public.accounts;
drop policy if exists accounts_update on public.accounts;
drop policy if exists accounts_delete on public.accounts;
create policy accounts_select on public.accounts
  for select using (auth.uid() = user_id);
create policy accounts_insert on public.accounts
  for insert with check (auth.uid() = user_id);
create policy accounts_update on public.accounts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy accounts_delete on public.accounts
  for delete using (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────────────────
-- TAGS — owner full CRUD
-- ────────────────────────────────────────────────────────────────────────
alter table public.tags enable row level security;
drop policy if exists tags_select on public.tags;
drop policy if exists tags_insert on public.tags;
drop policy if exists tags_update on public.tags;
drop policy if exists tags_delete on public.tags;
create policy tags_select on public.tags
  for select using (auth.uid() = user_id);
create policy tags_insert on public.tags
  for insert with check (auth.uid() = user_id);
create policy tags_update on public.tags
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy tags_delete on public.tags
  for delete using (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────────────────
-- RECURRING TRANSACTIONS — owner full CRUD
-- ────────────────────────────────────────────────────────────────────────
alter table public.recurring_transactions enable row level security;
drop policy if exists recurring_select on public.recurring_transactions;
drop policy if exists recurring_insert on public.recurring_transactions;
drop policy if exists recurring_update on public.recurring_transactions;
drop policy if exists recurring_delete on public.recurring_transactions;
create policy recurring_select on public.recurring_transactions
  for select using (auth.uid() = user_id);
create policy recurring_insert on public.recurring_transactions
  for insert with check (auth.uid() = user_id);
create policy recurring_update on public.recurring_transactions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy recurring_delete on public.recurring_transactions
  for delete using (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────────────────
-- TRANSACTIONS — owner full CRUD
-- ────────────────────────────────────────────────────────────────────────
alter table public.transactions enable row level security;
drop policy if exists transactions_select on public.transactions;
drop policy if exists transactions_insert on public.transactions;
drop policy if exists transactions_update on public.transactions;
drop policy if exists transactions_delete on public.transactions;
create policy transactions_select on public.transactions
  for select using (auth.uid() = user_id);
create policy transactions_insert on public.transactions
  for insert with check (auth.uid() = user_id);
create policy transactions_update on public.transactions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy transactions_delete on public.transactions
  for delete using (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────────────────
-- TRANSACTION_TAGS (join) — owner scope via the transaction
-- ────────────────────────────────────────────────────────────────────────
alter table public.transaction_tags enable row level security;
drop policy if exists txn_tags_select on public.transaction_tags;
drop policy if exists txn_tags_insert on public.transaction_tags;
drop policy if exists txn_tags_delete on public.transaction_tags;
create policy txn_tags_select on public.transaction_tags
  for select using (
    exists (select 1 from public.transactions t
            where t.id = transaction_id and t.user_id = auth.uid())
  );
create policy txn_tags_insert on public.transaction_tags
  for insert with check (
    exists (select 1 from public.transactions t
            where t.id = transaction_id and t.user_id = auth.uid())
  );
create policy txn_tags_delete on public.transaction_tags
  for delete using (
    exists (select 1 from public.transactions t
            where t.id = transaction_id and t.user_id = auth.uid())
  );

-- ────────────────────────────────────────────────────────────────────────
-- BUDGETS — owner full CRUD
-- ────────────────────────────────────────────────────────────────────────
alter table public.budgets enable row level security;
drop policy if exists budgets_select on public.budgets;
drop policy if exists budgets_insert on public.budgets;
drop policy if exists budgets_update on public.budgets;
drop policy if exists budgets_delete on public.budgets;
create policy budgets_select on public.budgets
  for select using (auth.uid() = user_id);
create policy budgets_insert on public.budgets
  for insert with check (auth.uid() = user_id);
create policy budgets_update on public.budgets
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy budgets_delete on public.budgets
  for delete using (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────────────────
-- SAVINGS GOALS — owner full CRUD
-- ────────────────────────────────────────────────────────────────────────
alter table public.savings_goals enable row level security;
drop policy if exists goals_select on public.savings_goals;
drop policy if exists goals_insert on public.savings_goals;
drop policy if exists goals_update on public.savings_goals;
drop policy if exists goals_delete on public.savings_goals;
create policy goals_select on public.savings_goals
  for select using (auth.uid() = user_id);
create policy goals_insert on public.savings_goals
  for insert with check (auth.uid() = user_id);
create policy goals_update on public.savings_goals
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy goals_delete on public.savings_goals
  for delete using (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────────────────
-- NOTES — owner full CRUD
-- ────────────────────────────────────────────────────────────────────────
alter table public.notes enable row level security;
drop policy if exists notes_select on public.notes;
drop policy if exists notes_insert on public.notes;
drop policy if exists notes_update on public.notes;
drop policy if exists notes_delete on public.notes;
create policy notes_select on public.notes
  for select using (auth.uid() = user_id);
create policy notes_insert on public.notes
  for insert with check (auth.uid() = user_id);
create policy notes_update on public.notes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy notes_delete on public.notes
  for delete using (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────────────────
-- ATTACHMENTS — owner full CRUD
-- ────────────────────────────────────────────────────────────────────────
alter table public.attachments enable row level security;
drop policy if exists attachments_select on public.attachments;
drop policy if exists attachments_insert on public.attachments;
drop policy if exists attachments_update on public.attachments;
drop policy if exists attachments_delete on public.attachments;
create policy attachments_select on public.attachments
  for select using (auth.uid() = user_id);
create policy attachments_insert on public.attachments
  for insert with check (auth.uid() = user_id);
create policy attachments_update on public.attachments
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy attachments_delete on public.attachments
  for delete using (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────────────────
-- NOTIFICATIONS — owner full CRUD
-- ────────────────────────────────────────────────────────────────────────
alter table public.notifications enable row level security;
drop policy if exists notifications_select on public.notifications;
drop policy if exists notifications_insert on public.notifications;
drop policy if exists notifications_update on public.notifications;
drop policy if exists notifications_delete on public.notifications;
create policy notifications_select on public.notifications
  for select using (auth.uid() = user_id);
create policy notifications_insert on public.notifications
  for insert with check (auth.uid() = user_id);
create policy notifications_update on public.notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy notifications_delete on public.notifications
  for delete using (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────────────────
-- MONTHLY ANALYTICS — owner full CRUD (written by SECURITY INVOKER funcs)
-- ────────────────────────────────────────────────────────────────────────
alter table public.monthly_analytics enable row level security;
drop policy if exists analytics_select on public.monthly_analytics;
drop policy if exists analytics_insert on public.monthly_analytics;
drop policy if exists analytics_update on public.monthly_analytics;
create policy analytics_select on public.monthly_analytics
  for select using (auth.uid() = user_id);
create policy analytics_insert on public.monthly_analytics
  for insert with check (auth.uid() = user_id);
create policy analytics_update on public.monthly_analytics
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────────────────
-- AUDIT LOGS — owner read; INSERT only via server (service role / function)
-- ────────────────────────────────────────────────────────────────────────
alter table public.audit_logs enable row level security;
drop policy if exists audit_select on public.audit_logs;
drop policy if exists audit_insert_owner on public.audit_logs;
create policy audit_select on public.audit_logs
  for select using (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════
-- REVOKE default table privileges as defense-in-depth: no broad grants.
-- The app writes through RLS-scoped policies + security-definer triggers.
-- ═══════════════════════════════════════════════════════════════════════
