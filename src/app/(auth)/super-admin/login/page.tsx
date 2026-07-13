"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/form-field";
import { useToast } from "@/hooks/use-toast";

const superAdminSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormValues = z.infer<typeof superAdminSchema>;

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(superAdminSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: FormValues) => {
    // Super admin login uses credentials without schoolSlug
    const res = await signIn("credentials", { ...values, redirect: false });
    if (res?.error) {
      toast({ variant: "destructive", title: "Login failed", description: "Invalid credentials or not a super admin" });
    } else {
      toast({ variant: "success", title: "Welcome, Admin!" });
      router.push("/super-admin");
      router.refresh();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <Card className="w-full max-w-md rounded-2xl border-border/60 glass shadow-float">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Super Admin</CardTitle>
          <CardDescription>Platform administration access</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field label="Email" error={errors.email?.message} required>
              <Input type="email" placeholder="admin@platform.com" {...register("email")} />
            </Field>
            <Field label="Password" error={errors.password?.message} required>
              <Input type="password" placeholder="••••••••" {...register("password")} />
            </Field>
            <Button type="submit" className="press w-full" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
            <div className="text-center">
              <Link href="/login" className="text-xs text-muted-foreground hover:text-foreground">
                Back to School Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
