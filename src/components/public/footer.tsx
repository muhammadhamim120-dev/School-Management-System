"use client";
import Link from "next/link";
import { GraduationCap, Mail, Phone, MapPin } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { Reveal } from "@/components/public/section";

export function PublicFooter() {
  const { t } = useI18n();
  return (
    <footer className="px-3 pb-3 pt-10">
      <Reveal>
        <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl border border-border/60 glass shadow-float">
          <div className="grid gap-8 p-6 sm:p-8 md:grid-cols-2 lg:grid-cols-4 lg:p-10">
            <div className="space-y-3">
              <Link href="/" className="flex items-center gap-2 font-semibold">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
                  <GraduationCap className="h-[18px] w-[18px]" />
                </span>
                Greenwood
              </Link>
              <p className="text-sm text-muted-foreground">{t("footer.tagline")}</p>
            </div>
            <div>
              <h4 className="mb-3 font-semibold">{t("footer.quickLinks")}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about" className="transition-colors hover:text-primary">{t("footer.aboutUs")}</Link></li>
                <li><Link href="/admissions" className="transition-colors hover:text-primary">{t("public.admissions")}</Link></li>
                <li><Link href="/teachers" className="transition-colors hover:text-primary">{t("public.faculty")}</Link></li>
                <li><Link href="/gallery" className="transition-colors hover:text-primary">{t("public.gallery")}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 font-semibold">{t("footer.resources")}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/notices" className="transition-colors hover:text-primary">{t("footer.noticeBoard")}</Link></li>
                <li><Link href="/events" className="transition-colors hover:text-primary">{t("public.events")}</Link></li>
                <li><Link href="/contact" className="transition-colors hover:text-primary">{t("public.contact")}</Link></li>
                <li><Link href="/portal" className="transition-colors hover:text-primary">{t("public.parentPortal")}</Link></li>
                <li><Link href="/login" className="transition-colors hover:text-primary">{t("public.portalLogin")}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 font-semibold">{t("footer.getInTouch")}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> 123 Education Blvd, Springfield</li>
                <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> +1 555 0100</li>
                <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> info@greenwood.edu</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border/50 py-4 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Greenwood International School. {t("footer.rights")}
          </div>
        </div>
      </Reveal>
    </footer>
  );
}
