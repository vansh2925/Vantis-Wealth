-- ═══════════════════════════════════════════════════════════════════════
-- Finance App — Functions & Triggers
-- Run AFTER schema.sql
-- ═══════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────────
-- 1. updated_at bookkeeping
-- ────────────────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ────────────────────────────────────────────────────────────────────────
-- 2. Refresh a user's monthly analytics rollup from raw transactions.
-- Kept in SQL so callers never have to hand-compute these figures.
-- ────────────────────────────────────────────────────────────────────────
create or replace function public.refresh_monthly_analytics(p_user_id uuid, p_month date)
returns void
language plpgsql
security invoker
as $$
declare
  v_income  numeric(16,2);
  v_expense numeric(16,2);
  v_budget  numeric(16,2);
  v_budget_used numeric(16,2);
  v_networth numeric(16,2);
  v_start date := date_trunc('month', p_month)::date;
  v_end   date := (v_start + interval '1 month')::date;
begin
  select coalesce(sum(amount), 0)
    into v_income
    from public.transactions
   where user_id = p_user_id and type = 'income' and date >= v_start and date < v_end;

  select coalesce(sum(amount), 0)
    into v_expense
    from public.transactions
   where user_id = p_user_id and type = 'expense' and date >= v_start and date < v_end;

  select coalesce(sum(amount), 0)
    into v_budget
    from public.budgets
   where user_id = p_user_id and month = v_start and category_id is null;

  select coalesce(sum(t.amount), 0)
    into v_budget_used
    from public.transactions t
    join public.budgets b on b.category_id = t.category_id and b.month = v_start and b.user_id = t.user_id
   where t.user_id = p_user_id and t.type = 'expense' and t.date >= v_start and t.date < v_end;

  select coalesce(sum(a.balance), 0)
    into v_networth
    from public.accounts a
   where a.user_id = p_user_id and a.is_archived = false;

  insert into public.monthly_analytics
        (user_id, month, total_income, total_expense, net_savings, savings_rate,
         budget_used, net_worth)
  values (p_user_id, v_start,
          v_income, v_expense, v_income - v_expense,
          case when v_income > 0 then round(((v_income - v_expense) / v_income) * 100, 2) else 0 end,
          v_budget_used, v_networth)
  on conflict (user_id, month) do update set
    total_income  = excluded.total_income,
    total_expense = excluded.total_expense,
    net_savings   = excluded.net_savings,
    savings_rate  = excluded.savings_rate,
    budget_used   = excluded.budget_used,
    net_worth     = excluded.net_worth,
    updated_at    = now();
end;
$$;

-- ────────────────────────────────────────────────────────────────────────
-- 3. Create a transaction and keep balances + analytics consistent,
-- all within a single DB transaction (atomicity).
-- ────────────────────────────────────────────────────────────────────────
create or replace function public.create_transaction(
  p_user_id            uuid,
  p_account_id         uuid,
  p_category_id        uuid,
  p_type               text,
  p_amount             numeric,
  p_currency_code      text,
  p_date               date,
  p_merchant           text default null,
  p_note               text default null,
  p_status             text default 'cleared',
  p_transfer_account_id uuid default null,
  p_recurring_id       uuid default null,
  p_attachment_url     text default null
)
returns public.transactions
language plpgsql
security invoker
as $$
declare
  v_txn public.transactions;
begin
  if p_amount <= 0 then
    raise exception 'Amount must be greater than zero.';
  end if;

  insert into public.transactions
    (user_id, account_id, transfer_account_id, category_id, recurring_id,
     type, amount, currency_code, merchant, note, date, status, attachment_url)
  values
    (p_user_id, p_account_id, p_transfer_account_id, p_category_id, p_recurring_id,
     p_type, p_amount, p_currency_code, p_merchant, p_note, p_date, p_status, p_attachment_url)
  returning * into v_txn;

  -- Update balances (credit cards: balance is the outstanding debt, so a
  -- 'credit' account behaves like a normal account in sign terms).
  if p_type = 'income' then
    update public.accounts set balance = balance + p_amount where id = p_account_id and user_id = p_user_id;
  elsif p_type = 'expense' then
    update public.accounts set balance = balance - p_amount where id = p_account_id and user_id = p_user_id;
  elsif p_type = 'transfer' then
    update public.accounts set balance = balance - p_amount where id = p_account_id and user_id = p_user_id;
    update public.accounts set balance = balance + p_amount where id = p_transfer_account_id and user_id = p_user_id;
  end if;

  perform public.refresh_monthly_analytics(p_user_id, p_date);

  return v_txn;
end;
$$;

-- ────────────────────────────────────────────────────────────────────────
-- 4. Delete a transaction and reverse its effect on balances/analytics.
-- ────────────────────────────────────────────────────────────────────────
create or replace function public.delete_transaction(p_txn_id uuid, p_user_id uuid)
returns void
language plpgsql
security invoker
as $$
declare
  v_txn public.transactions;
