"use client";
import * as React from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { StudentForm } from "@/components/students/student-form";
import { useResourceList } from "@/hooks/use-resource-list";
import { studentsApi, classesApi, sectionsApi, parentsApi } from "@/services/resources";
import { useToast } from "@/hooks/use-toast";
import { formatDate, initials, avatarUrl } from "@/lib/utils";
import type { StudentWithRelations, Class, Section, Parent } from "@/types";

const statusVariant = (s: string) => (s === "ACTIVE" ? "success" : s === "SUSPENDED" ? "destructive" : "secondary");

export default function StudentsPage() {
  const { toast } = useToast();
  const list = useResourceList<StudentWithRelations>(studentsApi.list);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<StudentWithRelations | null>(null);
  const [deleting, setDeleting] = React.useState<StudentWithRelations | null>(null);
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  const [classes, setClasses] = React.useState<Class[]>([]);
  const [sections, setSections] = React.useState<(Section & { classId: string })[]>([]);
  const [parents, setParents] = React.useState<Parent[]>([]);

  React.useEffect(() => {
    classesApi.list({ limit: 100 }).then((d) => setClasses(d.items)).catch(() => {});
    sectionsApi.list({ limit: 100 }).then((d) => setSections(d.items as never)).catch(() => {});
    parentsApi.list({ limit: 100 }).then((d) => setParents(d.items)).catch(() => {});
  }, []);

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await studentsApi.remove(deleting.id);
      toast({ variant: "success", title: "Student deleted" });
      setDeleting(null);
      list.refresh();
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: (e as Error).message });
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns: Column<StudentWithRelations>[] = [
    {
      key: "fullName", header: "Student",
      render: (s) => (
        <div className="flex items-center gap-3">
          <Avatar><AvatarImage src={s.photo || avatarUrl(s.fullName)} /><AvatarFallback>{initials(s.fullName)}</AvatarFallback></Avatar>
          <div>
            <div className="font-medium">{s.fullName}</div>
            <div className="text-xs text-muted-foreground">{s.studentId}</div>
          </div>
        </div>
      ),
    },
    { key: "class", header: "Class", render: (s) => s.class?.name ?? "—" },
    { key: "section", header: "Section", render: (s) => s.section?.name ?? "—" },
    { key: "rollNumber", header: "Roll", render: (s) => s.rollNumber ?? "—" },
    { key: "phone", header: "Phone", render: (s) => s.phone ?? "—" },
    { key: "admissionDate", header: "Admitted", render: (s) => formatDate(s.admissionDate) },
    { key: "status", header: "Status", render: (s) => <Badge variant={statusVariant(s.status)}>{s.status}</Badge> },
    {
      key: "actions", header: "", className: "text-right",
      render: (s) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={() => { setEditing(s); setFormOpen(true); }}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleting(s)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Student Management"
        description="Manage student records, enrollment, and details"
        action={
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4" /> Add Student
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
        searchPlaceholder="Search students..."
        rowKey={(s) => s.id}
      />
      <StudentForm
        open={formOpen}
        onOpenChange={setFormOpen}
        student={editing}
        classes={classes}
        sections={sections}
        parents={parents}
        onSaved={list.refresh}
      />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete student?"
        description={`This will permanently remove ${deleting?.fullName}.`}
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </div>
  );
}
