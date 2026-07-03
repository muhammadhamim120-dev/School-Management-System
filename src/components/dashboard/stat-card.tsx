"use client";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AnimatedCounter } from "@/components/ux/motion";

export function StatCard({
  label, value, icon: Icon, accent = "text-primary", hint, trend, count, format,
}: {
  label: string;
  value?: string | number;
  icon: LucideIcon;
  accent?: string;
  hint?: string;
  trend?: { value: string; direction: "up" | "down" };
  /** If provided, the value animates counting up from 0 (formatted via `format`). */
  count?: number;
  format?: (n: number) => string;
}) {
  return (
    <Card className="group glow relative overflow-hidden rounded-2xl p-5 lift">
      {/* accent glow revealed on hover */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/[0.08] opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative flex items-start justify-between">
        <div className="space-y-2.5">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-[30px] font-semibold leading-none tracking-tight tabular-nums">
            {count !== undefined ? <AnimatedCounter value={count} format={format} /> : value}
          </p>
        </div>
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl bg-muted ring-1 ring-border/50 transition-all group-hover:bg-accent group-hover:ring-primary/25", accent)}>
          <Icon className="h-[19px] w-[19px]" />
        </div>
      </div>
      {(trend || hint) && (
        <div className="relative mt-4 flex items-center gap-2 text-xs">
          {trend && (
            <span className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium tabular-nums",
              trend.direction === "up" ? "bg-success/12 text-success" : "bg-destructive/10 text-destructive"
            )}>
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
