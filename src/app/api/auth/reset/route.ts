import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, handleError } from "@/lib/api";
import { resetSchema } from "@/lib/validations";
import { hashPassword } from "@/lib/password";

export async function POST(req: NextRequest) {
  try {
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
