"use client";
import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import { Pencil, Trash2, Phone, Mail, MapPin, Briefcase, Users2, ShieldAlert } from "lucide-react";
import { ProfileBack, InfoRow, InfoGrid, ProfileStat } from "@/components/dashboard/profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { ParentForm } from "@/components/parents/parent-form";
import { parentsApi } from "@/services/resources";
import { useToast } from "@/hooks/use-toast";
import { initials, avatarUrl } from "@/lib/utils";

type ParentDetail = {
  id: string; parentId: string; fullName: string; photo?: string | null;
  phone?: string | null; email?: string | null; address?: string | null;
  occupation?: string | null; emergencyContact?: string | null;
  students: { id: string; fullName: string; studentId: string; photo?: string | null; rollNumber?: string | null }[];
};

export default function ParentProfilePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { toast } = useToast();

  const [parent, setParent] = React.useState<ParentDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  const load = React.useCallback(() => {
    setLoading(true);
    setError(null);
    parentsApi
      .get(id)
      .then((d) => setParent(d as unknown as ParentDetail))
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [id]);

  React.useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await parentsApi.remove(id);
      toast({ variant: "success", title: "Parent deleted" });
      router.push("/dashboard/parents");
    } catch (e) {
      toast({ variant: "destructive", title: "Couldn't delete", description: (e as Error).message });
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <ProfileBack href="/dashboard/parents" label="Back to parents" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (error || !parent) {
    return (
      <div>
        <ProfileBack href="/dashboard/parents" label="Back to parents" />
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="font-medium">Couldn&apos;t load this parent</p>
            <p className="text-sm text-muted-foreground">{error ?? "The record may have been removed."}</p>
            <Button variant="outline" onClick={load}>Try again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <ProfileBack href="/dashboard/parents" label="Back to parents" />

      <Card className="overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-primary/15 via-primary/5 to-transparent" />
        <CardContent className="pt-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <Avatar className="-mt-10 h-24 w-24 border-4 border-card shadow-soft">
                <AvatarImage src={parent.photo || avatarUrl(parent.fullName)} />
                <AvatarFallback className="text-2xl">{initials(parent.fullName)}</AvatarFallback>
              </Avatar>
              <div className="pb-1">
                <h2 className="text-xl font-semibold tracking-tight">{parent.fullName}</h2>
                <p className="text-sm text-muted-foreground">
                  {parent.parentId}{parent.occupation ? ` · ${parent.occupation}` : ""}
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
        <ProfileStat label="Linked students" value={parent.students.length} icon={Users2} accent="text-primary" />
        <ProfileStat label="Occupation" value={parent.occupation ?? "—"} icon={Briefcase} accent="text-primary" />
        <ProfileStat label="Emergency contact" value={parent.emergencyContact ?? "—"} icon={ShieldAlert} accent="text-primary" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Linked students</CardTitle></CardHeader>
          <CardContent>
            {parent.students.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No students linked to this guardian yet.</p>
            ) : (
              <div className="divide-y divide-border">
                {parent.students.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => router.push(`/dashboard/students/${s.id}`)}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left transition-colors hover:bg-muted/50"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={s.photo || avatarUrl(s.fullName)} />
                      <AvatarFallback className="text-xs">{initials(s.fullName)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{s.fullName}</div>
                      <div className="text-xs text-muted-foreground">{s.studentId}{s.rollNumber ? ` · Roll ${s.rollNumber}` : ""}</div>
                    </div>
                    <span className="text-xs text-primary">View →</span>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Contact</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> {parent.phone ?? "—"}</div>
              <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> {parent.email ?? "—"}</div>
              <div className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" /> <span>{parent.address ?? "—"}</span></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
            <CardContent>
              <InfoGrid>
                <InfoRow label="Parent ID" value={parent.parentId} mono />
                <InfoRow label="Occupation" value={parent.occupation ?? "—"} />
              </InfoGrid>
            </CardContent>
          </Card>
        </div>
      </div>

      <ParentForm open={editOpen} onOpenChange={setEditOpen} parent={parent as never} onSaved={() => { setEditOpen(false); load(); }} />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete parent?"
        description={`This will permanently remove ${parent.fullName}. This action cannot be undone.`}
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </div>
  );
}
