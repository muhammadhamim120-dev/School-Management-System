import { auth } from "@/lib/auth";

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;

  if (role !== "PARENT") {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center text-muted-foreground">
        <p>Access denied. This portal is for parents only.</p>
      </div>
    );
  }

  return <>{children}</>;
}
