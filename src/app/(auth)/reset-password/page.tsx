"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-primitives";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { authApi } from "@/lib/api/auth";
import { resetPasswordSchema, type ResetPasswordFormData } from "@/lib/validation/auth";
import { parseApiError } from "@/lib/utils/error";
import { notify } from "@/lib/notify";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setServerError("Invalid or missing password reset token. Please request a new link.");
      notify.warning("Invalid or missing password reset token.");
      return;
    }

    setServerError(null);
    notify.loading("Resetting password...", { id: "reset-pw" });
    try {
      await authApi.resetPassword({ token, newPassword: data.password });
      setIsSuccess(true);
      notify.success("Password reset successfully!", { id: "reset-pw" });
    } catch (err) {
      const parsed = parseApiError(err);
      setServerError(parsed.message);
      notify.error(err, { id: "reset-pw", title: "Reset Failed" });
    }
  };

  return (
    <div className="rounded-xs border border-border bg-card p-6 sm:p-8 shadow-xs">
      {isSuccess ? (
        <div className="text-center space-y-4">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
            <CheckCircle2 className="size-6" />
          </div>
          <h3 className="font-display text-base font-bold">Password Reset Complete</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your password has been successfully updated. You may now log in with your new credentials.
          </p>
          <div className="pt-2">
            <Button variant="gold" size="md" fullWidth onClick={() => router.push("/login")}>
              Sign In Now
            </Button>
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

          <FormField
            label="New Password"
            required
            hint="At least 8 characters with 1 uppercase & 1 number"
            error={errors.password?.message}
          >
            <Input
              type="password"
              placeholder="••••••••"
              leftAddon={<Lock className="size-4" />}
              {...register("password")}
            />
          </FormField>

          <FormField
            label="Confirm New Password"
            required
            error={errors.confirmPassword?.message}
          >
            <Input
              type="password"
              placeholder="••••••••"
              leftAddon={<Lock className="size-4" />}
              {...register("confirmPassword")}
            />
          </FormField>

          <div className="pt-2">
            <Button type="submit" variant="gold" size="md" fullWidth isLoading={isSubmitting}>
              Set New Password
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
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
          Create New Password
        </Heading>
        <Text variant="muted" className="mt-1 text-xs">
          Enter and confirm your new secure password.
        </Text>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground">Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
