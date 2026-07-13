import { auth } from "@/lib/auth";
import { AuthSessionProvider } from "@/components/session-provider";
import { PortalShell } from "@/components/portal/portal-shell";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;

  if (role !== "PARENT" && role !== "STUDENT") {
    return (
      <AuthSessionProvider>
        <div className="flex min-h-[100dvh] items-center justify-center text-muted-foreground">
          <p>Access denied. This portal is for parents and students only.</p>
        </div>
      </AuthSessionProvider>
    );
  }

  return (
    <AuthSessionProvider>
      <PortalShell role={role as "PARENT" | "STUDENT"} user={session?.user}>
        {children}
      </PortalShell>
    </AuthSessionProvider>
  );
}
