"use client";
import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2, Layers } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "@/components/form-field";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { classSchema, sectionSchema, type ClassInput, type SectionInput } from "@/lib/validations";
import { classesApi, sectionsApi } from "@/services/resources";
import { useToast } from "@/hooks/use-toast";
import type { Class, Section } from "@/types";

type ClassWithMeta = Class & { sections: Section[]; _count: { students: number; subjects: number } };

export default function ClassesPage() {
  const { toast } = useToast();
  const [rows, setRows] = React.useState<ClassWithMeta[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [classOpen, setClassOpen] = React.useState(false);
  const [sectionOpen, setSectionOpen] = React.useState(false);
  const [editingClass, setEditingClass] = React.useState<ClassWithMeta | null>(null);
  const [deleting, setDeleting] = React.useState<ClassWithMeta | null>(null);
  const [sectionClassId, setSectionClassId] = React.useState<string>("");

  const load = React.useCallback(() => {
    setLoading(true);
    classesApi.list({ limit: 100 }).then((d) => setRows(d.items as ClassWithMeta[])).catch(() => setRows([])).finally(() => setLoading(false));
  }, []);
  React.useEffect(() => { load(); }, [load]);

  const classForm = useForm<ClassInput>({ resolver: zodResolver(classSchema) });
  const sectionForm = useForm<SectionInput>({ resolver: zodResolver(sectionSchema) });

  const openClass = (c?: ClassWithMeta) => {
    setEditingClass(c ?? null);
    classForm.reset({ name: c?.name ?? "", capacity: c?.capacity ?? 40 });
    setClassOpen(true);
  };
  const openSection = (classId: string) => {
    setSectionClassId(classId);
    sectionForm.reset({ name: "", classId });
    setSectionOpen(true);
  };

  const submitClass = async (values: ClassInput) => {
    try {
      if (editingClass) await classesApi.update(editingClass.id, values);
      else await classesApi.create(values);
      toast({ variant: "success", title: editingClass ? "Class updated" : "Class created" });
      setClassOpen(false); load();
    } catch (e) { toast({ variant: "destructive", title: "Error", description: (e as Error).message }); }
  };
  const submitSection = async (values: SectionInput) => {
    try {
      await sectionsApi.create(values);
      toast({ variant: "success", title: "Section added" });
      setSectionOpen(false); load();
    } catch (e) { toast({ variant: "destructive", title: "Error", description: (e as Error).message }); }
  };
  const removeSection = async (id: string) => {
    try { await sectionsApi.remove(id); toast({ variant: "success", title: "Section removed" }); load(); }
    catch (e) { toast({ variant: "destructive", title: "Error", description: (e as Error).message }); }
  };
  const handleDelete = async () => {
    if (!deleting) return;
    try { await classesApi.remove(deleting.id); toast({ variant: "success", title: "Class deleted" }); setDeleting(null); load(); }
    catch (e) { toast({ variant: "destructive", title: "Error", description: (e as Error).message }); }
  };

  return (
    <div>
      <PageHeader
        title="Classes & Sections"
        description="Organize grade levels and their sections"
        action={<Button onClick={() => openClass()}><Plus className="h-4 w-4" /> Add Class</Button>}
      />
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : rows.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">No classes yet. Add your first class.</CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((c) => (
            <Card key={c.id}>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2"><Layers className="h-5 w-5 text-primary" /> {c.name}</CardTitle>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openClass(c)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleting(c)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>{c._count?.students ?? 0} students</span>
                  <span>{c._count?.subjects ?? 0} subjects</span>
                  <span>Cap: {c.capacity}</span>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium">Sections</span>
                    <Button variant="ghost" size="sm" onClick={() => openSection(c.id)}><Plus className="h-3 w-3" /> Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {c.sections.length === 0 ? (
                      <span className="text-xs text-muted-foreground">No sections</span>
                    ) : (
                      c.sections.map((s: Section) => (
                        <Badge key={s.id} variant="secondary" className="gap-1">
                          {s.name}
                          <button onClick={() => removeSection(s.id)} className="ml-1 text-muted-foreground hover:text-destructive">×</button>
                        </Badge>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={classOpen} onOpenChange={setClassOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingClass ? "Edit Class" : "Add Class"}</DialogTitle></DialogHeader>
          <form onSubmit={classForm.handleSubmit(submitClass)} className="space-y-4">
            <Field label="Class Name" error={classForm.formState.errors.name?.message} required>
              <Input {...classForm.register("name")} placeholder="e.g. Grade 5" />
            </Field>
            <Field label="Capacity" error={classForm.formState.errors.capacity?.message}>
              <Input type="number" min={1} {...classForm.register("capacity")} />
            </Field>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setClassOpen(false)}>Cancel</Button>
              <Button type="submit">{editingClass ? "Update" : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={sectionOpen} onOpenChange={setSectionOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Section</DialogTitle></DialogHeader>
          <form onSubmit={sectionForm.handleSubmit(submitSection)} className="space-y-4">
            <Field label="Class">
              <Select value={sectionClassId} onValueChange={(v) => { setSectionClassId(v); sectionForm.setValue("classId", v); }}>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  {rows.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Section Name" error={sectionForm.formState.errors.name?.message} required>
              <Input {...sectionForm.register("name")} placeholder="e.g. A" />
            </Field>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSectionOpen(false)}>Cancel</Button>
              <Button type="submit">Add</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete class?"
        description={`This removes ${deleting?.name} and its sections.`}
        onConfirm={handleDelete}
      />
    </div>
  );
}
