import { NextRequest } from "next/server";
import { ok, fail, handleError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { withTenantContext } from "@/lib/api-helpers";
import { getRequiredTenantId } from "@/lib/tenant-context";
import { tenantWhere } from "@/lib/tenant";

export const GET = withTenantContext(async (req: NextRequest, { params }: { params: Promise<{ studentId: string }> }) => {
  try {
    const auth = await requireAuth();
    if (!auth.authenticated) return auth.error;

    const { studentId } = await params;

    const parent = await prisma.parent.findFirst({
      where: tenantWhere({ email: auth.user.email }),
    });

    const student = await prisma.student.findFirst({
      where: tenantWhere({ id: studentId, parentId: parent?.id }),
      select: { id: true, fullName: true },
    });

    if (!student) return fail("Student not found or access denied.", 404);

    const fees = await prisma.fee.findMany({
      where: tenantWhere({ studentId }),
      orderBy: { dueDate: "desc" },
    });

    const outstanding = fees
      .filter((f) => f.status !== "PAID")
      .reduce((s, f) => s + Math.max(0, f.amount - f.paidAmount), 0);

    return ok({
      studentName: student.fullName,
      outstanding,
      fees: fees.map((f) => ({
        id: f.id,
        title: f.title,
        amount: f.amount,
        paidAmount: f.paidAmount,
        dueDate: f.dueDate.toISOString(),
        status: f.status,
      })),
    });
  } catch (e) {
    return handleError(e);
  }
});
