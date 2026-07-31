"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wallet, X } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { NAV_SECTIONS } from "@/lib/constants/navigation";
import { APP_NAME } from "@/lib/constants/app";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarFooter } from "./sidebar-footer";

export function MobileNav({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="flex w-72 flex-col p-0">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <div className="flex h-16 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Wallet className="h-5 w-5" />
            </div>
            <span className="text-base font-semibold tracking-tight">{APP_NAME}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} aria-label="Close menu">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <nav className="flex flex-col gap-5 p-3">
            {NAV_SECTIONS.map((section) => (
              <div key={section.label} className="space-y-1">
                <p className="px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                  {section.label}
                </p>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active =
                    item.href === "/dashboard"
                      ? pathname === item.href
                      : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => onOpenChange(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon className="h-[18px] w-[18px]" />
                      {item.title}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </ScrollArea>

        <SidebarFooter collapsed={false} />
      </SheetContent>
    </Sheet>
  );
}
