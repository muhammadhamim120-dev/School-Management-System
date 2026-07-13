import { Building2, DollarSign, Users, LifeBuoy } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card } from "@/components/ui/card";

export default function SuperAdminDashboardPage() {
  return (
    <>
      <PageHeader
        title="Super Admin Dashboard"
        description="Platform overview and key metrics"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Schools"
          icon={Building2}
          count={42}
          accent="text-primary"
          trend={{ value: "+3", direction: "up" }}
          hint="this month"
        />
        <StatCard
          label="Monthly Recurring Revenue"
          icon={DollarSign}
          count={128500}
          format={(n) => `$${(n / 1000).toFixed(1)}k`}
          accent="text-emerald-500"
          trend={{ value: "+12%", direction: "up" }}
          hint="vs last month"
        />
        <StatCard
          label="Active Users"
          icon={Users}
          count={3847}
          accent="text-blue-500"
          trend={{ value: "+248", direction: "up" }}
          hint="this week"
        />
        <StatCard
          label="Open Support Tickets"
          icon={LifeBuoy}
          count={18}
          accent="text-orange-500"
          trend={{ value: "-5", direction: "down" }}
          hint="vs last week"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl p-6">
          <h3 className="mb-4 text-sm font-semibold">Revenue Trend</h3>
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            Chart placeholder — MRR over time
          </div>
        </Card>
        <Card className="rounded-2xl p-6">
          <h3 className="mb-4 text-sm font-semibold">School Growth</h3>
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            Chart placeholder — new schools per month
          </div>
        </Card>
      </div>
    </>
  );
}
