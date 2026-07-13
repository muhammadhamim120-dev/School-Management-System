import { auth } from "@/lib/auth";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;

  if (role !== "STUDENT") {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center text-muted-foreground">
        <p>Access denied. This portal is for students only.</p>
      </div>
    );
  }

  return <>{children}</>;
}
