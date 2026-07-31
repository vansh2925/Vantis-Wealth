"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { recurringSchema, type RecurringValues } from "@/lib/validations/finance";
import { useRecurring } from "@/hooks/use-recurring";
import { useAuth } from "@/contexts/auth-context";
import { AccountSelect } from "@/components/transactions/account-select";
import { CategorySelect } from "@/components/transactions/category-select";
import type { RecurringTransaction } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: RecurringTransaction | null;
}

export function RecurringFormDialog({ open, onOpenChange, editing }: Props) {
  const { profile } = useAuth();
  const { createRecurring, updateRecurring } = useRecurring();
  const [pending, setPending] = useState(false);

  const form = useForm<RecurringValues>({
    resolver: zodResolver(recurringSchema),
    defaultValues: {
      type: "expense",
      amount: 0,
      accountId: "",
      categoryId: null,
      currencyCode: profile?.currency_code ?? "INR",
      merchant: "",
      note: "",
      frequency: "monthly",
      intervalEvery: 1,
      startDate: new Date().toISOString().slice(0, 10),
      endDate: null,
    },
  });

  const type = form.watch("type");

  useEffect(() => {
    if (!open) return;
    if (editing) {
      form.reset({
        type: editing.type,
        amount: editing.amount,
        accountId: editing.account_id ?? "",
        categoryId: editing.category_id ?? null,
        currencyCode: editing.currency_code,
        merchant: editing.merchant ?? "",
        note: editing.note ?? "",
        frequency: editing.frequency,
        intervalEvery: editing.interval_every,
        startDate: editing.start_date,
        endDate: editing.end_date,
      });
    } else {
      form.reset({
        type: "expense",
        amount: 0,
        accountId: "",
        categoryId: null,
        currencyCode: profile?.currency_code ?? "INR",
        merchant: "",
        note: "",
        frequency: "monthly",
        intervalEvery: 1,
        startDate: new Date().toISOString().slice(0, 10),
        endDate: null,
      });
    }
  }, [open, editing, form, profile]);

  async function onSubmit(values: RecurringValues) {
    setPending(true);
    try {
      if (editing) {
        await updateRecurring.mutateAsync({ id: editing.id, values });
        toast.success("Recurring updated.");
      } else {
        await createRecurring.mutateAsync(values);
        toast.success("Recurring transaction created.");
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
          <DialogTitle>{editing ? "Edit recurring" : "New recurring transaction"}</DialogTitle>
          <DialogDescription>Automate rent, subscriptions, salary and more.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Type */}
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
            {(
              [
                { value: "expense", label: "Expense", icon: TrendingDown, c: "text-rose-500" },
                { value: "income", label: "Income", icon: TrendingUp, c: "text-emerald-500" },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const active = type === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => form.setValue("type", tab.value)}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium transition-colors",
                    active ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className={cn("h-4 w-4", tab.c)} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" type="number" step="0.01" min="0" inputMode="decimal" placeholder="0.00" {...form.register("amount", { valueAsNumber: true })} />
              {form.formState.errors.amount && (
                <p className="text-sm text-destructive">{form.formState.errors.amount.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Select value={form.watch("frequency")} onValueChange={(v) => form.setValue("frequency", v as RecurringValues["frequency"])}>
                <SelectTrigger id="frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Account</Label>
            <AccountSelect
              value={form.watch("accountId")}
              onValueChange={(v) => form.setValue("accountId", v, { shouldValidate: true })}
            />
            {form.formState.errors.accountId && (
              <p className="text-sm text-destructive">{form.formState.errors.accountId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <CategorySelect
              value={form.watch("categoryId")}
              type={type as "income" | "expense"}
              onValueChange={(v) => form.setValue("categoryId", v)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="intervalEvery">Every (n)</Label>
              <Input id="intervalEvery" type="number" min="1" step="1" {...form.register("intervalEvery", { valueAsNumber: true })} />
              {form.formState.errors.intervalEvery && (
                <p className="text-sm text-destructive">{form.formState.errors.intervalEvery.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Start date</Label>
              <Input id="startDate" type="date" {...form.register("startDate")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="merchant">Merchant / payee</Label>
            <Input id="merchant" placeholder="e.g. Netflix" {...form.register("merchant")} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Save" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
