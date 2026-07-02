"use client";
import * as React from "react";
import { usePathname } from "next/navigation";
import { Menu, Bell, LogOut, User, Search } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { navItems } from "@/lib/nav";
import { useI18n } from "@/components/i18n-provider";
import type { MessageKey } from "@/lib/i18n/messages";
import { initials, avatarUrl } from "@/lib/utils";

type Props = {
  onMenu: () => void;
  user?: { name?: string | null; email?: string | null; image?: string | null };
  notifications?: { id: string; title: string }[];
};

function usePageHref() {
  const pathname = usePathname();
  const match = [...navItems]
    .sort((a, b) => b.href.length - a.href.length)
    .find((i) => pathname === i.href || (i.href !== "/dashboard" && pathname.startsWith(i.href)));
  return match?.href ?? "/dashboard";
}

const breadcrumbKey: Record<string, MessageKey> = {
  "/dashboard": "nav.dashboard",
  "/dashboard/students": "nav.students",
  "/dashboard/teachers": "nav.teachers",
  "/dashboard/parents": "nav.parents",
  "/dashboard/classes": "nav.classes",
  "/dashboard/subjects": "nav.subjects",
  "/dashboard/attendance": "nav.attendance",
  "/dashboard/exams": "nav.exams",
  "/dashboard/results": "nav.results",
  "/dashboard/board-registrations": "nav.boardRegistration",
  "/dashboard/academic": "nav.academicSetup",
  "/dashboard/finance": "nav.finance",
  "/dashboard/library": "nav.library",
  "/dashboard/transport": "nav.transport",
  "/dashboard/hostel": "nav.hostel",
  "/dashboard/sms": "nav.sms",
  "/dashboard/admissions": "nav.admissions",
  "/dashboard/parent-portal": "nav.parentPortal",
  "/dashboard/risk": "nav.risk",
  "/dashboard/fees": "nav.fees",
  "/dashboard/notices": "nav.notices",
  "/dashboard/events": "nav.events",
  "/dashboard/settings": "nav.settings",
};

export function Topbar({ onMenu, user, notifications = [] }: Props) {
  const { t } = useI18n();
  const href = usePageHref();
  const title = breadcrumbKey[href] ? t(breadcrumbKey[href]) : t("nav.dashboard");

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/70 px-4 backdrop-blur-xl lg:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenu}>
        <Menu className="h-5 w-5" />
      </Button>

      {/* Breadcrumb / context */}
      <div className="flex items-center gap-2 text-sm">
        <span className="hidden text-muted-foreground sm:inline">Greenwood</span>
        <span className="hidden text-muted-foreground/50 sm:inline">/</span>
        <span className="font-medium">{title}</span>
      </div>

      <div className="flex-1" />

      {/* Search affordance (command-palette style) */}
      <button
        type="button"
        className="hidden items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground shadow-xs transition-colors hover:bg-accent md:flex"
      >
        <Search className="h-4 w-4" />
        <span>Search…</span>
        <kbd className="ml-3 rounded border border-border bg-muted px-1.5 py-0.5 font-sans text-[10px] font-medium text-muted-foreground">⌘K</kbd>
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {notifications.length > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Notifications</span>
            <span className="text-xs font-normal text-muted-foreground">{notifications.length} new</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {notifications.length === 0 ? (
            <div className="px-2 py-8 text-center text-sm text-muted-foreground">You&apos;re all caught up</div>
          ) : (
            notifications.slice(0, 6).map((n) => (
              <DropdownMenuItem key={n.id} className="flex items-start gap-2.5 py-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span className="text-sm font-medium leading-snug">{n.title}</span>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <LanguageToggle />
      <ThemeToggle />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring/50">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.image || avatarUrl(user?.name)} alt={user?.name || "User"} />
              <AvatarFallback className="text-xs">{initials(user?.name)}</AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="font-medium">{user?.name || "Administrator"}</div>
            <div className="text-xs font-normal text-muted-foreground">{user?.email}</div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem><User className="h-4 w-4" /> Profile</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-4 w-4" /> Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
