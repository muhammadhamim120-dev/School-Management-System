"use client";
import Link from "next/link";
import * as React from "react";
import { usePathname } from "next/navigation";
import { GraduationCap, Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { useI18n } from "@/components/i18n-provider";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", key: "public.home" as const },
  { href: "/about", key: "public.about" as const },
  { href: "/admissions", key: "public.admissions" as const },
  { href: "/teachers", key: "public.faculty" as const },
  { href: "/gallery", key: "public.gallery" as const },
  { href: "/notices", key: "public.notices" as const },
  { href: "/events", key: "public.events" as const },
  { href: "/contact", key: "public.contact" as const },
];

export function PublicNavbar() {
  const pathname = usePathname();
  const { t } = useI18n();
  const [open, setOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center px-3 pt-3">
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "pointer-events-auto w-full max-w-6xl rounded-2xl transition-all duration-300",
          scrolled
            ? "glass border border-border/60 shadow-float"
            : "border border-transparent bg-transparent"
        )}
      >
        <div className="flex h-14 items-center justify-between px-4 sm:px-5">
          <Link href="/" className="group flex items-center gap-2 font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
              <GraduationCap className="h-[18px] w-[18px]" />
            </span>
            <span className="tracking-tight">Greenwood</span>
          </Link>

          <nav className="hidden items-center gap-0.5 lg:flex">
            {links.map((l) => {
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "relative rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                    active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 -z-10 rounded-lg bg-accent"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  {t(l.key)}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1.5">
            <LanguageToggle />
            <ThemeToggle />
            <Button asChild size="sm" variant="ghost" className="hidden lg:inline-flex">
              <Link href="/portal">{t("public.parentPortal")}</Link>
            </Button>
            <Button asChild size="sm" variant="ghost" className="hidden lg:inline-flex">
              <Link href="/pay">{t("public.payFees")}</Link>
            </Button>
            <Button asChild size="sm" className="hidden press lg:inline-flex">
              <Link href="/login">{t("public.portalLogin")}</Link>
            </Button>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu">
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {open && (
            <motion.nav
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden border-t border-border/50 lg:hidden"
            >
              <div className="flex flex-col gap-0.5 p-3">
                {links.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      pathname === l.href ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/60"
                    )}
                  >
                    {t(l.key)}
                  </Link>
                ))}
                <div className="mt-2 grid grid-cols-1 gap-2">
                  <Button asChild size="sm" variant="outline"><Link href="/portal" onClick={() => setOpen(false)}>{t("public.parentPortal")}</Link></Button>
                  <Button asChild size="sm" variant="outline"><Link href="/pay" onClick={() => setOpen(false)}>{t("public.payFees")}</Link></Button>
                  <Button asChild size="sm"><Link href="/login" onClick={() => setOpen(false)}>{t("public.portalLogin")}</Link></Button>
                </div>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </motion.header>
    </div>
  );
}
