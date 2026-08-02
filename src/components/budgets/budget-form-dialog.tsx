"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { budgetSchema, type BudgetValues } from "@/lib/validations/finance";
import { useBudgets } from "@/hooks/use-budgets";
import { useCategories } from "@/hooks/use-categories";
import { useAuth } from "@/contexts/auth-context";
import { categoryIcon } from "@/lib/constants/categories";
import { CurrencyPicker } from "@/components/common/currency-picker";
import type { BudgetWithSpent } from "@/hooks/use-budgets";

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: BudgetWithSpent | null;
}

export function BudgetFormDialog({ open, onOpenChange, editing }: Props) {
  const { profile } = useAuth();
  const { createBudget, updateBudget } = useBudgets(currentMonth());
  const { categories } = useCategories();
  const [pending, setPending] = useState(false);

  const expenseCategories = categories?.filter((c) => c.type === "expense") ?? [];

  const form = useForm<BudgetValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      month: currentMonth(),
      amount: 0,
      categoryId: null,
      currencyCode: profile?.currency_code ?? "INR",
    },
  });

  useEffect(() => {
    if (!open) return;
    if (editing) {
      form.reset({
        month: editing.month,
        amount: editing.amount,
        categoryId: editing.category_id,
        currencyCode: editing.currency_code,
      });
    } else {
      form.reset({
        month: currentMonth(),
        amount: 0,
        categoryId: null,
        currencyCode: profile?.currency_code ?? "INR",
      });
    }
  }, [open, editing, form, profile]);

  async function onSubmit(values: BudgetValues) {
    setPending(true);
    try {
      if (editing) {
        await updateBudget.mutateAsync({ id: editing.id, values });
        toast.success("Budget updated.");
      } else {
        await createBudget.mutateAsync(values);
        toast.success("Budget set.");
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
          <DialogTitle>{editing ? "Edit budget" : "Set a budget"}</DialogTitle>
          <DialogDescription>
            {editing?.category_id ? "Adjust this category's monthly limit." : "Set a monthly limit for a category or your whole month."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Scope</Label>
            <Select
              value={form.watch("categoryId") ?? "overall"}
              onValueChange={(v) =>
                form.setValue("categoryId", v === "overall" ? null : v, { shouldValidate: true })
              }
              disabled={!!editing?.category_id}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overall">Entire month (overall)</SelectItem>
                {expenseCategories.map((c) => {
                  const Icon = categoryIcon(c.icon);
                  return (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="flex items-center gap-2">
                        <Icon className="h-4 w-4" style={{ color: c.color }} />
                        {c.name}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label>Currency</Label>
            <CurrencyPicker
              value={form.watch("currencyCode")}
              onValueChange={(v) => form.setValue("currencyCode", v, { shouldValidate: true })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Monthly limit ({form.watch("currencyCode")})</Label>
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

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Save" : "Set budget"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
