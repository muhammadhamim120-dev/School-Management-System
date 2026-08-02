import { auth } from "@/lib/auth";
import { handleError } from "@/lib/api";
import { isAdmin as roleIsAdmin, requiresAdmin, type Role } from "@/lib/rbac";

// API authentication utilities

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  image?: string;
  schoolId: string | null;
}

export interface AuthResult {
  authenticated: true;
  user: AuthenticatedUser;
}

export interface AuthError {
  authenticated: false;
  error: Response;
}

export type AuthCheckResult = AuthResult | AuthError;

/**
 * Require authentication for an API route
 */
export async function requireAuth(): Promise<AuthCheckResult> {
  const session = await auth();

  if (!session?.user) {
    return {
      authenticated: false,
      error: handleError({ code: "P2025", message: "Unauthorized" }),
    };
  }

  const user: AuthenticatedUser = {
    id: session.user.id as string,
    name: session.user.name as string,
    email: session.user.email as string,
    role: (session.user as { role?: string }).role || "STAFF",
    image: session.user.image as string | undefined,
    schoolId: (session.user as { schoolId?: string | null }).schoolId ?? null,
  };

  return { authenticated: true, user };
}

/**
 * Require authentication with a valid tenant context.
 * Non-SUPER_ADMIN users must have a schoolId.
 */
export async function requireTenantAuth(): Promise<AuthCheckResult> {
  const authResult = await requireAuth();
  if (!authResult.authenticated) return authResult;

  if (!authResult.user.schoolId && authResult.user.role !== "SUPER_ADMIN") {
    return {
      authenticated: false,
      error: handleError({ code: "P2025", message: "No tenant context" }),
    };
  }

  return authResult;
}

/**
 * Require SUPER_ADMIN role
 */
export async function requireSuperAdmin(): Promise<AuthCheckResult> {
  return requireRole("SUPER_ADMIN");
}

/**
 * Require specific role for an API route
 */
export async function requireRole(...roles: string[]): Promise<AuthCheckResult> {
  const authResult = await requireAuth();

  if (!authResult.authenticated) {
    return authResult;
  }

  if (!roles.includes(authResult.user.role)) {
    return {
      authenticated: false,
      error: handleError({
        code: "P2025",
        message: `Unauthorized: Required role: ${roles.join(" or ")}`,
      }),
    };
  }

  return authResult;
}

/**
 * Require admin role for an API route
 */
export async function requireAdmin(): Promise<AuthCheckResult> {
  return requireRole("ADMIN", "SCHOOL_ADMIN", "SUPER_ADMIN");
}

/**
 * Require teacher or admin role for an API route
 */
export async function requireTeacherOrAdmin(): Promise<AuthCheckResult> {
  return requireRole("ADMIN", "SCHOOL_ADMIN", "TEACHER", "SUPER_ADMIN");
}

/**
 * Get current user without requiring authentication
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  return {
    id: session.user.id as string,
    name: session.user.name as string,
    email: session.user.email as string,
    role: (session.user as { role?: string }).role || "STAFF",
    image: session.user.image as string | undefined,
    schoolId: (session.user as { schoolId?: string | null }).schoolId ?? null,
  };
}

export async function hasRole(...roles: string[]): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  return roles.includes(user.role);
}

export async function isAdmin(): Promise<boolean> {
  return hasRole("ADMIN", "SCHOOL_ADMIN", "SUPER_ADMIN");
}

export async function isTeacherOrAdmin(): Promise<boolean> {
  return hasRole("ADMIN", "SCHOOL_ADMIN", "TEACHER", "SUPER_ADMIN");
}

/**
 * Get the current user's role from the session, or null if unauthenticated.
 * (Moved here from `@/lib/rbac` to keep that module edge-safe.)
 */
export async function getUserRole(): Promise<Role | null> {
  const session = await auth();
  return (session?.user as { role?: Role })?.role ?? null;
}

/**
 * Whether the current session may access the given route.
 * (Moved here from `@/lib/rbac` to keep that module edge-safe.)
 */
export async function canAccessRoute(pathname: string): Promise<boolean> {
  const role = await getUserRole();
  if (!role) return false;
  if (roleIsAdmin(role)) return true;
  if (requiresAdmin(pathname)) return false;
  return true;
}

export function unauthorizedResponse(message = "Unauthorized"): Response {
  return new Response(
    JSON.stringify({ success: false, error: message }),
    { status: 401, headers: { "Content-Type": "application/json" } }
  );
}

export function forbiddenResponse(message = "Forbidden"): Response {
  return new Response(
    JSON.stringify({ success: false, error: message }),
    { status: 403, headers: { "Content-Type": "application/json" } }
  );
}
