"use client";

import { MoreHorizontal, Pencil, Copy, Trash2, ArrowLeftRight, TrendingUp, TrendingDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/money";
import { categoryIcon } from "@/lib/constants/categories";
import type { TransactionWithRelations } from "@/types";

interface Props {
  rows: TransactionWithRelations[];
  currency: string;
  loading: boolean;
  selected: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: (ids: string[]) => void;
  onEdit: (txn: TransactionWithRelations) => void;
  onDelete: (txn: TransactionWithRelations) => void;
  onDuplicate: (txn: TransactionWithRelations) => void;
}

function TypeIcon({ type }: { type: string }) {
  if (type === "income") return <TrendingUp className="h-4 w-4 text-emerald-500" />;
  if (type === "expense") return <TrendingDown className="h-4 w-4 text-rose-500" />;
  return <ArrowLeftRight className="h-4 w-4 text-blue-500" />;
}

export function TransactionTable({
  rows,
  currency,
  loading,
  selected,
  onToggle,
  onToggleAll,
  onEdit,
  onDelete,
  onDuplicate,
}: Props) {
  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                checked={allSelected}
                onCheckedChange={() => onToggleAll(rows.map((r) => r.id))}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Merchant</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Account</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell colSpan={8}>
                  <Skeleton className="h-8 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center text-sm text-muted-foreground">
                No transactions found.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((txn) => {
              const CatIcon = txn.category ? categoryIcon(txn.category.icon) : null;
              return (
                <TableRow
                  key={txn.id}
                  className={cn(selected.has(txn.id) && "bg-muted/40")}
                >
                  <TableCell>
                    <Checkbox
                      checked={selected.has(txn.id)}
                      onCheckedChange={() => onToggle(txn.id)}
                      aria-label="Select row"
                    />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {txn.date}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <TypeIcon type={txn.type} />
                      <span className="font-medium">{txn.merchant || "—"}</span>
                    </div>
                    {txn.note && (
                      <p className="text-xs text-muted-foreground">{txn.note}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    {txn.category ? (
                      <span className="flex items-center gap-1.5 text-sm">
                        {CatIcon && (
                          <CatIcon className="h-4 w-4" style={{ color: txn.category.color }} />
                        )}
                        {txn.category.name}
                      </span>
                    ) : txn.type === "transfer" ? (
                      <span className="text-xs text-muted-foreground">
                        {txn.account?.name} → {txn.transfer_account?.name}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {txn.type === "transfer"
                      ? txn.account?.name
                      : (txn.account?.name ?? "—")}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "whitespace-nowrap text-right font-semibold tabular-nums",
                      txn.type === "income" && "text-emerald-600",
                      txn.type === "expense" && "text-rose-600",
                      txn.type === "transfer" && "text-blue-600"
                    )}
                  >
                    {txn.type === "expense" ? "-" : "+"}
                    {formatMoney(txn.amount, txn.currency_code || currency)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={txn.status === "cleared" ? "secondary" : "outline"}>
                      {txn.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(txn)}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDuplicate(txn)}>
                          <Copy className="mr-2 h-4 w-4" /> Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDelete(txn)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
