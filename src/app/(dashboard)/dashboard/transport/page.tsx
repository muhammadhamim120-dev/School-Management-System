"use client";
import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Bus, User, Route as RouteIcon, MapPin, X, CheckCircle2, XCircle } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  driverSchema, vehicleSchema, transportRouteSchema, studentTransportSchema,
  type DriverInput, type VehicleInput, type TransportRouteInput, type StudentTransportInput,
} from "@/lib/validations";
import { driversApi, vehiclesApi, transportRoutesApi, studentTransportApi, studentsApi } from "@/services/resources";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/components/i18n-provider";
import type { Driver, VehicleWithDriver, RouteWithRelations, StudentTransportWithRelations, StudentWithRelations } from "@/types";

const vehicleStatusVariant = (s: string) => (s === "ACTIVE" ? "success" : s === "MAINTENANCE" ? "warning" : "secondary");

type Summary = {
  totalVehicles: number; totalRoutes: number; totalDrivers: number; riders: number;
  vehicleStatus: { status: string; count: number }[]; trackingConfigured: boolean;
};

export default function TransportPage() {
  const { t, num } = useI18n();
  const [summary, setSummary] = React.useState<Summary | null>(null);
  const [sumLoading, setSumLoading] = React.useState(true);

  const loadSummary = React.useCallback(() => {
    setSumLoading(true);
    request<Summary>("/api/transport-summary").then(setSummary).catch(() => setSummary(null)).finally(() => setSumLoading(false));
  }, []);
  React.useEffect(() => { loadSummary(); }, [loadSummary]);

  const kpis = summary ? [
    { icon: Bus, label: t("trn.totalVehicles"), value: num(summary.totalVehicles) },
    { icon: RouteIcon, label: t("trn.totalRoutes"), value: num(summary.totalRoutes) },
    { icon: User, label: t("trn.totalDrivers"), value: num(summary.totalDrivers) },
    { icon: MapPin, label: t("trn.riders"), value: num(summary.riders) },
  ] : [];

  return (
    <div>
      <PageHeader title={t("trn.title")} description={t("trn.subtitle")} />

      {sumLoading ? (
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

      {summary && (
        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium">{t("trn.tracking")}:</span>
          {summary.trackingConfigured
            ? <span className="flex items-center gap-1 text-success"><CheckCircle2 className="h-4 w-4" /> {t("trn.trackingOn")}</span>
            : <span className="flex items-center gap-1"><XCircle className="h-4 w-4" /> {t("trn.trackingOff")}</span>}
        </div>
      )}

      <div className="mt-6">
        <Tabs defaultValue="vehicles">
          <TabsList>
            <TabsTrigger value="vehicles">{t("trn.vehicles")}</TabsTrigger>
            <TabsTrigger value="drivers">{t("trn.drivers")}</TabsTrigger>
            <TabsTrigger value="routes">{t("trn.routes")}</TabsTrigger>
            <TabsTrigger value="assignments">{t("trn.assignments")}</TabsTrigger>
          </TabsList>
          <TabsContent value="vehicles" className="mt-4"><VehiclesTab onChange={loadSummary} /></TabsContent>
          <TabsContent value="drivers" className="mt-4"><DriversTab onChange={loadSummary} /></TabsContent>
          <TabsContent value="routes" className="mt-4"><RoutesTab onChange={loadSummary} /></TabsContent>
          <TabsContent value="assignments" className="mt-4"><AssignmentsTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/* ---------------- Vehicles ---------------- */
function VehiclesTab({ onChange }: { onChange: () => void }) {
  const { t, num } = useI18n();
  const { toast } = useToast();
  const list = useResourceList<VehicleWithDriver>(vehiclesApi.list);
  const [drivers, setDrivers] = React.useState<Driver[]>([]);
  const [open, setOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState<VehicleWithDriver | null>(null);
  React.useEffect(() => { driversApi.list({ limit: 200 }).then((d) => setDrivers(d.items)).catch(() => {}); }, []);
  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } =
    useForm<VehicleInput>({ resolver: zodResolver(vehicleSchema), defaultValues: { type: "BUS", status: "ACTIVE", capacity: 30 } });
  const openForm = () => { reset({ regNumber: "", type: "BUS", status: "ACTIVE", capacity: 30 }); setOpen(true); };
  const onSubmit = async (v: VehicleInput) => {
    try { await vehiclesApi.create(v); toast({ variant: "success", title: "Vehicle added" }); setOpen(false); list.refresh(); onChange(); }
    catch (e) { toast({ variant: "destructive", title: "Error", description: (e as Error).message }); }
  };
  const del = async () => { if (!deleting) return;
    try { await vehiclesApi.remove(deleting.id); toast({ variant: "success", title: "Deleted" }); setDeleting(null); list.refresh(); onChange(); }
    catch (e) { toast({ variant: "destructive", title: "Error", description: (e as Error).message }); } };
  const columns: Column<VehicleWithDriver>[] = [
    { key: "regNumber", header: t("trn.regNumber"), render: (v) => <span className="font-medium">{v.regNumber}</span> },
    { key: "type", header: t("trn.type"), render: (v) => v.type },
    { key: "capacity", header: t("trn.capacity"), render: (v) => <span className="tabular-nums">{num(v.capacity)}</span> },
    { key: "driver", header: t("trn.driver"), render: (v) => v.driver?.name ?? "—" },
    { key: "status", header: t("trn.status"), render: (v) => <Badge variant={vehicleStatusVariant(v.status)} dot>{v.status}</Badge> },
    { key: "actions", header: "", className: "text-right", render: (v) => (
      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleting(v)}><Trash2 className="h-4 w-4" /></Button>
    ) },
  ];
  return (
    <div>
      <div className="mb-4 flex justify-end"><Button onClick={openForm}><Plus className="h-4 w-4" /> {t("trn.addVehicle")}</Button></div>
      <DataTable columns={columns} rows={list.rows} loading={list.loading} error={list.error} total={list.total}
        page={list.page} totalPages={list.totalPages} search={list.search} onSearch={list.onSearch} onPage={list.setPage}
        onRetry={list.refresh} rowKey={(v) => v.id} searchPlaceholder="Search reg. no…" />
      <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{t("trn.addVehicle")}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label={t("trn.regNumber")} error={errors.regNumber?.message} required><Input {...register("regNumber")} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("trn.type")}>
              <Select value={watch("type")} onValueChange={(v) => setValue("type", v as VehicleInput["type"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["BUS","MINIBUS","VAN","CAR"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label={t("trn.capacity")} error={errors.capacity?.message}><Input type="number" min={1} {...register("capacity")} /></Field>
          </div>
          <Field label={t("trn.driver")}>
            <Select value={watch("driverId") ?? ""} onValueChange={(v) => setValue("driverId", v)}>
              <SelectTrigger><SelectValue placeholder={t("trn.driver")} /></SelectTrigger>
              <SelectContent>{drivers.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label={t("trn.status")}>
            <Select value={watch("status")} onValueChange={(v) => setValue("status", v as VehicleInput["status"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["ACTIVE","MAINTENANCE","INACTIVE"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : t("common.save")}</Button>
          </DialogFooter>
        </form>
      </DialogContent></Dialog>
      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title="Delete vehicle?" description={`Removes ${deleting?.regNumber}.`} onConfirm={del} />
    </div>
  );
}

/* ---------------- Drivers ---------------- */
function DriversTab({ onChange }: { onChange: () => void }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const list = useResourceList<Driver>(driversApi.list);
  const [open, setOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState<Driver | null>(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<DriverInput>({ resolver: zodResolver(driverSchema) });
  const openForm = () => { reset({ name: "" }); setOpen(true); };
  const onSubmit = async (v: DriverInput) => {
    try { await driversApi.create(v); toast({ variant: "success", title: "Driver added" }); setOpen(false); list.refresh(); onChange(); }
    catch (e) { toast({ variant: "destructive", title: "Error", description: (e as Error).message }); }
  };
  const del = async () => { if (!deleting) return;
    try { await driversApi.remove(deleting.id); toast({ variant: "success", title: "Deleted" }); setDeleting(null); list.refresh(); onChange(); }
    catch (e) { toast({ variant: "destructive", title: "Error", description: (e as Error).message }); } };
  const columns: Column<Driver>[] = [
    { key: "name", header: t("trn.name"), render: (d) => <span className="font-medium">{d.name}</span> },
    { key: "phone", header: t("trn.phone"), render: (d) => d.phone ?? "—" },
    { key: "licenseNo", header: t("trn.licenseNo"), render: (d) => d.licenseNo ?? "—" },
    { key: "actions", header: "", className: "text-right", render: (d) => (
      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleting(d)}><Trash2 className="h-4 w-4" /></Button>
    ) },
  ];
  return (
    <div>
      <div className="mb-4 flex justify-end"><Button onClick={openForm}><Plus className="h-4 w-4" /> {t("trn.addDriver")}</Button></div>
      <DataTable columns={columns} rows={list.rows} loading={list.loading} error={list.error} total={list.total}
        page={list.page} totalPages={list.totalPages} search={list.search} onSearch={list.onSearch} onPage={list.setPage}
        onRetry={list.refresh} rowKey={(d) => d.id} searchPlaceholder="Search driver…" />
      <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{t("trn.addDriver")}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label={t("trn.name")} error={errors.name?.message} required><Input {...register("name")} /></Field>
          <Field label={t("trn.phone")}><Input {...register("phone")} /></Field>
          <Field label={t("trn.licenseNo")}><Input {...register("licenseNo")} /></Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : t("common.save")}</Button>
          </DialogFooter>
        </form>
      </DialogContent></Dialog>
      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title="Delete driver?" description={`Removes ${deleting?.name}.`} onConfirm={del} />
    </div>
  );
}

/* ---------------- Routes ---------------- */
type StopDraft = { name: string; pickupTime: string };
function RoutesTab({ onChange }: { onChange: () => void }) {
  const { t, money, num } = useI18n();
  const { toast } = useToast();
  const list = useResourceList<RouteWithRelations>(transportRoutesApi.list);
  const [vehicles, setVehicles] = React.useState<VehicleWithDriver[]>([]);
  const [open, setOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState<RouteWithRelations | null>(null);
  const [name, setName] = React.useState(""); const [code, setCode] = React.useState(""); const [fare, setFare] = React.useState("0");
  const [vehicleId, setVehicleId] = React.useState(""); const [stops, setStops] = React.useState<StopDraft[]>([{ name: "", pickupTime: "" }]);
  const [saving, setSaving] = React.useState(false);
  React.useEffect(() => { vehiclesApi.list({ limit: 200 }).then((d) => setVehicles(d.items)).catch(() => {}); }, []);
  const openForm = () => { setName(""); setCode(""); setFare("0"); setVehicleId(""); setStops([{ name: "", pickupTime: "" }]); setOpen(true); };
  const submit = async () => {
    if (!name || !code) { toast({ variant: "destructive", title: "Name and code required" }); return; }
    setSaving(true);
    try {
      const payload: TransportRouteInput = {
        name, code, fare: Number(fare) || 0, vehicleId: vehicleId || undefined,
        stops: stops.filter((s) => s.name).map((s, i) => ({ name: s.name, sequence: i, pickupTime: s.pickupTime || undefined })),
      };
      await transportRoutesApi.create(payload);
      toast({ variant: "success", title: "Route added" }); setOpen(false); list.refresh(); onChange();
    } catch (e) { toast({ variant: "destructive", title: "Error", description: (e as Error).message }); }
    finally { setSaving(false); }
  };
  const del = async () => { if (!deleting) return;
    try { await transportRoutesApi.remove(deleting.id); toast({ variant: "success", title: "Deleted" }); setDeleting(null); list.refresh(); onChange(); }
    catch (e) { toast({ variant: "destructive", title: "Error", description: (e as Error).message }); } };
  const columns: Column<RouteWithRelations>[] = [
    { key: "name", header: t("trn.name"), render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "code", header: t("trn.code"), render: (r) => <span className="tabular-nums">{r.code}</span> },
    { key: "fare", header: t("trn.fare"), render: (r) => <span className="tabular-nums">{money(r.fare)}</span> },
    { key: "vehicle", header: t("trn.vehicle"), render: (r) => r.vehicle?.regNumber ?? "—" },
    { key: "stops", header: t("trn.stops"), render: (r) => <span className="tabular-nums">{num(r.stops?.length ?? 0)}</span> },
    { key: "riders", header: t("trn.riders"), render: (r) => <span className="tabular-nums">{num(r._count?.assignments ?? 0)}</span> },
    { key: "actions", header: "", className: "text-right", render: (r) => (
      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleting(r)}><Trash2 className="h-4 w-4" /></Button>
    ) },
  ];
  return (
    <div>
      <div className="mb-4 flex justify-end"><Button onClick={openForm}><Plus className="h-4 w-4" /> {t("trn.addRoute")}</Button></div>
      <DataTable columns={columns} rows={list.rows} loading={list.loading} error={list.error} total={list.total}
        page={list.page} totalPages={list.totalPages} search={list.search} onSearch={list.onSearch} onPage={list.setPage}
        onRetry={list.refresh} rowKey={(r) => r.id} searchPlaceholder="Search route…" />
      <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{t("trn.addRoute")}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("trn.name")} required><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
            <Field label={t("trn.code")} required><Input value={code} onChange={(e) => setCode(e.target.value)} /></Field>
            <Field label={t("trn.fare")}><Input type="number" min={0} value={fare} onChange={(e) => setFare(e.target.value)} /></Field>
            <Field label={t("trn.vehicle")}>
              <Select value={vehicleId} onValueChange={setVehicleId}>
                <SelectTrigger><SelectValue placeholder={t("trn.vehicle")} /></SelectTrigger>
                <SelectContent>{vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.regNumber}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between"><span className="text-sm font-medium">{t("trn.stops")}</span>
              <Button type="button" variant="ghost" size="sm" onClick={() => setStops((p) => [...p, { name: "", pickupTime: "" }])}><Plus className="h-3.5 w-3.5" /> {t("trn.addStop")}</Button></div>
            {stops.map((s, idx) => (
              <div key={idx} className="grid grid-cols-12 items-center gap-2">
                <div className="col-span-7"><Input placeholder={t("trn.stopName")} value={s.name} onChange={(e) => setStops((p) => p.map((x, i) => i === idx ? { ...x, name: e.target.value } : x))} /></div>
                <div className="col-span-4"><Input placeholder={t("trn.pickupTime")} value={s.pickupTime} onChange={(e) => setStops((p) => p.map((x, i) => i === idx ? { ...x, pickupTime: e.target.value } : x))} /></div>
                <div className="col-span-1 flex justify-end">{stops.length > 1 && <Button type="button" variant="ghost" size="icon" onClick={() => setStops((p) => p.filter((_, i) => i !== idx))}><X className="h-4 w-4" /></Button>}</div>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Saving..." : t("common.save")}</Button>
        </DialogFooter>
      </DialogContent></Dialog>
      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title="Delete route?" description={`Removes ${deleting?.name} and its stops.`} onConfirm={del} />
    </div>
  );
}

/* ---------------- Assignments ---------------- */
function AssignmentsTab() {
  const { t } = useI18n();
  const { toast } = useToast();
  const list = useResourceList<StudentTransportWithRelations>(studentTransportApi.list);
  const [students, setStudents] = React.useState<StudentWithRelations[]>([]);
  const [routes, setRoutes] = React.useState<RouteWithRelations[]>([]);
  const [open, setOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState<StudentTransportWithRelations | null>(null);
  const { handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } =
    useForm<StudentTransportInput>({ resolver: zodResolver(studentTransportSchema), defaultValues: { status: "ACTIVE" } });
  const selectedRoute = routes.find((r) => r.id === watch("routeId"));
  React.useEffect(() => {
    studentsApi.list({ limit: 300 }).then((d) => setStudents(d.items)).catch(() => {});
    transportRoutesApi.list({ limit: 200 }).then((d) => setRoutes(d.items)).catch(() => {});
  }, []);
  const openForm = () => { reset({ status: "ACTIVE", studentId: "", routeId: "" }); setOpen(true); };
  const onSubmit = async (v: StudentTransportInput) => {
    try { await studentTransportApi.create(v); toast({ variant: "success", title: "Assigned" }); setOpen(false); list.refresh(); }
    catch (e) { toast({ variant: "destructive", title: "Error", description: (e as Error).message }); }
  };
  const del = async () => { if (!deleting) return;
    try { await studentTransportApi.remove(deleting.id); toast({ variant: "success", title: "Removed" }); setDeleting(null); list.refresh(); }
    catch (e) { toast({ variant: "destructive", title: "Error", description: (e as Error).message }); } };
  const columns: Column<StudentTransportWithRelations>[] = [
    { key: "student", header: t("trn.student"), render: (a) => a.student?.fullName ?? "—" },
    { key: "route", header: t("trn.route"), render: (a) => a.route?.name ?? "—" },
    { key: "stop", header: t("trn.stop"), render: (a) => a.stop?.name ?? "—" },
    { key: "status", header: t("trn.status"), render: (a) => <Badge variant={a.status === "ACTIVE" ? "success" : "secondary"} dot>{a.status}</Badge> },
    { key: "actions", header: "", className: "text-right", render: (a) => (
      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleting(a)}><Trash2 className="h-4 w-4" /></Button>
    ) },
  ];
  return (
    <div>
      <div className="mb-4 flex justify-end"><Button onClick={openForm}><Plus className="h-4 w-4" /> {t("trn.assignStudent")}</Button></div>
      <DataTable columns={columns} rows={list.rows} loading={list.loading} error={list.error} total={list.total}
        page={list.page} totalPages={list.totalPages} search={list.search} onSearch={list.onSearch} onPage={list.setPage}
        onRetry={list.refresh} rowKey={(a) => a.id} searchPlaceholder="Search…" />
      <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{t("trn.assignStudent")}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label={t("trn.student")} error={errors.studentId?.message} required>
            <Select value={watch("studentId")} onValueChange={(v) => setValue("studentId", v)}>
              <SelectTrigger><SelectValue placeholder={t("opt.selectStudent")} /></SelectTrigger>
              <SelectContent>{students.map((s) => <SelectItem key={s.id} value={s.id}>{s.fullName}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label={t("trn.route")} error={errors.routeId?.message} required>
            <Select value={watch("routeId")} onValueChange={(v) => { setValue("routeId", v); setValue("stopId", undefined); }}>
              <SelectTrigger><SelectValue placeholder={t("trn.route")} /></SelectTrigger>
              <SelectContent>{routes.map((r) => <SelectItem key={r.id} value={r.id}>{r.name} ({r.code})</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          {selectedRoute && (selectedRoute.stops?.length ?? 0) > 0 && (
            <Field label={t("trn.stop")}>
              <Select value={watch("stopId") ?? ""} onValueChange={(v) => setValue("stopId", v)}>
                <SelectTrigger><SelectValue placeholder={t("trn.stop")} /></SelectTrigger>
                <SelectContent>{selectedRoute.stops!.map((s: { id: string; name: string }) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : t("common.save")}</Button>
          </DialogFooter>
        </form>
      </DialogContent></Dialog>
      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title="Remove assignment?" description="Removes this student's transport assignment." onConfirm={del} />
    </div>
  );
}
