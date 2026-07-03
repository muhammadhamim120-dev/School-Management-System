import { NextRequest, NextResponse } from "next/server";
import { getPaymentGateway, isGatewayId } from "@/services/payments";
import { settlePayment, logTransaction } from "@/lib/payment-settle";
import { notifyPaymentSuccess } from "@/lib/payment-notify";

// Payer's browser is redirected here after checkout. We verify server-side,
// settle if successful, then redirect to a human-facing result page.
async function handle(req: NextRequest, gatewayParam: string) {
  const gid = gatewayParam.toUpperCase();
  const origin = req.nextUrl.origin;
  if (!isGatewayId(gid)) return NextResponse.redirect(`${origin}/dashboard/payments?status=error`);

  const sp = req.nextUrl.searchParams;
  const gatewayRef = sp.get("gatewayRef") || sp.get("paymentID") || sp.get("tran_id") || sp.get("val_id") || "";
  const invoiceId = sp.get("invoiceId") || "";
  if (!gatewayRef) return NextResponse.redirect(`${origin}/dashboard/payments?status=failed`);

  const provider = getPaymentGateway(gid);
  const result = await provider.verify(gatewayRef);

  if (result.ok && result.status === "SUCCESS" && invoiceId && result.amount) {
    const payment = await settlePayment({ invoiceId, amount: result.amount, gateway: gid, gatewayRef, event: "CALLBACK" });
    notifyPaymentSuccess(payment.id, origin).catch(() => {}); // non-blocking
    return NextResponse.redirect(`${origin}/pay/result?status=success&ref=${gatewayRef}`);
  }
  await logTransaction({
    invoiceId: invoiceId || null, gateway: gid, gatewayRef, event: "CALLBACK",
    status: result.ok ? (result.status === "SUCCESS" ? "SUCCESS" : result.status === "FAILED" ? "FAILED" : "PENDING") : "FAILED",
    message: result.ok ? "Callback processed." : result.error,
  });
  const outcome = result.ok && result.status === "PENDING" ? "pending" : "failed";
  return NextResponse.redirect(`${origin}/pay/result?status=${outcome}&ref=${gatewayRef}`);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ gateway: string }> }) {
  const { gateway } = await params; return handle(req, gateway);
}
export async function POST(req: NextRequest, { params }: { params: Promise<{ gateway: string }> }) {
  const { gateway } = await params; return handle(req, gateway);
}
