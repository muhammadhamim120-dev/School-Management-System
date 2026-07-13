"use client";
import * as React from "react";
import { Search, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { request } from "@/services/api-client";
import { useI18n } from "@/components/i18n-provider";

type TrackResult = {
  applicantName: string;
  session: string;
  classApplied: string | null;
  status: string;
  admitRoll: string | null;
  trackingCode: string | null;
  appliedAt: string;
};

export default function TrackPage() {
  const { t, date: fmt } = useI18n();
  const [query, setQuery] = React.useState("");
  const [result, setResult] = React.useState<TrackResult | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [notFound, setNotFound] = React.useState(false);

  const check = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true); setNotFound(false); setResult(null);
    try {
      // Try as tracking code first, then as phone.
      const res = await request<TrackResult>("/api/applications/track", {
        method: "POST",
        body: JSON.stringify({ code: query.trim() }),
      });
      setResult(res);
    } catch {
      try {
        const res = await request<TrackResult>("/api/applications/track", {
          method: "POST",
          body: JSON.stringify({ phone: query.trim() }),
        });
        setResult(res);
      } catch {
        setNotFound(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const statusVariant = (s: string) =>
    s === "ADMITTED" ? "success" : s === "REJECTED" ? "destructive" : s === "SHORTLISTED" ? "default" : "secondary";

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <FileCheck className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold">{t("adm.track")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("adm.trackDesc")}</p>
      </div>

      <Card>
        <CardContent className="p-5">
          <form onSubmit={check} className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("adm.enterCodeOrPhone")}
              className="h-11"
            />
            <Button type="submit" disabled={loading} className="h-11">
              <Search className="h-4 w-4" /> {loading ? "…" : t("adm.check")}
            </Button>
          </form>

          {notFound && (
            <p className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{t("adm.notFound")}</p>
          )}

          {result && (
            <div className="mt-5 space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{result.applicantName}</div>
                  <div className="text-xs text-muted-foreground">{result.session}</div>
                </div>
                <Badge variant={statusVariant(result.status)} dot>{result.status}</Badge>
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div><dt className="text-muted-foreground">{t("adm.trackingCode")}</dt><dd className="font-medium tabular-nums">{result.trackingCode ?? "—"}</dd></div>
                <div><dt className="text-muted-foreground">{t("board.roll")}</dt><dd className="font-medium tabular-nums">{result.admitRoll ?? "—"}</dd></div>
                {result.classApplied && <div><dt className="text-muted-foreground">{t("page.classes.title")}</dt><dd className="font-medium">{result.classApplied}</dd></div>}
                <div><dt className="text-muted-foreground">{t("adm.appliedOn")}</dt><dd className="font-medium">{fmt(result.appliedAt)}</dd></div>
              </dl>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
