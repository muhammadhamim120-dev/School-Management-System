"use client";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n-provider";

export function LanguageToggle() {
  const { locale, toggleLocale } = useI18n();
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLocale}
      className="gap-1.5"
      aria-label="Toggle language"
      title={locale === "en" ? "Switch to Bangla" : "Switch to English"}
    >
      <Languages className="h-4 w-4" />
      <span className="text-xs font-medium">{locale === "en" ? "বাংলা" : "EN"}</span>
    </Button>
  );
}
