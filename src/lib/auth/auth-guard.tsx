"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "./auth-context";
import type { UserRole } from "@/types";

export interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireAuth?: boolean;
}

export function AuthGuard({
  children,
  allowedRoles,
  requireAuth = true,
}: AuthGuardProps) {
  const { user, isAuthenticated, isLoading, role } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    if (requireAuth && !isAuthenticated) {
      const redirectUrl = encodeURIComponent(pathname || "/");
      router.replace(`/login?redirect=${redirectUrl}`);
      return;
    }

    if (
      requireAuth &&
      isAuthenticated &&
      allowedRoles &&
      allowedRoles.length > 0 &&
      role &&
      !allowedRoles.includes(role)
    ) {
      if (role === "ADMIN" && !allowedRoles.includes("ADMIN")) {
        // Admin visiting client portal -> redirect to Admin Command Center
        router.replace("/admin");
      } else if (role === "CLIENT" && !allowedRoles.includes("CLIENT")) {
        // Client visiting admin portal -> redirect to Unauthorized
        router.replace("/unauthorized");
      } else {
        router.replace("/unauthorized");
      }
    }
  }, [isLoading, isAuthenticated, role, allowedRoles, requireAuth, router, pathname]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-4 bg-background">
        <div className="relative flex size-12 items-center justify-center">
          <div className="absolute size-12 animate-ping rounded-full bg-gold/20" />
          <div className="size-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
        </div>
        <p className="font-display text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Verifying Credentials...
        </p>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return null;
  }

  if (
    requireAuth &&
    isAuthenticated &&
    allowedRoles &&
    allowedRoles.length > 0 &&
    role &&
    !allowedRoles.includes(role)
  ) {
    return null;
  }

  return <>{children}</>;
}
