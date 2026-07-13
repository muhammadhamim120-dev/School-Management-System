"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { TableFilter } from "@/components/dashboard/table-filter";
import { ShiftFilter } from "@/components/dashboard/shift-filter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { TeacherForm } from "@/components/teachers/teacher-form";
import { useResourceList } from "@/hooks/use-resource-list";
import { teachersApi, campusesApi } from "@/services/resources";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/components/i18n-provider";
import { formatDate, formatCurrency, initials, avatarUrl } from "@/lib/utils";
import type { Teacher, Campus } from "@/types";

const statusVariant = (s: string) => (s === "ACTIVE" ? "success" : s === "SUSPENDED" ? "destructive" : "secondary");

export default function TeachersPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { toast } = useToast();
  const list = useResourceList<Teacher>(teachersApi.list);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Teacher | null>(null);
  const [deleting, setDeleting] = React.useState<Teacher | null>(null);
  const [deleteLoading, setDeleteLoading] = React.useState(false);
  const [campuses, setCampuses] = React.useState<Campus[]>([]);

  React.useEffect(() => {
    campusesApi.list({ limit: 100 }).then((d) => setCampuses(d.items)).catch(() => {});
  }, []);

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await teachersApi.remove(deleting.id);
      toast({ variant: "success", title: "Teacher deleted", description: `${deleting.fullName} was removed.` });
      setDeleting(null);
      list.refresh();
    } catch (e) {
      toast({ variant: "destructive", title: "Couldn't delete teacher", description: (e as Error).message });
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns: Column<Teacher>[] = [
    {
      key: "fullName", header: t("col.teacher"), sortField: "fullName",
      render: (t) => (
        <div className="flex items-center gap-3">
          <Avatar><AvatarImage src={t.photo || avatarUrl(t.fullName)} /><AvatarFallback>{initials(t.fullName)}</AvatarFallback></Avatar>
          <div>
            <div className="font-medium">{t.fullName}</div>
            <div className="text-xs text-muted-foreground">{t.teacherId}</div>
          </div>
        </div>
      ),
    },
    { key: "department", header: t("col.department"), render: (t) => t.department ?? "—" },
    { key: "subject", header: t("col.subject"), render: (t) => t.subject ?? "—" },
    { key: "experience", header: t("col.experience"), sortField: "experience", render: (t) => `${t.experience ?? 0} yrs` },
    { key: "phone", header: t("col.phone"), render: (t) => t.phone ?? "—" },
    { key: "joiningDate", header: t("col.joined"), sortField: "joiningDate", render: (t) => formatDate(t.joiningDate) },
    { key: "salary", header: t("col.salary"), render: (t) => formatCurrency(t.salary) },
    { key: "status", header: t("col.status"), render: (t) => <Badge variant={statusVariant(t.status)} dot>{t.status}</Badge> },
    {
      key: "actions", header: "", className: "text-right",
      render: (t) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" onClick={() => { setEditing(t); setFormOpen(true); }} aria-label="Edit">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleting(t)} aria-label="Delete">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t("page.teachers.title")}
        description={t("page.teachers.desc")}
        action={
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4" /> {t("page.teachers.add")}
          </Button>
        }
      />
      <DataTable
        columns={columns}
        rows={list.rows}
        loading={list.loading}
        error={list.error}
        total={list.total}
        page={list.page}
        totalPages={list.totalPages}
        search={list.search}
        onSearch={list.onSearch}
        onPage={list.setPage}
        sort={list.sort}
        onToggleSort={list.toggleSort}
        activeFilterCount={list.activeFilterCount}
        onClearFilters={list.clearFilters}
        onRetry={list.refresh}
        searchPlaceholder="Search by name, ID, or department…"
        rowKey={(t) => t.id}
        onRowClick={(t) => router.push(`/dashboard/teachers/${t.id}`)}
        filters={
          <>
            <ShiftFilter
              value={(list.filters.shift as "ALL" | "MORNING" | "DAY" | "EVENING") ?? "ALL"}
              onChange={(v) => list.setFilter("shift", v === "ALL" ? undefined : v)}
            />
            <TableFilter
              placeholder="All statuses"
              value={list.filters.status}
              onChange={(v) => list.setFilter("status", v)}
              options={[
                { label: "Active", value: "ACTIVE" },
                { label: "Inactive", value: "INACTIVE" },
                { label: "Suspended", value: "SUSPENDED" },
              ]}
            />
          </>
        }
      />
      <TeacherForm open={formOpen} onOpenChange={setFormOpen} teacher={editing} campuses={campuses} onSaved={list.refresh} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete teacher?"
        description={`This will permanently remove ${deleting?.fullName}. This action cannot be undone.`}
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </div>
  );
}
