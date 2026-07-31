import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Service-role admin client.
 *
 * BYPASSES Row Level Security — use ONLY in server contexts where the caller
 * is fully trusted (cron jobs, edge functions, admin route handlers).
 * NEVER import this into a Client Component; the service role key must stay
 * server-side (it has full read/write across all rows in the project).
 *
 * Guarded behind NEXT_SERVER_ONLY_USE_ADMIN so an accidental client import
 * fails loudly at build time rather than leaking the key.
 */
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

export function getServiceSupabase() {
  if (typeof window !== "undefined") {
    throw new Error(
      "getServiceSupabase() must only be called from the server. The service role key must never be exposed to the browser."
    );
  }
  if (!url || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL.");
  }
  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Convenience named export used by Route Handlers / Server Actions.
export const adminSupabase = getServiceSupabase;
