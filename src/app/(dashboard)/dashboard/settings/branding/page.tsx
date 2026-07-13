"use client";
import * as React from "react";
import { Save, Upload } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Field } from "@/components/form-field";
import { request } from "@/services/api-client";
import { useToast } from "@/hooks/use-toast";

type BrandingData = {
  schoolName: string;
  logo: string;
  theme: {
    primary?: string;
    secondary?: string;
    accent?: string;
    borderRadius?: string;
  } | null;
  customCss: string;
};

const PRESET_COLORS = [
  { label: "Blue", value: "#3b82f6" },
  { label: "Indigo", value: "#6366f1" },
  { label: "Violet", value: "#8b5cf6" },
  { label: "Emerald", value: "#10b981" },
  { label: "Teal", value: "#14b8a6" },
  { label: "Orange", value: "#f97316" },
  { label: "Rose", value: "#f43f5e" },
  { label: "Slate", value: "#475569" },
];

export default function BrandingPage() {
  const { toast } = useToast();
  const [data, setData] = React.useState<BrandingData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    request<BrandingData>("/api/settings")
      .then((d) =>
        setData({
          schoolName: d.schoolName ?? "",
          logo: d.logo ?? "",
          theme: d.theme ?? { primary: "#3b82f6", secondary: "", accent: "", borderRadius: "0.5rem" },
          customCss: d.customCss ?? "",
        })
      )
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const updateTheme = (key: string, value: string) =>
    setData((d) =>
      d ? { ...d, theme: { ...d.theme, [key]: value } } : d
    );

  const save = async () => {
    if (!data) return;
    setSaving(true);
    try {
      await request("/api/settings", {
        method: "PATCH",
        body: JSON.stringify({
          schoolName: data.schoolName,
          logo: data.logo,
          theme: data.theme,
          customCss: data.customCss,
        }),
      });
      toast({ variant: "success", title: "Branding saved" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Branding"
        description="Customize your school's appearance"
        action={
          <Button onClick={save} disabled={saving || !data}>
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        }
      />

      {loading || !data ? (
        <div className="space-y-4 max-w-2xl">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-60 w-full" />
        </div>
      ) : (
        <div className="space-y-6 max-w-2xl">
          {/* Logo & School Name */}
          <Card>
            <CardHeader>
              <CardTitle>School Identity</CardTitle>
              <CardDescription>Logo and school name displayed across the platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="School Name">
                <Input
                  value={data.schoolName}
                  onChange={(e) => setData((d) => d ? { ...d, schoolName: e.target.value } : d)}
                />
              </Field>
              <Field label="Logo URL">
                <div className="flex gap-2">
                  <Input
                    value={data.logo}
                    onChange={(e) => setData((d) => d ? { ...d, logo: e.target.value } : d)}
                    placeholder="https://..."
                  />
                  <Button variant="outline" size="icon" asChild>
                    <label>
                      <Upload className="h-4 w-4" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const form = new FormData();
                          form.append("file", file);
                          try {
                            const res = await fetch("/api/upload", { method: "POST", body: form });
                            const json = await res.json();
                            if (json.success && json.data?.url) {
                              setData((d) => d ? { ...d, logo: json.data.url } : d);
                            }
                          } catch {
                            toast({ variant: "destructive", title: "Upload failed" });
                          }
                        }}
                      />
                    </label>
                  </Button>
                </div>
              </Field>
              {data.logo && (
                <div className="rounded-lg border border-border p-4 flex items-center justify-center bg-muted/30">
                  <img src={data.logo} alt="Logo preview" className="max-h-16 object-contain" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Theme Colors */}
          <Card>
            <CardHeader>
              <CardTitle>Theme Colors</CardTitle>
              <CardDescription>Set your school's primary brand color</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Primary Color">
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={data.theme?.primary ?? "#3b82f6"}
                    onChange={(e) => updateTheme("primary", e.target.value)}
                    className="h-10 w-10 cursor-pointer rounded-md border border-input"
                  />
                  <Input
                    value={data.theme?.primary ?? "#3b82f6"}
                    onChange={(e) => updateTheme("primary", e.target.value)}
                    className="max-w-[140px]"
                  />
                </div>
              </Field>
              <div>
                <p className="text-sm font-medium mb-2">Quick Presets</p>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => updateTheme("primary", c.value)}
                      className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-accent transition-colors"
                    >
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: c.value }}
                      />
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <Field label="Secondary Color">
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={data.theme?.secondary ?? "#64748b"}
                    onChange={(e) => updateTheme("secondary", e.target.value)}
                    className="h-10 w-10 cursor-pointer rounded-md border border-input"
                  />
                  <Input
                    value={data.theme?.secondary ?? "#64748b"}
                    onChange={(e) => updateTheme("secondary", e.target.value)}
                    className="max-w-[140px]"
                  />
                </div>
              </Field>
            </CardContent>
          </Card>

          {/* Custom CSS */}
          <Card>
            <CardHeader>
              <CardTitle>Custom CSS</CardTitle>
              <CardDescription>Add custom styles to override the default theme</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={data.customCss}
                onChange={(e) => setData((d) => d ? { ...d, customCss: e.target.value } : d)}
                placeholder="/* Your custom CSS here */"
                rows={10}
                className="font-mono text-xs"
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
