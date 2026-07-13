import { prisma } from "@/lib/prisma";
import { getRequiredTenantId } from "@/lib/tenant-context";
import type { PlanTier } from "@prisma/client";

export type PlanFeature =
  | "ai_dropout_risk"
  | "online_exams"
  | "coaching"
  | "transport"
  | "hostel"
  | "sms"
  | "custom_branding"
  | "advanced_reports"
  | "parent_portal"
  | "certificates"
  | "multi_campus";

export interface PlanLimits {
  maxStudents: number;
  maxTeachers: number;
  maxStorageMb: number;
  features: PlanFeature[];
  monthlyPrice: number;
  label: string;
  description: string;
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  FREE: {
    maxStudents: 100,
    maxTeachers: 20,
    maxStorageMb: 500,
    features: ["parent_portal", "certificates"],
    monthlyPrice: 0,
    label: "Free",
    description: "Basic features for small schools",
  },
  STARTER: {
    maxStudents: 500,
    maxTeachers: 50,
    maxStorageMb: 2000,
    features: ["parent_portal", "certificates", "sms", "transport", "custom_branding"],
    monthlyPrice: 29,
    label: "Starter",
    description: "Essential tools for growing schools",
  },
  PROFESSIONAL: {
    maxStudents: 2000,
    maxTeachers: 200,
    maxStorageMb: 10000,
    features: [
      "parent_portal", "certificates", "sms", "transport", "hostel",
      "custom_branding", "coaching", "online_exams", "advanced_reports",
    ],
    monthlyPrice: 79,
    label: "Professional",
    description: "Full feature set for established schools",
  },
  ENTERPRISE: {
    maxStudents: 99999,
    maxTeachers: 99999,
    maxStorageMb: 50000,
    features: [
      "parent_portal", "certificates", "sms", "transport", "hostel",
      "custom_branding", "coaching", "online_exams", "advanced_reports",
      "ai_dropout_risk", "multi_campus",
    ],
    monthlyPrice: 199,
    label: "Enterprise",
    description: "Unlimited access with priority support",
  },
};

export async function getSubscription(schoolId?: string) {
  const orgId = schoolId ?? getRequiredTenantId();
  return prisma.subscription.findUnique({
    where: { organizationId: orgId },
  });
}

export async function checkLimit(
  resource: "students" | "teachers" | "storage",
  schoolId?: string,
): Promise<{ allowed: boolean; current: number; max: number }> {
  const orgId = schoolId ?? getRequiredTenantId();
  const sub = await getSubscription(orgId);
  const tier = sub?.tier ?? "FREE";
  const limits = PLAN_LIMITS[tier];

  if (resource === "students") {
    const current = await prisma.student.count({ where: { schoolId: orgId } });
    return { allowed: current < limits.maxStudents, current, max: limits.maxStudents };
  }
  if (resource === "teachers") {
    const current = await prisma.teacher.count({ where: { schoolId: orgId } });
    return { allowed: current < limits.maxTeachers, current, max: limits.maxTeachers };
  }
  // storage — approximate by counting file uploads or return raw MB from sub
  const currentMb = sub?.maxStorageMb ?? 0;
  return { allowed: true, current: currentMb, max: limits.maxStorageMb };
}

export async function checkFeature(
  feature: PlanFeature,
  schoolId?: string,
): Promise<boolean> {
  const orgId = schoolId ?? getRequiredTenantId();
  const sub = await getSubscription(orgId);
  const tier = sub?.tier ?? "FREE";
  return PLAN_LIMITS[tier].features.includes(feature);
}

const TIER_ORDER: PlanTier[] = ["FREE", "STARTER", "PROFESSIONAL", "ENTERPRISE"];

export function canUpgrade(current: PlanTier, target: PlanTier): boolean {
  return TIER_ORDER.indexOf(target) > TIER_ORDER.indexOf(current);
}

export function getNextTier(current: PlanTier): PlanTier | null {
  const idx = TIER_ORDER.indexOf(current);
  return idx < TIER_ORDER.length - 1 ? TIER_ORDER[idx + 1] : null;
}

export async function upgradeTier(newTier: PlanTier, schoolId?: string) {
  const orgId = schoolId ?? getRequiredTenantId();
  const limits = PLAN_LIMITS[newTier];
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  return prisma.subscription.upsert({
    where: { organizationId: orgId },
    update: {
      tier: newTier,
      status: "ACTIVE",
      maxStudents: limits.maxStudents,
      maxTeachers: limits.maxTeachers,
      maxStorageMb: limits.maxStorageMb,
      monthlyPrice: limits.monthlyPrice,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      features: limits.features,
    },
    create: {
      organizationId: orgId,
      tier: newTier,
      status: "ACTIVE",
      maxStudents: limits.maxStudents,
      maxTeachers: limits.maxTeachers,
      maxStorageMb: limits.maxStorageMb,
      monthlyPrice: limits.monthlyPrice,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      features: limits.features,
    },
  });
}
