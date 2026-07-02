"use client";
import Link from "next/link";
import { GraduationCap, Mail, Phone, MapPin } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";

export function PublicFooter() {
  const { t } = useI18n();
  return (
    <footer className="border-t bg-card">
      <div className="container grid gap-8 py-12 md:grid-cols-4">
        <div className="space-y-3">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="h-5 w-5" />
            </span>
            Greenwood
          </Link>
          <p className="text-sm text-muted-foreground">
            {t("footer.tagline")}
          </p>
        </div>
        <div>
          <h4 className="mb-3 font-semibold">{t("footer.quickLinks")}</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/about" className="hover:text-primary">{t("footer.aboutUs")}</Link></li>
            <li><Link href="/admissions" className="hover:text-primary">{t("public.admissions")}</Link></li>
            <li><Link href="/teachers" className="hover:text-primary">{t("public.faculty")}</Link></li>
            <li><Link href="/gallery" className="hover:text-primary">{t("public.gallery")}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold">{t("footer.resources")}</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/notices" className="hover:text-primary">{t("footer.noticeBoard")}</Link></li>
            <li><Link href="/events" className="hover:text-primary">{t("public.events")}</Link></li>
            <li><Link href="/contact" className="hover:text-primary">{t("public.contact")}</Link></li>
            <li><Link href="/login" className="hover:text-primary">{t("public.portalLogin")}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold">{t("footer.getInTouch")}</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><MapPin className="h-4 w-4" /> 123 Education Blvd, Springfield</li>
            <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> +1 555 0100</li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> info@greenwood.edu</li>
          </ul>
        </div>
      </div>
      <div className="border-t py-4 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Greenwood International School. {t("footer.rights")}
      </div>
    </footer>
  );
}
