import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";

/**
 * Protected application shell. `requireUser()` enforces authentication on the
 * server (defense-in-depth beyond the proxy redirect), then renders the
 * full app chrome around the page content.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  await requireUser();

  return <AppShell>{children}</AppShell>;
}
