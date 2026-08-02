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
import { cn } from "@/lib/utils";
import { goalSchema, type GoalValues } from "@/lib/validations/finance";
import { useGoals } from "@/hooks/use-goals";
import { useAuth } from "@/contexts/auth-context";
import { ColorPicker } from "@/components/common/color-picker";
import { CurrencyPicker } from "@/components/common/currency-picker";
import { CATEGORY_ICONS, CATEGORY_COLORS } from "@/lib/constants/categories";
import type { SavingsGoal } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: SavingsGoal | null;
}

export function GoalFormDialog({ open, onOpenChange, editing }: Props) {
  const { profile } = useAuth();
  const { createGoal, updateGoal } = useGoals();
  const [pending, setPending] = useState(false);

  const form = useForm<GoalValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: "",
      targetAmount: 0,
      currentAmount: 0,
      currencyCode: profile?.currency_code ?? "INR",
      targetDate: null,
      icon: "piggy-bank",
      color: "#10b981",
      isArchived: false,
    },
  });

  useEffect(() => {
    if (!open) return;
    if (editing) {
      form.reset({
        name: editing.name,
        targetAmount: editing.target_amount,
        currentAmount: editing.current_amount,
        currencyCode: editing.currency_code,
        targetDate: editing.target_date,
        icon: editing.icon,
        color: editing.color,
        isArchived: editing.is_archived,
      });
    } else {
      form.reset({
        name: "",
        targetAmount: 0,
        currentAmount: 0,
        currencyCode: profile?.currency_code ?? "INR",
        targetDate: null,
        icon: "piggy-bank",
        color: "#10b981",
        isArchived: false,
      });
    }
  }, [open, editing, form, profile]);

  async function onSubmit(values: GoalValues) {
    setPending(true);
    try {
      if (editing) {
        await updateGoal.mutateAsync({ id: editing.id, values });
        toast.success("Goal updated.");
      } else {
        await createGoal.mutateAsync(values);
        toast.success("Goal created.");
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
          <DialogTitle>{editing ? "Edit goal" : "New savings goal"}</DialogTitle>
          <DialogDescription>Save toward something specific.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Goal name</Label>
            <Input id="name" placeholder="e.g. Emergency fund" {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Label>Currency</Label>
            <CurrencyPicker
              value={form.watch("currencyCode")}
              onValueChange={(v) => form.setValue("currencyCode", v, { shouldValidate: true })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="target">Target amount ({form.watch("currencyCode")})</Label>
              <Input id="target" type="number" step="0.01" inputMode="decimal" placeholder="0.00" {...form.register("targetAmount", { valueAsNumber: true })} />
              {form.formState.errors.targetAmount && (
                <p className="text-sm text-destructive">{form.formState.errors.targetAmount.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="current">Saved so far ({form.watch("currencyCode")})</Label>
              <Input id="current" type="number" step="0.01" inputMode="decimal" placeholder="0.00" {...form.register("currentAmount", { valueAsNumber: true })} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetDate">Target date (optional)</Label>
            <Input id="targetDate" type="date" {...form.register("targetDate")} />
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="grid grid-cols-8 gap-1">
              {CATEGORY_ICONS.map(({ key, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => form.setValue("icon", key)}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                    form.watch("icon") === key
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Colour</Label>
            <ColorPicker value={form.watch("color")} onValueChange={(c) => form.setValue("color", c)} colors={CATEGORY_COLORS} />
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
