import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isDashboard = req.nextUrl.pathname.startsWith("/dashboard");
  const isAuthPage = ["/login", "/forgot-password", "/reset-password"].some((p) =>
    req.nextUrl.pathname.startsWith(p)
  );

  if (isDashboard && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }
  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/forgot-password", "/reset-password"],
};
