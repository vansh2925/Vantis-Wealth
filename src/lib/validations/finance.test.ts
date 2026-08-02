import { describe, it, expect } from "vitest";
import { transactionSchema, accountSchema, budgetSchema } from "./finance";

const acc = "00000000-0000-0000-0000-000000000001";
const acc2 = "00000000-0000-0000-0000-000000000002";
const cat = "00000000-0000-0000-0000-000000000003";

describe("transactionSchema", () => {
  it("accepts a valid expense with category", () => {
    const r = transactionSchema.safeParse({ type: "expense", amount: 250, accountId: acc, categoryId: cat, currencyCode: "INR", date: "2026-08-01", merchant: "Cafe", status: "cleared" });
    expect(r.success).toBe(true);
  });

  it("rejects a zero/negative amount", () => {
    expect(transactionSchema.safeParse({ type: "expense", amount: 0, accountId: acc, categoryId: cat, currencyCode: "INR", date: "2026-08-01", status: "cleared" }).success).toBe(false);
  });

  it("requires a category for expenses", () => {
    const r = transactionSchema.safeParse({ type: "expense", amount: 100, accountId: acc, categoryId: null, currencyCode: "INR", date: "2026-08-01", status: "cleared" });
    expect(r.success).toBe(false);
  });

  it("allows income without a category", () => {
    const r = transactionSchema.safeParse({ type: "income", amount: 500, accountId: acc, categoryId: null, currencyCode: "INR", date: "2026-08-01", status: "cleared" });
    expect(r.success).toBe(true);
  });

  it("requires a transfer destination", () => {
    const r = transactionSchema.safeParse({ type: "transfer", amount: 100, accountId: acc, categoryId: null, currencyCode: "INR", date: "2026-08-01", status: "cleared" });
    expect(r.success).toBe(false);
  });

  it("rejects transferring to the same account", () => {
    const r = transactionSchema.safeParse({ type: "transfer", amount: 100, accountId: acc, transferAccountId: acc, categoryId: null, currencyCode: "INR", date: "2026-08-01", status: "cleared" });
    expect(r.success).toBe(false);
  });
});

describe("accountSchema", () => {
  it("requires a name", () => {
    expect(accountSchema.safeParse({ name: "", type: "checking", balance: 0, currencyCode: "INR", color: "#3b82f6", isArchived: false }).success).toBe(false);
  });
  it("accepts a valid account", () => {
    expect(accountSchema.safeParse({ name: "Savings", type: "savings", balance: 1000, currencyCode: "INR", color: "#10b981", isArchived: false }).success).toBe(true);
  });
});

describe("budgetSchema", () => {
  it("rejects a negative budget", () => {
    expect(budgetSchema.safeParse({ month: "2026-08-01", amount: -5, currencyCode: "INR" }).success).toBe(false);
  });
  it("accepts a zero or positive budget", () => {
    expect(budgetSchema.safeParse({ month: "2026-08-01", amount: 0, currencyCode: "INR" }).success).toBe(true);
  });
});
