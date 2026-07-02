"use client";
import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Building, BedDouble, Users, LogOut } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "@/components/form-field";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { useResourceList } from "@/hooks/use-resource-list";
import { request } from "@/services/api-client";
import {
  hostelBuildingSchema, hostelRoomSchema, hostelAllocationSchema,
  type HostelBuildingInput, type HostelRoomInput, type HostelAllocationInput,
} from "@/lib/validations";
import { hostelBuildingsApi, hostelRoomsApi, hostelAllocationsApi, studentsApi } from "@/services/resources";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/components/i18n-provider";
import type { BuildingWithRooms, RoomWithRelations, AllocationWithRelations, StudentWithRelations } from "@/types";

const roomStatusVariant = (s: string) => (s === "AVAILABLE" ? "success" : s === "FULL" ? "warning" : "secondary");

type Summary = { buildings: number; rooms: number; capacity: number; occupants: number; vacancies: number; roomStatus: { status: string; count: number }[] };

export default function HostelPage() {
  const { t, num } = useI18n();
  const [summary, setSummary] = React.useState<Summary | null>(null);
  const [loading, setLoading] = React.useState(true);
  const load = React.useCallback(() => {
    setLoading(true);
    request<Summary>("/api/hostel-summary").then(setSummary).catch(() => setSummary(null)).finally(() => setLoading(false));
  }, []);
  React.useEffect(() => { load(); }, [load]);

  const kpis = summary ? [
    { icon: Building, label: t("hos.buildings"), value: num(summary.buildings) },
    { icon: BedDouble, label: t("hos.rooms"), value: num(summary.rooms) },
    { icon: Users, label: t("hos.occupants"), value: num(summary.occupants) },
    { icon: BedDouble, label: t("hos.vacancies"), value: num(summary.vacancies) },
  ] : [];

  return (
    <div>
      <PageHeader title={t("hos.title")} description={t("hos.subtitle")} />
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      ) : summary ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((k) => { const Icon = k.icon; return (
            <Card key={k.label}><CardContent className="flex items-center gap-3 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
              <div><div className="text-xl font-bold tabular-nums">{k.value}</div><div className="text-xs text-muted-foreground">{k.label}</div></div>
            </CardContent></Card>
          ); })}
        </div>
      ) : null}

      <div className="mt-6">
        <Tabs defaultValue="buildings">
          <TabsList>
            <TabsTrigger value="buildings">{t("hos.buildings")}</TabsTrigger>
            <TabsTrigger value="rooms">{t("hos.rooms")}</TabsTrigger>
            <TabsTrigger value="allocations">{t("hos.allocations")}</TabsTrigger>
          </TabsList>
          <TabsContent value="buildings" className="mt-4"><BuildingsTab onChange={load} /></TabsContent>
          <TabsContent value="rooms" className="mt-4"><RoomsTab onChange={load} /></TabsContent>
          <TabsContent value="allocations" className="mt-4"><AllocationsTab onChange={load} /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function BuildingsTab({ onChange }: { onChange: () => void }) {
  const { t, num } = useI18n();
  const { toast } = useToast();
  const list = useResourceList<BuildingWithRooms>(hostelBuildingsApi.list);
  const [open, setOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState<BuildingWithRooms | null>(null);
  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<HostelBuildingInput>({ resolver: zodResolver(hostelBuildingSchema) });
  const openForm = () => { reset({ name: "" }); setOpen(true); };
  const onSubmit = async (v: HostelBuildingInput) => {
    try { await hostelBuildingsApi.create(v); toast({ variant: "success", title: "Building added" }); setOpen(false); list.refresh(); onChange(); }
    catch (e) { toast({ variant: "destructive", title: "Error", description: (e as Error).message }); }
  };
  const del = async () => { if (!deleting) return;
    try { await hostelBuildingsApi.remove(deleting.id); toast({ variant: "success", title: "Deleted" }); setDeleting(null); list.refresh(); onChange(); }
    catch (e) { toast({ variant: "destructive", title: "Error", description: (e as Error).message }); } };
  const columns: Column<BuildingWithRooms>[] = [
    { key: "name", header: t("hos.name"), render: (b) => <span className="font-medium">{b.name}</span> },
    { key: "gender", header: t("hos.gender"), render: (b) => b.gender ?? "—" },
    { key: "warden", header: t("hos.warden"), render: (b) => b.warden ?? "—" },
    { key: "rooms", header: t("hos.rooms"), render: (b) => <span className="tabular-nums">{num(b._count?.rooms ?? 0)}</span> },
    { key: "actions", header: "", className: "text-right", render: (b) => (
      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleting(b)}><Trash2 className="h-4 w-4" /></Button>
    ) },
  ];
  return (
    <div>
      <div className="mb-4 flex justify-end"><Button onClick={openForm}><Plus className="h-4 w-4" /> {t("hos.addBuilding")}</Button></div>
      <DataTable columns={columns} rows={list.rows} loading={list.loading} error={list.error} total={list.total}
        page={list.page} totalPages={list.totalPages} search={list.search} onSearch={list.onSearch} onPage={list.setPage}
        onRetry={list.refresh} rowKey={(b) => b.id} searchPlaceholder="Search building…" />
      <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{t("hos.addBuilding")}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label={t("hos.name")} error={errors.name?.message} required><Input {...register("name")} /></Field>
          <Field label={t("hos.gender")}>
            <Select value={watch("gender") ?? ""} onValueChange={(v) => setValue("gender", v as HostelBuildingInput["gender"])}>
              <SelectTrigger><SelectValue placeholder={t("hos.gender")} /></SelectTrigger>
              <SelectContent><SelectItem value="MALE">Male</SelectItem><SelectItem value="FEMALE">Female</SelectItem><SelectItem value="OTHER">Other</SelectItem></SelectContent>
            </Select>
          </Field>
          <Field label={t("hos.warden")}><Input {...register("warden")} /></Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : t("common.save")}</Button>
          </DialogFooter>
        </form>
      </DialogContent></Dialog>
      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title="Delete building?" description={`Removes ${deleting?.name} and its rooms.`} onConfirm={del} />
    </div>
  );
}

