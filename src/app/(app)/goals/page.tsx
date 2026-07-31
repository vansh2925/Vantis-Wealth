import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = { title: "Savings Goals" };

export default function GoalsPage() {
  return <PlaceholderPage title="Savings Goals" phase="Phase 4" />;
}
