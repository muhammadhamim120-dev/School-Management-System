// Locale-aware formatting for Bangla (bn) and English (en).
// Pure functions — safe to use on server or client.

export type Locale = "en" | "bn";

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

/** Convert ASCII digits in a string/number to Bangla digits when locale is "bn". */
export function toLocaleDigits(value: string | number, locale: Locale): string {
  const s = String(value);
  if (locale !== "bn") return s;
  return s.replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}

/** Format an integer/decimal with grouping, localized digits. */
export function formatNumber(value: number | null | undefined, locale: Locale): string {
  const n = value ?? 0;
  const grouped = new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-US").format(n);
  // Intl already yields Bangla digits for bn-BD in most runtimes; enforce for safety.
  return locale === "bn" ? toLocaleDigits(grouped.replace(/[০-৯]/g, (c) => String(BN_DIGITS.indexOf(c))), "bn") : grouped;
}

/** Currency formatting. Bangladesh uses BDT (৳); English view keeps USD for existing data compatibility. */
export function formatMoney(value: number | null | undefined, locale: Locale): string {
  const n = value ?? 0;
  if (locale === "bn") {
    const formatted = new Intl.NumberFormat("bn-BD", { maximumFractionDigits: 2 }).format(n);
    return `৳ ${toLocaleDigits(formatted.replace(/[০-৯]/g, (c) => String(BN_DIGITS.indexOf(c))), "bn")}`;
  }
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

/** Localized date formatting. */
export function formatLocaleDate(
  date: Date | string | null | undefined,
  locale: Locale,
  opts: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" }
): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  const formatted = new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-US", opts).format(d);
  return locale === "bn" ? toLocaleDigits(formatted, "bn") : formatted;
}
