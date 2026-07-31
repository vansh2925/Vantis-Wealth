"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { AccountCard } from "@/components/accounts/account-card";
import { AccountFormDialog } from "@/components/accounts/account-form-dialog";
import { TransactionDialog } from "@/components/transactions/transaction-dialog";
import { useAccounts } from "@/hooks/use-accounts";
import type { Account } from "@/types";

export default function AccountsPage() {
  const { accounts, isLoading, createAccount, updateAccount, archiveAccount, deleteAccount } =
    useAccounts();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [transferFrom, setTransferFrom] = useState<Account | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);

  const openAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (a: Account) => {
    setEditing(a);
    setDialogOpen(true);
  };

  function handleArchive(a: Account) {
    void archiveAccount
      .mutateAsync(a.id)
      .then(() => toast.success("Account archived."))
      .catch((e) => toast.error(e instanceof Error ? e.message : "Archive failed."));
  }

  function handleDelete() {
    if (!deleteTarget) return;
    void deleteAccount
      .mutateAsync(deleteTarget.id)
      .then(() => {
        toast.success("Account deleted.");
        setDeleteTarget(null);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Delete failed."));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Accounts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {accounts?.length ?? 0} active account{accounts?.length === 1 ? "" : "s"}
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" /> Add account
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      ) : accounts?.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">
          No accounts yet. Add your first account to start tracking.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts?.map((a) => (
            <AccountCard
              key={a.id}
              account={a}
              onEdit={openEdit}
              onTransfer={setTransferFrom}
              onArchive={handleArchive}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      <AccountFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
      />

      {/* Transfer = a transaction of type transfer prefilled from this account */}
      <TransactionDialog
        open={!!transferFrom}
        onOpenChange={(o) => !o && setTransferFrom(null)}
        prefill={transferFrom ? { type: "transfer", accountId: transferFrom.id } : undefined}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this account?</AlertDialogTitle>
            <AlertDialogDescription>
              Transactions on this account will keep their history, but the
              account itself will be removed. This cannot be undone.
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
