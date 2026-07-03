import { prisma } from "@/lib/prisma";
import { getSmsProvider } from "@/services/sms";
import { MAX_SMS_ATTEMPTS } from "@/lib/sms";

type RecipientRow = { id: string; phone: string; attempts: number };

/**
 * Dispatch the given recipients of a message via the active provider, updating
 * each recipient's status/attempts/error and the message counters. Shared by
 * the send route and the retry route.
 */
export async function dispatchRecipients(messageId: string, recipients: RecipientRow[], body: string) {
  const provider = getSmsProvider();
  await prisma.smsMessage.update({ where: { id: messageId }, data: { status: "SENDING", provider: provider.id } });

  const results = await provider.send(recipients.map((r) => ({ to: r.phone, text: body })));

  let sent = 0, failed = 0;
  for (let i = 0; i < recipients.length; i++) {
    const r = recipients[i];
    const res = results[i];
    const ok = res?.ok ?? false;
    await prisma.smsRecipient.update({
      where: { id: r.id },
      data: {
        status: ok ? "SENT" : "FAILED",
        error: ok ? null : (res?.error ?? "Unknown error"),
        attempts: r.attempts + 1,
        lastAttemptAt: new Date(),
      },
    });
    if (ok) sent++; else failed++;
  }

  // Recompute message counters from the authoritative recipient rows.
  const agg = await prisma.smsRecipient.groupBy({ by: ["status"], where: { messageId }, _count: { _all: true } });
  const counts: Record<string, number> = {};
  for (const a of agg as { status: string; _count: { _all: number } }[]) counts[a.status] = a._count._all;
  const total = Object.values(counts).reduce((s: number, n: number) => s + n, 0);
  const sentCount = (counts.SENT ?? 0) + (counts.DELIVERED ?? 0);
  const failedCount = counts.FAILED ?? 0;
  const deliveredCount = counts.DELIVERED ?? 0;
  const allDone = (counts.QUEUED ?? 0) === 0 && (counts.SENDING ?? 0) === 0;

  await prisma.smsMessage.update({
    where: { id: messageId },
    data: {
      status: allDone ? (failedCount === total ? "FAILED" : "SENT") : "SENDING",
      sentAt: new Date(), totalCount: total, sentCount, failedCount, deliveredCount,
    },
  });
  return { sent, failed };
}

/** Recipients eligible for retry: FAILED and under the attempt cap. */
export async function retryableRecipients(messageId: string) {
  return prisma.smsRecipient.findMany({
    where: { messageId, status: "FAILED", attempts: { lt: MAX_SMS_ATTEMPTS } },
    select: { id: true, phone: true, attempts: true },
  });
}
