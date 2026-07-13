import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { fail } from "@/lib/api";
import { withTenantContext } from "@/lib/api-helpers";

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
const money = (n: number) => `\u09F3${(n ?? 0).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Returns a self-contained, printable HTML receipt.
export const GET = withTenantContext(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: { invoice: { include: { student: { include: { class: true } } } } },
    });
    if (!payment) return fail("Payment not found", 404);

    const inv = payment.invoice;
    const student = inv?.student;
    const net = payment.amount - (payment.refundedAmount ?? 0);
    const rows: [string, string][] = [
      ["Receipt No.", payment.id.slice(-10).toUpperCase()],
      ["Date", new Date(payment.receivedAt).toLocaleString("en-BD")],
      ["Invoice", inv?.invoiceNo ?? "\u2014"],
      ["Student", student?.fullName ?? "\u2014"],
      ["Class", student?.class?.name ?? "\u2014"],
      ["Method", payment.method],
      ["Gateway Ref", payment.gatewayRef ?? "\u2014"],
      ["Status", payment.status],
    ];

    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Receipt ${esc(payment.id.slice(-8))}</title>
<style>
  *{box-sizing:border-box} body{font-family:system-ui,Segoe UI,Arial,sans-serif;color:#1a1a1a;max-width:640px;margin:32px auto;padding:0 24px}
  .head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #0f766e;padding-bottom:16px}
  .brand{font-size:22px;font-weight:800;color:#0f766e} .sub{color:#666;font-size:13px;margin-top:2px}
  .tag{background:#0f766e;color:#fff;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:600}
  table{width:100%;border-collapse:collapse;margin-top:24px} td{padding:9px 4px;border-bottom:1px solid #eee;font-size:14px}
  td:first-child{color:#666;width:40%} td:last-child{font-weight:600;text-align:right}
  .total{margin-top:24px;background:#f0fdfa;border:1px solid #99f6e4;border-radius:10px;padding:16px 20px;display:flex;justify-content:space-between;align-items:center}
  .total .lbl{color:#0f766e;font-weight:600} .total .amt{font-size:26px;font-weight:800;color:#0f766e}
  .refund{color:#b91c1c;font-size:13px;margin-top:6px;text-align:right}
  .foot{margin-top:32px;color:#999;font-size:12px;text-align:center;border-top:1px solid #eee;padding-top:16px}
  @media print{body{margin:0}.noprint{display:none}}
  .btn{display:inline-block;margin-top:20px;background:#0f766e;color:#fff;border:none;padding:10px 20px;border-radius:8px;font-size:14px;cursor:pointer}
</style></head><body>
  <div class="head">
    <div><div class="brand">Greenwood International School</div><div class="sub">Payment Receipt</div></div>
    <div class="tag">${esc(payment.status)}</div>
  </div>
  <table>${rows.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join("")}</table>
  <div class="total"><span class="lbl">Amount Paid</span><span class="amt">${money(payment.amount)}</span></div>
  ${(payment.refundedAmount ?? 0) > 0 ? `<div class="refund">Refunded: ${money(payment.refundedAmount)} \u00B7 Net: ${money(net)}</div>` : ""}
  <div class="foot">This is a computer-generated receipt. Generated ${new Date().toLocaleString("en-BD")}.</div>
  <div class="noprint" style="text-align:center"><button class="btn" onclick="window.print()">Print / Save as PDF</button></div>
</body></html>`;

    return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Content-Disposition": `inline; filename="receipt-${payment.id.slice(-8)}.html"` } });
  } catch {
    return fail("Failed to generate receipt", 500);
  }
});
