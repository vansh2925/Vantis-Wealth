"use client";

import { Menu, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { NotificationBell } from "./notification-bell";

export function openQuickAdd() {
  window.dispatchEvent(new CustomEvent("open-quick-add"));
}

export function AppHeader({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6">
      {/* Mobile menu */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onMenuClick}
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="ml-auto flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={openQuickAdd} aria-label="Quick add">
          <Plus className="h-5 w-5" />
        </Button>
        <NotificationBell />
        <ThemeToggle />
      </div>
    </header>
  );
}
