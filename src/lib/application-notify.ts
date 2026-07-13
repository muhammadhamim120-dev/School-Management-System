// Admission notifications — email + SMS on application status changes.
// Reuses the existing email service (nodemailer) and SMS module. Best-effort:
// a notification failure never blocks the admission workflow.

import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/services/email";
import { dispatchRecipients } from "@/lib/sms-dispatch";
import { renderTemplate } from "@/lib/sms";
import { getRequiredTenantId } from "@/lib/tenant-context";

export async function notifyApplicationStatus(applicationId: string, status: string): Promise<void> {
  const app = await prisma.application.findUnique({ where: { id: applicationId }, include: { session: true } });
  if (!app) return;

  const text = `Dear guardian, the application for ${app.applicantName} (${app.session.name}) is now: ${status}. — Greenwood School`;

  // Email (if the applicant supplied an email).
  if (app.email) {
    try {
      await sendEmail({
        to: app.email,
        subject: `Admission Update — ${status}`,
        html: `<p>${text}</p><p>Tracking code: <strong>${app.trackingCode ?? "—"}</strong></p>`,
        text,
      });
    } catch { /* best-effort */ }
  }

  // SMS (if a guardian phone is on file).
  if (app.guardianPhone) {
    try {
      const tpl = await prisma.smsTemplate.findFirst({ where: { category: "ADMISSION" } });
      const body = tpl ? renderTemplate(tpl.body, { name: app.applicantName, status, ref: app.trackingCode ?? "" }) : text;
      const msg = await prisma.smsMessage.create({
        data: {
          title: `Admission — ${status}`,
          body, category: "ADMISSION", audience: "CUSTOM", status: "QUEUED", totalCount: 1,
          schoolId: getRequiredTenantId(),
          recipients: { create: [{ name: app.guardianName ?? app.applicantName, phone: app.guardianPhone }] },
        },
      });
      const recips = await prisma.smsRecipient.findMany({ where: { messageId: msg.id }, select: { id: true, phone: true, attempts: true } });
      await dispatchRecipients(msg.id, recips, body);
    } catch { /* best-effort */ }
  }
}

/** Short, human-friendly tracking code, e.g. "GW-7K3F9P". */
export function generateTrackingCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 7; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `GW-${s}`;
}
