export type Role = "SUPER_ADMIN" | "SCHOOL_ADMIN" | "ADMIN" | "TEACHER" | "STAFF" | "PARENT" | "STUDENT" | "ACCOUNTANT";

// Role hierarchy for permission checks (higher = more access)
const ROLE_HIERARCHY: Record<string, number> = {
  SUPER_ADMIN: 100,
  SCHOOL_ADMIN: 80,
  ADMIN: 80, // backward compat alias
  ACCOUNTANT: 60,
  TEACHER: 40,
  STAFF: 40,
  PARENT: 20,
  STUDENT: 10,
};

// Routes that require admin access
const ADMIN_ROUTES = [
  "/dashboard/settings",
  "/dashboard/finance",
  "/dashboard/payments",
  "/dashboard/academic",
  "/dashboard/board-registrations",
];

const ADMIN_API_ROUTES = [
  "/api/settings",
  "/api/finance-summary",
  "/api/campuses",
];

function matchesRoute(path: string, patterns: string[]): boolean {
  return patterns.some((pattern) => path.startsWith(pattern));
}

export function hasPermission(userRole: string, requiredLevel: number): boolean {
  return (ROLE_HIERARCHY[userRole] ?? 0) >= requiredLevel;
}

export function isAdmin(role: string | undefined): boolean {
  return role === "ADMIN" || role === "SCHOOL_ADMIN" || role === "SUPER_ADMIN";
}

export function isTeacherOrAdmin(role: string | undefined): boolean {
  return role === "ADMIN" || role === "SCHOOL_ADMIN" || role === "TEACHER" || role === "SUPER_ADMIN";
}

export function isSuperAdmin(role: string | undefined): boolean {
  return role === "SUPER_ADMIN";
}

export function isSchoolStaff(role: string | undefined): boolean {
  return ["ADMIN", "SCHOOL_ADMIN", "TEACHER", "STAFF", "ACCOUNTANT"].includes(role ?? "");
}

export function requiresAdmin(pathname: string): boolean {
  return matchesRoute(pathname, ADMIN_ROUTES);
}

export function requiresAdminApi(pathname: string): boolean {
  return matchesRoute(pathname, ADMIN_API_ROUTES);
}

export async function getUserRole(): Promise<Role | null> {
  // Lazy import keeps `@/lib/auth` (Prisma/bcrypt) out of this module's static
  // import graph, so middleware can import the pure helpers above edge-safely.
  const { auth } = await import("@/lib/auth");
  const session = await auth();
  return (session?.user as { role?: Role })?.role ?? null;
}

export async function canAccessRoute(pathname: string): Promise<boolean> {
  const role = await getUserRole();
  if (!role) return false;
  if (isAdmin(role)) return true;
  if (requiresAdmin(pathname)) return false;
  return true;
}

/**
 * Get the dashboard base path for a given role.
 */
export function getDashboardPath(role: string): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "/super-admin";
    case "PARENT":
      return "/portal/parent";
    case "STUDENT":
      return "/portal/student";
    default:
      return "/dashboard";
  }
}
