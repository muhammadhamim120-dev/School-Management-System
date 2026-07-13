import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";
import { requireSuperAdmin } from "@/lib/api-auth";

export const GET = async (req: NextRequest) => {
  try {
    const auth = await requireSuperAdmin();
    if (!auth.authenticated) return auth.error;

    const dbStart = Date.now();
    let dbConnected = false;
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbConnected = true;
    } catch {
      dbConnected = false;
    }
    const dbLatencyMs = Date.now() - dbStart;

    const [
      organizationCount,
      userCount,
      studentCount,
      teacherCount,
      subscriptionCount,
      ticketCount,
      auditLogCount,
      featureFlagCount,
    ] = await Promise.all([
      prisma.organization.count(),
      prisma.user.count(),
      prisma.student.count(),
      prisma.teacher.count(),
      prisma.subscription.count(),
      prisma.supportTicket.count(),
      prisma.auditLog.count(),
      prisma.featureFlag.count(),
    ]);

    return ok({
      status: dbConnected ? "healthy" : "degraded",
      dbConnected,
      dbLatencyMs,
      counts: {
        organizations: organizationCount,
        users: userCount,
        students: studentCount,
        teachers: teacherCount,
        subscriptions: subscriptionCount,
        supportTickets: ticketCount,
        auditLogs: auditLogCount,
        featureFlags: featureFlagCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    return handleError(e);
  }
};
