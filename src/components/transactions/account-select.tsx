"use client";

import { useAccounts } from "@/hooks/use-accounts";
import { ACCOUNT_TYPE_META } from "@/lib/constants/accounts";
import { useMoney } from "@/contexts/display-currency-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AccountSelectProps {
  value: string | null | undefined;
  onValueChange: (value: string) => void;
  placeholder?: string;
  /** Optionally hide one account (used for the transfer destination). */
  excludeId?: string;
}

export function AccountSelect({
  value,
  onValueChange,
  placeholder = "Select account",
  excludeId,
}: AccountSelectProps) {
  const { accounts, isLoading } = useAccounts();
  const { format } = useMoney();
  const list = accounts?.filter((a) => a.id !== excludeId) ?? [];

  return (
    <Select
      value={value ?? undefined}
      onValueChange={onValueChange}
      disabled={isLoading}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {list.map((a) => {
          const meta = ACCOUNT_TYPE_META[a.type];
          const Icon = meta.icon;
          return (
            <SelectItem key={a.id} value={a.id}>
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4" style={{ color: meta.color }} />
                <span>{a.name}</span>
                <span className="ml-auto pl-3 text-xs text-muted-foreground">
                  {format(a.balance, a.currency_code)}
                </span>
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
