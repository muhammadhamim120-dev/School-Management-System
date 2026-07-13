"use client";
import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { Shield, FileText } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";

type AuditLog = {
  id: string;
  userId: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  details: unknown;
  ipAddress: string | null;
  createdAt: string;
  organization: { id: string; name: string } | null;
};

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "15" });
      if (search) params.set("search", search);
      if (actionFilter) params.set("action", actionFilter);
      const res = await fetch(`/api/super-admin/audit?${params}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setLogs(json.data.items);
      setTotal(json.data.total);
      setTotalPages(json.data.totalPages);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [page, search, actionFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const columns: Column<AuditLog>[] = [
    {
      key: "action",
      header: "Action",
      render: (row) => (
        <Badge variant="outline" className="font-mono text-xs">
          {row.action}
        </Badge>
      ),
    },
    {
      key: "resource",
      header: "Resource",
      render: (row) => (
        <span className="font-medium">{row.resource}{row.resourceId ? ` / ${row.resourceId.slice(0, 8)}` : ""}</span>
      ),
    },
    {
      key: "org",
      header: "School",
      render: (row) => row.organization?.name ?? "—",
    },
    {
      key: "userId",
      header: "User ID",
      render: (row) => <span className="font-mono text-xs text-muted-foreground">{row.userId?.slice(0, 8) ?? "—"}</span>,
    },
    {
      key: "ip",
      header: "IP",
      render: (row) => <span className="text-muted-foreground">{row.ipAddress ?? "—"}</span>,
    },
    {
      key: "createdAt",
      header: "Time",
      render: (row) => new Date(row.createdAt).toLocaleString(),
    },
  ];

  return (
    <>
      <PageHeader
        title="Audit Logs"
        description="Platform-wide audit trail for security and compliance"
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <StatCard label="Total Audit Events" icon={FileText} count={total} accent="text-primary" />
        <StatCard label="Unique Actions" icon={Shield} value={new Set(logs.map((l) => l.action)).size.toString()} accent="text-blue-500" />
      </div>

      <DataTable
        columns={columns}
        rows={logs}
        loading={loading}
        error={error}
        total={total}
        page={page}
        totalPages={totalPages}
        search={search}
        onSearch={(v) => { setSearch(v); setPage(1); }}
        onPage={setPage}
        rowKey={(r) => r.id}
        searchPlaceholder="Search audit logs..."
        filters={
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            className="h-9 rounded-md border border-transparent bg-muted/60 px-3 text-sm shadow-none focus:border-ring focus:outline-none"
          >
            <option value="">All Actions</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
            <option value="LOGIN">Login</option>
            <option value="LOGOUT">Logout</option>
          </select>
        }
      />
    </>
  );
}
