import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, handleError } from "@/lib/api";
import { resetSchema } from "@/lib/validations";
import { hashPassword } from "@/lib/password";
import { checkRateLimit, getRateLimitHeaders, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // Rate limit by IP address
    const ip = getClientIp(req);
    const rateLimitResult = checkRateLimit(`reset:${ip}`, RATE_LIMITS.passwordReset);

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

    const { token, password } = resetSchema.parse(await req.json());
    const user = await prisma.user.findFirst({
      where: { resetToken: token, resetTokenExpiry: { gt: new Date() } },
    });
    if (!user) return fail("Invalid or expired reset token", 400);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: await hashPassword(password), resetToken: null, resetTokenExpiry: null },
    });
    return ok({ message: "Password updated successfully" });
  } catch (e) { return handleError(e); }
}
