import { NextRequest } from "next/server";
import { ok, handleError } from "@/lib/api";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dispatchRecipients } from "@/lib/sms-dispatch";

// Dispatch all QUEUED recipients of a message via the active provider.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth(); if (!session) return handleError({ code: "P2025" });
    const { id } = await params;
    const message = await prisma.smsMessage.findUnique({ where: { id } });
    if (!message) return handleError({ code: "P2025" });

    const queued = await prisma.smsRecipient.findMany({
      where: { messageId: id, status: { in: ["QUEUED", "DRAFT"] } },
      select: { id: true, phone: true, attempts: true },
    });
    if (queued.length === 0) return handleError({ code: "CONFLICT", message: "No queued recipients to send." });

    const result = await dispatchRecipients(id, queued, message.body);
    return ok(result);
  } catch (e) { return handleError(e); }
}
