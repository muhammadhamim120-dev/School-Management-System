import { GraduationCap } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <GraduationCap className="h-7 w-7" />
          </span>
          <h1 className="text-xl font-bold">Greenwood International School</h1>
          <p className="text-sm text-muted-foreground">School Management System</p>
        </div>
        {children}
      </div>
    </div>
  );
}
