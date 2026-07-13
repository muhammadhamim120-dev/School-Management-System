"use client";
import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2, Tag, ListTree } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "@/components/form-field";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { feeCategorySchema, feeStructureSchema, type FeeCategoryInput, type FeeStructureInput } from "@/lib/validations";
import { feeCategoriesApi, feeStructuresApi } from "@/services/resources";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/components/i18n-provider";
import type { FeeCategory, FeeStructureWithCategory } from "@/types";

const FEE_TYPES = ["TUITION", "ADMISSION", "EXAM", "TRANSPORT", "HOSTEL", "COACHING", "LIBRARY", "OTHER"] as const;
const RECURRENCES = ["ONE_TIME", "MONTHLY", "TERM", "ANNUAL"] as const;

export default function FeeSetupPage() {
  const { toast } = useToast();
  const { t, money } = useI18n();

  const [categories, setCategories] = React.useState<FeeCategory[]>([]);
  const [structures, setStructures] = React.useState<FeeStructureWithCategory[]>([]);
  const [catLoading, setCatLoading] = React.useState(true);
  const [structLoading, setStructLoading] = React.useState(true);

  const [catOpen, setCatOpen] = React.useState(false);
  const [editingCat, setEditingCat] = React.useState<FeeCategory | null>(null);
  const [deletingCat, setDeletingCat] = React.useState<FeeCategory | null>(null);

  const [structOpen, setStructOpen] = React.useState(false);
  const [editingStruct, setEditingStruct] = React.useState<FeeStructureWithCategory | null>(null);
  const [deletingStruct, setDeletingStruct] = React.useState<FeeStructureWithCategory | null>(null);

  const loadCats = React.useCallback(() => {
    setCatLoading(true);
    feeCategoriesApi.list({ limit: 100 }).then((d) => setCategories(d.items)).catch(() => setCategories([])).finally(() => setCatLoading(false));
  }, []);
  const loadStructs = React.useCallback(() => {
    setStructLoading(true);
    feeStructuresApi.list({ limit: 100 }).then((d) => setStructures(d.items)).catch(() => setStructures([])).finally(() => setStructLoading(false));
  }, []);
  React.useEffect(() => { loadCats(); loadStructs(); }, [loadCats, loadStructs]);

  const catForm = useForm<FeeCategoryInput>({ resolver: zodResolver(feeCategorySchema) });
  const structForm = useForm<FeeStructureInput>({ resolver: zodResolver(feeStructureSchema) });

  const openCat = (c?: FeeCategory) => {
    setEditingCat(c ?? null);
    catForm.reset({ name: c?.name ?? "", type: (c?.type as FeeCategoryInput["type"]) ?? "TUITION", recurrence: (c?.recurrence as FeeCategoryInput["recurrence"]) ?? "ONE_TIME", description: c?.description ?? "", isActive: c?.isActive ?? true });
    setCatOpen(true);
  };
  const openStruct = (s?: FeeStructureWithCategory) => {
    setEditingStruct(s ?? null);
    structForm.reset({ categoryId: s?.categoryId ?? "", amount: s?.amount ?? 0, label: s?.label ?? "", shift: (s?.shift as FeeStructureInput["shift"]) ?? undefined, isActive: s?.isActive ?? true });
    setStructOpen(true);
  };

  const submitCat = async (values: FeeCategoryInput) => {
    try {
      if (editingCat) await feeCategoriesApi.update(editingCat.id, values);
      else await feeCategoriesApi.create(values);
      toast({ variant: "success", title: editingCat ? "Category updated" : "Category created" });
      setCatOpen(false); loadCats();
    } catch (e) { toast({ variant: "destructive", title: "Error", description: (e as Error).message }); }
  };
  const submitStruct = async (values: FeeStructureInput) => {
    try {
      if (editingStruct) await feeStructuresApi.update(editingStruct.id, values);
      else await feeStructuresApi.create(values);
      toast({ variant: "success", title: editingStruct ? "Structure updated" : "Structure created" });
      setStructOpen(false); loadStructs();
    } catch (e) { toast({ variant: "destructive", title: "Error", description: (e as Error).message }); }
  };
  const delCat = async () => {
    if (!deletingCat) return;
    try { await feeCategoriesApi.remove(deletingCat.id); toast({ variant: "success", title: "Category deleted" }); setDeletingCat(null); loadCats(); loadStructs(); }
    catch (e) { toast({ variant: "destructive", title: "Error", description: (e as Error).message }); }
  };
  const delStruct = async () => {
    if (!deletingStruct) return;
    try { await feeStructuresApi.remove(deletingStruct.id); toast({ variant: "success", title: "Structure deleted" }); setDeletingStruct(null); loadStructs(); }
    catch (e) { toast({ variant: "destructive", title: "Error", description: (e as Error).message }); }
  };

  return (
    <div>
      <PageHeader title={t("fin.setup")} description={t("fin.setupDesc")} />
      <Tabs defaultValue="categories">
        <TabsList>
          <TabsTrigger value="categories">{t("fin.categories")}</TabsTrigger>
          <TabsTrigger value="structures">{t("fin.structures")}</TabsTrigger>
        </TabsList>

        {/* Categories */}
        <TabsContent value="categories" className="mt-4">
          <div className="mb-4 flex justify-end">
            <Button onClick={() => openCat()}><Plus className="h-4 w-4" /> {t("fin.addCategory")}</Button>
          </div>
          {catLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>
          ) : categories.length === 0 ? (
            <Card><CardContent className="py-16 text-center text-muted-foreground">{t("fin.noCategories")}</CardContent></Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((c) => (
                <Card key={c.id}>
                  <CardHeader className="flex-row items-start justify-between space-y-0">
                    <div>
                      <CardTitle className="flex items-center gap-2"><Tag className="h-4 w-4 text-primary" /> {c.name}</CardTitle>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Badge variant="secondary">{c.type}</Badge>
                        <Badge variant="outline">{c.recurrence}</Badge>
                        {!c.isActive && <Badge variant="secondary">Inactive</Badge>}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {c.description && <p className="mb-3 text-sm text-muted-foreground">{c.description}</p>}
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openCat(c)}><Pencil className="h-3.5 w-3.5" /> {t("common.edit")}</Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeletingCat(c)}><Trash2 className="h-3.5 w-3.5" /> {t("common.delete")}</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Structures */}
        <TabsContent value="structures" className="mt-4">
          <div className="mb-4 flex justify-end">
            <Button onClick={() => openStruct()} disabled={categories.length === 0}><Plus className="h-4 w-4" /> {t("fin.addStructure")}</Button>
          </div>
          {structLoading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
          ) : structures.length === 0 ? (
            <Card><CardContent className="py-16 text-center text-muted-foreground">{t("fin.noStructures")}</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {structures.map((s) => (
                <Card key={s.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <ListTree className="h-4 w-4 text-primary" />
                      <div>
                        <div className="font-medium">{s.category?.name ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">{s.label ?? ""}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-semibold tabular-nums">{money(s.amount)}</span>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openStruct(s)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeletingStruct(s)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Category dialog */}
      <Dialog open={catOpen} onOpenChange={setCatOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingCat ? t("common.edit") : t("fin.addCategory")}</DialogTitle></DialogHeader>
          <form onSubmit={catForm.handleSubmit(submitCat)} className="space-y-4">
            <Field label={t("fin.categoryName")} error={catForm.formState.errors.name?.message} required><Input {...catForm.register("name")} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("fin.type")} error={catForm.formState.errors.type?.message} required>
                <Select value={catForm.watch("type")} onValueChange={(v) => catForm.setValue("type", v as FeeCategoryInput["type"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{FEE_TYPES.map((ft) => <SelectItem key={ft} value={ft}>{ft}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label={t("fin.recurrence")} error={catForm.formState.errors.recurrence?.message}>
                <Select value={catForm.watch("recurrence")} onValueChange={(v) => catForm.setValue("recurrence", v as FeeCategoryInput["recurrence"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{RECURRENCES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            </div>
            <Field label={t("fin.description")} error={catForm.formState.errors.description?.message}><Input {...catForm.register("description")} /></Field>
            <div className="flex items-center gap-2">
              <Switch checked={catForm.watch("isActive")} onCheckedChange={(c) => catForm.setValue("isActive", c)} />
              <span className="text-sm">{t("fin.active")}</span>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCatOpen(false)}>{t("common.cancel")}</Button>
              <Button type="submit" disabled={catForm.formState.isSubmitting}>{catForm.formState.isSubmitting ? "Saving..." : t("common.save")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Structure dialog */}
      <Dialog open={structOpen} onOpenChange={setStructOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingStruct ? t("common.edit") : t("fin.addStructure")}</DialogTitle></DialogHeader>
          <form onSubmit={structForm.handleSubmit(submitStruct)} className="space-y-4">
            <Field label={t("fin.category")} error={structForm.formState.errors.categoryId?.message} required>
              <Select value={structForm.watch("categoryId")} onValueChange={(v) => structForm.setValue("categoryId", v)}>
                <SelectTrigger><SelectValue placeholder={t("fin.category")} /></SelectTrigger>
                <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label={t("fin.amount")} error={structForm.formState.errors.amount?.message} required><Input type="number" min={0} {...structForm.register("amount")} /></Field>
            <Field label={t("field.shift")} error={structForm.formState.errors.shift?.message}>
              <Select value={structForm.watch("shift") ?? "none"} onValueChange={(v) => structForm.setValue("shift", v === "none" ? undefined : (v as FeeStructureInput["shift"]))}>
                <SelectTrigger><SelectValue placeholder={t("placeholder.selectShift")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  <SelectItem value="MORNING">{t("shift.MORNING")}</SelectItem>
                  <SelectItem value="DAY">{t("shift.DAY")}</SelectItem>
                  <SelectItem value="EVENING">{t("shift.EVENING")}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("fin.label")} error={structForm.formState.errors.label?.message}><Input {...structForm.register("label")} placeholder="e.g. Grade 5 — 2025 — Morning" /></Field>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setStructOpen(false)}>{t("common.cancel")}</Button>
              <Button type="submit" disabled={structForm.formState.isSubmitting}>{structForm.formState.isSubmitting ? "Saving..." : t("common.save")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deletingCat} onOpenChange={(o) => !o && setDeletingCat(null)} title="Delete category?" description={`This removes ${deletingCat?.name} and its structures.`} onConfirm={delCat} />
      <ConfirmDialog open={!!deletingStruct} onOpenChange={(o) => !o && setDeletingStruct(null)} title="Delete structure?" description="This removes the fee structure." onConfirm={delStruct} />
    </div>
  );
}
