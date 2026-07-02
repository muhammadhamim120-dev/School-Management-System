"use client";
import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { parentSchema, type ParentInput } from "@/lib/validations";
import { parentsApi, studentsApi } from "@/services/resources";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/form-field";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/components/i18n-provider";
import { cn } from "@/lib/utils";
import type { ParentWithStudents, StudentWithRelations } from "@/types";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  parent?: ParentWithStudents | null;
  onSaved: () => void;
};

export function ParentForm({ open, onOpenChange, parent, onSaved }: Props) {
  const { t } = useI18n();
  const { toast } = useToast();
  const isEdit = !!parent;
  const [students, setStudents] = React.useState<StudentWithRelations[]>([]);
  const [selected, setSelected] = React.useState<string[]>([]);
  const {
    register, handleSubmit, reset, formState: { errors, isSubmitting },
  } = useForm<ParentInput>({ resolver: zodResolver(parentSchema) });

  React.useEffect(() => {
    if (open) {
      studentsApi.list({ limit: 100 }).then((d) => setStudents(d.items)).catch(() => {});
      setSelected(parent?.students?.map((s: { id: string }) => s.id) ?? []);
      reset({
        parentId: parent?.parentId ?? `PAR-${Date.now().toString().slice(-6)}`,
        fullName: parent?.fullName ?? "",
        photo: parent?.photo ?? "",
        phone: parent?.phone ?? "",
        email: parent?.email ?? "",
        address: parent?.address ?? "",
        occupation: parent?.occupation ?? "",
        emergencyContact: parent?.emergencyContact ?? "",
      });
    }
  }, [open, parent, reset]);

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const onSubmit = async (values: ParentInput) => {
    try {
      const payload = { ...values, studentIds: selected };
      if (isEdit && parent) await parentsApi.update(parent.id, payload);
      else await parentsApi.create(payload);
      toast({ variant: "success", title: isEdit ? "Parent updated" : "Parent created" });
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
          <DialogTitle>{isEdit ? "Edit Parent" : "Add Parent"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t("field.parentId")} error={errors.parentId?.message} required>
            <Input {...register("parentId")} />
          </Field>
          <Field label={t("field.fullName")} error={errors.fullName?.message} required>
            <Input {...register("fullName")} />
          </Field>
          <Field label={t("field.phone")} error={errors.phone?.message}>
            <Input {...register("phone")} />
          </Field>
          <Field label={t("field.email")} error={errors.email?.message}>
            <Input type="email" {...register("email")} />
          </Field>
          <Field label={t("field.occupation")} error={errors.occupation?.message}>
            <Input {...register("occupation")} />
          </Field>
          <Field label={t("field.emergencyContact")} error={errors.emergencyContact?.message}>
            <Input {...register("emergencyContact")} />
          </Field>
          <Field label={t("field.photoUrl")} error={errors.photo?.message} className="sm:col-span-2">
            <Input {...register("photo")} placeholder="https://..." />
          </Field>
          <Field label={t("field.address")} error={errors.address?.message} className="sm:col-span-2">
            <Textarea {...register("address")} />
          </Field>
          <div className="sm:col-span-2">
            <Field label={t("field.linkedStudents")}>
              <div className="max-h-40 overflow-y-auto rounded-md border p-2">
                {students.length === 0 ? (
                  <p className="px-1 py-2 text-sm text-muted-foreground">No students available</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {students.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggle(s.id)}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs transition-colors",
                          selected.includes(s.id)
                            ? "border-primary bg-primary text-primary-foreground"
                            : "hover:bg-accent"
                        )}
                      >
                        {s.fullName}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Field>
            {selected.length > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                <Badge variant="secondary">{selected.length}</Badge> student(s) selected
              </p>
            )}
          </div>
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
