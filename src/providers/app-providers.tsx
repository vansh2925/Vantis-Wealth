"use client";

import type { ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/auth-context";
import { ThemeProvider } from "@/contexts/theme-context";
import { DisplayCurrencyProvider } from "@/contexts/display-currency-context";
import { QueryProvider } from "./query-provider";

/**
 * Composes every client-side provider in dependency order.
 * Theme outermost, then auth/query (both need nothing), then UI providers.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <AuthProvider>
          <DisplayCurrencyProvider>
            <TooltipProvider delayDuration={150}>
              {children}
              <Toaster richColors position="top-right" />
            </TooltipProvider>
          </DisplayCurrencyProvider>
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
