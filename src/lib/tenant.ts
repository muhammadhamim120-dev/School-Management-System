import { getRequiredTenantId } from "./tenant-context";

/**
 * Adds schoolId filter to any Prisma where clause.
 * Use this in API routes to scope queries to the current tenant.
 */
export function tenantWhere<T extends Record<string, unknown>>(where?: T): T & { schoolId: string } {
  const schoolId = getRequiredTenantId();
  return { ...where, schoolId } as T & { schoolId: string };
}

/**
 * Get the current tenant's schoolId. Returns null if no tenant context.
 */
export function getTenantSchoolId(): string | null {
  try {
    return getRequiredTenantId();
  } catch {
    return null;
  }
}
