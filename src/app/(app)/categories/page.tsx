"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CategoryFormDialog } from "@/components/categories/category-form-dialog";
import { useCategories } from "@/hooks/use-categories";
import { categoryIcon } from "@/lib/constants/categories";
import type { Category } from "@/types";

function CategoryRow({
  category,
  onEdit,
  onDelete,
}: {
  category: Category;
  onEdit: (c: Category) => void;
  onDelete: (c: Category) => void;
}) {
  const Icon = categoryIcon(category.icon);
  const isShared = category.user_id === null;

  return (
    <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
      <span className="flex items-center gap-2.5 text-sm">
        <Icon className="h-4 w-4" style={{ color: category.color }} />
        <span className="h-2 w-2 rounded-full" style={{ background: category.color }} />
        {category.name}
        {isShared && (
          <Lock className="h-3 w-3 text-muted-foreground/60" aria-label="Default category" />
        )}
      </span>
      {!isShared && (
        <span className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(category)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => onDelete(category)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </span>
      )}
    </div>
  );
}

export default function CategoriesPage() {
  const { categories, isLoading, deleteCategory } = useCategories();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [defaultType, setDefaultType] = useState<"income" | "expense">("expense");
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const openAdd = (type: "income" | "expense") => {
    setDefaultType(type);
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (c: Category) => {
    setEditing(c);
    setDialogOpen(true);
  };

  function handleDelete() {
    if (!deleteTarget) return;
    void deleteCategory
      .mutateAsync(deleteTarget.id)
      .then(() => {
        toast.success("Category deleted.");
        setDeleteTarget(null);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Delete failed."));
  }

  const expense = categories?.filter((c) => c.type === "expense") ?? [];
  const income = categories?.filter((c) => c.type === "income") ?? [];

  const Section = ({ title, list }: { title: string; list: Category[] }) => (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{title}</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => openAdd(title === "Expense" ? "expense" : "income")}>
          <Plus className="mr-1 h-4 w-4" /> Add
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {list.map((c) => (
          <CategoryRow
            key={c.id}
            category={c}
            onEdit={openEdit}
            onDelete={setDeleteTarget}
          />
        ))}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Default categories are locked; custom ones can be edited.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-40" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Section title="Expense" list={expense} />
          <Section title="Income" list={income} />
        </div>
      )}

      <CategoryFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        defaultType={defaultType}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this category?</AlertDialogTitle>
            <AlertDialogDescription>
              Past transactions will keep their category history, but the
              category itself will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
