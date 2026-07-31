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
import { categorySchema, type CategoryValues } from "@/lib/validations/finance";
import { CATEGORY_ICONS, CATEGORY_COLORS } from "@/lib/constants/categories";
import { useCategories } from "@/hooks/use-categories";
import { ColorPicker } from "@/components/common/color-picker";
import type { Category } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: Category | null;
  /** Default type when adding (e.g. from an inline "+ Expense"). */
  defaultType?: "income" | "expense";
}

export function CategoryFormDialog({ open, onOpenChange, editing, defaultType = "expense" }: Props) {
  const { createCategory, updateCategory } = useCategories();
  const [pending, setPending] = useState(false);

  const form = useForm<CategoryValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { type: "expense", name: "", icon: "circle-plus", color: "#10b981", parentId: null },
  });

  const type = form.watch("type");

  useEffect(() => {
    if (!open) return;
    if (editing) {
      form.reset({
        type: editing.type,
        name: editing.name,
        icon: editing.icon,
        color: editing.color,
        parentId: editing.parent_id,
      });
    } else {
      form.reset({
        type: defaultType,
        name: "",
        icon: "circle-plus",
        color: type === "expense" ? "#10b981" : "#3b82f6",
        parentId: null,
      });
    }
  }, [open, editing, form, defaultType]);

  async function onSubmit(values: CategoryValues) {
    setPending(true);
    try {
      if (editing) {
        await updateCategory.mutateAsync({ id: editing.id, values });
        toast.success("Category updated.");
      } else {
        await createCategory.mutateAsync(values);
        toast.success("Category created.");
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
          <DialogTitle>{editing ? "Edit category" : "New category"}</DialogTitle>
          <DialogDescription>Give it a name, icon and colour.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Type */}
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
            {(
              [
                { value: "expense", label: "Expense", icon: TrendingDown },
                { value: "income", label: "Income", icon: TrendingUp },
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
                  <Icon className={cn("h-4 w-4", tab.value === "expense" ? "text-rose-500" : "text-emerald-500")} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="e.g. Dining out" {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="grid grid-cols-8 gap-1">
              {CATEGORY_ICONS.map(({ key, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => form.setValue("icon", key)}
                  aria-label={`Icon ${key}`}
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
