"use client";
import * as React from "react";
import { QrCode, CameraOff } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "@/components/form-field";
import { request } from "@/services/api-client";
import { useI18n } from "@/components/i18n-provider";

type CheckInResult = {
  name: string;
  role: "STUDENT" | "TEACHER";
  status: "PRESENT" | "LATE";
  late: boolean;
  at: string;
};

/**
 * Camera QR check-in station.
 *
 * Uses the native BarcodeDetector API (Chromium-based browsers). When the API
 * isn't available, the user is directed to the kiosk page. A short cooldown
 * prevents duplicate scans of the same code.
 */
export default function ScanPage() {
  const { t } = useI18n();
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const rafRef = React.useRef<number | null>(null);
  const lastScanRef = React.useRef<{ value: string; at: number }>({ value: "", at: 0 });

  const [supported, setSupported] = React.useState<boolean | null>(null);
  const [role, setRole] = React.useState<"STUDENT" | "TEACHER">("STUDENT");
  const [feed, setFeed] = React.useState<CheckInResult[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Feature-detect BarcodeDetector.
    const hasAPI = typeof window !== "undefined" && "BarcodeDetector" in window;
    setSupported(hasAPI);
    if (!hasAPI) return;

    let cancelled = false;
    let detector: { detect: (source: CanvasImageSource) => Promise<Array<{ rawValue: string }>> };

    (async () => {
      try {
        // Camera + detector setup
        const AnyDetector = (window as unknown as { BarcodeDetector: new (o: { formats: string[] }) => typeof detector }).BarcodeDetector;
        detector = new AnyDetector({ formats: ["qr_code"] });
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((tr) => tr.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        const loop = async () => {
          if (cancelled || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            const value = codes[0]?.rawValue;
            if (value) {
              const now = Date.now();
              const last = lastScanRef.current;
              if (!(value === last.value && now - last.at < 4000)) {
                lastScanRef.current = { value, at: now };
                await submit(value);
              }
            }
          } catch {
            /* transient detect error — keep looping */
          }
          rafRef.current = window.setTimeout(loop, 350) as unknown as number;
        };
        loop();
      } catch (e) {
        setError((e as Error).message || "Camera unavailable");
      }
    })();

    return () => {
      cancelled = true;
      if (rafRef.current) clearTimeout(rafRef.current);
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const submit = async (identifier: string) => {
    try {
      const res = await request<{ name: string; role: "STUDENT" | "TEACHER"; status: "PRESENT" | "LATE"; late: boolean }>(
        "/api/attendance/check-in",
        { method: "POST", body: JSON.stringify({ identifier, method: "QR", role }) }
      );
      setFeed((f) => [{ name: res.name, role: res.role, status: res.status, late: res.late, at: new Date().toLocaleTimeString() }, ...f].slice(0, 12));
    } catch {
      /* surfaced via empty result; keep station alive */
    }
  };

  return (
    <div>
      <PageHeader title={t("att.scan")} description={t("att.scanDesc")} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <div className="mb-3 max-w-xs">
              <Field label={t("att.role")}>
                <Select value={role} onValueChange={(v) => setRole(v as "STUDENT" | "TEACHER")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STUDENT">{t("att.student")}</SelectItem>
                    <SelectItem value="TEACHER">{t("att.teacher")}</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            {supported === false ? (
              <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
                <CameraOff className="h-10 w-10" />
                <p className="max-w-sm text-sm">{t("att.cameraUnsupported")}</p>
              </div>
            ) : error ? (
              <div className="py-16 text-center text-sm text-destructive">{error}</div>
            ) : (
              <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-black">
                <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="h-2/3 w-2/3 rounded-lg border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
                </div>
                <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-md bg-black/60 px-2 py-1 text-xs text-white">
                  <QrCode className="h-3.5 w-3.5" /> {t("att.qr")}
                </div>
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
