"use client";
import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, MessageSquare, Send, Users, FileText, CheckCircle2, XCircle } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "@/components/form-field";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { useResourceList } from "@/hooks/use-resource-list";
import { request } from "@/services/api-client";
import { smsTemplateSchema, type SmsTemplateInput, type SmsMessageInput } from "@/lib/validations";
import { smsTemplatesApi, smsMessagesApi } from "@/services/resources";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/components/i18n-provider";
import type { SmsTemplate, SmsMessageWithRelations } from "@/types";
import type { MessageKey } from "@/lib/i18n/messages";

const statusVariant = (s: string) => (s === "SENT" ? "success" : s === "FAILED" ? "destructive" : s === "QUEUED" ? "warning" : "secondary");
const AUDIENCES = ["ALL", "STUDENTS", "PARENTS", "TEACHERS", "CUSTOM"] as const;

type Summary = {
  templates: number; totalMessages: number; totalSent: number; totalRecipients: number;
  statusBreakdown: { status: string; count: number }[];
  provider: { active: string; configured: boolean; providers: { id: string; configured: boolean }[] };
};

export default function SmsPage() {
  const { t, num } = useI18n();
  const [summary, setSummary] = React.useState<Summary | null>(null);
  const [loading, setLoading] = React.useState(true);
  const load = React.useCallback(() => {
    setLoading(true);
    request<Summary>("/api/sms-summary").then(setSummary).catch(() => setSummary(null)).finally(() => setLoading(false));
  }, []);
  React.useEffect(() => { load(); }, [load]);

  const kpis = summary ? [
    { icon: MessageSquare, label: t("sms.totalMessages"), value: num(summary.totalMessages) },
    { icon: Send, label: t("sms.totalSent"), value: num(summary.totalSent) },
    { icon: Users, label: t("sms.totalRecipients"), value: num(summary.totalRecipients) },
    { icon: FileText, label: t("sms.templatesCount"), value: num(summary.templates) },
  ] : [];

  return (
    <div>
      <PageHeader title={t("sms.title")} description={t("sms.subtitle")} />
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      ) : summary ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map((k) => { const Icon = k.icon; return (
              <Card key={k.label}><CardContent className="flex items-center gap-3 p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
                <div><div className="text-xl font-bold tabular-nums">{k.value}</div><div className="text-xs text-muted-foreground">{k.label}</div></div>
              </CardContent></Card>
            ); })}
          </div>
          <Card className="mt-4">
            <CardHeader><CardTitle className="text-sm">{t("sms.provider")}</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3 text-sm">
              <Badge variant="secondary">{summary.provider.active}</Badge>
              {summary.provider.configured
                ? <span className="flex items-center gap-1 text-success"><CheckCircle2 className="h-4 w-4" /> {t("sms.configured")}</span>
                : <span className="flex items-center gap-1 text-muted-foreground"><XCircle className="h-4 w-4" /> {t("sms.notConfigured")}</span>}
              {!summary.provider.configured && <span className="text-xs text-muted-foreground">{t("sms.providerNote")}</span>}
            </CardContent>
          </Card>
        </>
      ) : null}

      <div className="mt-6">
        <Tabs defaultValue="messages">
          <TabsList>
            <TabsTrigger value="messages">{t("sms.messages")}</TabsTrigger>
            <TabsTrigger value="templates">{t("sms.templates")}</TabsTrigger>
          </TabsList>
          <TabsContent value="messages" className="mt-4"><MessagesTab onChange={load} /></TabsContent>
          <TabsContent value="templates" className="mt-4"><TemplatesTab onChange={load} /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function MessagesTab({ onChange }: { onChange: () => void }) {
  const { t, num, date } = useI18n();
  const { toast } = useToast();
  const list = useResourceList<SmsMessageWithRelations>(smsMessagesApi.list);
  const [templates, setTemplates] = React.useState<SmsTemplate[]>([]);
  const [open, setOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState<SmsMessageWithRelations | null>(null);
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [audience, setAudience] = React.useState<typeof AUDIENCES[number]>("STUDENTS");
  const [category, setCategory] = React.useState<string>("GENERAL");
  const [templateId, setTemplateId] = React.useState("");
  const [customNumbers, setCustomNumbers] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => { smsTemplatesApi.list({ limit: 100 }).then((d) => setTemplates(d.items)).catch(() => {}); }, []);

  const openForm = () => { setTitle(""); setBody(""); setAudience("STUDENTS"); setCategory("GENERAL"); setTemplateId(""); setCustomNumbers(""); setOpen(true); };
  const applyTemplate = (id: string) => {
    setTemplateId(id);
    const tpl = templates.find((x) => x.id === id);
    if (tpl) { setBody(tpl.body); if (tpl.category) setCategory(tpl.category); }
  };
  const submit = async (send: boolean) => {
    if (!body.trim()) { toast({ variant: "destructive", title: "Message body required" }); return; }
    setSaving(true);
    try {
      const payload: SmsMessageInput = {
        title: title || undefined, body, audience, category: category as SmsMessageInput["category"], templateId: templateId || undefined, send,
        recipients: audience === "CUSTOM"
          ? customNumbers.split(",").map((n) => n.trim()).filter(Boolean).map((phone) => ({ name: undefined, phone }))
          : [],
      };
      await smsMessagesApi.create(payload);
      toast({ variant: "success", title: send ? "Message dispatched" : "Draft saved" });
      setOpen(false); list.refresh(); onChange();
    } catch (e) { toast({ variant: "destructive", title: "Error", description: (e as Error).message }); }
    finally { setSaving(false); }
  };
  const del = async () => { if (!deleting) return;
    try { await smsMessagesApi.remove(deleting.id); toast({ variant: "success", title: "Deleted" }); setDeleting(null); list.refresh(); onChange(); }
    catch (e) { toast({ variant: "destructive", title: "Error", description: (e as Error).message }); } };

  const columns: Column<SmsMessageWithRelations>[] = [
    { key: "title", header: t("sms.title2"), render: (m) => (
      <div><div className="font-medium">{m.title ?? "—"}</div><div className="max-w-xs truncate text-xs text-muted-foreground">{m.body}</div></div>
    ) },
    { key: "audience", header: t("sms.audience"), render: (m) => <Badge variant="secondary">{t(`sms.aud.${m.audience}` as MessageKey)}</Badge> },
    { key: "recipients", header: t("sms.recipients"), render: (m) => <span className="tabular-nums">{num(m.totalCount)}</span> },
    { key: "status", header: t("sms.status"), render: (m) => <Badge variant={statusVariant(m.status)} dot>{m.status}</Badge> },
    { key: "date", header: t("col.date"), render: (m) => date(m.createdAt) },
    { key: "actions", header: "", className: "text-right", render: (m) => (
      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleting(m)}><Trash2 className="h-4 w-4" /></Button>
    ) },
  ];
  return (
    <div>
      <div className="mb-4 flex justify-end"><Button onClick={openForm}><Plus className="h-4 w-4" /> {t("sms.compose")}</Button></div>
      <DataTable columns={columns} rows={list.rows} loading={list.loading} error={list.error} total={list.total}
        page={list.page} totalPages={list.totalPages} search={list.search} onSearch={list.onSearch} onPage={list.setPage}
        onRetry={list.refresh} rowKey={(m) => m.id} searchPlaceholder="Search…" />
      <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{t("sms.compose")}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <Field label={t("sms.title2")}><Input value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("sms.audience")}>
              <Select value={audience} onValueChange={(v) => setAudience(v as typeof audience)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{AUDIENCES.map((a) => <SelectItem key={a} value={a}>{t(`sms.aud.${a}` as MessageKey)}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label={t("sms.useTemplate")}>
              <Select value={templateId} onValueChange={applyTemplate}>
                <SelectTrigger><SelectValue placeholder={t("sms.template")} /></SelectTrigger>
                <SelectContent>{templates.map((tp) => <SelectItem key={tp.id} value={tp.id}>{tp.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>
          {audience === "CUSTOM" && (
            <Field label={t("sms.customNumbers")}><Input value={customNumbers} onChange={(e) => setCustomNumbers(e.target.value)} placeholder="017…, 018…" /></Field>
          )}
          <Field label={t("sms.body")}><Textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} /></Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => submit(false)} disabled={saving}>{t("sms.saveDraft")}</Button>
          <Button onClick={() => submit(true)} disabled={saving}><Send className="h-4 w-4" /> {t("sms.sendNow")}</Button>
        </DialogFooter>
      </DialogContent></Dialog>
      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title="Delete message?" description="Removes this message and its recipients." onConfirm={del} />
    </div>
  );
}

function TemplatesTab({ onChange }: { onChange: () => void }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const list = useResourceList<SmsTemplate>(smsTemplatesApi.list);
  const [open, setOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState<SmsTemplate | null>(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<SmsTemplateInput>({ resolver: zodResolver(smsTemplateSchema) });
  const openForm = () => { reset({ name: "", body: "" }); setOpen(true); };
  const onSubmit = async (v: SmsTemplateInput) => {
    try { await smsTemplatesApi.create(v); toast({ variant: "success", title: "Template saved" }); setOpen(false); list.refresh(); onChange(); }
    catch (e) { toast({ variant: "destructive", title: "Error", description: (e as Error).message }); }
  };
  const del = async () => { if (!deleting) return;
    try { await smsTemplatesApi.remove(deleting.id); toast({ variant: "success", title: "Deleted" }); setDeleting(null); list.refresh(); onChange(); }
    catch (e) { toast({ variant: "destructive", title: "Error", description: (e as Error).message }); } };
  const columns: Column<SmsTemplate>[] = [
    { key: "name", header: t("sms.name"), render: (tp) => <span className="font-medium">{tp.name}</span> },
    { key: "body", header: t("sms.body"), render: (tp) => <span className="max-w-md truncate text-sm text-muted-foreground">{tp.body}</span> },
    { key: "actions", header: "", className: "text-right", render: (tp) => (
      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleting(tp)}><Trash2 className="h-4 w-4" /></Button>
    ) },
  ];
  return (
    <div>
      <div className="mb-4 flex justify-end"><Button onClick={openForm}><Plus className="h-4 w-4" /> {t("sms.newTemplate")}</Button></div>
      <DataTable columns={columns} rows={list.rows} loading={list.loading} error={list.error} total={list.total}
        page={list.page} totalPages={list.totalPages} search={list.search} onSearch={list.onSearch} onPage={list.setPage}
        onRetry={list.refresh} rowKey={(tp) => tp.id} searchPlaceholder="Search template…" />
      <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{t("sms.newTemplate")}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label={t("sms.name")} error={errors.name?.message} required><Input {...register("name")} /></Field>
          <Field label={t("sms.body")} error={errors.body?.message} required><Textarea rows={4} {...register("body")} /></Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : t("common.save")}</Button>
          </DialogFooter>
        </form>
      </DialogContent></Dialog>
      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title="Delete template?" description={`Removes ${deleting?.name}.`} onConfirm={del} />
    </div>
  );
}
