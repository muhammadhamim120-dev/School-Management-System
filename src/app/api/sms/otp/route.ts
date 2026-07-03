import { NextRequest } from "next/server";
import { z } from "zod";
import { ok, fail, handleError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { generateOtp } from "@/lib/sms";
import { dispatchRecipients } from "@/lib/sms-dispatch";

const schema = z.object({ phone: z.string().min(6), purpose: z.string().optional() });

// Generate + send an OTP. Returns the messageId; the code itself is only
// returned in non-production for testing, never exposed in production.
export async function POST(req: NextRequest) {
  try {
    let raw: unknown;
    try { raw = await req.json(); } catch { return fail("Invalid JSON body.", 400); }
    const { phone, purpose } = schema.parse(raw);

    const code = generateOtp(6);
    const body = `Your Greenwood verification code is ${code}. It expires in 5 minutes. Do not share it.`;

    const message = await prisma.smsMessage.create({ data: {
      title: purpose ?? "OTP", body, category: "OTP", audience: "CUSTOM", status: "QUEUED", totalCount: 1,
      recipients: { create: [{ phone, status: "QUEUED" }] },
    }, include: { recipients: true } });

    await dispatchRecipients(message.id, message.recipients.map((r: { id: string; phone: string; attempts: number }) => ({ id: r.id, phone: r.phone, attempts: r.attempts })), body);

    const payload: { messageId: string; code?: string } = { messageId: message.id };
    if (process.env.NODE_ENV !== "production") payload.code = code; // dev convenience only
    return ok(payload);
  } catch (e) { return handleError(e); }
}
