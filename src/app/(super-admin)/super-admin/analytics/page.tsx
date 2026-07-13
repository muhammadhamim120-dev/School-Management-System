import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";

export default function SuperAdminAnalyticsPage() {
  return (
    <>
      <PageHeader
        title="Analytics"
        description="Platform metrics and growth insights"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl p-6">
          <h3 className="mb-4 text-sm font-semibold">Monthly Recurring Revenue</h3>
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            MRR chart placeholder — area chart showing revenue over 12 months
          </div>
        </Card>
        <Card className="rounded-2xl p-6">
          <h3 className="mb-4 text-sm font-semibold">User Growth</h3>
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            User growth chart placeholder — bar chart showing new users per month
          </div>
        </Card>
        <Card className="rounded-2xl p-6">
          <h3 className="mb-4 text-sm font-semibold">School Onboarding</h3>
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            School onboarding funnel placeholder — conversion from signup to active
          </div>
        </Card>
        <Card className="rounded-2xl p-6">
          <h3 className="mb-4 text-sm font-semibold">Feature Usage</h3>
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            Feature usage heatmap placeholder — which modules are most used
          </div>
        </Card>
      </div>
    </>
  );
}
