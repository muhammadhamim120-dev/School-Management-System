"use client";
import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { LifeBuoy, AlertCircle, Clock } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";

type Ticket = {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  organization: { id: string; name: string } | null;
};

const priorityColors: Record<string, string> = {
  LOW: "secondary",
  MEDIUM: "outline",
  HIGH: "destructive",
  URGENT: "destructive",
};

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/super-admin/support?${params}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setTickets(json.data.items);
      setTotal(json.data.total);
      setTotalPages(json.data.totalPages);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCount = tickets.filter((t) => t.status === "OPEN").length;
  const inProgressCount = tickets.filter((t) => t.status === "IN_PROGRESS").length;

  const columns: Column<Ticket>[] = [
    {
      key: "subject",
      header: "Subject",
      render: (row) => (
        <div>
          <div className="font-medium">{row.subject}</div>
          <div className="text-xs text-muted-foreground">{row.description.slice(0, 60)}...</div>
        </div>
      ),
    },
    {
      key: "org",
      header: "School",
      render: (row) => row.organization?.name ?? "—",
    },
    {
      key: "priority",
      header: "Priority",
      render: (row) => <Badge variant={priorityColors[row.priority] as "default" | "secondary" | "destructive"}>{row.priority}</Badge>,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <Badge variant={row.status === "OPEN" ? "secondary" : row.status === "RESOLVED" ? "default" : "outline"}>{row.status}</Badge>,
    },
    {
      key: "createdAt",
      header: "Created",
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
  ];

  return (
    <>
      <PageHeader
        title="Support Tickets"
        description="Manage customer support requests"
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Open Tickets" icon={AlertCircle} count={openCount} accent="text-orange-500" />
        <StatCard label="In Progress" icon={Clock} count={inProgressCount} accent="text-blue-500" />
        <StatCard label="Total Tickets" icon={LifeBuoy} count={total} accent="text-primary" />
      </div>

      <DataTable
        columns={columns}
        rows={tickets}
        loading={loading}
        error={error}
        total={total}
        page={page}
        totalPages={totalPages}
        search={search}
        onSearch={(v) => { setSearch(v); setPage(1); }}
        onPage={setPage}
        rowKey={(r) => r.id}
        searchPlaceholder="Search tickets..."
        filters={
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="h-9 rounded-md border border-transparent bg-muted/60 px-3 text-sm shadow-none focus:border-ring focus:outline-none"
          >
            <option value="">All Status</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        }
      />
    </>
  );
}