function RoomsTab({ onChange }: { onChange: () => void }) {
  const { t, money, num } = useI18n();
  const { toast } = useToast();
  const list = useResourceList<RoomWithRelations>(hostelRoomsApi.list);
  const [buildings, setBuildings] = React.useState<BuildingWithRooms[]>([]);
  const [open, setOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState<RoomWithRelations | null>(null);
  React.useEffect(() => { hostelBuildingsApi.list({ limit: 100 }).then((d) => setBuildings(d.items)).catch(() => {}); }, []);
  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<HostelRoomInput>({ resolver: zodResolver(hostelRoomSchema), defaultValues: { capacity: 4, monthlyFee: 0, status: "AVAILABLE" } });
  const openForm = () => { reset({ buildingId: "", roomNo: "", capacity: 4, monthlyFee: 0, status: "AVAILABLE" }); setOpen(true); };
  const onSubmit = async (v: HostelRoomInput) => {
    try { await hostelRoomsApi.create(v); toast({ variant: "success", title: "Room added" }); setOpen(false); list.refresh(); onChange(); }
    catch (e) { toast({ variant: "destructive", title: "Error", description: (e as Error).message }); }
  };
  const del = async () => { if (!deleting) return;
    try { await hostelRoomsApi.remove(deleting.id); toast({ variant: "success", title: "Deleted" }); setDeleting(null); list.refresh(); onChange(); }
    catch (e) { toast({ variant: "destructive", title: "Error", description: (e as Error).message }); } };
  const columns: Column<RoomWithRelations>[] = [
    { key: "roomNo", header: t("hos.roomNo"), render: (r) => <span className="font-medium">{r.roomNo}</span> },
    { key: "building", header: t("hos.building"), render: (r) => r.building?.name ?? "—" },
    { key: "occupancy", header: t("hos.occupancy"), render: (r) => <span className="tabular-nums">{num(r._count?.allocations ?? 0)}/{num(r.capacity)}</span> },
    { key: "monthlyFee", header: t("hos.monthlyFee"), render: (r) => <span className="tabular-nums">{money(r.monthlyFee)}</span> },
    { key: "status", header: t("hos.status"), render: (r) => <Badge variant={roomStatusVariant(r.status)} dot>{r.status}</Badge> },
    { key: "actions", header: "", className: "text-right", render: (r) => (
      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleting(r)}><Trash2 className="h-4 w-4" /></Button>
    ) },
  ];
  return (
    <div>
      <div className="mb-4 flex justify-end"><Button onClick={openForm} disabled={buildings.length === 0}><Plus className="h-4 w-4" /> {t("hos.addRoom")}</Button></div>
      <DataTable columns={columns} rows={list.rows} loading={list.loading} error={list.error} total={list.total}
        page={list.page} totalPages={list.totalPages} search={list.search} onSearch={list.onSearch} onPage={list.setPage}
        onRetry={list.refresh} rowKey={(r) => r.id} searchPlaceholder="Search room…" />
      <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{t("hos.addRoom")}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label={t("hos.building")} error={errors.buildingId?.message} required>
            <Select value={watch("buildingId")} onValueChange={(v) => setValue("buildingId", v)}>
              <SelectTrigger><SelectValue placeholder={t("hos.building")} /></SelectTrigger>
              <SelectContent>{buildings.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("hos.roomNo")} error={errors.roomNo?.message} required><Input {...register("roomNo")} /></Field>
            <Field label={t("hos.capacity")} error={errors.capacity?.message}><Input type="number" min={1} {...register("capacity")} /></Field>
          </div>
          <Field label={t("hos.monthlyFee")} error={errors.monthlyFee?.message}><Input type="number" min={0} {...register("monthlyFee")} /></Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : t("common.save")}</Button>
          </DialogFooter>
        </form>
      </DialogContent></Dialog>
      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title="Delete room?" description={`Removes room ${deleting?.roomNo}.`} onConfirm={del} />
    </div>
  );
}

