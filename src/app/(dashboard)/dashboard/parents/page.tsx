"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { ParentForm } from "@/components/parents/parent-form";
import { useResourceList } from "@/hooks/use-resource-list";
import { parentsApi } from "@/services/resources";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/components/i18n-provider";
import { initials, avatarUrl } from "@/lib/utils";
import type { ParentWithStudents } from "@/types";

export default function ParentsPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { toast } = useToast();
  const list = useResourceList<ParentWithStudents>(parentsApi.list);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ParentWithStudents | null>(null);
  const [deleting, setDeleting] = React.useState<ParentWithStudents | null>(null);
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await parentsApi.remove(deleting.id);
      toast({ variant: "success", title: "Parent deleted", description: `${deleting.fullName} was removed.` });
      setDeleting(null);
      list.refresh();
    } catch (e) {
      toast({ variant: "destructive", title: "Couldn't delete parent", description: (e as Error).message });
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns: Column<ParentWithStudents>[] = [
    {
      key: "fullName", header: t("col.parent"), sortField: "fullName",
      render: (p) => (
        <div className="flex items-center gap-3">
          <Avatar><AvatarImage src={p.photo || avatarUrl(p.fullName)} /><AvatarFallback>{initials(p.fullName)}</AvatarFallback></Avatar>
          <div>
            <div className="font-medium">{p.fullName}</div>
            <div className="text-xs text-muted-foreground">{p.parentId}</div>
          </div>
        </div>
      ),
    },
    { key: "occupation", header: t("col.occupation"), render: (p) => p.occupation ?? "—" },
    { key: "phone", header: t("col.phone"), render: (p) => p.phone ?? "—" },
    { key: "email", header: t("col.email"), render: (p) => p.email ?? "—" },
    {
      key: "students", header: t("col.children"),
      render: (p) => <Badge variant="secondary">{p.students?.length ?? 0}</Badge>,
    },
    {
      key: "actions", header: "", className: "text-right",
      render: (p) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" onClick={() => { setEditing(p); setFormOpen(true); }} aria-label="Edit">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleting(p)} aria-label="Delete">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t("page.parents.title")}
        description={t("page.parents.desc")}
        action={
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4" /> {t("page.parents.add")}
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
        onRetry={list.refresh}
        searchPlaceholder="Search by name, ID, email, or occupation…"
        rowKey={(p) => p.id}
        onRowClick={(p) => router.push(`/dashboard/parents/${p.id}`)}
      />
      <ParentForm open={formOpen} onOpenChange={setFormOpen} parent={editing} onSaved={list.refresh} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete parent?"
        description={`This will permanently remove ${deleting?.fullName}. This action cannot be undone.`}
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </div>
  );
}
