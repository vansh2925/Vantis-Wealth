"use client";

import { MoreHorizontal, Pencil, ArrowLeftRight, Archive, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatMoney } from "@/lib/money";
import { ACCOUNT_TYPE_META } from "@/lib/constants/accounts";
import { cn } from "@/lib/utils";
import type { Account } from "@/types";

interface Props {
  account: Account;
  onEdit: (a: Account) => void;
  onTransfer: (a: Account) => void;
  onArchive: (a: Account) => void;
  onDelete: (a: Account) => void;
}

export function AccountCard({ account, onEdit, onTransfer, onArchive, onDelete }: Props) {
  const meta = ACCOUNT_TYPE_META[account.type];
  const Icon = meta.icon;
  const isCredit = account.type === "credit";

  return (
    <Card className="relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-1"
        style={{ background: account.color }}
      />
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: `${account.color}1a`, color: account.color }}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium leading-tight">{account.name}</p>
              <p className="text-xs text-muted-foreground">
                {meta.label}
                {account.bank_name ? ` · ${account.bank_name}` : ""}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(account)}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onTransfer(account)}>
                <ArrowLeftRight className="mr-2 h-4 w-4" /> Transfer
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onArchive(account)}>
                <Archive className="mr-2 h-4 w-4" /> Archive
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(account)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <p
          className={cn(
            "mt-4 text-2xl font-semibold tabular-nums",
            isCredit && account.balance < 0 && "text-rose-600"
          )}
        >
          {formatMoney(account.balance, account.currency_code)}
        </p>
      </CardContent>
    </Card>
  );
}
