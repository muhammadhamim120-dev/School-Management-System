"use client";
import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { studentSchema, type StudentInput } from "@/lib/validations";
import { studentsApi } from "@/services/resources";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/form-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/components/i18n-provider";
import type { StudentWithRelations, Class, Section, Parent, Campus, AcademicSession } from "@/types";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  student?: StudentWithRelations | null;
  classes: Class[];
  sections: (Section & { classId: string })[];
  parents: Parent[];
  campuses?: Campus[];
  sessions?: AcademicSession[];
  onSaved: () => void;
};

function toDateInput(d?: Date | string | null) {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

export function StudentForm({ open, onOpenChange, student, classes, sections, parents, campuses = [], sessions = [], onSaved }: Props) {
  const { toast } = useToast();
  const { t } = useI18n();
  const isEdit = !!student;
  const {
    register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting },
  } = useForm<StudentInput>({ resolver: zodResolver(studentSchema) });

  const classId = watch("classId");

  React.useEffect(() => {
    if (open) {
      reset({
        studentId: student?.studentId ?? `STU-${Date.now().toString().slice(-6)}`,
        fullName: student?.fullName ?? "",
        photo: student?.photo ?? "",
        gender: student?.gender ?? "MALE",
        dateOfBirth: student?.dateOfBirth ? (toDateInput(student.dateOfBirth) as unknown as Date) : ("" as unknown as Date),
        bloodGroup: student?.bloodGroup ?? "",
        phone: student?.phone ?? "",
        email: student?.email ?? "",
        address: student?.address ?? "",
        classId: student?.classId ?? "",
        sectionId: student?.sectionId ?? "",
        rollNumber: student?.rollNumber ?? "",
        admissionDate: student?.admissionDate ? (toDateInput(student.admissionDate) as unknown as Date) : undefined,
        guardianName: student?.guardianName ?? "",
        parentId: student?.parentId ?? "",
        emergencyContact: student?.emergencyContact ?? "",
        status: student?.status ?? "ACTIVE",
        medium: student?.medium ?? undefined,
        madrasaLevel: student?.madrasaLevel ?? undefined,
        shift: student?.shift ?? undefined,
        campusId: student?.campusId ?? "",
        sessionId: student?.sessionId ?? "",
      });
    }
  }, [open, student, reset]);

  const onSubmit = async (values: StudentInput) => {
    try {
      const payload = { ...values };
      if (isEdit && student) await studentsApi.update(student.id, payload);
      else await studentsApi.create(payload);
      toast({ variant: "success", title: isEdit ? t("toast.studentUpdated") : t("toast.studentCreated") });
      onOpenChange(false);
      onSaved();
    } catch (e) {
      toast({ variant: "destructive", title: t("common.error"), description: (e as Error).message });
    }
  };

  const filteredSections = sections.filter((s) => !classId || s.classId === classId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("form.editStudent") : t("form.addStudent")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t("field.studentId")} error={errors.studentId?.message} required>
            <Input {...register("studentId")} />
          </Field>
          <Field label={t("field.fullName")} error={errors.fullName?.message} required>
            <Input {...register("fullName")} />
          </Field>
          <Field label={t("field.gender")} error={errors.gender?.message}>
            <Select value={watch("gender")} onValueChange={(v) => setValue("gender", v as StudentInput["gender"])}>
              <SelectTrigger><SelectValue placeholder={t("placeholder.select")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="MALE">{t("field.male")}</SelectItem>
                <SelectItem value="FEMALE">{t("field.female")}</SelectItem>
                <SelectItem value="OTHER">{t("field.other")}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label={t("field.dob")} error={errors.dateOfBirth?.message} required>
            <Input type="date" {...register("dateOfBirth")} />
          </Field>
          <Field label={t("field.bloodGroup")} error={errors.bloodGroup?.message}>
            <Input {...register("bloodGroup")} placeholder={t("placeholder.bloodExample")} />
          </Field>
          <Field label={t("field.phone")} error={errors.phone?.message}>
            <Input {...register("phone")} />
          </Field>
          <Field label={t("field.email")} error={errors.email?.message}>
            <Input type="email" {...register("email")} />
          </Field>
          <Field label={t("field.rollNumber")} error={errors.rollNumber?.message}>
            <Input {...register("rollNumber")} />
          </Field>
          <Field label={t("field.class")} error={errors.classId?.message}>
            <Select value={watch("classId") || ""} onValueChange={(v) => setValue("classId", v)}>
              <SelectTrigger><SelectValue placeholder={t("placeholder.selectClass")} /></SelectTrigger>
              <SelectContent>
                {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label={t("field.section")} error={errors.sectionId?.message}>
            <Select value={watch("sectionId") || ""} onValueChange={(v) => setValue("sectionId", v)}>
              <SelectTrigger><SelectValue placeholder={t("placeholder.selectSection")} /></SelectTrigger>
              <SelectContent>
                {filteredSections.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label={t("field.admissionDate")} error={errors.admissionDate?.message}>
            <Input type="date" {...register("admissionDate")} />
          </Field>
          <Field label={t("field.guardianName")} error={errors.guardianName?.message}>
            <Input {...register("guardianName")} />
          </Field>
          <Field label={t("field.parent")} error={errors.parentId?.message}>
            <Select value={watch("parentId") || ""} onValueChange={(v) => setValue("parentId", v)}>
              <SelectTrigger><SelectValue placeholder={t("placeholder.linkParent")} /></SelectTrigger>
              <SelectContent>
                {parents.map((p) => <SelectItem key={p.id} value={p.id}>{p.fullName}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label={t("field.emergencyContact")} error={errors.emergencyContact?.message}>
            <Input {...register("emergencyContact")} />
          </Field>
          <Field label={t("field.status")} error={errors.status?.message}>
            <Select value={watch("status")} onValueChange={(v) => setValue("status", v as StudentInput["status"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">{t("field.active")}</SelectItem>
                <SelectItem value="INACTIVE">{t("field.inactive")}</SelectItem>
                <SelectItem value="SUSPENDED">{t("field.suspended")}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label={t("field.medium")} error={errors.medium?.message}>
            <Select value={watch("medium") ?? ""} onValueChange={(v) => setValue("medium", v as StudentInput["medium"])}>
              <SelectTrigger><SelectValue placeholder={t("placeholder.selectMedium")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="BANGLA">{t("medium.BANGLA")}</SelectItem>
                <SelectItem value="ENGLISH">{t("medium.ENGLISH")}</SelectItem>
                <SelectItem value="MADRASA">{t("medium.MADRASA")}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          {watch("medium") === "MADRASA" && (
            <Field label={t("field.madrasaStream")} error={errors.madrasaLevel?.message}>
              <Select value={watch("madrasaLevel") ?? ""} onValueChange={(v) => setValue("madrasaLevel", v as StudentInput["madrasaLevel"])}>
                <SelectTrigger><SelectValue placeholder={t("placeholder.selectStream")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="EBTEDAYEE">{t("madrasa.EBTEDAYEE")}</SelectItem>
                  <SelectItem value="DAKHIL">{t("madrasa.DAKHIL")}</SelectItem>
                  <SelectItem value="ALIM">{t("madrasa.ALIM")}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          )}
          <Field label={t("field.shift")} error={errors.shift?.message}>
            <Select value={watch("shift") ?? ""} onValueChange={(v) => setValue("shift", v as StudentInput["shift"])}>
              <SelectTrigger><SelectValue placeholder={t("placeholder.selectShift")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="MORNING">{t("shift.MORNING")}</SelectItem>
                <SelectItem value="DAY">{t("shift.DAY")}</SelectItem>
                <SelectItem value="EVENING">{t("shift.EVENING")}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label={t("field.campus")} error={errors.campusId?.message}>
            <Select value={watch("campusId") || ""} onValueChange={(v) => setValue("campusId", v)}>
              <SelectTrigger><SelectValue placeholder={t("placeholder.selectCampus")} /></SelectTrigger>
              <SelectContent>
                {campuses.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label={t("field.session")} error={errors.sessionId?.message}>
            <Select value={watch("sessionId") || ""} onValueChange={(v) => setValue("sessionId", v)}>
              <SelectTrigger><SelectValue placeholder={t("placeholder.selectSession")} /></SelectTrigger>
              <SelectContent>
                {sessions.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label={t("field.photoUrl")} error={errors.photo?.message} className="sm:col-span-2">
            <Input {...register("photo")} placeholder={t("placeholder.photoUrl")} />
          </Field>
          <Field label={t("field.address")} error={errors.address?.message} className="sm:col-span-2">
            <Textarea {...register("address")} />
          </Field>
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("common.saving") : isEdit ? t("common.update") : t("common.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
