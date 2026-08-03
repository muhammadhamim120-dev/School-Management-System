"use client";
import * as React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, Bell, LogOut, User, Search, Settings, HelpCircle, Plus, Home } from "lucide-react";
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
  "/dashboard/timetable": "nav.timetable",
  "/dashboard/coaching": "nav.coaching",
  "/dashboard/exams": "nav.exams",
  "/dashboard/results": "nav.results",
  "/dashboard/board-registrations": "nav.boardRegistration",
  "/dashboard/academic": "nav.academicSetup",
  "/dashboard/finance": "nav.finance",
  "/dashboard/payments": "nav.payments",
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
  const isDashboard = href === "/dashboard";

  return (
    <header className="glass-subtle sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/50 bg-background px-4 lg:px-6">
      {/* Mobile menu */}
      <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9" onClick={onMenu}>
        <Menu className="h-5 w-5" />
      </Button>

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm">
        <Link
          href="/dashboard"
          className="flex items-center gap-1 text-muted-foreground/50 hover:text-foreground transition-colors"
        >
          <Home className="h-3.5 w-3.5" />
        </Link>
        {!isDashboard && (
          <>
            <span className="text-muted-foreground/30">/</span>
            <span className="font-semibold text-foreground">{title}</span>
          </>
        )}
        {isDashboard && (
          <span className="font-semibold text-foreground">{title}</span>
        )}
      </nav>

      <div className="flex-1" />

      {/* Search */}
      <button
        type="button"
        onClick={() => window.dispatchEvent(new Event("open-command-palette"))}
        className="press hidden items-center gap-2.5 rounded-xl border border-border/40 bg-muted/30 px-3.5 py-2 text-sm text-muted-foreground/60 shadow-xs transition-all duration-200 hover:bg-accent hover:border-border hover:text-foreground md:flex"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Search…</span>
        <kbd className="ml-3 rounded-md border border-border/60 bg-background px-1.5 py-0.5 font-sans text-[10px] font-medium text-muted-foreground/40">⌘K</kbd>
      </button>

      {/* Quick actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9 hidden sm:flex">
            <Plus className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <Link href="/dashboard/students">Add Student</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/teachers">Add Teacher</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/notices">Post Notice</Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Notifications */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative h-9 w-9">
            <Bell className="h-4 w-4" />
            {notifications.length > 0 && (
              <span className="notification-badge">
                {notifications.length > 9 ? "9+" : notifications.length}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span className="text-sm font-semibold">Notifications</span>
            {notifications.length > 0 && (
              <span className="text-xs font-medium text-primary">{notifications.length} new</span>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {notifications.length === 0 ? (
            <div className="px-2 py-10 text-center">
              <Bell className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm font-medium text-muted-foreground">You&apos;re all caught up</p>
              <p className="text-xs text-muted-foreground/60 mt-1">No new notifications</p>
            </div>
          ) : (
            notifications.slice(0, 6).map((n) => (
              <DropdownMenuItem key={n.id} className="flex items-start gap-2.5 py-2.5 cursor-pointer">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span className="text-sm font-medium leading-snug">{n.title}</span>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <LanguageToggle />
      <ThemeToggle />

      {/* Profile menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring/50 transition-opacity hover:opacity-80">
            <Avatar className="h-9 w-9 ring-2 ring-primary/10">
              <AvatarImage src={user?.image || avatarUrl(user?.name)} alt={user?.name || "User"} />
              <AvatarFallback className="text-xs font-semibold">{initials(user?.name)}</AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="font-semibold">{user?.name || "Administrator"}</div>
            <div className="text-xs font-normal text-muted-foreground">{user?.email}</div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/profile">
              <User className="h-4 w-4" /> Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/settings">
              <Settings className="h-4 w-4" /> Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <HelpCircle className="h-4 w-4" /> Help
          </DropdownMenuItem>
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
