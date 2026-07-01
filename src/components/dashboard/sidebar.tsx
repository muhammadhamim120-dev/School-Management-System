"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, X } from "lucide-react";
import { navGroups } from "@/lib/nav";
import { cn, initials, avatarUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Props = {
  open: boolean;
  onClose: () => void;
  user?: { name?: string | null; email?: string | null; image?: string | null };
};

export function Sidebar({ open, onClose, user }: Props) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-border bg-card transition-transform duration-200 ease-out lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-sm">
              <GraduationCap className="h-[18px] w-[18px]" />
            </span>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight">Greenwood</div>
              <div className="text-[11px] text-muted-foreground">School Admin</div>
            </div>
          </Link>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
          {navGroups.map((group) => (
            <div key={group.label}>
              <div className="mb-1.5 px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                {group.label}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150",
                        active
                          ? "bg-accent text-foreground"
                          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                      )}
                    >
                      {active && (
                        <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-primary" />
                      )}
                      <Icon
                        className={cn(
                          "h-[18px] w-[18px] shrink-0 transition-colors",
                          active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                        )}
                      />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.image || avatarUrl(user?.name)} alt={user?.name || "User"} />
              <AvatarFallback className="text-xs">{initials(user?.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-sm font-medium">{user?.name || "Administrator"}</div>
              <div className="truncate text-[11px] text-muted-foreground">{user?.email || "admin@greenwood.edu"}</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
