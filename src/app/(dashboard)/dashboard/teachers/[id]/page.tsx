"use client";
import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import { Pencil, Trash2, Phone, Mail, MapPin, BookOpen, Briefcase, Award, Clock } from "lucide-react";
import { ProfileBack, InfoRow, InfoGrid, ProfileStat } from "@/components/dashboard/profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { TeacherForm } from "@/components/teachers/teacher-form";
import { teachersApi, campusesApi } from "@/services/resources";
import { useToast } from "@/hooks/use-toast";
import { formatDate, formatCurrency, initials, avatarUrl } from "@/lib/utils";

type TeacherDetail = {
  id: string; teacherId: string; fullName: string; photo?: string | null;
  department?: string | null; subject?: string | null; qualification?: string | null;
  experience?: number | null; phone?: string | null; email?: string | null;
  address?: string | null; joiningDate?: string | null; salary?: number | null; status: string;
  subjects: { id: string; name: string; code: string }[];
};

const statusVariant = (s: string) => (s === "ACTIVE" ? "success" : s === "SUSPENDED" ? "destructive" : "secondary");

export default function TeacherProfilePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { toast } = useToast();

  const [teacher, setTeacher] = React.useState<TeacherDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteLoading, setDeleteLoading] = React.useState(false);
  const [campuses, setCampuses] = React.useState<{ id: string; name: string }[]>([]);

  const load = React.useCallback(() => {
    setLoading(true);
    setError(null);
    teachersApi
      .get(id)
      .then((d) => setTeacher(d as unknown as TeacherDetail))
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [id]);

  React.useEffect(() => { load(); }, [load]);
  React.useEffect(() => {
    campusesApi.list({ limit: 100 }).then((d) => setCampuses(d.items)).catch(() => {});
  }, []);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await teachersApi.remove(id);
      toast({ variant: "success", title: "Teacher deleted" });
      router.push("/dashboard/teachers");
    } catch (e) {
      toast({ variant: "destructive", title: "Couldn't delete", description: (e as Error).message });
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <ProfileBack href="/dashboard/teachers" label="Back to teachers" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (error || !teacher) {
    return (
      <div>
        <ProfileBack href="/dashboard/teachers" label="Back to teachers" />
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="font-medium">Couldn&apos;t load this teacher</p>
            <p className="text-sm text-muted-foreground">{error ?? "The record may have been removed."}</p>
            <Button variant="outline" onClick={load}>Try again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <ProfileBack href="/dashboard/teachers" label="Back to teachers" />

      <Card className="overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-primary/15 via-primary/5 to-transparent" />
        <CardContent className="pt-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <Avatar className="-mt-10 h-24 w-24 border-4 border-card shadow-soft">
                <AvatarImage src={teacher.photo || avatarUrl(teacher.fullName)} />
                <AvatarFallback className="text-2xl">{initials(teacher.fullName)}</AvatarFallback>
              </Avatar>
              <div className="pb-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold tracking-tight">{teacher.fullName}</h2>
                  <Badge variant={statusVariant(teacher.status)} dot>{teacher.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {teacher.teacherId} · {teacher.department ?? "Staff"}
                  {teacher.subject ? ` · ${teacher.subject}` : ""}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditOpen(true)}><Pencil className="h-4 w-4" /> Edit</Button>
              <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <ProfileStat label="Experience" value={`${teacher.experience ?? 0} yrs`} icon={Clock} accent="text-primary" />
        <ProfileStat label="Subjects taught" value={teacher.subjects.length} icon={BookOpen} accent="text-primary" />
        <ProfileStat label="Department" value={teacher.department ?? "—"} icon={Briefcase} accent="text-primary" />
      </div>

      <Tabs defaultValue="overview" className="mt-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Professional information</CardTitle></CardHeader>
            <CardContent>
              <InfoGrid>
                <InfoRow label="Full name" value={teacher.fullName} />
                <InfoRow label="Teacher ID" value={teacher.teacherId} mono />
                <InfoRow label="Department" value={teacher.department ?? "—"} />
                <InfoRow label="Primary subject" value={teacher.subject ?? "—"} />
                <InfoRow label="Qualification" value={teacher.qualification ?? "—"} />
                <InfoRow label="Experience" value={`${teacher.experience ?? 0} years`} />
                <InfoRow label="Joined" value={formatDate(teacher.joiningDate)} />
                <InfoRow label="Salary" value={formatCurrency(teacher.salary)} mono />
              </InfoGrid>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Contact</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> {teacher.phone ?? "—"}</div>
              <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> {teacher.email ?? "—"}</div>
              <div className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" /> <span>{teacher.address ?? "—"}</span></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subjects" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Assigned subjects</CardTitle></CardHeader>
            <CardContent>
              {teacher.subjects.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">No subjects assigned yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {teacher.subjects.map((s) => (
                    <div key={s.id} className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-sm">
                      <Award className="h-4 w-4 text-primary" />
                      <span className="font-medium">{s.name}</span>
                      <span className="text-xs text-muted-foreground">{s.code}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <TeacherForm open={editOpen} onOpenChange={setEditOpen} teacher={teacher as never} campuses={campuses as never} onSaved={() => { setEditOpen(false); load(); }} />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete teacher?"
        description={`This will permanently remove ${teacher.fullName}. This action cannot be undone.`}
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </div>
  );
}
