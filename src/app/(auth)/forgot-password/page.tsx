"use client";
import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { forgotSchema } from "@/lib/validations";
import { request } from "@/services/api-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/form-field";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

type ForgotValues = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [devToken, setDevToken] = React.useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (values: ForgotValues) => {
    try {
      const res = await request<{ message: string; devToken?: string }>("/api/auth/forgot", {
        method: "POST",
        body: JSON.stringify(values),
      });
      toast({ variant: "success", title: "Request sent", description: res.message });
      if (res.devToken) setDevToken(res.devToken);
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: (e as Error).message });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset password</CardTitle>
        <CardDescription>Enter your email and we&apos;ll generate a reset link</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Email" error={errors.email?.message} required>
            <Input type="email" placeholder="you@school.edu" {...register("email")} />
          </Field>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Send reset link"}
          </Button>
          {devToken && (
            <div className="rounded-md bg-muted p-3 text-xs">
              <p className="mb-1 font-medium">Demo mode — no email service configured.</p>
              <Link href={`/reset-password?token=${devToken}`} className="break-all text-primary hover:underline">
                Click here to reset your password
              </Link>
            </div>
          )}
          <Link href="/login" className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to sign in
          </Link>
        </form>
      </CardContent>
    </Card>
  );
}
