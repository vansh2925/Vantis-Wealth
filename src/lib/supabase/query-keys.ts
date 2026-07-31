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
};
