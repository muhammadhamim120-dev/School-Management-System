import { NextRequest } from "next/server";
import { z } from "zod";
import { ok, handleError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getPaymentGateway, isGatewayId } from "@/services/payments";
import { logTransaction, recomputeInvoice } from "@/lib/payment-settle";
import { withTenantContext } from "@/lib/api-helpers";

const schema = z.object({
  paymentId: z.string().min(1),
  amount: z.coerce.number().positive(),
  reason: z.string().optional(),
});

export const POST = withTenantContext(async (req: NextRequest) => {
  try {
    const { paymentId, amount, reason } = schema.parse(await req.json());

    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) return handleError({ code: "P2025" });
    if (payment.status !== "SUCCESS" && payment.status !== "REFUNDED") {
      return handleError({ code: "CONFLICT", message: "Only successful payments can be refunded." });
    }
    const alreadyRefunded = payment.refundedAmount ?? 0;
    const refundable = payment.amount - alreadyRefunded;
    if (amount > refundable) return handleError({ code: "CONFLICT", message: `Refund exceeds refundable amount (${refundable}).` });

    // Gateway refund (only for gateway-backed payments; manual/cash skip provider).
    if (payment.gateway && payment.gatewayRef && isGatewayId(payment.gateway)) {
      const res = await getPaymentGateway(payment.gateway).refund({ gatewayRef: payment.gatewayRef, amount, reason });
      if (!res.ok) {
        await logTransaction({ paymentId, invoiceId: payment.invoiceId, gateway: payment.gateway, gatewayRef: payment.gatewayRef,
          event: "REFUND", status: "FAILED", amount, message: res.error });
        return handleError({ code: "CONFLICT", message: res.error });
      }
    }

    const newRefunded = alreadyRefunded + amount;
    const updated = await prisma.payment.update({ where: { id: paymentId }, data: {
      refundedAmount: newRefunded, refundedAt: new Date(),
      refundRef: `RF-${Date.now()}`, status: "REFUNDED",
    } });
    await logTransaction({ paymentId, invoiceId: payment.invoiceId, gateway: payment.gateway ?? null, gatewayRef: payment.gatewayRef,
      event: "REFUND", status: "REFUNDED", amount, message: reason ?? "Refund processed." });
    await recomputeInvoice(payment.invoiceId);
    return ok(updated);
  } catch (e) { return handleError(e); }
});
