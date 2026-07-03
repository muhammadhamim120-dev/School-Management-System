import { GraduationCap } from "lucide-react";
import { AuroraBackground } from "@/components/ux/aurora-background";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <AuroraBackground />
      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-float">
            <GraduationCap className="h-7 w-7" />
          </span>
          <h1 className="text-xl font-semibold tracking-tight">Greenwood International School</h1>
          <p className="text-sm text-muted-foreground">School Management System</p>
        </div>
        {children}
      </div>
    </div>
  );
}
