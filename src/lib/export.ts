import type { TransactionWithRelations } from "@/types";
import { formatMoney } from "./money";

/** Escape a field for CSV, quoting when it contains separators/quotes/newlines. */
function csvField(value: unknown): string {
  const s = value == null ? "" : String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toCsv(header: string[], rows: (string | number)[][]): string {
  const lines = [header, ...rows].map((row) => row.map(csvField).join(","));
  return lines.join("\r\n");
}

/**
 * Download a string as a file (CSV, JSON, etc.) in the browser.
 */
export function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Export the current transaction rows to a CSV file. */
export function exportTransactionsCsv(
  rows: TransactionWithRelations[],
  currency: string
) {
  const header = [
    "Date",
    "Type",
    "Amount",
    "Merchant",
    "Note",
    "Category",
    "Account",
    "Status",
  ];
  const body = rows.map((t) => [
    t.date,
    t.type,
    t.type === "expense" ? -t.amount : t.amount,
    t.merchant ?? "",
    t.note ?? "",
    t.category?.name ?? "",
    t.account?.name ?? "",
    t.status,
  ]);
  downloadFile(
    `transactions-${new Date().toISOString().slice(0, 10)}.csv`,
    toCsv(header, body),
    "text/csv;charset=utf-8"
  );
}

export function formatCsvAmount(rows: TransactionWithRelations[], currency: string) {
  // Helper kept for future Excel/PDF exports that need formatted values.
  return rows.map((t) => formatMoney(t.amount, currency));
}
