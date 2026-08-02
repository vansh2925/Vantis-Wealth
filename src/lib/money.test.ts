import { describe, it, expect } from "vitest";
import { formatMoney, formatMoneyCompact } from "./money";

describe("formatMoney", () => {
  it("formats INR in en-IN grouping", () => {
    expect(formatMoney(123456.78, "INR", "en-IN")).toBe("₹1,23,456.78");
  });

  it("formats USD with dollar sign", () => {
    expect(formatMoney(1234.5, "USD", "en-IN")).toBe("$1,234.50");
  });

  it("handles zero", () => {
    expect(formatMoney(0, "INR")).toContain("0.00");
  });

  it("still renders for an unknown currency code", () => {
    expect(formatMoney(5, "ZZZ")).toContain("ZZZ");
    expect(formatMoney(5, "ZZZ")).toContain("5.00");
  });
});

describe("formatMoneyCompact", () => {
  it("uses lakh/crore units for INR", () => {
    expect(formatMoneyCompact(1_23_45_678, "INR", "en-IN")).toBe("₹1.2Cr");
    expect(formatMoneyCompact(1_50_000, "INR", "en-IN")).toBe("₹1.5L");
    expect(formatMoneyCompact(2500, "INR", "en-IN")).toBe("₹2.5k");
  });

  it("handles negatives", () => {
    expect(formatMoneyCompact(-1_50_000, "INR", "en-IN")).toBe("-₹1.5L");
  });
});
