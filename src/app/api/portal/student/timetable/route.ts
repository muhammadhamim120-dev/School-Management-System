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
    if (auth.user.role !== "STUDENT") return ok({ className: null, section: null, slots: [] });

    // Find the student record linked to this user
    const student = await prisma.student.findFirst({
      where: tenantWhere({ email: auth.user.email }),
      include: { class: true, section: true },
    });

    if (!student || !student.classId) {
      return ok({ className: null, section: null, slots: [] });
    }

    const slots = await prisma.routineSlot.findMany({
      where: tenantWhere({
        classId: student.classId,
        OR: [{ sectionId: student.sectionId }, { sectionId: null }],
      }),
      include: { subject: true, teacher: true },
      orderBy: [{ day: "asc" }, { startTime: "asc" }],
    });

    return ok({
      className: student.class?.name ?? null,
      section: student.section?.name ?? null,
      slots: slots.map((s) => ({
        id: s.id,
        day: s.day,
        startTime: s.startTime,
        endTime: s.endTime,
        subject: s.subject?.name ?? null,
        teacher: s.teacher?.fullName ?? null,
        room: s.room,
      })),
    });
  } catch (e) {
    return handleError(e);
  }
});
