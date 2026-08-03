import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDashboardPath } from "@/lib/rbac";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { InfoGrid, InfoRow } from "@/components/dashboard/profile";

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  SCHOOL_ADMIN: "School Admin",
  ADMIN: "Administrator",
  TEACHER: "Teacher",
  STAFF: "Staff",
  ACCOUNTANT: "Accountant",
  PARENT: "Parent",
  STUDENT: "Student",
};

function initials(name?: string | null) {
  if (!name) return "U";
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

/**
 * Universal self-profile page — reachable by every authenticated role.
 * Kept OUTSIDE /dashboard so middleware does not bounce PARENT/STUDENT away.
 */
export default async function ProfilePage() {
  const session = await auth();
  const user = session?.user as
    | { name?: string; email?: string; image?: string | null; role?: string; schoolId?: string | null }
    | undefined;

  if (!user) redirect("/login");

  const org = user.schoolId
    ? await prisma.organization.findUnique({ where: { id: user.schoolId }, select: { name: true, slug: true } })
    : null;

  const role = user.role ?? "";
  const homeHref = getDashboardPath(role);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href={homeHref}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <h1 className="mb-1 text-2xl font-semibold tracking-tight">My Profile</h1>
      <p className="mb-6 text-sm text-muted-foreground">Your account details</p>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 ring-2 ring-primary/10">
              <AvatarImage src={user.image ?? undefined} alt={user.name ?? "User"} />
              <AvatarFallback className="text-lg font-semibold">{initials(user.name)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="text-lg font-semibold">{user.name ?? "—"}</div>
              <div className="text-sm text-muted-foreground">{user.email ?? "—"}</div>
            </div>
          </div>

          <div className="mt-6 border-t pt-4">
            <InfoGrid>
              <InfoRow label="Full name" value={user.name ?? "—"} />
              <InfoRow label="Email" value={user.email ?? "—"} mono />
              <InfoRow label="Role" value={ROLE_LABELS[role] ?? role ?? "—"} />
              <InfoRow label="School" value={org?.name ?? "—"} />
              {org?.slug && <InfoRow label="School code" value={org.slug} mono />}
            </InfoGrid>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
