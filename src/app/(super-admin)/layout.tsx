import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SuperAdminShell } from "@/components/super-admin/shell";
import { AuthSessionProvider } from "@/components/session-provider";

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if ((session.user as any).role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  return (
    <AuthSessionProvider>
      <SuperAdminShell user={session.user}>
        {children}
      </SuperAdminShell>
    </AuthSessionProvider>
  );
}
