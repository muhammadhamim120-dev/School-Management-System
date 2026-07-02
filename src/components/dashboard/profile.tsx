"use client";
import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function ProfileBack({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" /> {label}
    </Link>
  );
}

/** A labeled field for info grids. */
export function InfoRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 py-2">
      <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className={cn("text-sm", mono && "tabular-nums")}>{value ?? "—"}</dd>
    </div>
  );
}

export function InfoGrid({ children }: { children: React.ReactNode }) {
  return <dl className="grid grid-cols-1 gap-x-8 sm:grid-cols-2 lg:grid-cols-3">{children}</dl>;
}

/** A compact metric tile for profile summaries. */
export function ProfileStat({
  label, value, icon: Icon, accent,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  accent?: string;
}) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg bg-muted", accent)}>
        <Icon className="h-[18px] w-[18px]" />
      </div>
      <div>
        <div className="text-lg font-semibold leading-none tabular-nums">{value}</div>
        <div className="mt-1 text-xs text-muted-foreground">{label}</div>
      </div>
    </Card>
  );
}

/** Vertical timeline item. */
export function TimelineItem({
  title, meta, last,
}: {
  title: React.ReactNode;
  meta?: string;
  last?: boolean;
}) {
  return (
    <li className="relative flex gap-4 pb-6 last:pb-0">
      {!last && <span className="absolute left-[7px] top-4 h-full w-px bg-border" />}
      <span className="relative mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-primary bg-background" />
      <div className="min-w-0">
        <div className="text-sm font-medium">{title}</div>
        {meta && <div className="text-xs text-muted-foreground">{meta}</div>}
      </div>
    </li>
  );
}
