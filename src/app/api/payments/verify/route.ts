import { NextRequest } from "next/server";
import { z } from "zod";
import { ok, handleError } from "@/lib/api";
import { auth } from "@/lib/auth";
import { getPaymentGateway, isGatewayId } from "@/services/payments";
import { settlePayment, logTransaction } from "@/lib/payment-settle";

const schema = z.object({
  gateway: z.enum(["BKASH", "NAGAD", "ROCKET", "SSLCOMMERZ"]),
  gatewayRef: z.string().min(1),
  invoiceId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth(); if (!session) return handleError({ code: "P2025" });
    const { gateway, gatewayRef, invoiceId } = schema.parse(await req.json());
    if (!isGatewayId(gateway)) return handleError({ code: "CONFLICT", message: "Unknown gateway." });

    const result = await getPaymentGateway(gateway).verify(gatewayRef);
    if (result.ok && result.status === "SUCCESS" && result.amount) {
      const payment = await settlePayment({ invoiceId, amount: result.amount, gateway, gatewayRef, event: "VERIFY" });
      return ok({ status: "SUCCESS", payment });
    }
    await logTransaction({
      invoiceId, gateway, gatewayRef, event: "VERIFY",
      status: result.ok ? (result.status === "SUCCESS" ? "SUCCESS" : result.status === "FAILED" ? "FAILED" : "PENDING") : "FAILED",
      message: result.ok ? "Verify processed." : result.error,
    });
    return ok({ status: result.ok ? result.status : "FAILED", error: result.ok ? undefined : result.error });
  } catch (e) { return handleError(e); }
}
