// Homework parent notification.
//
// When a teacher assigns homework with notifyParents=true, this builds an SMS
// to every parent of an active student in the target class (optionally scoped
// to a section) and dispatches via the active SMS provider. Fire-and-forget at
// the call site — an SMS failure must never break homework creation.

import { prisma } from "@/lib/prisma";
import { dispatchRecipients } from "@/lib/sms-dispatch";
import { renderTemplate } from "@/lib/sms";
import { getRequiredTenantId } from "@/lib/tenant-context";

type NotifyResult = { notified: number; reason?: string };

export async function notifyParentsHomework(
  homeworkId: string
): Promise<NotifyResult> {
  const hw = await prisma.homework.findUnique({
    where: { id: homeworkId },
    include: { class: true, subject: true },
  });
  if (!hw) return { notified: 0, reason: "homework not found" };

  // Active students in the class; scope to a section when the homework targets one.
  const students = await prisma.student.findMany({
    where: { classId: hw.classId, status: "ACTIVE", ...(hw.sectionId ? { sectionId: hw.sectionId } : {}) },
    include: { parent: true },
  });

  const recipients = students
    .map((s) => ({
      name: s.parent?.fullName ?? s.guardianName ?? "Guardian",
      phone: s.parent?.phone || s.phone,
      studentName: s.fullName,
    }))
    .filter((r) => r.phone);

  if (recipients.length === 0) return { notified: 0, reason: "no parent phones on file" };

  const dueStr = hw.dueDate.toLocaleDateString("en-GB");
  const subjectName = hw.subject?.name ?? "";
  const tpl = await prisma.smsTemplate.findFirst({ where: { category: "GENERAL" } });
  const body = tpl
    ? renderTemplate(tpl.body, {
        title: hw.title,
        subject: subjectName,
        class: hw.class.name,
        due: dueStr,
      })
    : `New homework: ${hw.title}${subjectName ? ` (${subjectName})` : ""} for ${hw.class.name}. Due ${dueStr}. — Greenwood School`;

  const message = await prisma.smsMessage.create({
    data: {
      title: `Homework — ${hw.title}`,
      body,
      category: "GENERAL",
      audience: "CUSTOM",
      status: "QUEUED",
      totalCount: recipients.length,
      schoolId: getRequiredTenantId(),
      recipients: {
        create: recipients.map((r) => ({ name: r.name, phone: r.phone as string })),
      },
    },
  });

  const rows = await prisma.smsRecipient.findMany({
    where: { messageId: message.id },
    select: { id: true, phone: true, attempts: true },
  });

  try {
    await dispatchRecipients(message.id, rows, body);
  } catch {
    /* best-effort — failures are recorded on the recipient rows */
  }
  return { notified: recipients.length };
}
