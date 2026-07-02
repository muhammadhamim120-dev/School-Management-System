"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { TableFilter } from "@/components/dashboard/table-filter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { StudentForm } from "@/components/students/student-form";
import { useResourceList } from "@/hooks/use-resource-list";
import { studentsApi, classesApi, sectionsApi, parentsApi, campusesApi, sessionsApi } from "@/services/resources";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/components/i18n-provider";
import { formatDate, initials, avatarUrl } from "@/lib/utils";
import type { StudentWithRelations, Class, Section, Parent, Campus, AcademicSession } from "@/types";

const statusVariant = (s: string) => (s === "ACTIVE" ? "success" : s === "SUSPENDED" ? "destructive" : "secondary");

export default function StudentsPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { toast } = useToast();
  const list = useResourceList<StudentWithRelations>(studentsApi.list);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<StudentWithRelations | null>(null);
  const [deleting, setDeleting] = React.useState<StudentWithRelations | null>(null);
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  const [classes, setClasses] = React.useState<Class[]>([]);
  const [sections, setSections] = React.useState<(Section & { classId: string })[]>([]);
  const [parents, setParents] = React.useState<Parent[]>([]);
  const [campuses, setCampuses] = React.useState<Campus[]>([]);
  const [sessions, setSessions] = React.useState<AcademicSession[]>([]);

  React.useEffect(() => {
    classesApi.list({ limit: 100 }).then((d) => setClasses(d.items)).catch(() => {});
    sectionsApi.list({ limit: 100 }).then((d) => setSections(d.items as never)).catch(() => {});
    parentsApi.list({ limit: 100 }).then((d) => setParents(d.items)).catch(() => {});
    campusesApi.list({ limit: 100 }).then((d) => setCampuses(d.items)).catch(() => {});
    sessionsApi.list({ limit: 100 }).then((d) => setSessions(d.items)).catch(() => {});
  }, []);

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await studentsApi.remove(deleting.id);
      toast({ variant: "success", title: "Student deleted", description: `${deleting.fullName} was removed.` });
      setDeleting(null);
      list.refresh();
    } catch (e) {
      toast({ variant: "destructive", title: "Couldn't delete student", description: (e as Error).message });
    } finally {
      setDeleteLoading(false);
    }
  };

  // Sections filtered to the selected class (if any).
  const selectedClassId = list.filters.classId;
  const sectionOptions = sections
    .filter((s) => !selectedClassId || s.classId === selectedClassId)
    .map((s) => ({ label: s.name, value: s.id }));

  const columns: Column<StudentWithRelations>[] = [
    {
      key: "fullName", header: t("col.student"), sortField: "fullName",
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
    { key: "class", header: t("col.class"), render: (s) => s.class?.name ?? "—" },
    { key: "section", header: t("col.section"), render: (s) => s.section?.name ?? "—" },
    { key: "rollNumber", header: t("col.roll"), sortField: "rollNumber", render: (s) => s.rollNumber ?? "—" },
    { key: "phone", header: t("col.phone"), render: (s) => s.phone ?? "—" },
    { key: "admissionDate", header: t("col.admitted"), sortField: "admissionDate", render: (s) => formatDate(s.admissionDate) },
    { key: "status", header: t("col.status"), render: (s) => <Badge variant={statusVariant(s.status)} dot>{s.status}</Badge> },
    {
      key: "actions", header: "", className: "text-right",
      render: (s) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" onClick={() => { setEditing(s); setFormOpen(true); }} aria-label="Edit">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleting(s)} aria-label="Delete">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t("page.students.title")}
        description={t("page.students.desc")}
        action={
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4" /> {t("page.students.add")}
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
        searchPlaceholder="Search by name, ID, or email…"
        rowKey={(s) => s.id}
        onRowClick={(s) => router.push(`/dashboard/students/${s.id}`)}
        filters={
          <>
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
            <TableFilter
              placeholder="All classes"
              value={list.filters.classId}
              onChange={(v) => { list.setFilter("classId", v); list.setFilter("sectionId", undefined); }}
              options={classes.map((c) => ({ label: c.name, value: c.id }))}
            />
            <TableFilter
              placeholder="All sections"
              value={list.filters.sectionId}
              onChange={(v) => list.setFilter("sectionId", v)}
              options={sectionOptions}
            />
          </>
        }
      />
      <StudentForm
        open={formOpen}
        onOpenChange={setFormOpen}
        student={editing}
        classes={classes}
        sections={sections}
        parents={parents}
        campuses={campuses}
        sessions={sessions}
        onSaved={list.refresh}
      />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete student?"
        description={`This will permanently remove ${deleting?.fullName}. This action cannot be undone.`}
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </div>
  );
}
