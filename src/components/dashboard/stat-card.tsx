import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  label, value, icon: Icon, accent = "text-primary", hint, trend,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: string;
  hint?: string;
  trend?: { value: string; direction: "up" | "down" };
}) {
  return (
    <Card className="group relative overflow-hidden p-5 transition-all duration-200 hover:shadow-elevated hover:-translate-y-0.5">
      <div className="flex items-start justify-between">
        <div className="space-y-2.5">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-[28px] font-semibold leading-none tracking-tight tabular-nums">{value}</p>
        </div>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg bg-muted transition-colors group-hover:bg-accent", accent)}>
          <Icon className="h-[18px] w-[18px]" />
        </div>
      </div>
      {(trend || hint) && (
        <div className="mt-4 flex items-center gap-2 text-xs">
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium tabular-nums",
                trend.direction === "up" ? "bg-success/12 text-success" : "bg-destructive/10 text-destructive"
              )}
            >
              {trend.direction === "up" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {trend.value}
            </span>
          )}
          {hint && <span className="text-muted-foreground">{hint}</span>}
        </div>
      )}
    </Card>
  );
}
