import { NextRequest } from "next/server";
import { z } from "zod";
import { ok, handleError } from "@/lib/api";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPaymentGateway, isGatewayId } from "@/services/payments";
import { logTransaction } from "@/lib/payment-settle";

const schema = z.object({
  invoiceId: z.string().min(1),
  gateway: z.enum(["BKASH", "NAGAD", "ROCKET", "SSLCOMMERZ"]),
  amount: z.coerce.number().positive(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth(); if (!session) return handleError({ code: "P2025" });
    const { invoiceId, gateway, amount } = schema.parse(await req.json());

    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId }, include: { student: true } });
    if (!invoice) return handleError({ code: "P2025" });

    const due = Math.max(0, invoice.total - invoice.paidTotal);
    if (amount > due) return handleError({ code: "CONFLICT", message: `Amount exceeds outstanding due (${due}).` });
    if (!isGatewayId(gateway)) return handleError({ code: "CONFLICT", message: "Unknown gateway." });

    const provider = getPaymentGateway(gateway);
    const origin = req.nextUrl.origin;
    const result = await provider.initiate({
      invoiceId, amount, currency: "BDT",
      customerName: invoice.student?.fullName, customerPhone: invoice.student?.phone ?? undefined,
      callbackUrl: `${origin}/api/payments/callback/${gateway.toLowerCase()}`,
    });

    await logTransaction({
      invoiceId, gateway, event: "INITIATE",
      status: result.ok ? "PENDING" : "FAILED",
      amount, gatewayRef: result.ok ? result.gatewayRef : null,
      message: result.ok ? "Checkout session created." : result.error,
    });

    if (!result.ok) return handleError({ code: "CONFLICT", message: result.error });
    return ok({ redirectUrl: result.redirectUrl, gatewayRef: result.gatewayRef });
  } catch (e) { return handleError(e); }
}
