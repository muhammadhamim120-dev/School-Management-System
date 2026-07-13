import { AsyncLocalStorage } from "async_hooks";

interface TenantContext {
  schoolId: string | null;
}

const tenantStorage = new AsyncLocalStorage<TenantContext>();

export function runWithTenant<T>(ctx: TenantContext, fn: () => T): T {
  return tenantStorage.run(ctx, fn);
}

export function getTenantId(): string | null {
  return tenantStorage.getStore()?.schoolId ?? null;
}

export function getRequiredTenantId(): string {
  const id = getTenantId();
  if (!id) throw new Error("No tenant context — SUPER_ADMIN must set explicit schoolId");
  return id;
}
