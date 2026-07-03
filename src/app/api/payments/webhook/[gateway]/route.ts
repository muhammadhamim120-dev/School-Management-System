import { NextRequest } from "next/server";
import { ok, handleError, fail } from "@/lib/api";
import { getPaymentGateway, isGatewayId } from "@/services/payments";
import { settlePayment, logTransaction } from "@/lib/payment-settle";
import { notifyPaymentSuccess } from "@/lib/payment-notify";

// Public endpoint hit by the payment provider. Authenticity is enforced by
// HMAC signature verification inside the provider — NOT by session auth.
export async function POST(req: NextRequest, { params }: { params: Promise<{ gateway: string }> }) {
  try {
    const { gateway } = await params;
    const gid = gateway.toUpperCase();
    if (!isGatewayId(gid)) return fail("Unknown gateway", 404);

    const rawBody = await req.text();
    const headers: Record<string, string> = {};
    req.headers.forEach((v, k) => { headers[k.toLowerCase()] = v; });

    const provider = getPaymentGateway(gid);
    const parsed = await provider.parseWebhook(headers, rawBody);

    if (!parsed.ok) {
      await logTransaction({ gateway: gid, event: "WEBHOOK", status: "FAILED", message: parsed.error });
      return fail(parsed.error, 400);
    }

    if (parsed.status === "SUCCESS" && parsed.invoiceId && parsed.amount) {
      const payment = await settlePayment({
        invoiceId: parsed.invoiceId, amount: parsed.amount,
        gateway: gid, gatewayRef: parsed.gatewayRef, event: "WEBHOOK",
      });
      const origin = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
      notifyPaymentSuccess(payment.id, origin).catch(() => {}); // non-blocking
    } else {
      await logTransaction({
        invoiceId: parsed.invoiceId, gateway: gid, gatewayRef: parsed.gatewayRef,
        event: "WEBHOOK", status: parsed.status === "SUCCESS" ? "SUCCESS" : parsed.status === "FAILED" ? "FAILED" : "PENDING",
        amount: parsed.amount, message: "Webhook received.",
      });
    }
    return ok({ received: true });
  } catch (e) { return handleError(e); }
}
