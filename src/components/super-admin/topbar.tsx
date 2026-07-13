"use client";
import * as React from "react";
import { usePathname } from "next/navigation";
import { Menu, Bell, LogOut, User, Search } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { superAdminNavItems } from "@/components/super-admin/nav";
import { initials, avatarUrl } from "@/lib/utils";

type Props = {
  onMenu: () => void;
  user?: { name?: string | null; email?: string | null; image?: string | null };
};

export function SuperAdminTopbar({ onMenu, user }: Props) {
  const pathname = usePathname();

  const match = [...superAdminNavItems]
    .sort((a, b) => b.href.length - a.href.length)
    .find(
      (i) =>
        pathname === i.href ||
        (i.href !== "/super-admin" && pathname.startsWith(i.href)),
    );
  const title = match?.label ?? "Dashboard";

  return (
    <header className="glass-subtle sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/60 bg-background/70 px-4 lg:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenu}>
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex items-center gap-2 text-sm">
        <span className="hidden text-muted-foreground sm:inline">Super Admin</span>
        <span className="hidden text-muted-foreground/50 sm:inline">/</span>
        <span className="font-medium">{title}</span>
      </div>

      <div className="flex-1" />

      <button
        type="button"
        className="press hidden items-center gap-2 rounded-lg border border-border/60 bg-card/60 px-3 py-1.5 text-sm text-muted-foreground shadow-xs transition-colors hover:bg-accent md:flex"
      >
        <Search className="h-4 w-4" />
        <span>Search…</span>
        <kbd className="ml-3 rounded border border-border bg-muted px-1.5 py-0.5 font-sans text-[10px] font-medium text-muted-foreground">
          ⌘K
        </kbd>
      </button>

      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-5 w-5" />
      </Button>

      <ThemeToggle />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring/50">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={user?.image || avatarUrl(user?.name)}
                alt={user?.name || "User"}
              />
              <AvatarFallback className="text-xs">{initials(user?.name)}</AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="font-medium">{user?.name || "Super Admin"}</div>
            <div className="text-xs font-normal text-muted-foreground">{user?.email}</div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <User className="h-4 w-4" /> Profile
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
