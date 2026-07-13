"use client";
import { useI18n } from "@/components/i18n-provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type ShiftFilterValue = "ALL" | "MORNING" | "DAY" | "EVENING";

/** Reusable shift selector with an "All shifts" option, for list-page filtering. */
export function ShiftFilter({
  value, onChange, className,
}: {
  value: ShiftFilterValue;
  onChange: (v: ShiftFilterValue) => void;
  className?: string;
}) {
  const { t } = useI18n();
  return (
    <Select value={value} onValueChange={(v) => onChange(v as ShiftFilterValue)}>
      <SelectTrigger className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">{t("shift.all")}</SelectItem>
        <SelectItem value="MORNING">{t("shift.MORNING")}</SelectItem>
        <SelectItem value="DAY">{t("shift.DAY")}</SelectItem>
        <SelectItem value="EVENING">{t("shift.EVENING")}</SelectItem>
      </SelectContent>
    </Select>
  );
}
