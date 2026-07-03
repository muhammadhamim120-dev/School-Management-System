"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { loginSchema } from "@/lib/validations";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/form-field";
import { useToast } from "@/hooks/use-toast";

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "admin@greenwood.edu", password: "" },
  });

  const onSubmit = async (values: LoginValues) => {
    const res = await signIn("credentials", { ...values, redirect: false });
    if (res?.error) {
      toast({ variant: "destructive", title: "Login failed", description: "Invalid email or password" });
    } else {
      toast({ variant: "success", title: "Welcome back!" });
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <Card className="rounded-2xl border-border/60 glass shadow-float">
      <CardHeader>
        <CardTitle className="text-xl">Sign in</CardTitle>
        <CardDescription>Enter your credentials to access the dashboard</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Email" error={errors.email?.message} required>
            <Input type="email" placeholder="you@school.edu" {...register("email")} />
          </Field>
          <Field label="Password" error={errors.password?.message} required>
            <Input type="password" placeholder="••••••••" {...register("password")} />
          </Field>
          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-sm text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <Button type="submit" className="press w-full" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
          <p className="rounded-xl bg-muted/70 p-3 text-center text-xs text-muted-foreground">
            Demo credentials: <strong>admin@greenwood.edu</strong> / <strong>admin123</strong>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
