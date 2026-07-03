"use client";
import * as React from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { AuroraBackground } from "@/components/ux/aurora-background";
import { CommandPalette } from "@/components/ux/command-palette";
import { PageTransition } from "@/components/ux/motion";

type Props = {
  children: React.ReactNode;
  user?: { name?: string | null; email?: string | null; image?: string | null };
  notifications?: { id: string; title: string }[];
};

export function DashboardShell({ children, user, notifications }: Props) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="relative flex min-h-screen">
      {/* Animated aurora + mesh background behind everything */}
      <AuroraBackground />
      {/* ⌘K command palette (global) */}
      <CommandPalette />

      <Sidebar open={open} onClose={() => setOpen(false)} user={user} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenu={() => setOpen(true)} user={user} notifications={notifications} />
        <main className="flex-1 p-4 lg:p-8">
          <div className="mx-auto w-full max-w-[1400px]">
            <PageTransition>{children}</PageTransition>
          </div>
        </main>
      </div>
    </div>
  );
}
