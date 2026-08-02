import { describe, it, expect } from "vitest";
import {
  monthKeys,
  monthRange,
  financialHealthScore,
  generateInsights,
  isOptionalCategory,
  type InsightInput,
} from "./analytics";

describe("monthRange", () => {
  it("returns half-open month bounds", () => {
    expect(monthRange("2026-08-01")).toEqual({ start: "2026-08-01", end: "2026-09-01" });
  });
  it("rolls over the year boundary", () => {
    expect(monthRange("2026-12-01")).toEqual({ start: "2026-12-01", end: "2027-01-01" });
  });
});

describe("monthKeys", () => {
  it("returns count keys ending at the given month", () => {
    expect(monthKeys(3, "2026-08-01")).toEqual(["2026-06-01", "2026-07-01", "2026-08-01"]);
  });
});

describe("financialHealthScore", () => {
  it("scores 100 when saving everything, no debt, on budget", () => {
    const r = financialHealthScore({ income: 1000, expense: 0, budgetTotal: 0, budgetUsed: 0, netWorth: 5000, hasHistory: true });
    expect(r?.score).toBe(100);
  });

  it("penalises a negative savings rate", () => {
    const r = financialHealthScore({ income: 1000, expense: 1500, budgetTotal: 0, budgetUsed: 0, netWorth: 0, hasHistory: true });
    expect(r!.score).toBeLessThan(100);
  });

  it("penalises exceeded budgets", () => {
    const good = financialHealthScore({ income: 1000, expense: 200, budgetTotal: 500, budgetUsed: 200, netWorth: 1000, hasHistory: true });
    const bad = financialHealthScore({ income: 1000, expense: 200, budgetTotal: 500, budgetUsed: 600, netWorth: 1000, hasHistory: true });
    expect(bad!.score).toBeLessThan(good!.score);
  });
});

describe("generateInsights", () => {
  function base(overrides: Partial<InsightInput> = {}): InsightInput {
    return {
      currency: "INR",
      income: 10000,
      expense: 5000,
      prevExpenseByCategory: { food: 1000 },
      expenseByCategory: { food: 1250 },
      categoryName: (id) => (id === "food" ? "Food" : id),
      budgets: [],
      largestOptionalSpend: null,
      prevNetSavings: 4000,
      netSavings: 5000,
      ...overrides,
    };
  }

  it("reports savings growth when savings increased", () => {
    const out = generateInsights(base({ prevNetSavings: 4000, netSavings: 5000 }));
    expect(out.some((i) => i.id === "savings-trend" && i.tone === "good")).toBe(true);
  });

  it("flags an exceeded budget", () => {
    const out = generateInsights(
      base({ budgets: [{ categoryId: "food", amount: 1000, spent: 1250 }] })
    );
    expect(out.some((i) => i.id === "budget-food")).toBe(true);
  });

  it("reports category increase vs last month", () => {
    const out = generateInsights(base({ prevExpenseByCategory: { food: 1000 }, expenseByCategory: { food: 1500 } }));
    expect(out.some((i) => i.id === "category-increase")).toBe(true);
  });

  it("gives a saving tip for large optional spend", () => {
    const out = generateInsights(base({ largestOptionalSpend: 5000 }));
    expect(out.some((i) => i.id === "saving-tip")).toBe(true);
  });
});

describe("isOptionalCategory", () => {
  it("recognises discretionary categories", () => {
    expect(isOptionalCategory("Dining out")).toBe(true);
    expect(isOptionalCategory("Shopping")).toBe(true);
    expect(isOptionalCategory("Rent")).toBe(false);
  });
});
