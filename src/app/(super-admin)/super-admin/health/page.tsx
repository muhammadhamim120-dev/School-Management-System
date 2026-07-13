"use client";
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";
import { Activity, Building2, Users, GraduationCap, BookOpen, RefreshCw, AlertTriangle } from "lucide-react";

type HealthData = {
  status: string;
  dbConnected: boolean;
  dbLatencyMs: number;
  counts: {
    organizations: number;
    users: number;
    students: number;
    teachers: number;
    subscriptions: number;
    supportTickets: number;
    auditLogs: number;
    featureFlags: number;
  };
  timestamp: string;
};

export default function HealthPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/super-admin/health");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setHealth(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHealth(); }, []);

  return (
    <>
      <PageHeader
        title="System Health"
        description="Database connectivity and platform model counts"
        action={
          <Button variant="outline" size="sm" onClick={fetchHealth} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      {error && (
        <Card className="mb-6 rounded-2xl border-destructive/20 bg-destructive/5 p-6">
          <div className="flex items-center gap-3 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">{error}</span>
          </div>
        </Card>
      )}

      {health && (
        <>
          <Card className="mb-6 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${health.dbConnected ? "bg-emerald-500/10" : "bg-destructive/10"}`}>
                  <Activity className={`h-5 w-5 ${health.dbConnected ? "text-emerald-500" : "text-destructive"}`} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Database Connection</h3>
                  <p className="text-xs text-muted-foreground">PostgreSQL via Prisma</p>
                </div>
              </div>
              <Badge variant={health.dbConnected ? "default" : "destructive"}>
                {health.dbConnected ? "Connected" : "Disconnected"}
              </Badge>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <div>
                <span className="text-muted-foreground">Latency</span>
                <p className="font-medium tabular-nums">{health.dbLatencyMs}ms</p>
              </div>
              <div>
                <span className="text-muted-foreground">Status</span>
                <p className="font-medium capitalize">{health.status}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Last Check</span>
                <p className="font-medium">{new Date(health.timestamp).toLocaleTimeString()}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Platform</span>
                <p className="font-medium">EduPlatform SaaS</p>
              </div>
            </div>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Organizations" icon={Building2} count={health.counts.organizations} accent="text-primary" />
            <StatCard label="Users" icon={Users} count={health.counts.users} accent="text-blue-500" />
            <StatCard label="Students" icon={GraduationCap} count={health.counts.students} accent="text-emerald-500" />
            <StatCard label="Teachers" icon={BookOpen} count={health.counts.teachers} accent="text-orange-500" />
          </div>

          <Card className="mt-6 rounded-2xl p-6">
            <h3 className="mb-4 text-sm font-semibold">Model Counts</h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {Object.entries(health.counts).map(([key, value]) => (
                <div key={key} className="rounded-xl border border-border/60 bg-muted/30 p-4">
                  <p className="text-xs text-muted-foreground capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">{value.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {loading && !health && (
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          <RefreshCw className="h-6 w-6 animate-spin" />
        </div>
      )}
    </>
  );
}
