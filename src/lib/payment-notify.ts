import { prisma } from "@/lib/prisma";
import { getSmsProvider } from "@/services/sms";
import { sendEmail, emailConfigured } from "@/services/email";

const money = (n: number) => `Tk ${(n ?? 0).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Fire post-payment notifications (SMS + email) for a settled payment.
 * Best-effort: failures are logged as transactions but never block the payment.
 * Called after settlePayment().
 */
export async function notifyPaymentSuccess(paymentId: string, appOrigin: string) {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { invoice: { include: { student: { include: { parent: true } } } } },
    });
    if (!payment || !payment.invoice) return;
    const student = payment.invoice.student;
    const receiptUrl = `${appOrigin}/api/payments/${payment.id}/receipt`;
    const amount = money(payment.amount);
    const invNo = payment.invoice.invoiceNo;

    // SMS to student + parent phones
    const phones = [student?.phone, student?.parent?.phone].filter(Boolean) as string[];
    if (phones.length) {
      const provider = getSmsProvider();
      if (provider.isConfigured()) {
        const text = `Payment received: ${amount} for invoice ${invNo} (${student?.fullName}). Thank you. - Greenwood School`;
        try {
          const results = await provider.send(phones.map((to) => ({ to, text })));
          for (const r of results) {
            await prisma.paymentTransaction.create({ data: {
              paymentId: payment.id, invoiceId: payment.invoiceId, gateway: payment.gateway ?? null, gatewayRef: payment.gatewayRef,
              event: "MANUAL", status: r.ok ? "SUCCESS" : "FAILED", message: `SMS to ${r.to}: ${r.ok ? "sent" : r.error}`,
            } });
          }
        } catch { /* non-blocking */ }
      }
    }

    // Email to student/parent email
    const emails = [student?.email, student?.parent?.email].filter(Boolean) as string[];
    if (emails.length && emailConfigured()) {
      const html = `
        <div style="font-family:system-ui,Arial,sans-serif;max-width:520px;margin:0 auto">
          <h2 style="color:#0f766e">Payment Received</h2>
          <p>Dear guardian of <strong>${student?.fullName ?? ""}</strong>,</p>
          <p>We have received your payment of <strong>${amount}</strong> against invoice <strong>${invNo}</strong>.</p>
          <p>Method: ${payment.gateway ?? payment.method}<br/>Reference: ${payment.gatewayRef ?? "-"}</p>
          <p><a href="${receiptUrl}" style="background:#0f766e;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;display:inline-block">Download Receipt</a></p>
          <p style="color:#888;font-size:12px">Greenwood International School</p>
        </div>`;
      for (const to of emails) {
        const res = await sendEmail({ to, subject: `Payment received — ${invNo}`, html });
        await prisma.paymentTransaction.create({ data: {
          paymentId: payment.id, invoiceId: payment.invoiceId, gateway: payment.gateway ?? null, gatewayRef: payment.gatewayRef,
          event: "MANUAL", status: res.ok ? "SUCCESS" : "FAILED", message: `Email to ${to}: ${res.ok ? "sent" : res.error}`,
        } });
      }
    }
  } catch {
    // Never let notification failure affect payment settlement.
  }
}
