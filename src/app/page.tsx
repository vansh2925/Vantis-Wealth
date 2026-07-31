import { redirect } from "next/navigation";

/**
 * Root route redirects straight into the app. A marketing/landing page can be
 * added later if needed.
 */
export default function Home() {
  redirect("/dashboard");
}
