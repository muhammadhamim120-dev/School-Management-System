// Instant attendance SMS to a student's parent.
//
// Renders the ATTENDANCE SMS template (falling back to a sensible default) and
// dispatches via the active SMS provider. Fire-and-forget at the call site —
// an SMS failure must never break a check-in.

import { prisma } from "@/lib/prisma";
import { dispatchRecipients } from "@/lib/sms-dispatch";
import { renderTemplate } from "@/lib/sms";
import { getRequiredTenantId } from "@/lib/tenant-context";

type NotifyResult = { sent: boolean; reason?: string };

export async function notifyParentAttendance(
  studentId: string,
  status: string,
  day: Date
): Promise<NotifyResult> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { parent: true },
  });
  if (!student) return { sent: false, reason: "student not found" };

  // Prefer the linked parent's phone; fall back to the student's phone/guardian.
  const phone = student.parent?.phone || student.phone;
  if (!phone) return { sent: false, reason: "no parent phone on file" };

  const dateStr = day.toLocaleDateString("en-GB");
  const tpl = await prisma.smsTemplate.findFirst({ where: { category: "ATTENDANCE" } });
  const body = tpl
    ? renderTemplate(tpl.body, { name: student.fullName, date: dateStr, status })
    : `Dear guardian, ${student.fullName} was marked ${status} on ${dateStr}. — Greenwood School`;

  const message = await prisma.smsMessage.create({
    data: {
      title: `Attendance — ${student.fullName}`,
      body,
      category: "ATTENDANCE",
      audience: "CUSTOM",
      status: "QUEUED",
      totalCount: 1,
      schoolId: getRequiredTenantId(),
      recipients: {
        create: [{ name: student.parent?.fullName ?? student.guardianName ?? "Guardian", phone }],
      },
    },
  });

  const recipients = await prisma.smsRecipient.findMany({
    where: { messageId: message.id },
    select: { id: true, phone: true, attempts: true },
  });

  // Dispatch via the active provider; swallow errors (best-effort).
  try {
    await dispatchRecipients(message.id, recipients, body);
  } catch {
    /* best-effort — failure is recorded on the recipient rows */
  }
  return { sent: true };
}
