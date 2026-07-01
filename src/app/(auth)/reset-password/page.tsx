"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { request } from "@/services/api-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/form-field";
import { useToast } from "@/hooks/use-toast";

const formSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirm: z.string().min(6, "Please confirm your password"),
  })
  .refine((d) => d.password === d.confirm, { message: "Passwords do not match", path: ["confirm"] });

type FormValues = z.infer<typeof formSchema>;

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (values: FormValues) => {
    if (!token) {
      toast({ variant: "destructive", title: "Missing token", description: "This reset link is invalid." });
      return;
    }
    try {
      await request("/api/auth/reset", {
        method: "POST",
        body: JSON.stringify({ token, password: values.password }),
      });
      toast({ variant: "success", title: "Password updated", description: "You can now sign in." });
      router.push("/login");
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: (e as Error).message });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set new password</CardTitle>
        <CardDescription>Choose a strong password for your account</CardDescription>
      </CardHeader>
      <CardContent>
        {!token ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">This reset link is invalid or has expired.</p>
            <Link href="/forgot-password" className="text-sm text-primary hover:underline">
              Request a new link
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field label="New Password" error={errors.password?.message} required>
              <Input type="password" placeholder="••••••••" {...register("password")} />
            </Field>
            <Field label="Confirm Password" error={errors.confirm?.message} required>
              <Input type="password" placeholder="••••••••" {...register("confirm")} />
            </Field>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update password"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <React.Suspense fallback={<div className="text-center text-sm text-muted-foreground">Loading...</div>}>
      <ResetForm />
    </React.Suspense>
  );
}
