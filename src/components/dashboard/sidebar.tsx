"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, X, PanelLeftClose, PanelLeft, LogOut } from "lucide-react";
import { navGroups, getNavGroupsForRole } from "@/lib/nav";
import { useI18n } from "@/components/i18n-provider";
import type { MessageKey } from "@/lib/i18n/messages";
import { cn, initials, avatarUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Props = {
  open: boolean;
  onClose: () => void;
  role?: string;
  user?: { name?: string | null; email?: string | null; image?: string | null };
};

const STORAGE_KEY = "sms-sidebar-collapsed";

export function Sidebar({ open, onClose, role, user }: Props) {
  const pathname = usePathname();
  const { t } = useI18n();
  const [collapsed, setCollapsed] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) setCollapsed(stored === "true");
    } catch {}
    setMounted(true);
  }, []);

  const toggleCollapse = React.useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem(STORAGE_KEY, String(next)); } catch {}
      return next;
    });
  }, []);

  const isCollapsed = mounted && collapsed;

  const labelKey: Record<string, MessageKey> = {
    "Dashboard": "nav.dashboard",
    "Students": "nav.students",
    "Teachers": "nav.teachers",
    "Parents": "nav.parents",
    "Classes": "nav.classes",
    "Subjects": "nav.subjects",
    "Attendance": "nav.attendance",
    "Examinations": "nav.exams",
    "Homework": "nav.homework",
    "Online Exam": "nav.onlineExam",
    "Results": "nav.results",
    "Board Registration": "nav.boardRegistration",
    "Academic Setup": "nav.academicSetup",
    "Finance": "nav.finance",
    "Payments": "nav.payments",
    "Library": "nav.library",
    "Transport": "nav.transport",
    "Hostel": "nav.hostel",
    "SMS": "nav.sms",
    "Admissions": "nav.admissions",
    "Parent Portal": "nav.parentPortal",
    "Dropout Risk": "nav.risk",
    "Fees": "nav.fees",
    "Notices": "nav.notices",
    "Events": "nav.events",
    "Settings": "nav.settings",
    "Timetable": "nav.timetable",
    "Coaching": "nav.coaching",
  };
  const groupKey: Record<string, MessageKey> = {
    "Overview": "navgroup.Overview",
    "People": "navgroup.People",
    "Academics": "navgroup.Academics",
    "Operations": "navgroup.Operations",
    "Engagement & Insights": "navgroup.Insights",
  };
  const filteredGroups = role ? getNavGroupsForRole(role) : navGroups;

  const tLabel = (label: string) => (labelKey[label] ? t(labelKey[label]) : label);
  const tGroup = (label: string) => (groupKey[label] ? t(groupKey[label]) : label);

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col",
          "border-r border-border bg-card",
          "lg:sticky lg:top-0 lg:h-screen",
          "lg:m-3 lg:h-[calc(100vh-1.5rem)] lg:rounded-2xl lg:border lg:border-border/60 glass lg:shadow-float lg:border-r-0",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          "transition-[width] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
          isCollapsed ? "w-[68px]" : "w-[280px] lg:w-[248px]"
        )}
      >
        {/* Header */}
        <div className={cn(
          "flex h-16 shrink-0 items-center border-b border-border/30 px-3",
          isCollapsed ? "justify-center" : "justify-between"
        )}>
          <Link href="/dashboard" className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20">
              <GraduationCap className="h-[18px] w-[18px]" />
            </span>
            {!isCollapsed && (
              <div className="leading-tight animate-fade-in">
                <div className="text-sm font-bold tracking-tight">Greenwood</div>
                <div className="text-[10px] font-medium text-muted-foreground/60">School Admin</div>
              </div>
            )}
          </Link>
          {!isCollapsed && (
            <Button variant="ghost" size="icon" className="lg:hidden h-7 w-7" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Collapse toggle — desktop only */}
        <button
          onClick={toggleCollapse}
          className="hidden lg:flex absolute -right-3 top-8 z-10 h-6 w-6 items-center justify-center rounded-full border bg-card shadow-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-150"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <PanelLeft className="h-3 w-3" /> : <PanelLeftClose className="h-3 w-3" />}
        </button>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-3">
          {filteredGroups.map((group) => (
            <div key={tGroup(group.label)} className={cn("mb-4", isCollapsed && "mb-3")}>
              {!isCollapsed && (
                <div className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
                  {tGroup(group.label)}
                </div>
              )}
              {isCollapsed && <div className="mx-auto mb-2 h-px w-6 bg-border/60" />}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;
                  const label = tLabel(item.label);

                  return (
                    <div key={item.href} className="relative group">
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          "sidebar-item",
                          isCollapsed && "justify-center px-0",
                          active && "active"
                        )}
                      >
                        <Icon className={cn(
                          "h-[18px] w-[18px] shrink-0 transition-colors duration-150",
                          active ? "text-primary" : ""
                        )} />
                        {!isCollapsed && <span className="truncate">{label}</span>}
                      </Link>
                      {/* CSS tooltip for collapsed state */}
                      {isCollapsed && (
                        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 rounded-md bg-popover text-popover-foreground text-xs font-medium shadow-md border border-border opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 whitespace-nowrap">
                          {label}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer — user card */}
        <div className="shrink-0 border-t border-border/30 p-2.5">
          <div className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-muted/40",
            isCollapsed && "justify-center px-0"
          )}>
            <Avatar className="h-9 w-9 shrink-0 ring-2 ring-primary/10">
              <AvatarImage src={user?.image || avatarUrl(user?.name)} alt={user?.name || "User"} />
              <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">{initials(user?.name)}</AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="min-w-0 flex-1 leading-tight animate-fade-in">
                <div className="truncate text-sm font-semibold">{user?.name || "Administrator"}</div>
                <div className="truncate text-[10px] text-muted-foreground/60">{user?.email || "admin@greenwood.edu"}</div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
