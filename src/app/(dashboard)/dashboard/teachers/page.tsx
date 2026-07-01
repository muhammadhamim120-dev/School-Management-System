"use client";
import * as React from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { TeacherForm } from "@/components/teachers/teacher-form";
import { useResourceList } from "@/hooks/use-resource-list";
import { teachersApi } from "@/services/resources";
import { useToast } from "@/hooks/use-toast";
import { formatDate, formatCurrency, initials, avatarUrl } from "@/lib/utils";
import type { Teacher } from "@/types";

const statusVariant = (s: string) => (s === "ACTIVE" ? "success" : s === "SUSPENDED" ? "destructive" : "secondary");

export default function TeachersPage() {
  const { toast } = useToast();
  const list = useResourceList<Teacher>(teachersApi.list);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Teacher | null>(null);
  const [deleting, setDeleting] = React.useState<Teacher | null>(null);
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await teachersApi.remove(deleting.id);
      toast({ variant: "success", title: "Teacher deleted" });
      setDeleting(null);
      list.refresh();
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: (e as Error).message });
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns: Column<Teacher>[] = [
    {
      key: "fullName", header: "Teacher",
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
    { key: "department", header: "Department", render: (t) => t.department ?? "—" },
    { key: "subject", header: "Subject", render: (t) => t.subject ?? "—" },
    { key: "experience", header: "Experience", render: (t) => `${t.experience ?? 0} yrs` },
    { key: "phone", header: "Phone", render: (t) => t.phone ?? "—" },
    { key: "joiningDate", header: "Joined", render: (t) => formatDate(t.joiningDate) },
    { key: "salary", header: "Salary", render: (t) => formatCurrency(t.salary) },
    { key: "status", header: "Status", render: (t) => <Badge variant={statusVariant(t.status)}>{t.status}</Badge> },
    {
      key: "actions", header: "", className: "text-right",
      render: (t) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={() => { setEditing(t); setFormOpen(true); }}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleting(t)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Teacher Management"
        description="Manage teaching staff, departments, and assignments"
        action={
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4" /> Add Teacher
          </Button>
        }
      />
      <DataTable
        columns={columns}
        rows={list.rows}
        loading={list.loading}
        total={list.total}
        page={list.page}
        totalPages={list.totalPages}
        search={list.search}
        onSearch={list.onSearch}
        onPage={list.setPage}
        searchPlaceholder="Search teachers..."
        rowKey={(t) => t.id}
      />
      <TeacherForm open={formOpen} onOpenChange={setFormOpen} teacher={editing} onSaved={list.refresh} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete teacher?"
        description={`This will permanently remove ${deleting?.fullName}.`}
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </div>
  );
}