function AllocationsTab({ onChange }: { onChange: () => void }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const list = useResourceList<AllocationWithRelations>(hostelAllocationsApi.list);
  const [rooms, setRooms] = React.useState<RoomWithRelations[]>([]);
  const [students, setStudents] = React.useState<StudentWithRelations[]>([]);
  const [open, setOpen] = React.useState(false);
  const [vacating, setVacating] = React.useState<AllocationWithRelations | null>(null);
  React.useEffect(() => {
    hostelRoomsApi.list({ limit: 300 }).then((d) => setRooms(d.items.filter((r) => r.status !== "FULL"))).catch(() => {});
    studentsApi.list({ limit: 300 }).then((d) => setStudents(d.items)).catch(() => {});
  }, []);
  const { handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<HostelAllocationInput>({ resolver: zodResolver(hostelAllocationSchema), defaultValues: { status: "ACTIVE" } });
  const openForm = () => { reset({ status: "ACTIVE", roomId: "", studentId: "" }); setOpen(true); };
  const onSubmit = async (v: HostelAllocationInput) => {
    try { await hostelAllocationsApi.create(v); toast({ variant: "success", title: "Allocated" }); setOpen(false); list.refresh(); onChange(); }
    catch (e) { toast({ variant: "destructive", title: "Error", description: (e as Error).message }); }
  };
  const vacate = async () => { if (!vacating) return;
    try { await hostelAllocationsApi.update(vacating.id, {}); toast({ variant: "success", title: "Vacated" }); setVacating(null); list.refresh(); onChange(); }
    catch (e) { toast({ variant: "destructive", title: "Error", description: (e as Error).message }); } };
  const columns: Column<AllocationWithRelations>[] = [
    { key: "student", header: t("hos.student"), render: (a) => a.student?.fullName ?? "—" },
    { key: "building", header: t("hos.building"), render: (a) => a.room?.building?.name ?? "—" },
    { key: "room", header: t("hos.room"), render: (a) => a.room?.roomNo ?? "—" },
    { key: "status", header: t("hos.status"), render: (a) => <Badge variant={a.status === "ACTIVE" ? "success" : "secondary"} dot>{a.status}</Badge> },
    { key: "actions", header: "", className: "text-right", render: (a) => (
      a.status === "ACTIVE" ? <Button variant="ghost" size="sm" onClick={() => setVacating(a)}><LogOut className="h-3.5 w-3.5" /> {t("hos.vacate")}</Button> : <span className="text-xs text-muted-foreground">—</span>
    ) },
  ];
  return (
    <div>
      <div className="mb-4 flex justify-end"><Button onClick={openForm}><Plus className="h-4 w-4" /> {t("hos.allocate")}</Button></div>
      <DataTable columns={columns} rows={list.rows} loading={list.loading} error={list.error} total={list.total}
        page={list.page} totalPages={list.totalPages} search={list.search} onSearch={list.onSearch} onPage={list.setPage}
        onRetry={list.refresh} rowKey={(a) => a.id} searchPlaceholder="Search…" />
      <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{t("hos.allocate")}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label={t("hos.student")} error={errors.studentId?.message} required>
            <Select value={watch("studentId")} onValueChange={(v) => setValue("studentId", v)}>
              <SelectTrigger><SelectValue placeholder={t("opt.selectStudent")} /></SelectTrigger>
              <SelectContent>{students.map((s) => <SelectItem key={s.id} value={s.id}>{s.fullName}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label={t("hos.room")} error={errors.roomId?.message} required>
            <Select value={watch("roomId")} onValueChange={(v) => setValue("roomId", v)}>
              <SelectTrigger><SelectValue placeholder={t("hos.room")} /></SelectTrigger>
              <SelectContent>{rooms.map((r) => <SelectItem key={r.id} value={r.id}>{r.building?.name} · {r.roomNo}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : t("common.save")}</Button>
          </DialogFooter>
        </form>
      </DialogContent></Dialog>
      <ConfirmDialog open={!!vacating} onOpenChange={(o) => !o && setVacating(null)} title="Vacate room?" description="Marks this allocation as vacated and frees the room." onConfirm={vacate} confirmLabel={t("hos.vacate")} />
    </div>
  );
}
