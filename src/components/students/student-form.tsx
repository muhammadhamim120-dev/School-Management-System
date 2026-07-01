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
import type { StudentWithRelations, Class, Section, Parent } from "@/types";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  student?: StudentWithRelations | null;
  classes: Class[];
  sections: (Section & { classId: string })[];
  parents: Parent[];
  onSaved: () => void;
};

function toDateInput(d?: Date | string | null) {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

export function StudentForm({ open, onOpenChange, student, classes, sections, parents, onSaved }: Props) {
  const { toast } = useToast();
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
      });
    }
  }, [open, student, reset]);

  const onSubmit = async (values: StudentInput) => {
    try {
      const payload = { ...values };
      if (isEdit && student) await studentsApi.update(student.id, payload);
      else await studentsApi.create(payload);
      toast({ variant: "success", title: isEdit ? "Student updated" : "Student created" });
      onOpenChange(false);
      onSaved();
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: (e as Error).message });
    }
  };

  const filteredSections = sections.filter((s) => !classId || s.classId === classId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Student" : "Add Student"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Student ID" error={errors.studentId?.message} required>
            <Input {...register("studentId")} />
          </Field>
          <Field label="Full Name" error={errors.fullName?.message} required>
            <Input {...register("fullName")} />
          </Field>
          <Field label="Gender" error={errors.gender?.message}>
            <Select value={watch("gender")} onValueChange={(v) => setValue("gender", v as StudentInput["gender"])}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="MALE">Male</SelectItem>
                <SelectItem value="FEMALE">Female</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Date of Birth" error={errors.dateOfBirth?.message} required>
            <Input type="date" {...register("dateOfBirth")} />
          </Field>
          <Field label="Blood Group" error={errors.bloodGroup?.message}>
            <Input {...register("bloodGroup")} placeholder="e.g. O+" />
          </Field>
          <Field label="Phone" error={errors.phone?.message}>
            <Input {...register("phone")} />
          </Field>
          <Field label="Email" error={errors.email?.message}>
            <Input type="email" {...register("email")} />
          </Field>
          <Field label="Roll Number" error={errors.rollNumber?.message}>
            <Input {...register("rollNumber")} />
          </Field>
          <Field label="Class" error={errors.classId?.message}>
            <Select value={watch("classId") || ""} onValueChange={(v) => setValue("classId", v)}>
              <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
              <SelectContent>
                {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Section" error={errors.sectionId?.message}>
            <Select value={watch("sectionId") || ""} onValueChange={(v) => setValue("sectionId", v)}>
              <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
              <SelectContent>
                {filteredSections.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Admission Date" error={errors.admissionDate?.message}>
            <Input type="date" {...register("admissionDate")} />
          </Field>
          <Field label="Guardian Name" error={errors.guardianName?.message}>
            <Input {...register("guardianName")} />
          </Field>
          <Field label="Parent" error={errors.parentId?.message}>
            <Select value={watch("parentId") || ""} onValueChange={(v) => setValue("parentId", v)}>
              <SelectTrigger><SelectValue placeholder="Link parent" /></SelectTrigger>
              <SelectContent>
                {parents.map((p) => <SelectItem key={p.id} value={p.id}>{p.fullName}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Emergency Contact" error={errors.emergencyContact?.message}>
            <Input {...register("emergencyContact")} />
          </Field>
          <Field label="Status" error={errors.status?.message}>
            <Select value={watch("status")} onValueChange={(v) => setValue("status", v as StudentInput["status"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Photo URL" error={errors.photo?.message} className="sm:col-span-2">
            <Input {...register("photo")} placeholder="https://..." />
          </Field>
          <Field label="Address" error={errors.address?.message} className="sm:col-span-2">
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
