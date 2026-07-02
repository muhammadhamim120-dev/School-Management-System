// Pure finance calculations, shared by API routes and UI so totals are never
// computed two different ways (DRY).

export type LineItem = { amount: number; discount?: number };

export function computeInvoiceTotals(items: LineItem[]) {
  const subtotal = items.reduce((s, i) => s + (i.amount || 0), 0);
  const discountTotal = items.reduce((s, i) => s + (i.discount || 0), 0);
  const total = Math.max(0, subtotal - discountTotal);
  return { subtotal, discountTotal, total };
}

export type InvoiceStatusValue = "DRAFT" | "ISSUED" | "PARTIAL" | "PAID" | "OVERDUE" | "CANCELLED";

/**
 * Derive an invoice status from money + due date. Never downgrades a terminal
 * CANCELLED. PAID when fully covered; PARTIAL when some paid; OVERDUE when
 * unpaid past the due date; otherwise ISSUED.
 */
export function deriveInvoiceStatus(params: {
  total: number;
  paidTotal: number;
  dueDate: Date | string;
  current?: InvoiceStatusValue;
}): InvoiceStatusValue {
  if (params.current === "CANCELLED") return "CANCELLED";
  const due = new Date(params.dueDate);
  if (params.paidTotal >= params.total && params.total > 0) return "PAID";
  if (params.paidTotal > 0) return "PARTIAL";
  if (!Number.isNaN(due.getTime()) && due.getTime() < Date.now()) return "OVERDUE";
  return "ISSUED";
}

/** Apply a concession to a base amount. */
export function applyConcession(
  base: number,
  concession: { mode: "PERCENTAGE" | "FIXED"; value: number }
): number {
  if (concession.mode === "PERCENTAGE") {
    return Math.min(base, (base * concession.value) / 100);
  }
  return Math.min(base, concession.value);
}

/** Generate a human-friendly invoice number: INV-YYYY-###### */
export function nextInvoiceNo(seq: number, year = new Date().getFullYear()): string {
  return `INV-${year}-${String(seq).padStart(6, "0")}`;
}
