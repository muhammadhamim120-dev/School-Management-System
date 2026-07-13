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
      include: { class: true, section: true },
    });

    if (!student) return fail("Student not found or access denied.", 404);

    let homeworkWithStatus: {
      id: string; title: string; details: string; subject: string | null;
      teacher: string | null; assignedOn: string; dueDate: string; submissionStatus: string | null;
    }[] = [];

    if (student.classId) {
      const homework = await prisma.homework.findMany({
        where: tenantWhere({
          classId: student.classId,
          OR: [{ sectionId: student.sectionId }, { sectionId: null }],
        }),
        include: { subject: true, teacher: true },
        orderBy: { dueDate: "desc" },
        take: 50,
      });

      // Check submission status for each homework
      homeworkWithStatus = await Promise.all(
        homework.map(async (h) => {
          const submission = await prisma.homeworkSubmission.findUnique({
            where: { homeworkId_studentId: { homeworkId: h.id, studentId } },
          });
          return {
            id: h.id,
            title: h.title,
            details: h.details,
            subject: h.subject?.name ?? null,
            teacher: h.teacher?.fullName ?? null,
            assignedOn: h.assignedOn.toISOString(),
            dueDate: h.dueDate.toISOString(),
            submissionStatus: submission?.status ?? null,
          };
        })
      );
    }

    return ok({
      studentName: student.fullName,
      homework: homeworkWithStatus,
    });
  } catch (e) {
    return handleError(e);
  }
});
