import { NextRequest } from "next/server";
import { ok, handleError } from "@/lib/api";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dispatchRecipients, retryableRecipients } from "@/lib/sms-dispatch";

// Retry FAILED recipients (under the attempt cap) for a message.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth(); if (!session) return handleError({ code: "P2025" });
    const { id } = await params;
    const message = await prisma.smsMessage.findUnique({ where: { id } });
    if (!message) return handleError({ code: "P2025" });

    const toRetry = await retryableRecipients(id);
    if (toRetry.length === 0) return handleError({ code: "CONFLICT", message: "Nothing to retry." });

    const result = await dispatchRecipients(id, toRetry, message.body);
    return ok({ retried: toRetry.length, ...result });
  } catch (e) { return handleError(e); }
}
