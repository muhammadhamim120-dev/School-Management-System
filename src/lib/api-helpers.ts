import { NextRequest } from "next/server";
import { auth } from "./auth";
import { runWithTenant } from "./tenant-context";

/**
 * Wraps a Next.js route handler with tenant context from the session.
 * The tenant context (schoolId) is extracted from the JWT and made available
 * via AsyncLocalStorage for the duration of the request.
 *
 * Supports both `GET(req)` and `GET(req, { params })` handler signatures.
 */
export function withTenantContext<T extends unknown[]>(
  handler: (req: NextRequest, ...args: T) => Promise<Response>
) {
  return async (req: NextRequest, ...args: T) => {
    const session = await auth();
    const schoolId = (session?.user as { schoolId?: string | null })?.schoolId ?? null;

    return runWithTenant({ schoolId }, () => handler(req, ...args));
  };
}
