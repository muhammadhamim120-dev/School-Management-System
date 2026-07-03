import { NextRequest } from "next/server";
import { z } from "zod";
import { ok, fail, handleError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { verifyPayToken } from "@/lib/pay-token";
import { getPaymentGateway, isGatewayId } from "@/services/payments";
import { logTransaction } from "@/lib/payment-settle";

// PUBLIC (no session). Requires a valid lookup token proving the payer verified
// their identity. Starts a gateway payment for one invoice (full or partial).
const schema = z.object({
  token: z.string().min(1),
  invoiceId: z.string().min(1),
  gateway: z.enum(["BKASH", "NAGAD", "ROCKET", "SSLCOMMERZ"]),
  amount: z.coerce.number().positive(),
});

export async function POST(req: NextRequest) {
  try {
    const { token, invoiceId, gateway, amount } = schema.parse(await req.json());
    const verified = verifyPayToken(token);
    if (!verified.ok) return fail("Session expired. Please look up your fees again.", 401);
    if (!isGatewayId(gateway)) return fail("Unknown gateway.", 400);

    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId }, include: { student: true } });
    if (!invoice) return fail("Invoice not found.", 404);
    // Token must belong to the invoice's student.
    if (invoice.studentId !== verified.studentId) return fail("This invoice does not belong to the verified student.", 403);

    const due = Math.max(0, invoice.total - invoice.paidTotal);
    if (amount > due) return fail(`Amount exceeds outstanding due (${due}).`, 409);

    const provider = getPaymentGateway(gateway);
    if (!provider.isConfigured()) return fail(`${gateway} is not available right now. Please choose another method.`, 503);

    const origin = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
    const result = await provider.initiate({
      invoiceId, amount, currency: "BDT",
      customerName: invoice.student?.fullName, customerPhone: invoice.student?.phone ?? undefined,
      callbackUrl: `${origin}/api/payments/callback/${gateway.toLowerCase()}?invoiceId=${invoiceId}`,
    });

    await logTransaction({
      invoiceId, gateway, event: "INITIATE",
      status: result.ok ? "PENDING" : "FAILED", amount,
      gatewayRef: result.ok ? result.gatewayRef : null,
      message: result.ok ? "Public checkout session created." : result.error,
    });

    if (!result.ok) return fail(result.error, 502);
    return ok({ redirectUrl: result.redirectUrl, gatewayRef: result.gatewayRef });
  } catch (e) { return handleError(e); }
}
