"use client";

import { useState, type ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";
import { AppHeader } from "./app-header";
import { CommandMenu } from "./command-menu";
import { PageTransition } from "./page-transition";
import { QuickAdd } from "@/components/transactions/quick-add";

/**
 * The application chrome: collapsible desktop sidebar, mobile sheet nav,
 * sticky header, global command palette, and animated page content.
 * Client-side so it can manage UI state; authentication is enforced by the
 * parent server layout via requireUser().
 */
export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-svh">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <MobileNav open={mobileOpen} onOpenChange={setMobileOpen} />

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader onMenuClick={() => setMobileOpen(true)} />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>

      <CommandMenu />
      <QuickAdd />
    </div>
  );
}
