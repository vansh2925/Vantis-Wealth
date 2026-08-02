import { formatMoney } from "./money";

/** First day of the current month as "YYYY-MM-01". */
export function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

/** Array of the last `count` month keys, oldest first, ending at `endMonth`. */
export function monthKeys(count: number, endMonth = currentMonthKey()): string[] {
  const [y, m] = endMonth.split("-").map(Number);
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(y, m - 1 - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`);
  }
  return keys;
}

/** Half-open range [start, end) for a month key. */
export function monthRange(monthKey: string): { start: string; end: string } {
  const [y, m] = monthKey.split("-").map(Number);
  // Date handles the year rollover (month index 12 === next January).
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  return { start: fmt(new Date(y, m - 1, 1)), end: fmt(new Date(y, m, 1)) };
}

export interface HealthInput {
  income: number;
  expense: number;
  budgetTotal: number; // sum of budgeted amounts
  budgetUsed: number; // sum spent against budgets
  netWorth: number;
  hasHistory: boolean; // any past months
}

export interface HealthFactor {
  label: string;
  weight: number;
  score: number;
}

export interface HealthResult {
  score: number;
  factors: HealthFactor[];
}

/**
 * A simple, explainable 0-100 financial health score.
 * Returns null when there's nothing to judge yet.
 */
export function financialHealthScore(input: HealthInput): HealthResult | null {
  const savingsRate = input.income > 0 ? (input.income - input.expense) / input.income : 0;
  const budgetAdherence =
    input.budgetTotal > 0 ? Math.max(0, 1 - input.budgetUsed / input.budgetTotal) : 1;
  const netWorthScore = input.netWorth >= 0 ? 1 : Math.min(1, 0.5 + input.netWorth / 100000);

  const factors: HealthFactor[] = [
    { label: "Savings rate", weight: 40, score: clamp01(savingsRate) },
    { label: "Budget adherence", weight: 30, score: clamp01(budgetAdherence) },
    { label: "Net worth", weight: 30, score: clamp01(netWorthScore) },
  ];

  const score = Math.round(factors.reduce((sum, f) => sum + f.score * f.weight, 0));
  return { score, factors };
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

// ── Smart insights ───────────────────────────────────────────────────────
export type InsightTone = "good" | "warning" | "info";

export interface Insight {
  id: string;
  tone: InsightTone;
  title: string;
  message: string;
}

export interface InsightInput {
  currency: string;
  income: number;
  expense: number;
  prevExpenseByCategory: Record<string, number>; // categoryId -> amount (prev month)
  expenseByCategory: Record<string, number>; // categoryId -> amount (this month)
  categoryName: (id: string) => string;
  budgets: { categoryId: string | null; amount: number; spent: number }[];
  largestOptionalSpend: number | null; // amount of biggest dining/entertainment/shopping spend
  prevNetSavings: number | null;
  netSavings: number;
}

const OPTIONAL_KEYS = ["entertainment", "shopping", "food", "dining", "travel"];

/**
 * Generate a handful of human-readable financial insights from the month's
 * data. Pure and deterministic (same inputs → same insights).
 */
export function generateInsights(input: InsightInput): Insight[] {
  const out: Insight[] = [];

  // Savings trend vs last month
  if (input.prevNetSavings !== null && input.prevNetSavings !== 0) {
    const pct = ((input.netSavings - input.prevNetSavings) / Math.abs(input.prevNetSavings)) * 100;
    if (Math.abs(pct) >= 5) {
      out.push({
        id: "savings-trend",
        tone: pct > 0 ? "good" : "warning",
        title: pct > 0 ? "Savings on the rise" : "Savings down this month",
        message:
          pct > 0
            ? `Your savings grew ${Math.round(pct)}% compared to last month.`
            : `Your savings dropped ${Math.round(Math.abs(pct))}% compared to last month.`,
      });
    }
  }

  // Budget exceeded
  for (const b of input.budgets) {
    if (b.categoryId && b.amount > 0 && b.spent > b.amount) {
      out.push({
        id: `budget-${b.categoryId}`,
        tone: "warning",
        title: "Budget exceeded",
        message: `You're over your ${input.categoryName(b.categoryId)} budget by ${formatMoney(b.spent - b.amount, input.currency)}.`,
      });
    }
  }

  // Category increased vs last month
  let maxDelta = 0;
  let maxCat: string | null = null;
  for (const [id, amount] of Object.entries(input.expenseByCategory)) {
    const prev = input.prevExpenseByCategory[id] ?? 0;
    if (prev > 0 && amount > prev) {
      const pct = ((amount - prev) / prev) * 100;
      if (pct > maxDelta) {
        maxDelta = pct;
        maxCat = id;
      }
    }
  }
  if (maxCat && maxDelta >= 15) {
    out.push({
      id: "category-increase",
      tone: "info",
      title: "Spending up",
      message: `You spent ${Math.round(maxDelta)}% more on ${input.categoryName(maxCat)} this month.`,
    });
  }

  // Biggest spending area
  const top = Object.entries(input.expenseByCategory).sort((a, b) => b[1] - a[1])[0];
  if (top && top[1] > 0) {
    out.push({
      id: "top-category",
      tone: "info",
      title: "Biggest spend",
      message: `${input.categoryName(top[0])} was your largest expense at ${formatMoney(top[1], input.currency)}.`,
    });
  }

  // Reduction suggestion on optional spending
  if (input.largestOptionalSpend && input.largestOptionalSpend > 0) {
    const saved = input.largestOptionalSpend * 0.2;
    if (saved >= 500) {
      out.push({
        id: "saving-tip",
        tone: "good",
        title: "Saving tip",
        message: `You could save around ${formatMoney(saved, input.currency)} a month by trimming your top optional expense.`,
      });
    }
  }

  // Positive: healthy savings rate
  if (input.income > 0) {
    const rate = ((input.income - input.expense) / input.income) * 100;
    if (rate >= 20) {
      out.push({
        id: "healthy-savings",
        tone: "good",
        title: "Great savings rate",
        message: `You saved ${Math.round(rate)}% of your income this month — that's above the 20% guideline.`,
      });
    }
  }

  return out.slice(0, 6);
}

export function isOptionalCategory(name: string): boolean {
  const n = name.toLowerCase();
  return OPTIONAL_KEYS.some((k) => n.includes(k));
}
