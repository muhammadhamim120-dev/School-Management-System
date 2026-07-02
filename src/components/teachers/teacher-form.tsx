"use client";
import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { teacherSchema, type TeacherInput } from "@/lib/validations";
import { teachersApi } from "@/services/resources";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/form-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/components/i18n-provider";
import type { Teacher, Campus } from "@/types";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  teacher?: Teacher | null;
  campuses?: Campus[];
  onSaved: () => void;
};

function toDateInput(d?: Date | string | null) {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

export function TeacherForm({ open, onOpenChange, teacher, campuses = [], onSaved }: Props) {
  const { t } = useI18n();
  const { toast } = useToast();
  const isEdit = !!teacher;
  const {
    register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting },
  } = useForm<TeacherInput>({ resolver: zodResolver(teacherSchema) });

  React.useEffect(() => {
    if (open) {
      reset({
        teacherId: teacher?.teacherId ?? `TCH-${Date.now().toString().slice(-6)}`,
        fullName: teacher?.fullName ?? "",
        photo: teacher?.photo ?? "",
        department: teacher?.department ?? "",
        subject: teacher?.subject ?? "",
        qualification: teacher?.qualification ?? "",
        experience: teacher?.experience ?? 0,
        phone: teacher?.phone ?? "",
        email: teacher?.email ?? "",
        address: teacher?.address ?? "",
        joiningDate: teacher?.joiningDate ? (toDateInput(teacher.joiningDate) as unknown as Date) : undefined,
        salary: teacher?.salary ?? 0,
        status: teacher?.status ?? "ACTIVE",
        campusId: teacher?.campusId ?? "",
      });
    }
  }, [open, teacher, reset]);

  const onSubmit = async (values: TeacherInput) => {
    try {
      if (isEdit && teacher) await teachersApi.update(teacher.id, values);
      else await teachersApi.create(values);
      toast({ variant: "success", title: isEdit ? "Teacher updated" : "Teacher created" });
      onOpenChange(false);
      onSaved();
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: (e as Error).message });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Teacher" : "Add Teacher"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t("field.teacherId")} error={errors.teacherId?.message} required>
            <Input {...register("teacherId")} />
          </Field>
          <Field label={t("field.fullName")} error={errors.fullName?.message} required>
            <Input {...register("fullName")} />
          </Field>
          <Field label={t("field.department")} error={errors.department?.message}>
            <Input {...register("department")} placeholder="e.g. Science" />
          </Field>
          <Field label={t("field.subject")} error={errors.subject?.message}>
            <Input {...register("subject")} placeholder="e.g. Physics" />
          </Field>
          <Field label={t("field.qualification")} error={errors.qualification?.message}>
            <Input {...register("qualification")} placeholder="e.g. M.Sc, B.Ed" />
          </Field>
          <Field label={t("field.experience")} error={errors.experience?.message}>
            <Input type="number" min={0} {...register("experience")} />
          </Field>
          <Field label={t("field.phone")} error={errors.phone?.message}>
            <Input {...register("phone")} />
          </Field>
          <Field label={t("field.email")} error={errors.email?.message}>
            <Input type="email" {...register("email")} />
          </Field>
          <Field label={t("field.joiningDate")} error={errors.joiningDate?.message}>
            <Input type="date" {...register("joiningDate")} />
          </Field>
          <Field label={t("field.salary")} error={errors.salary?.message}>
            <Input type="number" min={0} step="0.01" {...register("salary")} />
          </Field>
          <Field label={t("field.status")} error={errors.status?.message}>
            <Select value={watch("status")} onValueChange={(v) => setValue("status", v as TeacherInput["status"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">{t("field.active")}</SelectItem>
                <SelectItem value="INACTIVE">{t("field.inactive")}</SelectItem>
                <SelectItem value="SUSPENDED">{t("field.suspended")}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label={t("field.campus")} error={errors.campusId?.message}>
            <Select value={watch("campusId") || ""} onValueChange={(v) => setValue("campusId", v)}>
              <SelectTrigger><SelectValue placeholder="Select campus" /></SelectTrigger>
              <SelectContent>
                {campuses.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label={t("field.photoUrl")} error={errors.photo?.message}>
            <Input {...register("photo")} placeholder="https://..." />
          </Field>
          <Field label={t("field.address")} error={errors.address?.message} className="sm:col-span-2">
            <Textarea {...register("address")} />
          </Field>
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEdit ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
