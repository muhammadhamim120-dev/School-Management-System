import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/dashboard/shell";
import { AuthSessionProvider } from "@/components/session-provider";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  let notifications: { id: string; title: string }[] = [];
  try {
    const notices = await prisma.notice.findMany({ take: 6, orderBy: { createdAt: "desc" } });
    notifications = notices.map((n: { id: string; title: string }) => ({ id: n.id, title: n.title }));
  } catch {
    notifications = [];
  }
  const role = (session?.user as { role?: string })?.role;
  return (
    <AuthSessionProvider>
      <DashboardShell role={role} user={session?.user} notifications={notifications}>
        {children}
      </DashboardShell>
    </AuthSessionProvider>
  );
}
