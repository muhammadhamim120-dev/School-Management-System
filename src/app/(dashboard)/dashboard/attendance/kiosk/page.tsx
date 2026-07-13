"use client";
import * as React from "react";
import { ScanLine } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "@/components/form-field";
import { request } from "@/services/api-client";
import { useI18n } from "@/components/i18n-provider";

type CheckInResult = { name: string; role: "STUDENT" | "TEACHER"; status: "PRESENT" | "LATE"; at: string };

/**
 * RFID / badge kiosk.
 *
 * USB RFID readers act as keyboard wedges: they "type" the badge ID and press
 * Enter. This page keeps a single input focused; each Enter submits the value
 * to the check-in API with method RFID. The same input accepts a manually
 * typed student/teacher ID, so the page doubles as a fallback for QR/fingerprint
 * agents that post through a focused field.
 */
export default function KioskPage() {
  const { t } = useI18n();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [value, setValue] = React.useState("");
  const [role, setRole] = React.useState<"STUDENT" | "TEACHER">("STUDENT");
  const [method, setMethod] = React.useState<"RFID" | "QR" | "FINGERPRINT" | "MANUAL">("RFID");
  const [feed, setFeed] = React.useState<CheckInResult[]>([]);
  const [flash, setFlash] = React.useState<{ ok: boolean; text: string } | null>(null);

  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const identifier = value.trim();
    if (!identifier) return;
    setValue("");
    try {
      const res = await request<{ name: string; role: "STUDENT" | "TEACHER"; status: "PRESENT" | "LATE" }>(
        "/api/attendance/check-in",
        { method: "POST", body: JSON.stringify({ identifier, method, role }) }
      );
      setFeed((f) => [{ name: res.name, role: res.role, status: res.status, at: new Date().toLocaleTimeString() }, ...f].slice(0, 12));
      setFlash({ ok: true, text: `${res.name} — ${res.status === "LATE" ? t("att.late") : t("att.present")}` });
    } catch (e) {
      setFlash({ ok: false, text: t("att.notFound") });
    }
    setTimeout(() => setFlash(null), 2200);
    inputRef.current?.focus();
  };

  return (
    <div>
      <PageHeader title={t("att.kiosk")} description={t("att.kioskDesc")} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("att.role")}>
                <Select value={role} onValueChange={(v) => setRole(v as "STUDENT" | "TEACHER")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STUDENT">{t("att.student")}</SelectItem>
                    <SelectItem value="TEACHER">{t("att.teacher")}</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label={t("att.method")}>
                <Select value={method} onValueChange={(v) => setMethod(v as typeof method)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RFID">{t("att.rfid")}</SelectItem>
                    <SelectItem value="QR">{t("att.qr")}</SelectItem>
                    <SelectItem value="FINGERPRINT">{t("att.fingerprint")}</SelectItem>
                    <SelectItem value="MANUAL">{t("common.edit")}</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <form onSubmit={submit}>
              <label className="mb-1.5 block text-sm font-medium">{t("att.enterId")}</label>
              <div className="flex items-center gap-2">
                <ScanLine className="h-5 w-5 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={t("att.enterId")}
                  className="h-12 text-lg"
                  autoComplete="off"
                />
              </div>
            </form>

            {flash && (
              <div className={`rounded-md px-4 py-3 text-sm font-medium ${flash.ok ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                {flash.text}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="mb-3 text-sm font-semibold">{t("att.recent")}</h3>
            {feed.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">—</div>
            ) : (
              <ul className="divide-y">
                {feed.map((r, i) => (
                  <li key={i} className="flex items-center justify-between py-2.5">
                    <div>
                      <div className="font-medium">{r.name}</div>
                      <div className="text-xs text-muted-foreground">{r.role === "TEACHER" ? t("att.teacher") : t("att.student")} · {r.at}</div>
                    </div>
                    <Badge variant={r.status === "LATE" ? "warning" : "success"} dot>
                      {r.status === "LATE" ? t("att.late") : t("att.present")}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
