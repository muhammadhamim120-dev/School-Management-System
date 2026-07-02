"use client";
import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, BookMarked } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { TableFilter } from "@/components/dashboard/table-filter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "@/components/form-field";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { useResourceList } from "@/hooks/use-resource-list";
import { bookSchema, type BookInput } from "@/lib/validations";
import { booksApi, bookCategoriesApi, authorsApi, publishersApi } from "@/services/resources";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/components/i18n-provider";
import type { BookWithRelations, BookCategory, Author, Publisher } from "@/types";

export default function BooksPage() {
  const { toast } = useToast();
  const { t, num } = useI18n();
  const list = useResourceList<BookWithRelations>(booksApi.list);

  const [categories, setCategories] = React.useState<BookCategory[]>([]);
  const [authors, setAuthors] = React.useState<Author[]>([]);
  const [publishers, setPublishers] = React.useState<Publisher[]>([]);
  const [open, setOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState<BookWithRelations | null>(null);

  React.useEffect(() => {
    bookCategoriesApi.list({ limit: 100 }).then((d) => setCategories(d.items)).catch(() => {});
    authorsApi.list({ limit: 200 }).then((d) => setAuthors(d.items)).catch(() => {});
    publishersApi.list({ limit: 200 }).then((d) => setPublishers(d.items)).catch(() => {});
  }, []);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } =
    useForm<BookInput>({ resolver: zodResolver(bookSchema), defaultValues: { copyCount: 1 } });

  const openForm = () => { reset({ title: "", copyCount: 1 }); setOpen(true); };

  const onSubmit = async (values: BookInput) => {
    try {
      await booksApi.create(values);
      toast({ variant: "success", title: "Book added" });
      setOpen(false); list.refresh();
    } catch (e) { toast({ variant: "destructive", title: "Error", description: (e as Error).message }); }
  };
  const handleDelete = async () => {
    if (!deleting) return;
    try { await booksApi.remove(deleting.id); toast({ variant: "success", title: "Book deleted" }); setDeleting(null); list.refresh(); }
    catch (e) { toast({ variant: "destructive", title: "Error", description: (e as Error).message }); }
  };

  const columns: Column<BookWithRelations>[] = [
    { key: "title", header: t("lib.title2"), sortField: "title", render: (b) => (
      <div className="flex items-center gap-2"><BookMarked className="h-4 w-4 text-primary" /><div><div className="font-medium">{b.title}</div>{b.isbn && <div className="text-xs text-muted-foreground tabular-nums">{b.isbn}</div>}</div></div>
    ) },
    { key: "author", header: t("lib.author"), render: (b) => b.author?.name ?? "—" },
    { key: "category", header: t("lib.category"), render: (b) => b.category ? <Badge variant="secondary">{b.category.name}</Badge> : "—" },
    { key: "language", header: t("lib.language"), render: (b) => b.language ?? "—" },
    { key: "location", header: `${t("lib.shelf")}/${t("lib.rack")}`, render: (b) => [b.shelf, b.rack].filter(Boolean).join(" / ") || "—" },
    { key: "copies", header: t("lib.copies"), render: (b) => <span className="tabular-nums">{num(b._count?.copies ?? 0)}</span> },
    { key: "actions", header: "", className: "text-right", render: (b) => (
      <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleting(b)}><Trash2 className="h-4 w-4" /></Button>
      </div>
    ) },
  ];

  return (
    <div>
      <PageHeader title={t("lib.catalog")} description={t("lib.subtitle")}
        action={<Button onClick={openForm}><Plus className="h-4 w-4" /> {t("lib.addBook")}</Button>} />

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
        searchPlaceholder="Search title or ISBN…"
        rowKey={(b) => b.id}
        filters={
          <>
            <TableFilter placeholder={t("lib.category")} value={list.filters.categoryId} onChange={(v) => list.setFilter("categoryId", v)}
              options={categories.map((c) => ({ label: c.name, value: c.id }))} />
            <TableFilter placeholder={t("lib.language")} value={list.filters.language} onChange={(v) => list.setFilter("language", v)}
              options={[{ label: "Bangla", value: "Bangla" }, { label: "English", value: "English" }]} />
          </>
        }
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{t("lib.addBook")}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label={t("lib.title2")} error={errors.title?.message} required className="sm:col-span-2"><Input {...register("title")} /></Field>
              <Field label={t("lib.isbn")} error={errors.isbn?.message}><Input {...register("isbn")} /></Field>
              <Field label={t("lib.language")}>
                <Select value={watch("language") ?? ""} onValueChange={(v) => setValue("language", v)}>
                  <SelectTrigger><SelectValue placeholder={t("lib.language")} /></SelectTrigger>
                  <SelectContent><SelectItem value="Bangla">Bangla</SelectItem><SelectItem value="English">English</SelectItem><SelectItem value="Arabic">Arabic</SelectItem></SelectContent>
                </Select>
              </Field>
              <Field label={t("lib.category")}>
                <Select value={watch("categoryId") ?? ""} onValueChange={(v) => setValue("categoryId", v)}>
                  <SelectTrigger><SelectValue placeholder={t("lib.category")} /></SelectTrigger>
                  <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label={t("lib.author")}>
                <Select value={watch("authorId") ?? ""} onValueChange={(v) => setValue("authorId", v)}>
                  <SelectTrigger><SelectValue placeholder={t("lib.author")} /></SelectTrigger>
                  <SelectContent>{authors.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label={t("lib.publisher")}>
                <Select value={watch("publisherId") ?? ""} onValueChange={(v) => setValue("publisherId", v)}>
                  <SelectTrigger><SelectValue placeholder={t("lib.publisher")} /></SelectTrigger>
                  <SelectContent>{publishers.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label={t("lib.edition")}><Input {...register("edition")} /></Field>
              <Field label={t("lib.year")} error={errors.publishYear?.message}><Input type="number" {...register("publishYear")} /></Field>
              <Field label={t("lib.shelf")}><Input {...register("shelf")} /></Field>
              <Field label={t("lib.rack")}><Input {...register("rack")} /></Field>
              <Field label={t("lib.copyCount")} error={errors.copyCount?.message}><Input type="number" min={0} max={100} {...register("copyCount")} /></Field>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : t("common.save")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title="Delete book?" description={`This removes "${deleting?.title}" and all its copies.`} onConfirm={handleDelete} />
    </div>
  );
}
