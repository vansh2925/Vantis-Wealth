import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createServerClientInstance } from "@/lib/supabase/server";

/**
 * Returns the currently authenticated user, or null.
 * Use in Server Components / Server Actions where redirect is not desired.
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createServerClientInstance();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Requires an authenticated user; otherwise redirects to /login.
 * Use at the top of protected Server Components.
 */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}
