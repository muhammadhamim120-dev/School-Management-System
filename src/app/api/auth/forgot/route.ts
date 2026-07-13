import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";
import { forgotSchema } from "@/lib/validations";
import { randomBytes } from "crypto";
import { checkRateLimit, getRateLimitHeaders, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // Rate limit by IP address
    const ip = getClientIp(req);
    const rateLimitResult = checkRateLimit(`forgot:${ip}`, RATE_LIMITS.passwordReset);

    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ success: false, error: "Too many requests. Please try again later." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            ...getRateLimitHeaders(rateLimitResult),
          },
        }
      );
    }

    const { email } = forgotSchema.parse(await req.json());
    const user = await prisma.user.findFirst({ where: { email } });
    // Always succeed to avoid user enumeration
    if (user) {
      const token = randomBytes(32).toString("hex");
      const expiry = new Date(Date.now() + 1000 * 60 * 30);
      await prisma.user.update({ where: { id: user.id }, data: { resetToken: token, resetTokenExpiry: expiry } });
      // TODO: In production, send reset link via email
      // The token is stored in the database and will be validated by the reset endpoint
      return ok({ message: "If that email exists, a reset link was sent." });
    }
    return ok({ message: "If that email exists, a reset link was sent." });
  } catch (e) { return handleError(e); }
}
