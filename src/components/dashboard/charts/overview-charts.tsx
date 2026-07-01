"use client";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-sm shadow-float">
      {label && <div className="mb-1 font-medium">{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-muted-foreground">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.payload?.fill }} />
          <span className="text-foreground tabular-nums">{p.value}</span>
          <span>{p.name}</span>
        </div>
      ))}
    </div>
  );
}

export function GenderPie({ data }: { data: { name: string; value: number }[] }) {
  const hasData = data.some((d) => d.value > 0);
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gender distribution</CardTitle>
        <CardDescription>Breakdown across all enrolled students</CardDescription>
      </CardHeader>
      <CardContent className="h-72">
        {!hasData ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No data yet</div>
        ) : (
          <div className="flex h-full items-center gap-6">
            <div className="relative h-full flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data} dataKey="value" nameKey="name"
                    cx="50%" cy="50%" innerRadius={58} outerRadius={88}
                    paddingAngle={2} stroke="none"
                  >
                    {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-semibold tabular-nums">{total}</span>
                <span className="text-xs text-muted-foreground">Total</span>
              </div>
            </div>
            <div className="space-y-3">
              {data.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2.5 text-sm">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span className="text-muted-foreground">{d.name}</span>
                  <span className="font-medium tabular-nums">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ClassBar({ data }: { data: { name: string; students: number }[] }) {
  const hasData = data.length > 0;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Students per class</CardTitle>
        <CardDescription>Enrollment distribution by grade level</CardDescription>
      </CardHeader>
      <CardContent className="h-72">
        {!hasData ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0.55} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" />
              <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} stroke="hsl(var(--muted-foreground))" />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.5)" }} />
              <Bar dataKey="students" name="students" fill="url(#barFill)" radius={[6, 6, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
