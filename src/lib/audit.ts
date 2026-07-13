import { prisma } from "@/lib/prisma";
import { getRequiredTenantId } from "@/lib/tenant-context";
import type { Prisma } from "@prisma/client";

export interface AuditLogEntry {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAudit(entry: AuditLogEntry): Promise<void> {
  try {
    const schoolId = getRequiredTenantId();
    await prisma.auditLog.create({
      data: {
        userId: entry.userId ?? null,
        schoolId,
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId ?? null,
        details: (entry.details as Prisma.InputJsonValue) ?? undefined,
        ipAddress: entry.ipAddress ?? null,
        userAgent: entry.userAgent ?? null,
      },
    });
  } catch {
    // Audit logging should never throw — fire-and-forget
  }
}