begin
  select * into v_txn
    from public.transactions
   where id = p_txn_id and user_id = p_user_id;

  if not found then
    raise exception 'Transaction not found or not owned by user.';
  end if;

  delete from public.transactions where id = p_txn_id;

  if v_txn.type = 'income' then
    update public.accounts set balance = balance - v_txn.amount where id = v_txn.account_id;
  elsif v_txn.type = 'expense' then
    update public.accounts set balance = balance + v_txn.amount where id = v_txn.account_id;
  elsif v_txn.type = 'transfer' then
    update public.accounts set balance = balance + v_txn.amount where id = v_txn.account_id;
    update public.accounts set balance = balance - v_txn.amount where id = v_txn.transfer_account_id;
  end if;

  perform public.refresh_monthly_analytics(p_user_id, v_txn.date);
end;
$$;

-- ────────────────────────────────────────────────────────────────────────
-- 4b. Update a transaction: reverse the old balance effect, apply the new
-- one, and refresh analytics for both the old and new months. Atomic.
-- ────────────────────────────────────────────────────────────────────────
create or replace function public.update_transaction(
  p_txn_id             uuid,
  p_user_id            uuid,
  p_account_id         uuid,
  p_category_id        uuid,
  p_type               text,
  p_amount             numeric,
  p_currency_code      text,
  p_date               date,
  p_merchant           text default null,
  p_note               text default null,
  p_status             text default 'cleared',
  p_transfer_account_id uuid default null
)
returns public.transactions
language plpgsql
security invoker
as $$
declare
  v_old public.transactions;
  v_new public.transactions;
begin
  select * into v_old
    from public.transactions
   where id = p_txn_id and user_id = p_user_id;

  if not found then
    raise exception 'Transaction not found or not owned by user.';
  end if;

  -- Reverse old effect
  if v_old.type = 'income' then
    update public.accounts set balance = balance - v_old.amount
      where id = v_old.account_id and user_id = p_user_id;
  elsif v_old.type = 'expense' then
    update public.accounts set balance = balance + v_old.amount
      where id = v_old.account_id and user_id = p_user_id;
  elsif v_old.type = 'transfer' then
    update public.accounts set balance = balance + v_old.amount
      where id = v_old.account_id and user_id = p_user_id;
    update public.accounts set balance = balance - v_old.amount
      where id = v_old.transfer_account_id and user_id = p_user_id;
  end if;

  -- Apply new effect
  update public.transactions
     set account_id = p_account_id,
         transfer_account_id = case when p_type = 'transfer' then p_transfer_account_id else null end,
         category_id = p_category_id,
         type = p_type,
         amount = p_amount,
         currency_code = p_currency_code,
         merchant = p_merchant,
         note = p_note,
         date = p_date,
         status = p_status,
         updated_at = now()
   where id = p_txn_id and user_id = p_user_id
   returning * into v_new;

  if p_type = 'income' then
    update public.accounts set balance = balance + p_amount
      where id = p_account_id and user_id = p_user_id;
  elsif p_type = 'expense' then
    update public.accounts set balance = balance - p_amount
      where id = p_account_id and user_id = p_user_id;
  elsif p_type = 'transfer' then
    update public.accounts set balance = balance - p_amount
      where id = p_account_id and user_id = p_user_id;
    update public.accounts set balance = balance + p_amount
      where id = p_transfer_account_id and user_id = p_user_id;
  end if;

  perform public.refresh_monthly_analytics(p_user_id, v_old.date);
  if v_old.date <> p_date then
    perform public.refresh_monthly_analytics(p_user_id, p_date);
  end if;

  return v_new;
end;
$$;

-- ────────────────────────────────────────────────────────────────────────
-- 5. New-user bootstrap: create profile + settings.
-- Default categories stay shared (user_id NULL) so no copying is needed.
-- ────────────────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, currency_code, onboarded)
  values (new.id,
          coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
          coalesce(new.raw_user_meta_data ->> 'currency', 'INR'),
          false);

  insert into public.settings (user_id, currency_code)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'currency', 'INR'));

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ────────────────────────────────────────────────────────────────────────
-- 6. Wire up updated_at triggers.
-- ────────────────────────────────────────────────────────────────────────
create trigger set_profiles_updated_at
  before update on public.profiles for each row execute function public.set_updated_at();
create trigger set_settings_updated_at
  before update on public.settings for each row execute function public.set_updated_at();
create trigger set_categories_updated_at
  before update on public.categories for each row execute function public.set_updated_at();
create trigger set_accounts_updated_at
  before update on public.accounts for each row execute function public.set_updated_at();
create trigger set_recurring_updated_at
  before update on public.recurring_transactions for each row execute function public.set_updated_at();
create trigger set_transactions_updated_at
  before update on public.transactions for each row execute function public.set_updated_at();
create trigger set_budgets_updated_at
  before update on public.budgets for each row execute function public.set_updated_at();
create trigger set_goals_updated_at
  before update on public.savings_goals for each row execute function public.set_updated_at();
create trigger set_notes_updated_at
  before update on public.notes for each row execute function public.set_updated_at();
