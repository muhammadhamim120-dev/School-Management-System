import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, handleError } from "@/lib/api";
import { tenantWhere } from "@/lib/tenant";
import { withTenantContext } from "@/lib/api-helpers";
import { getRequiredTenantId } from "@/lib/tenant-context";
import { notifyApplicationStatus } from "@/lib/application-notify";

// POST — approve (admit) an application: set ADMITTED, assign admit roll +
// tracking code (if missing), fire email + SMS. Optional ?enroll=true also
// creates a Student + an admission-fee Invoice when the session targets a class.
export const POST = withTenantContext(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const enroll = req.nextUrl.searchParams.get("enroll") === "true";

    const app = await prisma.application.findUnique({ where: { id }, include: { session: true } });
    if (!app) return handleError({ code: "P2025" });

    const year = app.session.year || new Date().getFullYear();
    const admitRoll = app.admitRoll ?? `ADM-${year}-${String(Math.floor(Math.random() * 90000) + 10000)}`;
    const trackingCode = app.trackingCode ?? `GW-${Math.random().toString(36).slice(2, 9).toUpperCase()}`;

    const updated = await prisma.application.update({
      where: { id },
      data: { status: "ADMITTED", admitRoll, trackingCode },
      include: { session: true },
    });

    // Optional: enroll the admitted applicant as a Student + raise an admission invoice.
    if (enroll && app.session.classApplied) {
      const cls = await prisma.class.findFirst({ where: tenantWhere({ name: app.session.classApplied }) });
      if (cls) {
        const student = await prisma.student.create({
          data: {
            studentId: admitRoll,
            fullName: app.applicantName,
            gender: (app.gender ?? "MALE") as never,
            dateOfBirth: app.dateOfBirth ?? new Date(new Date().getFullYear() - 6, 0, 1),
            phone: app.guardianPhone ?? null,
            email: app.email ?? null,
            address: app.address ?? null,
            guardianName: app.guardianName ?? null,
            classId: cls.id,
            status: "ACTIVE",
            schoolId: getRequiredTenantId(),
          },
        });
        if ((app.session.admissionFee ?? 0) > 0) {
          const category = await prisma.feeCategory.upsert({
            where: { schoolId_name: { schoolId: getRequiredTenantId(), name: "Admission Fee" } },
            update: {}, create: { name: "Admission Fee", type: "ADMISSION", recurrence: "ONE_TIME", schoolId: getRequiredTenantId() },
          });
          await prisma.invoice.create({
            data: {
              invoiceNo: `ADM-${year}-${student.id.slice(-4).toUpperCase()}`,
              studentId: student.id,
              dueDate: new Date(Date.now() + 15 * 86400000),
              subtotal: app.session.admissionFee, discountTotal: 0, total: app.session.admissionFee, paidTotal: 0,
              status: "ISSUED",
              schoolId: getRequiredTenantId(),
              items: { create: [{ categoryId: category.id, description: `Admission Fee — ${app.session.name}`, amount: app.session.admissionFee, discount: 0 }] },
            },
          });
        }
      }
    }

    // Fire-and-forget notifications.
    notifyApplicationStatus(updated.id, "ADMITTED").catch(() => {});

    return ok({ application: updated, admitRoll, trackingCode });
  } catch (e) { return handleError(e); }
});
