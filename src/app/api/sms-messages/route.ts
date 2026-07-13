import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, handleError, parsePagination } from "@/lib/api";
import { smsMessageSchema } from "@/lib/validations";
import { getSmsProvider } from "@/services/sms";
import { withTenantContext } from "@/lib/api-helpers";
import { getRequiredTenantId } from "@/lib/tenant-context";

type Recip = { name: string | null; phone: string };

async function resolveAudience(audience: string): Promise<Recip[]> {
  if (audience === "STUDENTS") {
    const rows = await prisma.student.findMany({ where: { phone: { not: null } }, select: { fullName: true, phone: true } });
    return rows.map((r: { fullName: string; phone: string | null }) => ({ name: r.fullName, phone: r.phone as string }));
  }
  if (audience === "PARENTS") {
    const rows = await prisma.parent.findMany({ where: { phone: { not: null } }, select: { fullName: true, phone: true } });
    return rows.map((r: { fullName: string; phone: string | null }) => ({ name: r.fullName, phone: r.phone as string }));
  }
  if (audience === "TEACHERS") {
    const rows = await prisma.teacher.findMany({ where: { phone: { not: null } }, select: { fullName: true, phone: true } });
    return rows.map((r: { fullName: string; phone: string | null }) => ({ name: r.fullName, phone: r.phone as string }));
  }
  if (audience === "ALL") {
    const [s, p, t] = await Promise.all([
      prisma.student.findMany({ where: { phone: { not: null } }, select: { fullName: true, phone: true } }),
      prisma.parent.findMany({ where: { phone: { not: null } }, select: { fullName: true, phone: true } }),
      prisma.teacher.findMany({ where: { phone: { not: null } }, select: { fullName: true, phone: true } }),
    ]);
    return [...s, ...p, ...t].map((r: { fullName: string; phone: string | null }) => ({ name: r.fullName, phone: r.phone as string }));
  }
  return [];
}

export const GET = withTenantContext(async (req: NextRequest) => {
  try {
    const { page, limit, skip } = parsePagination(req.nextUrl.searchParams);
    const status = req.nextUrl.searchParams.get("status")?.trim();
    const where: Record<string, unknown> = status ? { status } : {};
    const [items, total] = await Promise.all([
      prisma.smsMessage.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" },
        include: { template: true, _count: { select: { recipients: true } } } }),
      prisma.smsMessage.count({ where }),
    ]);
    return ok({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (e) { return handleError(e); }
});

export const POST = withTenantContext(async (req: NextRequest) => {
  try {
    const data = smsMessageSchema.parse(await req.json());

    const recipients: Recip[] = data.audience === "CUSTOM"
      ? (data.recipients ?? []).map((r) => ({ name: r.name || null, phone: r.phone }))
      : await resolveAudience(data.audience);

    const provider = getSmsProvider();
    let status: "DRAFT" | "QUEUED" | "SENT" | "FAILED" = "DRAFT";
    let sentCount = 0, failedCount = 0, providerId: string | null = null, sentAt: Date | null = null;
    const recipientStatuses = new Map<string, { status: "QUEUED" | "SENT" | "FAILED"; error?: string }>();

    if (data.send && recipients.length > 0) {
      providerId = provider.id;
      if (provider.isConfigured()) {
        const results = await provider.send(recipients.map((r) => ({ to: r.phone, text: data.body })));
        for (const res of results) {
          recipientStatuses.set(res.to, { status: res.ok ? "SENT" : "FAILED", error: res.error });
          if (res.ok) sentCount++; else failedCount++;
        }
        status = failedCount === 0 ? "SENT" : sentCount === 0 ? "FAILED" : "SENT";
        sentAt = new Date();
      } else {
        status = "QUEUED";
      }
    }

    const schoolId = getRequiredTenantId();
    const message = await prisma.smsMessage.create({ data: {
      title: data.title || null, body: data.body, category: data.category, audience: data.audience, templateId: data.templateId || null,
      status, provider: providerId, sentAt, totalCount: recipients.length, sentCount, failedCount, schoolId,
      recipients: { create: recipients.map((r) => {
        const rs = recipientStatuses.get(r.phone);
        const attempted = data.send && provider.isConfigured();
        return {
          name: r.name, phone: r.phone,
          status: rs?.status ?? "QUEUED",
          error: rs?.error ?? null,
          attempts: attempted ? 1 : 0,
          lastAttemptAt: attempted ? new Date() : null,
        };
      }) },
    }, include: { template: true, _count: { select: { recipients: true } } } });

    return created(message);
  } catch (e) { return handleError(e); }
});
