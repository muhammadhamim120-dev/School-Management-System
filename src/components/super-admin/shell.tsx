"use client";
import * as React from "react";
import { SuperAdminSidebar } from "@/components/super-admin/sidebar";
import { SuperAdminTopbar } from "@/components/super-admin/topbar";
import { AuroraBackground } from "@/components/ux/aurora-background";
import { PageTransition } from "@/components/ux/motion";

type Props = {
  children: React.ReactNode;
  user?: { name?: string | null; email?: string | null; image?: string | null };
};

export function SuperAdminShell({ children, user }: Props) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="relative flex min-h-screen">
      <AuroraBackground />
      <SuperAdminSidebar open={open} onClose={() => setOpen(false)} user={user} />
      <div className="flex min-w-0 flex-1 flex-col">
        <SuperAdminTopbar onMenu={() => setOpen(true)} user={user} />
        <main className="flex-1 p-4 lg:p-8">
          <div className="mx-auto w-full max-w-[1400px]">
            <PageTransition>{children}</PageTransition>
          </div>
        </main>
      </div>
    </div>
  );
}
