"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-primitives";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { authApi } from "@/lib/api/auth";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/lib/validation/auth";
import { parseApiError } from "@/lib/utils/error";

export default function ForgotPasswordPage() {
  const [isSent, setIsSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setServerError(null);
    try {
      await authApi.forgotPassword(data);
      setIsSent(true);
    } catch (err) {
      const parsed = parseApiError(err);
      setServerError(parsed.message);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-background py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <div className="flex size-10 items-center justify-center rounded-xs bg-ink text-gold font-serif font-black text-xl border border-gold/40 shadow-xs">
            SD
          </div>
          <span className="font-display text-xl font-extrabold tracking-tight text-foreground">
            SWIFT DOC
          </span>
        </Link>
        <Heading level="h2" className="mt-4 text-2xl font-bold tracking-tight">
          Reset Password
        </Heading>
        <Text variant="muted" className="mt-1 text-xs">
          Enter your registered email address to receive password reset instructions.
        </Text>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="rounded-xs border border-border bg-card p-6 sm:p-8 shadow-xs">
          {isSent ? (
            <div className="text-center space-y-4">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
                <CheckCircle2 className="size-6" />
              </div>
              <h3 className="font-display text-base font-bold">Check Your Email</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                If an account exists for this email, you will receive password reset instructions shortly.
              </p>
              <div className="pt-2">
                <Link href="/login">
                  <Button variant="outline" size="sm" fullWidth leftIcon={<ArrowLeft className="size-3.5" />}>
                    Return to Sign In
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {serverError && (
                <div className="flex items-start gap-2 rounded-xs border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  <span>{serverError}</span>
                </div>
              )}

              <FormField label="Registered Email" required error={errors.email?.message}>
                <Input
                  type="email"
                  placeholder="name@example.co.ke"
                  leftAddon={<Mail className="size-4" />}
                  {...register("email")}
                />
              </FormField>

              <div className="pt-2">
                <Button type="submit" variant="gold" size="md" fullWidth isLoading={isSubmitting}>
                  Send Reset Link
                </Button>
              </div>

              <div className="pt-2 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="size-3.5" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
