import type { TransactionFilters, TransactionSort, TransactionSortDir } from "@/lib/validations/finance";

/** Centralised React Query keys so invalidation stays consistent. */
export const queryKeys = {
  transactions: {
    all: ["transactions"] as const,
    list: (f: {
      filters: TransactionFilters;
      sort: TransactionSort;
      dir: TransactionSortDir;
      page: number;
      pageSize: number;
    }) => ["transactions", "list", f] as const,
  },
  accounts: {
    all: ["accounts"] as const,
    list: () => ["accounts", "list"] as const,
  },
  categories: {
    all: ["categories"] as const,
    list: () => ["categories", "list"] as const,
  },
  currencies: {
    all: ["currencies"] as const,
  },
  budgets: {
    all: ["budgets"] as const,
    list: (month: string) => ["budgets", "list", month] as const,
  },
  goals: {
    all: ["goals"] as const,
    list: () => ["goals", "list"] as const,
  },
  recurring: {
    all: ["recurring"] as const,
    list: () => ["recurring", "list"] as const,
  },
  notifications: {
    all: ["notifications"] as const,
    list: () => ["notifications", "list"] as const,
    unread: () => ["notifications", "unread"] as const,
  },
};
