"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wallet, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_SECTIONS } from "@/lib/constants/navigation";
import { APP_NAME } from "@/lib/constants/app";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarFooter } from "./sidebar-footer";
import { CurrencyToggle } from "./currency-toggle";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === href;
  return pathname.startsWith(href);
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "hidden h-svh shrink-0 flex-col border-r bg-sidebar transition-[width] duration-200 ease-out md:flex",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Brand */}
      <div className={cn("flex h-16 items-center gap-2 border-b px-4", collapsed && "justify-center px-0")}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Wallet className="h-5 w-5" />
        </div>
        {!collapsed && (
          <span className="text-base font-semibold tracking-tight">{APP_NAME}</span>
        )}
      </div>

      <ScrollArea className="flex-1">
        <nav className={cn("flex flex-col gap-5 p-3", collapsed && "p-2")}>
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} className="space-y-1">
              {!collapsed && (
                <p className="px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                  {section.label}
                </p>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.title : undefined}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      collapsed && "justify-center px-0",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" />
                    {!collapsed && <span className="truncate">{item.title}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </ScrollArea>

      <div className="p-3">
        <CurrencyToggle collapsed={collapsed} />
      </div>

      <SidebarFooter collapsed={collapsed} />

      {/* Collapse toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="absolute bottom-3 right-3 h-7 w-7 rounded-full border bg-background text-muted-foreground hover:text-foreground"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
      </Button>
    </aside>
  );
}
