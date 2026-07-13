import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { requiresAdmin, getDashboardPath } from "@/lib/rbac";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const role = (req.auth?.user as { role?: string })?.role;
  const schoolId = (req.auth?.user as { schoolId?: string | null })?.schoolId;
  const pathname = req.nextUrl.pathname;

  const isDashboard = pathname.startsWith("/dashboard");
  const isSuperAdmin = pathname.startsWith("/super-admin");
  const isPortal = pathname.startsWith("/portal");
  const isAuthPage = ["/login", "/forgot-password", "/reset-password"].some((p) =>
    pathname.startsWith(p)
  );

  // Redirect unauthenticated users to login
  if ((isDashboard || isSuperAdmin || isPortal) && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  // Redirect authenticated users away from auth pages
  if (isAuthPage && isLoggedIn) {
    const dest = getDashboardPath(role ?? "");
    return NextResponse.redirect(new URL(dest, req.nextUrl));
  }

  // SUPER_ADMIN must use /super-admin, not /dashboard
  if (role === "SUPER_ADMIN" && isDashboard) {
    return NextResponse.redirect(new URL("/super-admin", req.nextUrl));
  }

  // Non-SUPER_ADMIN cannot access /super-admin
  if (role !== "SUPER_ADMIN" && isSuperAdmin) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  // PARENT → portal routes
  if (role === "PARENT" && isDashboard) {
    return NextResponse.redirect(new URL("/portal/parent", req.nextUrl));
  }

  // STUDENT → portal routes
  if (role === "STUDENT" && isDashboard) {
    return NextResponse.redirect(new URL("/portal/student", req.nextUrl));
  }

  // RBAC: Check admin-only routes
  if (isLoggedIn && isDashboard && requiresAdmin(pathname)) {
    if (!["ADMIN", "SCHOOL_ADMIN", "SUPER_ADMIN"].includes(role ?? "")) {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }
  }

  // Tenant validation: ensure schoolId exists for non-SUPER_ADMIN
  if (role && role !== "SUPER_ADMIN" && !schoolId) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/super-admin/:path*", "/portal/:path*", "/login", "/forgot-password", "/reset-password"],
};
