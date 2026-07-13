"use client";
import * as React from "react";
import Link from "next/link";
import {
  Users, GraduationCap, DollarSign, CalendarCheck, ArrowRight, Plus, Bell,
  CalendarDays, AlertTriangle, Crown, TrendingUp, BookOpen, Clock,
  Activity, ChevronRight, Sparkles, BarChart3, FileText, UserPlus, Send,
  GraduationCap as StaffIcon, CreditCard, ClipboardList, Megaphone,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { GenderPie, ClassBar } from "@/components/dashboard/charts/overview-charts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { request } from "@/services/api-client";
import { formatDate, initials, avatarUrl } from "@/lib/utils";
import { useI18n } from "@/components/i18n-provider";
import { Stagger, StaggerItem } from "@/components/ux/motion";

type DashboardData = {
  stats: { students: number; teachers: number; parents: number; classes: number; revenue: number; attendanceRate: number };
  genderDistribution: { name: string; value: number }[];
  classDistribution: { name: string; students: number }[];
  recentStudents: { id: string; fullName: string; photo?: string | null; class?: { name: string } | null; createdAt: string }[];
  recentTeachers: { id: string; fullName: string; photo?: string | null; department?: string | null }[];
  recentParents: { id: string; fullName: string; photo?: string | null; occupation?: string | null }[];
};

type SubscriptionData = {
  subscription: { tier: string; status: string; monthlyPrice: number; currentPeriodEnd?: string | null; trialEndsAt?: string | null };
  limits: { maxStudents: number; maxTeachers: number; maxStorageMb: number; label: string };
  usage: {
    students: { current: number; max: number };
    teachers: { current: number; max: number };
  };
};

function UsageBar({ label, current, max }: { label: string; current: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0;
  const nearLimit = pct >= 80;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className={nearLimit ? "font-semibold text-amber-600 tabular-nums" : "tabular-nums font-medium"}>
          {current.toLocaleString()} / {max.toLocaleString()}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${nearLimit ? "bg-gradient-to-r from-amber-500 to-amber-400" : "bg-gradient-to-r from-primary to-primary/70"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function WelcomeBanner({ userName }: { userName?: string | null }) {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-primary/[0.03] via-background to-[hsl(var(--chart-3))]/[0.02] p-6 sm:p-8">
      {/* Decorative gradient blobs */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/[0.06] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-[hsl(var(--chart-2))]/[0.05] blur-3xl" />

      <div className="relative">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {greeting}, {userName?.split(" ")[0] || "Admin"} <span className="inline-block animate-[wave_1.8s_ease-in-out_infinite]">👋</span>
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Here&apos;s what&apos;s happening at your school today
            </p>
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground sm:mt-0">
            <CalendarDays className="h-4 w-4" />
            <span className="font-medium">{dateStr}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickActionCard({
  label, description, href, icon: Icon, color,
}: {
  label: string;
  description: string;
  href: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Link href={href} className="group block">
      <div className="flex items-center gap-4 rounded-xl border border-border/40 bg-card p-4 transition-all duration-300 hover:shadow-elevated hover:border-border/80 hover:-translate-y-0.5">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground/40 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-muted-foreground" />
      </div>
    </Link>
  );
}

function ActivityItem({
  icon: Icon, title, time, color,
}: {
  icon: React.ElementType;
  title: string;
  time: string;
  color: string;
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${color}`}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-snug">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{time}</p>
      </div>
    </div>
  );
}

function PersonRow({ name, photo, meta, right }: { name: string; photo?: string | null; meta?: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30 rounded-lg">
      <Avatar className="h-9 w-9 ring-2 ring-background">
        <AvatarImage src={photo || avatarUrl(name)} />
        <AvatarFallback className="text-xs font-medium">{initials(name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{name}</p>
        {meta && <p className="truncate text-xs text-muted-foreground">{meta}</p>}
      </div>
      {right}
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/40 bg-card p-5 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-2.5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
        <Skeleton className="h-11 w-11 rounded-xl" />
      </div>
      <Skeleton className="h-4 w-24" />
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="rounded-2xl border border-border/40 bg-card p-6 space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

export default function DashboardHome() {
  const { t, num, money } = useI18n();
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [sub, setSub] = React.useState<SubscriptionData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    Promise.all([
      request<DashboardData>("/api/dashboard").catch(() => null),
      request<SubscriptionData>("/api/subscriptions/current").catch(() => null),
    ]).then(([d, s]) => {
      setData(d);
      setSub(s);
    }).finally(() => setLoading(false));
  }, []);

  const s = data?.stats;
  const trialDaysLeft = sub?.subscription.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(sub.subscription.trialEndsAt).getTime() - Date.now()) / 86400000))
    : 0;
  const isTrial = sub?.subscription.status === "TRIAL";
  const isFree = sub?.subscription.tier === "FREE";
  const studentPct = sub ? Math.round((sub.usage.students.current / sub.usage.students.max) * 100) : 0;
  const teacherPct = sub ? Math.round((sub.usage.teachers.current / sub.usage.teachers.max) * 100) : 0;
  const nearLimit = studentPct >= 80 || teacherPct >= 80;

  const recentActivities = React.useMemo(() => {
    if (!data) return [];
    const activities: { icon: React.ElementType; title: string; time: string; color: string }[] = [];
    data.recentStudents.forEach((st) => {
      activities.push({ icon: UserPlus, title: `${st.fullName} enrolled in ${st.class?.name || "school"}`, time: formatDate(st.createdAt), color: "bg-gradient-to-br from-primary to-primary/80" });
    });
    data.recentTeachers.forEach((t) => {
      activities.push({ icon: StaffIcon, title: `${t.fullName} joined as ${t.department || "staff member"}`, time: "Recently", color: "bg-gradient-to-br from-[hsl(var(--chart-2))] to-[hsl(var(--chart-2))]/80" });
    });
    return activities.slice(0, 5);
  }, [data]);

  const quickActions = [
    { label: t("quick.addStudent"), description: "Enroll a new student", href: "/dashboard/students", icon: UserPlus, color: "bg-gradient-to-br from-primary to-primary/80" },
    { label: t("quick.takeAttendance"), description: "Mark daily attendance", href: "/dashboard/attendance", icon: ClipboardList, color: "bg-gradient-to-br from-[hsl(var(--chart-2))] to-[hsl(var(--chart-2))]/80" },
    { label: t("quick.postNotice"), description: "Share announcements", href: "/dashboard/notices", icon: Megaphone, color: "bg-gradient-to-br from-[hsl(var(--chart-3))] to-[hsl(var(--chart-3))]/80" },
    { label: t("quick.scheduleEvent"), description: "Plan school events", href: "/dashboard/events", icon: CalendarDays, color: "bg-gradient-to-br from-[hsl(var(--chart-4))] to-[hsl(var(--chart-4))]/80" },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      {loading ? (
        <div className="rounded-2xl border border-border/40 bg-card p-6 sm:p-8 space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
      ) : (
        <WelcomeBanner />
      )}

      {/* Subscription trial banner */}
      {!loading && sub && isTrial && (
        <div className="relative overflow-hidden rounded-2xl border border-amber-200/60 bg-gradient-to-r from-amber-50 via-amber-50/80 to-amber-100/50 px-5 py-4 dark:border-amber-800/40 dark:from-amber-950/30 dark:via-amber-950/20 dark:to-amber-950/10">
          <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-amber-200/30 blur-2xl" />
          <div className="relative flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 shadow-sm">
              <Crown className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">Free Trial Active</p>
              <p className="text-xs text-amber-700/80 dark:text-amber-300/80">
                {trialDaysLeft > 0
                  ? `${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} remaining — explore all features`
                  : "Your trial has ended"}
              </p>
            </div>
            <Link
              href="/dashboard/settings?tab=billing"
              className="shrink-0 rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white transition-all duration-200 hover:bg-amber-700 hover:shadow-md"
            >
              Upgrade now
            </Link>
          </div>
        </div>
      )}

      {/* Usage limits */}
      {!loading && sub && nearLimit && (
        <Card className="overflow-hidden rounded-2xl border-border/40">
          <CardContent className="p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div>
                <span className="text-sm font-semibold">Usage Limits</span>
                {isFree && (
                  <Badge variant="outline" className="ml-2 text-[10px] font-medium">
                    {sub.limits.label} Plan
                  </Badge>
                )}
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <UsageBar label="Students" current={sub.usage.students.current} max={sub.usage.students.max} />
              <UsageBar label="Teachers" current={sub.usage.teachers.current} max={sub.usage.teachers.max} />
            </div>
            {(studentPct >= 90 || teacherPct >= 90) && (
              <div className="mt-4 flex items-center gap-2.5 rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>You&apos;re approaching your plan limits.</span>
                <Link href="/dashboard/settings?tab=billing" className="ml-auto font-semibold underline">
                  Upgrade
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stat cards */}
      <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading || !s ? (
          Array.from({ length: 4 }).map((_, i) => (
            <StaggerItem key={i}><StatCardSkeleton /></StaggerItem>
          ))
        ) : (
          <>
            <StaggerItem>
              <StatCard label={t("stat.students")} count={s.students} format={num} icon={Users} accent="primary" hint="Enrolled" trend={{ value: "4.2%", direction: "up" }} />
            </StaggerItem>
            <StaggerItem>
              <StatCard label={t("stat.teachers")} count={s.teachers} format={num} icon={GraduationCap} accent="success" hint="Active staff" />
            </StaggerItem>
            <StaggerItem>
              <StatCard label={t("stat.revenue")} count={s.revenue} format={money} icon={DollarSign} accent="warning" hint="Collected" trend={{ value: "2.1%", direction: "up" }} />
            </StaggerItem>
            <StaggerItem>
              <StatCard label={t("stat.attendance")} count={s.attendanceRate} format={(n) => `${num(n)}%`} icon={CalendarCheck} accent="chart3" hint="This week" />
            </StaggerItem>
          </>
        )}
      </Stagger>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2">
          {loading || !data ? <ChartSkeleton /> : <GenderPie data={data.genderDistribution} />}
        </div>
        <div className="lg:col-span-3">
          {loading || !data ? <ChartSkeleton /> : <ClassBar data={data.classDistribution} />}
        </div>
      </div>

      {/* Main content grid: Activity + Quick Actions + Recent lists */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Activity Feed */}
        <Card className="overflow-hidden rounded-2xl border-border/40">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-primary/5">
                  <Activity className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold">Activity Feed</CardTitle>
                  <CardDescription className="text-xs">Recent school activity</CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="text-[10px] font-medium">Live</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-3.5 w-full" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivities.length > 0 ? (
              <div className="divide-y divide-border/30">
                {recentActivities.map((a, i) => (
                  <ActivityItem key={i} {...a} />
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">No recent activity</div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="overflow-hidden rounded-2xl border-border/40">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[hsl(var(--chart-2))]/10 to-[hsl(var(--chart-2))]/5">
                <Sparkles className="h-4 w-4 text-[hsl(var(--chart-2))]" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
                <CardDescription className="text-xs">Frequent tasks</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 rounded-xl border border-border/40 p-4">
                    <Skeleton className="h-11 w-11 rounded-xl" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-3.5 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-4 w-4" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {quickActions.map((a) => (
                  <QuickActionCard key={a.label} {...a} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent People */}
        <Card className="overflow-hidden rounded-2xl border-border/40">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[hsl(var(--chart-3))]/10 to-[hsl(var(--chart-3))]/5">
                <Users className="h-4 w-4 text-[hsl(var(--chart-3))]" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">Recent People</CardTitle>
                <CardDescription className="text-xs">Latest additions</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-3.5 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {data?.recentStudents.slice(0, 3).map((st) => (
                  <PersonRow
                    key={st.id}
                    name={st.fullName}
                    photo={st.photo}
                    meta={st.class?.name ?? "Unassigned"}
                    right={<span className="text-[10px] text-muted-foreground tabular-nums">{formatDate(st.createdAt)}</span>}
                  />
                ))}
                {data?.recentTeachers.slice(0, 2).map((t) => (
                  <PersonRow
                    key={t.id}
                    name={t.fullName}
                    photo={t.photo}
                    meta={t.department ?? "—"}
                    right={<Badge variant="secondary" className="text-[10px]">Staff</Badge>}
                  />
                ))}
                {!loading && (!data?.recentStudents?.length && !data?.recentTeachers?.length) && (
                  <p className="py-8 text-center text-sm text-muted-foreground">No people yet</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom row: Recent lists full width */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="overflow-hidden rounded-2xl border-border/40">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <div className="space-y-0.5">
              <CardTitle className="text-sm font-semibold">Recent Students</CardTitle>
              <CardDescription className="text-xs">Newest enrollments</CardDescription>
            </div>
            <Link href="/dashboard/students" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline transition-colors">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0 px-1 pb-1">
            {loading ? (
              <div className="space-y-1 px-3">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-11 w-full rounded-lg" />)}
              </div>
            ) : data?.recentStudents.length ? (
              <div className="divide-y divide-border/30">
                {data.recentStudents.map((st) => (
                  <PersonRow
                    key={st.id}
                    name={st.fullName}
                    photo={st.photo}
                    meta={st.class?.name ?? "Unassigned"}
                    right={<span className="text-xs text-muted-foreground tabular-nums">{formatDate(st.createdAt)}</span>}
                  />
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">No students yet</p>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-2xl border-border/40">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <div className="space-y-0.5">
              <CardTitle className="text-sm font-semibold">Recent Teachers</CardTitle>
              <CardDescription className="text-xs">Latest additions to staff</CardDescription>
            </div>
            <Link href="/dashboard/teachers" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline transition-colors">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0 px-1 pb-1">
            {loading ? (
              <div className="space-y-1 px-3">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-11 w-full rounded-lg" />)}
              </div>
            ) : data?.recentTeachers.length ? (
              <div className="divide-y divide-border/30">
                {data.recentTeachers.map((t) => (
                  <PersonRow key={t.id} name={t.fullName} photo={t.photo} meta={t.department ?? "—"} />
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">No teachers yet</p>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-2xl border-border/40">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <div className="space-y-0.5">
              <CardTitle className="text-sm font-semibold">Recent Parents</CardTitle>
              <CardDescription className="text-xs">Newly added guardians</CardDescription>
            </div>
            <Link href="/dashboard/parents" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline transition-colors">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0 px-1 pb-1">
            {loading ? (
              <div className="space-y-1 px-3">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-11 w-full rounded-lg" />)}
              </div>
            ) : data?.recentParents.length ? (
              <div className="divide-y divide-border/30">
                {data.recentParents.map((p) => (
                  <PersonRow key={p.id} name={p.fullName} photo={p.photo} meta={p.occupation ?? "—"} />
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">No parents yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
