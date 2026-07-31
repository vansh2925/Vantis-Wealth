"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAccounts } from "@/hooks/use-accounts";
import { useCategories } from "@/hooks/use-categories";
import type { TransactionFilters } from "@/lib/validations/finance";

interface Props {
  filters: TransactionFilters;
  onChange: (patch: Partial<TransactionFilters>) => void;
}

export function TransactionFilters({ filters, onChange }: Props) {
  const { accounts } = useAccounts();
  const { categories } = useCategories();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.search}
          onChange={(e) => onChange({ search: e.target.value })}
          placeholder="Search merchant or note…"
          className="pl-9"
        />
      </div>

      <Select
        value={filters.type}
        onValueChange={(v) => onChange({ type: v as TransactionFilters["type"] })}
      >
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          <SelectItem value="income">Income</SelectItem>
          <SelectItem value="expense">Expense</SelectItem>
          <SelectItem value="transfer">Transfer</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.accountId}
        onValueChange={(v) => onChange({ accountId: v })}
      >
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All accounts</SelectItem>
          {(accounts ?? []).map((a) => (
            <SelectItem key={a.id} value={a.id}>
              {a.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.categoryId}
        onValueChange={(v) => onChange({ categoryId: v })}
      >
        <SelectTrigger className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {(categories ?? []).map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.status}
        onValueChange={(v) => onChange({ status: v as TransactionFilters["status"] })}
      >
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Any status</SelectItem>
          <SelectItem value="cleared">Cleared</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
