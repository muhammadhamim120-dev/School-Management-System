"use client";
import * as React from "react";
import { CreditCard, Check, ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { request } from "@/services/api-client";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/components/i18n-provider";
import { cn } from "@/lib/utils";
import type { PlanTier } from "@prisma/client";

type PlanFeature =
  | "ai_dropout_risk"
  | "online_exams"
  | "coaching"
  | "transport"
  | "hostel"
  | "sms"
  | "custom_branding"
  | "advanced_reports"
  | "parent_portal"
  | "certificates"
  | "multi_campus";

type PlanLimits = {
  maxStudents: number;
  maxTeachers: number;
  maxStorageMb: number;
  features: PlanFeature[];
  monthlyPrice: number;
  label: string;
  description: string;
};

type Usage = { current: number; max: number };

type SubscriptionData = {
  subscription: { tier: PlanTier; status: string; monthlyPrice: number };
  limits: PlanLimits;
  usage: { students: Usage; teachers: Usage };
};

const PLANS: { tier: PlanTier; label: string; price: number }[] = [
  { tier: "FREE", label: "Free", price: 0 },
  { tier: "STARTER", label: "Starter", price: 29 },
  { tier: "PROFESSIONAL", label: "Professional", price: 79 },
  { tier: "ENTERPRISE", label: "Enterprise", price: 199 },
];

const TIER_ORDER: PlanTier[] = ["FREE", "STARTER", "PROFESSIONAL", "ENTERPRISE"];

function UsageBar({ label, current, max }: { label: string; current: number; max: number }) {
  const pct = max > 0 ? Math.min((current / max) * 100, 100) : 0;
  const isHigh = pct > 80;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {current.toLocaleString()} / {max >= 99999 ? "Unlimited" : max.toLocaleString()}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn("h-full rounded-full transition-all", isHigh ? "bg-destructive" : "bg-primary")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function SubscriptionPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [data, setData] = React.useState<SubscriptionData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [upgrading, setUpgrading] = React.useState<PlanTier | null>(null);

  React.useEffect(() => {
    request<SubscriptionData>("/api/subscriptions/current")
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const handleUpgrade = async (tier: PlanTier) => {
    setUpgrading(tier);
    try {
      await request("/api/subscriptions/upgrade", {
        method: "POST",
        body: JSON.stringify({ tier }),
      });
      const updated = await request<SubscriptionData>("/api/subscriptions/current");
      setData(updated);
      toast({ variant: "success", title: `Upgraded to ${tier}` });
    } catch (e) {
      toast({ variant: "destructive", title: "Upgrade failed", description: (e as Error).message });
    } finally {
      setUpgrading(null);
    }
  };

  const currentTier = data?.subscription.tier ?? "FREE";
  const currentIdx = TIER_ORDER.indexOf(currentTier);

  return (
    <div>
      <PageHeader title="Subscription & Billing" description="Manage your plan and usage" />

      {loading || !data ? (
        <div className="space-y-4 max-w-3xl">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-60 w-full" />
        </div>
      ) : (
        <div className="space-y-6 max-w-3xl">
          {/* Current plan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Current Plan: {data.limits.label}
              </CardTitle>
              <CardDescription>
                {data.subscription.status === "ACTIVE" ? "Active" : data.subscription.status}
                {data.limits.monthlyPrice > 0 && ` - $${data.limits.monthlyPrice}/month`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <UsageBar
                label="Students"
                current={data.usage.students.current}
                max={data.usage.students.max}
              />
              <UsageBar
                label="Teachers"
                current={data.usage.teachers.current}
                max={data.usage.teachers.max}
              />
              <UsageBar
                label="Storage"
                current={0}
                max={data.limits.maxStorageMb}
              />
              <div className="pt-2">
                <p className="text-sm font-medium mb-2">Included Features</p>
                <div className="flex flex-wrap gap-2">
                  {data.limits.features.map((f) => (
                    <span key={f} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      <Check className="h-3 w-3" />
                      {f.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upgrade options */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Upgrade Your Plan</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {PLANS.map((plan, idx) => {
                const isCurrent = plan.tier === currentTier;
                const isAvailable = idx > currentIdx;
                return (
                  <Card
                    key={plan.tier}
                    interactive={isAvailable}
                    className={cn(
                      "relative",
                      isCurrent && "border-primary ring-1 ring-primary",
                      !isAvailable && !isCurrent && "opacity-50"
                    )}
                  >
                    {isCurrent && (
                      <span className="absolute -top-2.5 left-4 rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
                        Current
                      </span>
                    )}
                    <CardHeader className="pb-2">
                      <CardTitle>{plan.label}</CardTitle>
                      <CardDescription className="text-2xl font-bold text-foreground">
                        ${plan.price}<span className="text-sm font-normal text-muted-foreground">/mo</span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isAvailable ? (
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => handleUpgrade(plan.tier)}
                          disabled={upgrading !== null}
                        >
                          {upgrading === plan.tier ? "Upgrading..." : (
                            <>Upgrade <ArrowUpRight className="h-4 w-4" /></>
                          )}
                        </Button>
                      ) : isCurrent ? (
                        <Button size="sm" variant="outline" className="w-full" disabled>
                          Current Plan
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" className="w-full" disabled>
                          Downgrade
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
