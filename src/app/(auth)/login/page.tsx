"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, ShieldCheck, Mail, Lock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-primitives";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/lib/auth/auth-context";
import { loginSchema, type LoginFormData } from "@/lib/validation/auth";
import { parseApiError } from "@/lib/utils/error";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const { login, isAuthenticated, role, isLoading } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  // Redirect if already authenticated
  React.useEffect(() => {
    if (!isLoading && isAuthenticated && role) {
      if (role === "ADMIN") {
        router.replace("/admin");
      } else {
        router.replace("/client");
      }
    }
  }, [isLoading, isAuthenticated, role, router]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      const authResult = await login(data);
      const userRole = authResult.role || authResult.user?.role;

      if (redirectParam) {
        const decoded = decodeURIComponent(redirectParam);
        if (userRole === "ADMIN" && decoded.startsWith("/client")) {
          router.push("/admin");
        } else if (userRole === "CLIENT" && decoded.startsWith("/admin")) {
          router.push("/client");
        } else {
          router.push(decoded);
        }
      } else {
        if (userRole === "ADMIN") {
          router.push("/admin");
        } else {
          router.push("/client");
        }
      }
    } catch (err: unknown) {
      const parsed = parseApiError(err);
      setServerError(parsed.message);
    }
  };

  return (
    <div className="rounded-xs border border-border bg-card p-6 sm:p-8 shadow-xs">
      {serverError && (
        <div className="mb-6 flex items-start gap-3 rounded-xs border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive-foreground">
          <AlertCircle className="size-4 shrink-0 mt-0.5 text-destructive" />
          <div className="flex flex-col">
            <span className="font-bold">Authentication Failed</span>
            <span className="mt-0.5 leading-relaxed">{serverError}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="Email Address" required error={errors.email?.message}>
          <Input
            type="email"
            placeholder="name@example.co.ke"
            autoComplete="email"
            leftAddon={<Mail className="size-4" />}
            {...register("email")}
          />
        </FormField>

        <FormField label="Password" required error={errors.password?.message}>
          <Input
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            leftAddon={<Lock className="size-4" />}
            {...register("password")}
          />
        </FormField>

        <div className="flex items-center justify-between text-xs pt-1">
          <Link
            href="/forgot-password"
            className="font-medium text-gold-dark dark:text-gold hover:underline"
          >
            Forgot your password?
          </Link>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            variant="gold"
            size="md"
            fullWidth
            isLoading={isSubmitting}
            rightIcon={<ArrowRight className="size-4" />}
          >
            Sign In to Dashboard
          </Button>
        </div>
      </form>

      <div className="mt-6 border-t border-border/70 pt-6 text-center text-xs text-muted-foreground">
        Don&apos;t have an account yet?{" "}
        <Link href="/register" className="font-bold text-foreground hover:text-gold transition-colors">
          Register here
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
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
          Client Portal Sign In
        </Heading>
        <Text variant="muted" className="mt-1 text-xs">
          Access your statutory applications, documents vault, and M-Pesa receipts.
        </Text>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground">Loading form...</div>}>
          <LoginForm />
        </Suspense>

        <div className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
          <ShieldCheck className="size-4 text-gold" />
          <span>Protected by 256-bit SSL & Data Protection Act 2019</span>
        </div>
      </div>
    </div>
  );
}
