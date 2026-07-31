-- ═══════════════════════════════════════════════════════════════════════
-- Finance App — Seed Data (currencies + shared default categories)
-- Run AFTER schema.sql and functions.sql
-- ═══════════════════════════════════════════════════════════════════════

-- ── Currencies ─────────────────────────────────────────────────────────
insert into public.currencies (code, name, symbol, decimal_places, position) values
  ('INR', 'Indian Rupee',   '₹', 2, 'prefix'),
  ('USD', 'US Dollar',      '$', 2, 'prefix'),
  ('EUR', 'Euro',           '€', 2, 'prefix'),
  ('GBP', 'British Pound',  '£', 2, 'prefix'),
  ('JPY', 'Japanese Yen',   '¥', 0, 'prefix'),
  ('CAD', 'Canadian Dollar','$', 2, 'prefix'),
  ('AUD', 'Australian Dollar','$',2, 'prefix'),
  ('AED', 'UAE Dirham',     'د.إ', 2, 'prefix'),
  ('SGD', 'Singapore Dollar','$', 2, 'prefix'),
  ('CHF', 'Swiss Franc',    'Fr', 2, 'prefix'),
  ('CNY', 'Chinese Yuan',   '¥', 2, 'prefix')
on conflict (code) do nothing;

-- ── Default categories (user_id NULL = shared) ─────────────────────────
insert into public.categories (user_id, type, name, icon, color, is_custom, is_default, sort_order) values
  -- Income
  (null, 'income',  'Salary',            'wallet',        '#10b981', false, true, 10),
  (null, 'income',  'Freelance',         'briefcase',     '#3b82f6', false, true, 20),
  (null, 'income',  'Business',          'building-2',    '#8b5cf6', false, true, 30),
  (null, 'income',  'Investments',       'trending-up',   '#06b6d4', false, true, 40),
  (null, 'income',  'Gifts',             'gift',          '#ec4899', false, true, 50),
  (null, 'income',  'Other Income',      'circle-plus',   '#64748b', false, true, 99),
  -- Expense
  (null, 'expense', 'Food & Dining',     'utensils',      '#f59e0b', false, true, 10),
  (null, 'expense', 'Groceries',         'shopping-cart', '#eab308', false, true, 20),
  (null, 'expense', 'Transport',         'bus',           '#3b82f6', false, true, 30),
  (null, 'expense', 'Housing & Rent',    'home',          '#8b5cf6', false, true, 40),
  (null, 'expense', 'Utilities',         'zap',           '#ef4444', false, true, 50),
  (null, 'expense', 'Shopping',          'shopping-bag',  '#ec4899', false, true, 60),
  (null, 'expense', 'Entertainment',     'clapperboard',  '#f472b6', false, true, 70),
  (null, 'expense', 'Health & Fitness',  'heart-pulse',   '#ef4444', false, true, 80),
  (null, 'expense', 'Education',         'graduation-cap','#06b6d4', false, true, 90),
  (null, 'expense', 'Travel',            'plane',         '#0ea5e9', false, true, 100),
  (null, 'expense', 'Subscriptions',     'repeat',        '#6366f1', false, true, 110),
  (null, 'expense', 'Insurance',         'shield-check',  '#14b8a6', false, true, 120),
  (null, 'expense', 'Personal Care',     'sparkles',      '#d946ef', false, true, 130),
  (null, 'expense', 'Family',            'users',         '#f43f5e', false, true, 140),
  (null, 'expense', 'Fees & Charges',    'receipt',       '#94a3b8', false, true, 150),
  (null, 'expense', 'Other Expenses',    'circle-minus',  '#64748b', false, true, 99)
on conflict (user_id, type, name) do nothing;
