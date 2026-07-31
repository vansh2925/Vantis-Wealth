"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Download, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { TransactionFilters } from "@/components/transactions/transaction-filters";
import { TransactionTable } from "@/components/transactions/transaction-table";
import { TransactionDialog } from "@/components/transactions/transaction-dialog";
import { useTransactions } from "@/hooks/use-transactions";
import { useTransactionMutations } from "@/hooks/use-transaction-mutations";
import { useDebounce } from "@/hooks/use-debounce";
import { useAuth } from "@/contexts/auth-context";
import { DEFAULT_FILTERS, type TransactionFilters as TF } from "@/lib/validations/finance";
import type { TransactionWithRelations } from "@/types";
import { exportTransactionsCsv } from "@/lib/export";

const PAGE_SIZE = 15;

export default function TransactionsPage() {
  const { profile } = useAuth();
  const currency = profile?.currency_code ?? "INR";

  const [filters, setFilters] = useState<TF>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<"date" | "amount">("date");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TransactionWithRelations | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TransactionWithRelations | null>(null);

  const search = useDebounce(filters.search, 300);
  const { rows, count, isLoading, refetch } = useTransactions({
    filters: { ...filters, search },
    sort,
    dir,
    page,
    pageSize: PAGE_SIZE,
  });
  const { deleteTransaction, bulkDelete, duplicateTransaction } = useTransactionMutations();

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  const patchFilters = useCallback((patch: Partial<TF>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  }, []);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(
    (ids: string[]) => {
      setSelected((prev) => {
        const next = new Set(prev);
        if (ids.every((id) => next.has(id))) ids.forEach((id) => next.delete(id));
        else ids.forEach((id) => next.add(id));
        return next;
      });
    },
    []
  );

  const openAdd = useCallback(() => {
    setEditing(null);
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((txn: TransactionWithRelations) => {
    setEditing(txn);
    setDialogOpen(true);
  }, []);

  function handleDuplicate(txn: TransactionWithRelations) {
    void duplicateTransaction.mutateAsync({
      type: txn.type,
      amount: txn.amount,
      accountId: txn.account_id ?? "",
      transferAccountId: txn.transfer_account_id,
      categoryId: txn.category_id,
      currencyCode: txn.currency_code || currency,
      date: new Date().toISOString().slice(0, 10),
      merchant: txn.merchant ?? "",
      note: txn.note ?? "",
      status: txn.status,
    }).then(() => toast.success("Transaction duplicated.")).catch((e) =>
      toast.error(e instanceof Error ? e.message : "Duplicate failed.")
    );
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteTransaction.mutateAsync(deleteTarget.id);
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(deleteTarget.id);
        return next;
      });
      toast.success("Transaction deleted.");
      setDeleteTarget(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed.");
    }
  }

  async function handleBulkDelete() {
    const ids = [...selected];
    try {
      await bulkDelete.mutateAsync(ids);
      setSelected(new Set());
      toast.success(`Deleted ${ids.length} transaction${ids.length > 1 ? "s" : ""}.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Bulk delete failed.");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {count} record{count === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => exportTransactionsCsv(rows, currency)}
            disabled={rows.length === 0}
          >
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button onClick={openAdd}>
            <Plus className="mr-2 h-4 w-4" /> Add
          </Button>
        </div>
      </div>

      <TransactionFilters filters={filters} onChange={patchFilters} />

      {selected.size > 0 && (
        <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-2">
          <span className="text-sm text-muted-foreground">
            {selected.size} selected
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
              <RotateCcw className="mr-2 h-4 w-4" /> Clear
            </Button>
            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          </div>
        </div>
      )}

      <TransactionTable
        rows={rows}
        currency={currency}
        loading={isLoading}
        selected={selected}
        onToggle={toggle}
        onToggleAll={toggleAll}
        onEdit={openEdit}
        onDelete={setDeleteTarget}
        onDuplicate={handleDuplicate}
      />

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="mr-1 h-4 w-4" /> Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Add / edit dialog */}
      <TransactionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the record and adjust your account
              balance. This action cannot be undone.
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
