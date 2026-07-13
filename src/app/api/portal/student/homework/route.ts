import { ok, handleError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { withTenantContext } from "@/lib/api-helpers";
import { getRequiredTenantId } from "@/lib/tenant-context";
import { tenantWhere } from "@/lib/tenant";

export const GET = withTenantContext(async () => {
  try {
    const auth = await requireAuth();
    if (!auth.authenticated) return auth.error;
    if (auth.user.role !== "STUDENT") return ok({ homework: [] });

    const student = await prisma.student.findFirst({
      where: tenantWhere({ email: auth.user.email }),
      include: { class: true, section: true },
    });

    if (!student || !student.classId) {
      return ok({ homework: [] });
    }

    const homework = await prisma.homework.findMany({
      where: tenantWhere({
        classId: student.classId,
        OR: [{ sectionId: student.sectionId }, { sectionId: null }],
      }),
      include: { subject: true, teacher: true },
      orderBy: { dueDate: "desc" },
      take: 50,
    });

    const homeworkWithSubmission = await Promise.all(
      homework.map(async (h) => {
        const submission = await prisma.homeworkSubmission.findUnique({
          where: { homeworkId_studentId: { homeworkId: h.id, studentId: student.id } },
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
          marks: submission?.marks ?? null,
          totalMarks: submission?.totalMarks ?? 100,
          feedback: submission?.feedback ?? null,
        };
      })
    );

    return ok({ homework: homeworkWithSubmission });
  } catch (e) {
    return handleError(e);
  }
});
