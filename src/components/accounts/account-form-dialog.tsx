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
import { accountSchema, type AccountValues } from "@/lib/validations/finance";
import { ACCOUNT_TYPE_META, ACCOUNT_TYPES } from "@/lib/constants/accounts";
import { CATEGORY_COLORS } from "@/lib/constants/categories";
import { useAccounts } from "@/hooks/use-accounts";
import { useAuth } from "@/contexts/auth-context";
import { ColorPicker } from "@/components/common/color-picker";
import type { Account } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: Account | null;
}

export function AccountFormDialog({ open, onOpenChange, editing }: Props) {
  const { profile } = useAuth();
  const { createAccount, updateAccount } = useAccounts();
  const [pending, setPending] = useState(false);

  const form = useForm<AccountValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: "",
      type: "checking",
      balance: 0,
      currencyCode: profile?.currency_code ?? "INR",
      bankName: "",
      color: "#3b82f6",
      isArchived: false,
    },
  });

  useEffect(() => {
    if (!open) return;
    if (editing) {
      form.reset({
        name: editing.name,
        type: editing.type,
        balance: editing.balance,
        currencyCode: editing.currency_code,
        bankName: editing.bank_name ?? "",
        color: editing.color,
        isArchived: editing.is_archived,
      });
    } else {
      form.reset({
        name: "",
        type: "checking",
        balance: 0,
        currencyCode: profile?.currency_code ?? "INR",
        bankName: "",
        color: "#3b82f6",
        isArchived: false,
      });
    }
  }, [open, editing, form, profile]);

  async function onSubmit(values: AccountValues) {
    setPending(true);
    try {
      if (editing) {
        await updateAccount.mutateAsync({ id: editing.id, values });
        toast.success("Account updated.");
      } else {
        await createAccount.mutateAsync(values);
        toast.success("Account created.");
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
          <DialogTitle>{editing ? "Edit account" : "New account"}</DialogTitle>
          <DialogDescription>Add a bank, cash, UPI or investment account.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="e.g. HDFC Savings" {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={form.watch("type")}
                onValueChange={(v) => form.setValue("type", v as AccountValues["type"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {ACCOUNT_TYPE_META[t].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="balance">Balance</Label>
              <Input
                id="balance"
                type="number"
                step="0.01"
                inputMode="decimal"
                placeholder="0.00"
                {...form.register("balance", { valueAsNumber: true })}
              />
              {form.formState.errors.balance && (
                <p className="text-sm text-destructive">{form.formState.errors.balance.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bankName">Bank / institution</Label>
            <Input id="bankName" placeholder="Optional" {...form.register("bankName")} />
          </div>

          <div className="space-y-2">
            <Label>Colour</Label>
            <ColorPicker
              value={form.watch("color")}
              onValueChange={(c) => form.setValue("color", c)}
              colors={CATEGORY_COLORS}
            />
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
