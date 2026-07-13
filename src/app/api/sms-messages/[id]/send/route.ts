import { NextRequest } from "next/server";
import { ok, handleError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { dispatchRecipients } from "@/lib/sms-dispatch";
import { checkRateLimit, getRateLimitHeaders, RATE_LIMITS } from "@/lib/rate-limit";
import { withTenantContext } from "@/lib/api-helpers";

// Dispatch all QUEUED recipients of a message via the active provider.
export const POST = withTenantContext(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    // Rate limit by user ID (we use a generic key since we don't have session in withTenantContext)
    const rateLimitResult = checkRateLimit(`sms:send`, RATE_LIMITS.sms);

    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ success: false, error: "Too many SMS requests. Please try again later." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            ...getRateLimitHeaders(rateLimitResult),
          },
        }
      );
    }

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
});
