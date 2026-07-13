"use client";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AnimatedCounter } from "@/components/ux/motion";

const ACCENT_STYLES: Record<string, { bg: string; icon: string; glow: string }> = {
  primary: {
    bg: "bg-gradient-to-br from-primary/10 to-primary/5",
    icon: "text-primary",
    glow: "from-primary/20",
  },
  success: {
    bg: "bg-gradient-to-br from-success/10 to-success/5",
    icon: "text-success",
    glow: "from-success/20",
  },
  warning: {
    bg: "bg-gradient-to-br from-warning/10 to-warning/5",
    icon: "text-warning",
    glow: "from-warning/20",
  },
  chart3: {
    bg: "bg-gradient-to-br from-[hsl(var(--chart-3))]/10 to-[hsl(var(--chart-3))]/5",
    icon: "text-[hsl(var(--chart-3))]",
    glow: "from-[hsl(var(--chart-3))]/20",
  },
};

export function StatCard({
  label, value, icon: Icon, accent = "primary", hint, trend, count, format,
}: {
  label: string;
  value?: string | number;
  icon: LucideIcon;
  accent?: string;
  hint?: string;
  trend?: { value: string; direction: "up" | "down" };
  count?: number;
  format?: (n: number) => string;
}) {
  const styles = ACCENT_STYLES[accent] || ACCENT_STYLES.primary;

  return (
    <Card className="group relative overflow-hidden rounded-2xl border-border/40 p-5 transition-all duration-300 hover:shadow-elevated hover:border-border/80 hover:-translate-y-0.5">
      {/* Gradient glow on hover */}
      <div className={cn(
        "pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100",
        styles.glow
      )} />

      {/* Accent line at top */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative flex items-start justify-between">
        <div className="space-y-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">{label}</p>
          <p className="text-3xl font-bold leading-none tracking-tight tabular-nums">
            {count !== undefined ? <AnimatedCounter value={count} format={format} /> : value}
          </p>
        </div>
        <div className={cn(
          "flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-300",
          "ring-1 ring-border/30",
          "group-hover:ring-0 group-hover:scale-110",
          styles.bg
        )}>
          <Icon className={cn("h-5 w-5", styles.icon)} />
        </div>
      </div>

      {(trend || hint) && (
        <div className="relative mt-4 flex items-center gap-2 text-xs">
          {trend && (
            <span className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-semibold tabular-nums",
              trend.direction === "up" ? "bg-success/12 text-success" : "bg-destructive/10 text-destructive"
            )}>
              {trend.direction === "up" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {trend.value}
            </span>
          )}
          {hint && <span className="text-muted-foreground/50">{hint}</span>}
        </div>
      )}
    </Card>
  );
}
