"use client";
import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Pencil, Trash2, Phone, Mail, MapPin, Users2, CalendarCheck,
  Award, CreditCard, GraduationCap, Droplet, Cake,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ProfileBack, InfoRow, InfoGrid, ProfileStat, TimelineItem } from "@/components/dashboard/profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { StudentForm } from "@/components/students/student-form";
import { studentsApi, classesApi, sectionsApi, parentsApi } from "@/services/resources";
import { useToast } from "@/hooks/use-toast";
import { formatDate, formatCurrency, initials, avatarUrl } from "@/lib/utils";
import type { Class, Section, Parent } from "@/types";

type StudentDetail = {
  id: string; studentId: string; fullName: string; photo?: string | null;
  gender?: string | null; dateOfBirth?: string | null; bloodGroup?: string | null;
  phone?: string | null; email?: string | null; address?: string | null;
  rollNumber?: string | null; admissionDate?: string | null; status: string;
  guardianName?: string | null;
  class?: { name: string } | null;
  section?: { name: string } | null;
  parent?: (Parent & { fullName: string }) | null;
  attendance: { id: string; date: string; status: string }[];
  results: { id: string; marks: number; totalMarks: number; grade: string; examId: string; subjectId: string }[];
  fees: { id: string; title: string; amount: number; paidAmount: number; status: string; dueDate: string }[];
  boardRegistrations: { id: string; boardExam: string; examYear: number; regNumber?: string | null; rollNumber?: string | null; boardName?: string | null; status: string }[];
};

const statusVariant = (s: string) => (s === "ACTIVE" ? "success" : s === "SUSPENDED" ? "destructive" : "secondary");
const boardVariant = (s: string) =>
  s === "APPROVED" ? "success" : s === "REJECTED" ? "destructive" : s === "REGISTERED" ? "default" : "secondary";
const attVariant = (s: string) =>
  s === "PRESENT" ? "success" : s === "ABSENT" ? "destructive" : s === "LATE" ? "warning" : "secondary";
const feeVariant = (s: string) =>
  s === "PAID" ? "success" : s === "OVERDUE" ? "destructive" : s === "PARTIAL" ? "warning" : "secondary";
const gradeVariant = (g: string) => (g === "F" ? "destructive" : g?.startsWith("A") ? "success" : "secondary");

