// ═══════════════════════════════════════════════════════════════════════
// Domain types shared across components, hooks and services.
// These are the "feature" shapes (often supersets of raw DB rows) used by
// the UI. Raw table types live in ./database.ts.
// ═══════════════════════════════════════════════════════════════════════

import type { Tables } from "./database";
import type {
  AccountType,
  CategoryType,
  NotificationType,
  RecurringFrequency,
  TransactionType,
} from "./database";

export type {
  AccountType,
  CategoryType,
  NotificationType,
  RecurringFrequency,
  TransactionType,
};

export type Profile = Tables["profiles"]["Row"];
export type Settings = Tables["settings"]["Row"];
export type Account = Tables["accounts"]["Row"];
export type Category = Tables["categories"]["Row"];
export type Tag = Tables["tags"]["Row"];
export type Transaction = Tables["transactions"]["Row"];
export type RecurringTransaction = Tables["recurring_transactions"]["Row"];
export type Budget = Tables["budgets"]["Row"];
export type SavingsGoal = Tables["savings_goals"]["Row"];
export type Note = Tables["notes"]["Row"];
export type Attachment = Tables["attachments"]["Row"];
export type Notification = Tables["notifications"]["Row"];
export type MonthlyAnalytics = Tables["monthly_analytics"]["Row"];
export type Currency = Tables["currencies"]["Row"];

// ── Join / enriched shapes ──────────────────────────────────────────────
export interface TransactionWithRelations extends Transaction {
  account: Pick<Account, "id" | "name" | "type" | "color"> | null;
  transfer_account: Pick<Account, "id" | "name" | "type"> | null;
  category: Pick<Category, "id" | "name" | "icon" | "color" | "type"> | null;
  tags: Pick<Tag, "id" | "name" | "color">[];
}

/** Net worth line item used by the net-worth trend chart. */
export interface NetWorthPoint {
  date: string;
  value: number;
}

/** Financial health score breakdown (0–100). */
export interface FinancialHealth {
  score: number;
  factors: { label: string; weight: number; score: number }[];
}

export interface BudgetWithProgress extends Budget {
  spent: number;
  remaining: number;
  percentUsed: number;
  category: Pick<Category, "id" | "name" | "icon" | "color"> | null;
}

export interface GoalWithProgress extends SavingsGoal {
  percentComplete: number;
  daysLeft: number | null;
}
