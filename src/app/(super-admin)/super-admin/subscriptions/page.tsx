"use client";
import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { DollarSign, CreditCard, ArrowUpDown } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";

type Subscription = {
  id: string;
  tier: string;
  status: string;
  monthlyPrice: number;
  maxStudents: number;
  maxTeachers: number;
  organization: { id: string; name: string };
};

const tierColors: Record<string, string> = {
  FREE: "secondary",
  STARTER: "outline",
  PROFESSIONAL: "default",
  ENTERPRISE: "default",
};

const statusColors: Record<string, string> = {
  ACTIVE: "default",
  TRIAL: "secondary",
  PAST_DUE: "destructive",
  CANCELLED: "destructive",
  EXPIRED: "destructive",
};

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // We fetch users with their subscriptions via the analytics endpoint for summary
      // and list all orgs for the table
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/super-admin/schools?${params}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      const orgs = json.data.items;
      const subs: Subscription[] = orgs
        .filter((o: { subscription: unknown }) => o.subscription)
        .map((o: { id: string; name: string; subscription: { id: string; tier: string; status: string; monthlyPrice: number; maxStudents: number; maxTeachers: number } }) => ({
          id: o.subscription.id,
          tier: o.subscription.tier,
          status: o.subscription.status,
          monthlyPrice: o.subscription.monthlyPrice,
          maxStudents: o.subscription.maxStudents,
          maxTeachers: o.subscription.maxTeachers,
          organization: { id: o.id, name: o.name },
        }));

      setSubscriptions(subs);
      setTotal(json.data.total);
      setTotalPages(json.data.totalPages);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalMRR = subscriptions.reduce((sum, s) => sum + s.monthlyPrice, 0);
  const activeCount = subscriptions.filter((s) => s.status === "ACTIVE").length;

  const columns: Column<Subscription>[] = [
    {
      key: "org",
      header: "School",
      render: (row) => (
        <div>
          <div className="font-medium">{row.organization.name}</div>
          <div className="text-xs text-muted-foreground">{row.id.slice(0, 8)}</div>
        </div>
      ),
    },
    {
      key: "tier",
      header: "Plan",
      render: (row) => <Badge variant={tierColors[row.tier] as "default" | "secondary" | "outline"}>{row.tier}</Badge>,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <Badge variant={statusColors[row.status] as "default" | "secondary" | "destructive"}>{row.status}</Badge>,
    },
    {
      key: "monthlyPrice",
      header: "MRR",
      render: (row) => <span className="tabular-nums">${row.monthlyPrice.toLocaleString()}</span>,
    },
    {
      key: "limits",
      header: "Limits",
      render: (row) => (
        <span className="text-muted-foreground">
          {row.maxStudents} students / {row.maxTeachers} teachers
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Subscriptions"
        description="Manage school subscriptions and billing tiers"
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total MRR" icon={DollarSign} count={totalMRR} format={(n) => `$${n.toLocaleString()}`} accent="text-emerald-500" />
        <StatCard label="Active Subscriptions" icon={CreditCard} count={activeCount} accent="text-blue-500" />
        <StatCard label="Total Subscriptions" icon={ArrowUpDown} count={total} accent="text-primary" />
      </div>

      <DataTable
        columns={columns}
        rows={subscriptions}
        loading={loading}
        error={error}
        total={total}
        page={page}
        totalPages={totalPages}
        search={search}
        onSearch={(v) => { setSearch(v); setPage(1); }}
        onPage={setPage}
        rowKey={(r) => r.id}
        searchPlaceholder="Search subscriptions..."
      />
    </>
  );
}