export default function StudentProfilePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { toast } = useToast();

  const [student, setStudent] = React.useState<StudentDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  const [classes, setClasses] = React.useState<Class[]>([]);
  const [sections, setSections] = React.useState<(Section & { classId: string })[]>([]);
  const [parents, setParents] = React.useState<Parent[]>([]);

  const load = React.useCallback(() => {
    setLoading(true);
    setError(null);
    studentsApi
      .get(id)
      .then((d) => setStudent(d as unknown as StudentDetail))
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [id]);

  React.useEffect(() => {
    load();
    classesApi.list({ limit: 100 }).then((d) => setClasses(d.items)).catch(() => {});
    sectionsApi.list({ limit: 100 }).then((d) => setSections(d.items as never)).catch(() => {});
    parentsApi.list({ limit: 100 }).then((d) => setParents(d.items)).catch(() => {});
  }, [load]);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await studentsApi.remove(id);
      toast({ variant: "success", title: "Student deleted" });
      router.push("/dashboard/students");
    } catch (e) {
      toast({ variant: "destructive", title: "Couldn't delete", description: (e as Error).message });
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <ProfileBack href="/dashboard/students" label="Back to students" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        <Skeleton className="mt-4 h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !student) {
    return (
      <div>
        <ProfileBack href="/dashboard/students" label="Back to students" />
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="font-medium">Couldn&apos;t load this student</p>
            <p className="text-sm text-muted-foreground">{error ?? "The record may have been removed."}</p>
            <Button variant="outline" onClick={load}>Try again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Client-side summaries derived from the data the API already returns.
  const totalAtt = student.attendance.length;
  const presentCount = student.attendance.filter((a) => a.status === "PRESENT").length;
  const attendanceRate = totalAtt ? Math.round((presentCount / totalAtt) * 100) : 0;
  const avgScore = student.results.length
    ? Math.round(
        (student.results.reduce((sum, r) => sum + (r.marks / (r.totalMarks || 100)) * 100, 0) / student.results.length) * 10
      ) / 10
    : 0;
  const totalDue = student.fees.reduce((sum, f) => sum + (f.amount - f.paidAmount), 0);

  const timeline = [
    { title: "Admitted to school", date: student.admissionDate },
    ...student.results.slice(0, 3).map((r) => ({ title: `Scored ${r.grade} (${r.marks}/${r.totalMarks})`, date: undefined as string | undefined })),
    ...student.attendance.slice(0, 3).map((a) => ({ title: `Marked ${a.status.toLowerCase()}`, date: a.date })),
  ];

  return (
    <div>
      <ProfileBack href="/dashboard/students" label="Back to students" />

      {/* Header */}
      <Card className="overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-primary/15 via-primary/5 to-transparent" />
        <CardContent className="pt-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <Avatar className="-mt-10 h-24 w-24 border-4 border-card shadow-soft">
                <AvatarImage src={student.photo || avatarUrl(student.fullName)} />
                <AvatarFallback className="text-2xl">{initials(student.fullName)}</AvatarFallback>
              </Avatar>
              <div className="pb-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold tracking-tight">{student.fullName}</h2>
                  <Badge variant={statusVariant(student.status)} dot>{student.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {student.studentId} · {student.class?.name ?? "Unassigned"}
                  {student.section ? ` · Section ${student.section.name}` : ""}
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

      {/* Summary stats */}
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <ProfileStat label="Attendance rate" value={`${attendanceRate}%`} icon={CalendarCheck} accent="text-primary" />
        <ProfileStat label="Average score" value={`${avgScore}%`} icon={Award} accent="text-primary" />
        <ProfileStat label="Outstanding fees" value={formatCurrency(totalDue)} icon={CreditCard} accent="text-primary" />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="mt-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="fees">Fees</TabsTrigger>
          <TabsTrigger value="board">Board</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Personal information</CardTitle></CardHeader>
            <CardContent>
              <InfoGrid>
                <InfoRow label="Full name" value={student.fullName} />
                <InfoRow label="Student ID" value={student.studentId} mono />
                <InfoRow label="Gender" value={student.gender ?? "—"} />
                <InfoRow label="Date of birth" value={formatDate(student.dateOfBirth)} />
                <InfoRow label="Blood group" value={student.bloodGroup ?? "—"} />
                <InfoRow label="Roll number" value={student.rollNumber ?? "—"} mono />
                <InfoRow label="Class" value={student.class?.name ?? "—"} />
                <InfoRow label="Section" value={student.section?.name ?? "—"} />
                <InfoRow label="Admitted" value={formatDate(student.admissionDate)} />
              </InfoGrid>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Contact</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> {student.phone ?? "—"}</div>
                <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> {student.email ?? "—"}</div>
                <div className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" /> <span>{student.address ?? "—"}</span></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Guardian</CardTitle></CardHeader>
              <CardContent className="text-sm">
                <div className="flex items-center gap-2">
                  <Users2 className="h-4 w-4 text-muted-foreground" />
                  {student.parent?.fullName ?? student.guardianName ?? "—"}
                </div>
                {student.parent && (
                  <Button
                    variant="link"
                    className="mt-1 h-auto p-0 text-xs"
                    onClick={() => router.push(`/dashboard/parents/${student.parent!.id}`)}
                  >
                    View guardian profile →
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Attendance history</CardTitle></CardHeader>
            <CardContent className="p-0">
              {student.attendance.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">No attendance records yet.</p>
              ) : (
                <Table>
                  <TableHeader><TableRow className="hover:bg-transparent"><TableHead>Date</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {student.attendance.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>{formatDate(a.date)}</TableCell>
                        <TableCell><Badge variant={attVariant(a.status)} dot>{a.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Exam results</CardTitle></CardHeader>
            <CardContent className="p-0">
              {student.results.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">No results recorded yet.</p>
              ) : (
                <Table>
                  <TableHeader><TableRow className="hover:bg-transparent"><TableHead>Marks</TableHead><TableHead>Total</TableHead><TableHead>Percentage</TableHead><TableHead>Grade</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {student.results.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="tabular-nums">{r.marks}</TableCell>
                        <TableCell className="tabular-nums">{r.totalMarks}</TableCell>
                        <TableCell className="tabular-nums">{Math.round((r.marks / (r.totalMarks || 100)) * 100)}%</TableCell>
                        <TableCell><Badge variant={gradeVariant(r.grade)}>{r.grade}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fees" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Fee history</CardTitle></CardHeader>
            <CardContent className="p-0">
              {student.fees.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">No fee records yet.</p>
              ) : (
                <Table>
                  <TableHeader><TableRow className="hover:bg-transparent"><TableHead>Title</TableHead><TableHead>Amount</TableHead><TableHead>Paid</TableHead><TableHead>Due date</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {student.fees.map((f) => (
                      <TableRow key={f.id}>
                        <TableCell className="font-medium">{f.title}</TableCell>
                        <TableCell className="tabular-nums">{formatCurrency(f.amount)}</TableCell>
                        <TableCell className="tabular-nums">{formatCurrency(f.paidAmount)}</TableCell>
                        <TableCell>{formatDate(f.dueDate)}</TableCell>
                        <TableCell><Badge variant={feeVariant(f.status)} dot>{f.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="board" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Board registrations</CardTitle></CardHeader>
            <CardContent className="p-0">
              {student.boardRegistrations.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">No board registrations for this student.</p>
              ) : (
                <Table>
                  <TableHeader><TableRow className="hover:bg-transparent"><TableHead>Exam</TableHead><TableHead>Year</TableHead><TableHead>Reg No.</TableHead><TableHead>Roll</TableHead><TableHead>Board</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {student.boardRegistrations.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell><Badge variant="secondary">{b.boardExam}</Badge></TableCell>
                        <TableCell className="tabular-nums">{b.examYear}</TableCell>
                        <TableCell>{b.regNumber ?? "—"}</TableCell>
                        <TableCell>{b.rollNumber ?? "—"}</TableCell>
                        <TableCell>{b.boardName ?? "—"}</TableCell>
                        <TableCell><Badge variant={boardVariant(b.status)} dot>{b.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Activity timeline</CardTitle></CardHeader>
            <CardContent>
              <ul>
                {timeline.map((t, i) => (
                  <TimelineItem key={i} title={t.title} meta={t.date ? formatDate(t.date) : undefined} last={i === timeline.length - 1} />
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <StudentForm
        open={editOpen}
        onOpenChange={setEditOpen}
        student={student as never}
        classes={classes}
        sections={sections}
        parents={parents}
        onSaved={() => { setEditOpen(false); load(); }}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete student?"
        description={`This will permanently remove ${student.fullName}. This action cannot be undone.`}
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </div>
  );
}
