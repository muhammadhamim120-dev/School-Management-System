"use client";
import * as React from "react";
import Link from "next/link";
import { Users, GraduationCap, UserCog, Library, DollarSign, CalendarCheck, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { GenderPie, ClassBar } from "@/components/dashboard/charts/overview-charts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { request } from "@/services/api-client";
import { formatCurrency, formatDate, initials, avatarUrl } from "@/lib/utils";

type DashboardData = {
  stats: { students: number; teachers: number; parents: number; classes: number; revenue: number; attendanceRate: number };
  genderDistribution: { name: string; value: number }[];
  classDistribution: { name: string; students: number }[];
  recentStudents: { id: string; fullName: string; photo?: string | null; class?: { name: string } | null; createdAt: string }[];
  recentTeachers: { id: string; fullName: string; photo?: string | null; department?: string | null }[];
  recentParents: { id: string; fullName: string; photo?: string | null; occupation?: string | null }[];
};

function RecentCard({
  title, description, href, loading, children,
}: {
  title: string;
  description: string;
  href: string;
  loading: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Link href={href} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-1">
        {loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />) : children}
      </CardContent>
    </Card>
  );
}

function PersonRow({ name, photo, meta, right }: { name: string; photo?: string | null; meta?: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/50">
      <Avatar className="h-9 w-9">
        <AvatarImage src={photo || avatarUrl(name)} />
        <AvatarFallback className="text-xs">{initials(name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{name}</p>
        {meta && <p className="truncate text-xs text-muted-foreground">{meta}</p>}
      </div>
      {right}
    </div>
  );
}

export default function DashboardHome() {
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    request<DashboardData>("/api/dashboard")
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const s = data?.stats;

  return (
    <div>
      <PageHeader title="Dashboard" description="A real-time overview of your school at a glance." />

      <div className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {loading || !s ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[116px] rounded-xl" />)
        ) : (
          <>
            <StatCard label="Students" value={s.students.toLocaleString()} icon={Users} hint="Enrolled" trend={{ value: "4.2%", direction: "up" }} />
            <StatCard label="Teachers" value={s.teachers.toLocaleString()} icon={GraduationCap} hint="Active staff" />
            <StatCard label="Parents" value={s.parents.toLocaleString()} icon={UserCog} hint="Guardians" />
            <StatCard label="Classes" value={s.classes.toLocaleString()} icon={Library} hint="Grade levels" />
            <StatCard label="Revenue" value={formatCurrency(s.revenue)} icon={DollarSign} hint="Collected" trend={{ value: "2.1%", direction: "up" }} />
            <StatCard label="Attendance" value={`${s.attendanceRate}%`} icon={CalendarCheck} hint="This week" />
          </>
        )}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2">
          {loading || !data ? <Skeleton className="h-[344px] rounded-xl" /> : <GenderPie data={data.genderDistribution} />}
        </div>
        <div className="lg:col-span-3">
          {loading || !data ? <Skeleton className="h-[344px] rounded-xl" /> : <ClassBar data={data.classDistribution} />}
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <RecentCard title="Recent students" description="Newest enrollments" href="/dashboard/students" loading={loading}>
          {data?.recentStudents.length ? (
            data.recentStudents.map((st) => (
              <PersonRow
                key={st.id}
                name={st.fullName}
                photo={st.photo}
                meta={st.class?.name ?? "Unassigned"}
                right={<span className="text-xs text-muted-foreground tabular-nums">{formatDate(st.createdAt)}</span>}
              />
            ))
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">No students yet</p>
          )}
        </RecentCard>

        <RecentCard title="Recent teachers" description="Latest additions to staff" href="/dashboard/teachers" loading={loading}>
          {data?.recentTeachers.length ? (
            data.recentTeachers.map((t) => (
              <PersonRow key={t.id} name={t.fullName} photo={t.photo} meta={t.department ?? "—"} />
            ))
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">No teachers yet</p>
          )}
        </RecentCard>

        <RecentCard title="Recent parents" description="Newly added guardians" href="/dashboard/parents" loading={loading}>
          {data?.recentParents.length ? (
            data.recentParents.map((p) => (
              <PersonRow key={p.id} name={p.fullName} photo={p.photo} meta={p.occupation ?? "—"} />
            ))
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">No parents yet</p>
          )}
        </RecentCard>
      </div>
    </div>
  );
}
