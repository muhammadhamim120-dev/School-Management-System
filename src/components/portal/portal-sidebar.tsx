"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, X, PanelLeftClose, PanelLeft } from "lucide-react";
import { cn, initials, avatarUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { parentNavItems } from "./parent-nav";
import { studentNavItems } from "./student-nav";
import type { NavItem } from "@/lib/nav";

type Props = {
  open: boolean;
  onClose: () => void;
  role: "PARENT" | "STUDENT";
  user?: { name?: string | null; email?: string | null; image?: string | null };
};

const STORAGE_KEY = "sms-portal-sidebar-collapsed";

export function PortalSidebar({ open, onClose, role, user }: Props) {
  const pathname = usePathname();
  const items: NavItem[] = role === "STUDENT" ? studentNavItems : parentNavItems;
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

  const isActive = (href: string) =>
    pathname === href || (href !== "/portal" && pathname.startsWith(href));

  return (
    <>
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
          "flex h-14 shrink-0 items-center border-b border-border/50 px-3",
          isCollapsed ? "justify-center" : "justify-between"
        )}>
          <Link href="/portal" className={cn("flex items-center gap-2.5", isCollapsed && "justify-center")}>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-sm">
              <GraduationCap className="h-[18px] w-[18px]" />
            </span>
            {!isCollapsed && (
              <div className="leading-tight animate-fade-in">
                <div className="text-sm font-semibold tracking-tight">Greenwood</div>
                <div className="text-[11px] text-muted-foreground">
                  {role === "STUDENT" ? "Student Portal" : "Parent Portal"}
                </div>
              </div>
            )}
          </Link>
          {!isCollapsed && (
            <Button variant="ghost" size="icon" className="lg:hidden h-7 w-7" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={toggleCollapse}
          className="hidden lg:flex absolute -right-3 top-7 z-10 h-6 w-6 items-center justify-center rounded-full border bg-card shadow-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-150"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <PanelLeft className="h-3 w-3" /> : <PanelLeftClose className="h-3 w-3" />}
        </button>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-3">
          <div className="space-y-0.5">
            {items.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
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
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                  {isCollapsed && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 rounded-md bg-popover text-popover-foreground text-xs font-medium shadow-md border border-border opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 whitespace-nowrap">
                      {item.label}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="shrink-0 border-t border-border/50 p-2.5">
          <div className={cn(
            "flex items-center gap-2.5 rounded-lg px-2 py-2",
            isCollapsed && "justify-center px-0"
          )}>
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={user?.image || avatarUrl(user?.name)} alt={user?.name || "User"} />
              <AvatarFallback className="text-xs">{initials(user?.name)}</AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="min-w-0 flex-1 leading-tight animate-fade-in">
                <div className="truncate text-sm font-medium">{user?.name || "User"}</div>
                <div className="truncate text-[11px] text-muted-foreground">{user?.email || ""}</div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
