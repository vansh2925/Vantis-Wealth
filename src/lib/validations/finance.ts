import { z } from "zod";
import type { AccountType, TransactionType } from "@/types";

export const ACCOUNT_TYPES: AccountType[] = [
  "checking",
  "savings",
  "credit",
  "cash",
  "investment",
  "wallet",
  "upi",
  "business",
  "other",
];

export const accountSchema = z.object({
  name: z.string().trim().min(1, "Account name is required.").max(40),
  type: z.enum(ACCOUNT_TYPES as [AccountType, ...AccountType[]]),
  balance: z.coerce
    .number({ message: "Enter a valid balance." })
    .finite(),
  currencyCode: z.string().min(3),
  bankName: z.string().trim().max(60).optional().or(z.literal("")),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  isArchived: z.boolean(),
});

export const categorySchema = z.object({
  type: z.enum(["income", "expense"]),
  name: z.string().trim().min(1, "Category name is required.").max(40),
  icon: z.string().min(1),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  parentId: z.string().uuid().nullable().optional(),
});

export const transactionSchema = z
  .object({
    type: z.enum(["income", "expense", "transfer"]),
    amount: z.coerce
      .number({ message: "Enter a valid amount." })
      .positive("Amount must be greater than zero.")
      .finite(),
    accountId: z.string().uuid("Select an account."),
    transferAccountId: z.string().uuid().nullable().optional(),
    categoryId: z.string().uuid().nullable().optional(),
    currencyCode: z.string().min(3),
    date: z.string().min(1, "Pick a date."),
    merchant: z.string().trim().max(80).optional().or(z.literal("")),
    note: z.string().trim().max(500).optional().or(z.literal("")),
    status: z.enum(["cleared", "pending"]),
  })
  .refine((d) => d.type !== "transfer" || d.transferAccountId, {
    message: "Choose a destination account for the transfer.",
    path: ["transferAccountId"],
  })
  .refine(
    (d) =>
      d.type !== "transfer" ||
      !d.transferAccountId ||
      d.transferAccountId !== d.accountId,
    { message: "Transfer accounts must be different.", path: ["transferAccountId"] }
  )
  .refine(
    (d) =>
      d.type === "transfer" || d.categoryId || d.type === "income",
    { message: "Pick a category.", path: ["categoryId"] }
  );

export type AccountValues = z.infer<typeof accountSchema>;
export type CategoryValues = z.infer<typeof categorySchema>;
export type TransactionValues = z.infer<typeof transactionSchema>;

// ── Filter / sort shapes for the transactions page ──────────────────────
export const transactionFiltersSchema = z.object({
  search: z.string().default(""),
  type: z.enum(["all", "income", "expense", "transfer"]).default("all"),
  accountId: z.string().uuid().or(z.literal("all")).default("all"),
  categoryId: z.string().uuid().or(z.literal("all")).default("all"),
  status: z.enum(["all", "cleared", "pending"]).default("all"),
});

export type TransactionFilters = z.infer<typeof transactionFiltersSchema>;

export const DEFAULT_FILTERS: TransactionFilters = {
  search: "",
  type: "all",
  accountId: "all",
  categoryId: "all",
  status: "all",
};

export type TransactionSort = "date" | "amount";
export type TransactionSortDir = "asc" | "desc";
