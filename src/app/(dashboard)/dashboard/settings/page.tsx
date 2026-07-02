"use client";
import * as React from "react";
import { Save } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Field } from "@/components/form-field";
import { request } from "@/services/api-client";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/components/i18n-provider";

type Settings = {
  id: string;
  schoolName: string;
  email: string;
  phone: string;
  address: string;
  logo?: string | null;
  academicYear: string;
};

export default function SettingsPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [data, setData] = React.useState<Settings | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    request<Settings>("/api/settings").then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, []);

  const update = (k: keyof Settings, v: string) => setData((d) => (d ? { ...d, [k]: v } : d));

  const save = async () => {
    if (!data) return;
    setSaving(true);
    try {
      const updated = await request<Settings>("/api/settings", {
        method: "PATCH",
        body: JSON.stringify({
          schoolName: data.schoolName, email: data.email, phone: data.phone,
          address: data.address, logo: data.logo ?? "", academicYear: data.academicYear,
        }),
      });
      setData(updated);
      toast({ variant: "success", title: "Settings saved" });
    } catch (e) { toast({ variant: "destructive", title: "Error", description: (e as Error).message }); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <PageHeader
        title={t("page.settings.title")}
        description={t("page.settings.desc")}
        action={<Button onClick={save} disabled={saving || !data}><Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Changes"}</Button>}
      />
      <Card className="max-w-2xl">
        <CardHeader><CardTitle>School Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {loading || !data ? (
            Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
          ) : (
            <>
              <Field label="School Name">
                <Input value={data.schoolName} onChange={(e) => update("schoolName", e.target.value)} />
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Email">
                  <Input type="email" value={data.email} onChange={(e) => update("email", e.target.value)} />
                </Field>
                <Field label="Phone">
                  <Input value={data.phone} onChange={(e) => update("phone", e.target.value)} />
                </Field>
              </div>
              <Field label="Academic Year">
                <Input value={data.academicYear} onChange={(e) => update("academicYear", e.target.value)} />
              </Field>
              <Field label="Logo URL">
                <Input value={data.logo ?? ""} onChange={(e) => update("logo", e.target.value)} placeholder="https://..." />
              </Field>
              <Field label="Address">
                <Textarea value={data.address} onChange={(e) => update("address", e.target.value)} />
              </Field>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
