import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, handleError } from "@/lib/api";
import { requireAppAuth, serverTime } from "@/lib/app-api";

type NotificationItem = {
  id: string;
  type: "ATTENDANCE" | "FEE" | "RESULT" | "NOTICE" | "EVENT";
  title: string;
  body: string;
  date: string;
};

// GET -- a derived notification feed for the child (last 14 days).
export async function GET(req: NextRequest) {
  try {
    const auth = requireAppAuth(req);
    if (!auth.ok) return fail("Unauthorized.", auth.status);
    const since = new Date(); since.setDate(since.getDate() - 14);

    const student = await prisma.student.findUnique({ where: { id: auth.studentId }, select: { schoolId: true } });
    const schoolId = student?.schoolId;

    const [attendance, invoices, results, notices, events] = await Promise.all([
      prisma.attendance.findMany({ where: { studentId: auth.studentId, date: { gte: since }, status: { in: ["ABSENT", "LATE"] } }, orderBy: { date: "desc" }, take: 10 }),
      prisma.invoice.findMany({ where: { studentId: auth.studentId, status: { in: ["OVERDUE", "PARTIAL", "ISSUED"] } }, orderBy: { dueDate: "asc" }, take: 5 }),
      prisma.result.findMany({ where: { studentId: auth.studentId, createdAt: { gte: since } }, include: { subject: true }, orderBy: { createdAt: "desc" }, take: 10 }),
      prisma.notice.findMany({ where: { ...(schoolId ? { schoolId } : {}), pinned: true }, orderBy: { createdAt: "desc" }, take: 5 }),
      prisma.event.findMany({ where: { ...(schoolId ? { schoolId } : {}), startDate: { gte: new Date() }, status: "UPCOMING" }, orderBy: { startDate: "asc" }, take: 5 }),
    ]);

    const items: NotificationItem[] = [];
    for (const a of attendance) items.push({ id: `att-${a.id}`, type: "ATTENDANCE", title: `Marked ${a.status}`, body: `Attendance on ${a.date.toISOString().slice(0, 10)}`, date: a.date.toISOString() });
    for (const i of invoices) items.push({ id: `fee-${i.id}`, type: "FEE", title: `Invoice ${i.invoiceNo}`, body: `${i.status} \u00B7 due ${i.dueDate.toISOString().slice(0, 10)}`, date: i.updatedAt.toISOString() });
    for (const r of results) items.push({ id: `res-${r.id}`, type: "RESULT", title: `${r.subject?.name ?? "Result"} published`, body: `${r.marks}/${r.totalMarks} \u00B7 ${r.grade ?? ""}`, date: r.createdAt.toISOString() });
    for (const n of notices) items.push({ id: `note-${n.id}`, type: "NOTICE", title: n.title, body: n.content.slice(0, 120), date: n.createdAt.toISOString() });
    for (const e of events) items.push({ id: `evt-${e.id}`, type: "EVENT", title: e.title, body: `${e.startDate.toISOString().slice(0, 10)} \u00B7 ${e.location ?? ""}`, date: e.startDate.toISOString() });
    items.sort((a, b) => (a.date < b.date ? 1 : -1));

    return ok({ serverTime: serverTime(), items });
  } catch (e) { return handleError(e); }
}
