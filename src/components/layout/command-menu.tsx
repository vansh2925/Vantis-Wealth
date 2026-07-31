"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command as CommandPrimitive } from "cmdk";
import { CornerDownLeft } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { NAV_ITEMS_FLAT } from "@/lib/constants/navigation";
import { useHotkey } from "@/hooks/use-hotkey";

/**
 * Global command palette. Opens via Ctrl/Cmd+K or the header search button.
 * Currently navigates to pages; transaction/quick actions are added in later
 * phases.
 */
export function CommandMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useHotkey("k", () => setOpen((o) => !o), { enabled: true });

  useEffect(() => {
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener("open-command", onOpen);
    return () => window.removeEventListener("open-command", onOpen);
  }, []);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandPrimitive.Input placeholder="Type a command or search…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {NAV_ITEMS_FLAT.length > 0 && (
          <>
            <CommandGroup heading="Navigate">
              {NAV_ITEMS_FLAT.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={item.href}
                    value={item.title}
                    onSelect={() => go(item.href)}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {item.title}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}
        <CommandGroup heading="Shortcuts">
          <CommandItem value="new-transaction" onSelect={() => go("/transactions")}>
            <CornerDownLeft className="mr-2 h-4 w-4" />
            Quick add transaction
            <span className="ml-auto text-xs text-muted-foreground">Q</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
