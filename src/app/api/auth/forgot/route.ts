import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";
import { forgotSchema } from "@/lib/validations";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { email } = forgotSchema.parse(await req.json());
    const user = await prisma.user.findUnique({ where: { email } });
    // Always succeed to avoid user enumeration
    if (user) {
      const token = randomBytes(32).toString("hex");
      const expiry = new Date(Date.now() + 1000 * 60 * 30);
      await prisma.user.update({ where: { email }, data: { resetToken: token, resetTokenExpiry: expiry } });
      // In production: email the link. Here we return it for the demo environment.
      return ok({ message: "Reset link generated", devToken: token });
    }
    return ok({ message: "If that email exists, a reset link was sent." });
  } catch (e) { return handleError(e); }
}
