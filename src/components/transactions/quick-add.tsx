"use client";

import { useEffect, useState } from "react";
import { TransactionDialog } from "./transaction-dialog";

/**
 * Opens the add-transaction dialog, either directly or via the global
 * "open-quick-add" event dispatched from the header / command palette.
 */
export function QuickAdd() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener("open-quick-add", onOpen);
    return () => window.removeEventListener("open-quick-add", onOpen);
  }, []);

  return <TransactionDialog open={open} onOpenChange={setOpen} />;
}
