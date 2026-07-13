import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ToggleLeft } from "lucide-react";

const featureFlags = [
  { name: "Online Exams", description: "Enable online examination module for all schools", enabled: true },
  { name: "AI Attendance", description: "Facial recognition attendance system", enabled: false },
  { name: "Parent Portal v2", description: "Redesigned parent communication portal", enabled: true },
  { name: "SMS Gateway", description: "Twilio-based SMS notifications", enabled: false },
  { name: "Library System", description: "Digital library management module", enabled: true },
  { name: "Transport Tracking", description: "GPS-based bus tracking for parents", enabled: false },
];

const globalSettings = [
  { key: "platform_name", value: "EduPlatform", label: "Platform Name" },
  { key: "support_email", value: "support@eduplatform.com", label: "Support Email" },
  { key: "default_timezone", value: "Asia/Karachi", label: "Default Timezone" },
  { key: "max_schools_free", value: "1", label: "Max Schools (Free Plan)" },
  { key: "trial_days", value: "14", label: "Trial Duration (Days)" },
];

export default function SuperAdminSettingsPage() {
  return (
    <>
      <PageHeader
        title="Global Settings"
        description="Feature flags and platform configuration"
      />

      <div className="space-y-8">
        <section>
          <h2 className="mb-4 text-lg font-semibold">Feature Flags</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featureFlags.map((flag) => (
              <Card key={flag.name} className="rounded-2xl p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                      <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">{flag.name}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">{flag.description}</p>
                    </div>
                  </div>
                  <Badge variant={flag.enabled ? "default" : "secondary"}>
                    {flag.enabled ? "On" : "Off"}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold">Platform Configuration</h2>
          <Card className="rounded-2xl">
            <div className="divide-y divide-border/40">
              {globalSettings.map((s) => (
                <div key={s.key} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <div className="text-sm font-medium">{s.label}</div>
                    <div className="text-xs text-muted-foreground">{s.key}</div>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-card/60 px-3 py-1.5 text-sm">
                    {s.value}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>
      </div>
    </>
  );
}
