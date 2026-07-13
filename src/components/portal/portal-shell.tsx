"use client";
import * as React from "react";
import { PortalSidebar } from "./portal-sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { PageTransition } from "@/components/ux/motion";

type Props = {
  children: React.ReactNode;
  role: "PARENT" | "STUDENT";
  user?: { name?: string | null; email?: string | null; image?: string | null };
};

export function PortalShell({ children, role, user }: Props) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="relative flex min-h-screen">
      <PortalSidebar open={open} onClose={() => setOpen(false)} role={role} user={user} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenu={() => setOpen(true)} user={user} />
        <main className="flex-1 p-4 lg:p-8">
          <div className="mx-auto w-full max-w-[1400px]">
            <PageTransition>{children}</PageTransition>
          </div>
        </main>
      </div>
    </div>
  );
}
