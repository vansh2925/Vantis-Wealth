"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, TrendingDown, TrendingUp, ArrowLeftRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { transactionSchema, type TransactionValues } from "@/lib/validations/finance";
import { useTransactionMutations } from "@/hooks/use-transaction-mutations";
import { useAuth } from "@/contexts/auth-context";
import { AccountSelect } from "./account-select";
import { CategorySelect } from "./category-select";
import { CurrencyPicker } from "@/components/common/currency-picker";
import type { TransactionWithRelations } from "@/types";

interface Prefill {
  type?: TransactionValues["type"];
  accountId?: string;
}

interface TransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, the dialog edits this transaction; otherwise it adds. */
  editing?: TransactionWithRelations | null;
  /** Optional prefill for quick-add. */
  prefill?: Prefill;
}

const TYPE_TABS = [
  { value: "expense", label: "Expense", icon: TrendingDown, color: "text-rose-500" },
  { value: "income", label: "Income", icon: TrendingUp, color: "text-emerald-500" },
  { value: "transfer", label: "Transfer", icon: ArrowLeftRight, color: "text-blue-500" },
] as const;

export function TransactionDialog({
  open,
  onOpenChange,
  editing,
  prefill,
}: TransactionDialogProps) {
  const { profile } = useAuth();
  const currency = profile?.currency_code ?? "INR";
  const { createTransaction, updateTransaction } = useTransactionMutations();
  const [pending, setPending] = useState(false);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const form = useForm<TransactionValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: "expense",
      amount: 0,
      accountId: "",
      transferAccountId: null,
      categoryId: null,
      currencyCode: currency,
      date: today,
      merchant: "",
      note: "",
      status: "cleared",
    },
  });

  const { watch, setValue, reset, handleSubmit } = form;
  const type = watch("type");

  useEffect(() => {
    if (!open) return;
    if (editing) {
      reset({
        type: editing.type,
        amount: editing.amount,
        accountId: editing.account_id ?? "",
        transferAccountId: editing.transfer_account_id ?? null,
        categoryId: editing.category_id ?? null,
        currencyCode: editing.currency_code || currency,
        date: editing.date,
        merchant: editing.merchant ?? "",
        note: editing.note ?? "",
        status: editing.status,
      });
    } else {
      reset({
        type: prefill?.type ?? "expense",
        amount: 0,
        accountId: prefill?.accountId ?? "",
        transferAccountId: null,
        categoryId: null,
        currencyCode: currency,
        date: today,
        merchant: "",
        note: "",
        status: "cleared",
      });
    }
  }, [open, editing, prefill, reset, currency, today]);

  // When the type changes, clear transfer/category that don't apply.
  useEffect(() => {
    if (type === "transfer") setValue("categoryId", null);
    if (type !== "transfer") setValue("transferAccountId", null);
  }, [type, setValue]);

  async function onSubmit(values: TransactionValues) {
    setPending(true);
    try {
      if (editing) {
        await updateTransaction.mutateAsync({ id: editing.id, values });
        toast.success("Transaction updated.");
      } else {
        await createTransaction.mutateAsync(values);
        toast.success("Transaction added.");
      }
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit transaction" : "Add transaction"}</DialogTitle>
          <DialogDescription>Record money in or out.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Type switcher */}
          <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
            {TYPE_TABS.map((tab) => {
              const Icon = tab.icon;
              const active = type === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setValue("type", tab.value)}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium transition-colors",
                    active ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className={cn("h-4 w-4", tab.color)} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Currency */}
          <div className="flex items-center justify-between">
            <Label>Currency</Label>
            <CurrencyPicker
              value={form.watch("currencyCode")}
              onValueChange={(v) => form.setValue("currencyCode", v, { shouldValidate: true })}
            />
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount ({form.watch("currencyCode")})</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              placeholder="0.00"
              {...form.register("amount", { valueAsNumber: true })}
            />
            {form.formState.errors.amount && (
              <p className="text-sm text-destructive">{form.formState.errors.amount.message}</p>
            )}
          </div>

          {/* Account */}
          <div className="space-y-2">
            <Label>{type === "transfer" ? "From account" : "Account"}</Label>
            <AccountSelect
              value={form.watch("accountId")}
              onValueChange={(v) => setValue("accountId", v, { shouldValidate: true })}
            />
            {form.formState.errors.accountId && (
              <p className="text-sm text-destructive">{form.formState.errors.accountId.message}</p>
            )}
          </div>

          {/* Transfer destination */}
          {type === "transfer" && (
            <div className="space-y-2">
              <Label>To account</Label>
              <AccountSelect
                value={form.watch("transferAccountId")}
                excludeId={form.watch("accountId") || undefined}
                onValueChange={(v) => setValue("transferAccountId", v, { shouldValidate: true })}
                placeholder="Select destination"
              />
              {form.formState.errors.transferAccountId && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.transferAccountId.message}
                </p>
              )}
            </div>
          )}

          {/* Category */}
          {type !== "transfer" && (
            <div className="space-y-2">
              <Label>Category</Label>
              <CategorySelect
                value={form.watch("categoryId")}
                type={type as "income" | "expense"}
                onValueChange={(v) => setValue("categoryId", v, { shouldValidate: true })}
              />
              {form.formState.errors.categoryId && (
                <p className="text-sm text-destructive">{form.formState.errors.categoryId.message}</p>
              )}
            </div>
          )}

          {/* Date + status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" {...form.register("date")} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.watch("status")}
                onValueChange={(v) => setValue("status", v as "cleared" | "pending")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cleared">Cleared</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Merchant */}
          <div className="space-y-2">
            <Label htmlFor="merchant">Merchant / payee</Label>
            <Input id="merchant" placeholder="e.g. Zomato" {...form.register("merchant")} />
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="note">Note</Label>
            <Textarea id="note" rows={2} placeholder="Optional note" {...form.register("note")} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Save changes" : "Add"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
