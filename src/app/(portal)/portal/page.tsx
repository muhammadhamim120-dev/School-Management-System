import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/**
 * /portal entry point.
 *
 * The standalone Student-ID + phone/DOB portal has been retired in favour of a
 * single email/password login for everyone. Parents and students are routed to
 * their session-based portal; anyone else is sent to the standard login.
 *
 * (Unauthenticated visitors are already redirected to /login by middleware
 * before this runs.)
 */
export default async function PortalEntry() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;

  if (role === "PARENT") redirect("/parent");
  if (role === "STUDENT") redirect("/student");
  redirect("/login");
}
