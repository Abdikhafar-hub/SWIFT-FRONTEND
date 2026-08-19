"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { Loader2 } from "lucide-react";

export default function RootPortalPage() {
  const router = useRouter();
  const { isAuthenticated, role, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && role === "ADMIN") {
        router.replace("/admin");
      } else if (isAuthenticated) {
        router.replace("/client");
      } else {
        router.replace("/login");
      }
    }
  }, [isLoading, isAuthenticated, role, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center space-y-4 text-center">
        <div className="flex size-14 items-center justify-center rounded-xs bg-ink font-serif text-2xl font-black text-gold border border-gold/40 shadow-md animate-pulse">
          SD
        </div>
        <div className="space-y-1">
          <h1 className="font-display text-lg font-bold tracking-tight text-foreground">
            Swift Doc Portal
          </h1>
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="size-3.5 animate-spin text-gold" />
            Directing to secure authentication...
          </p>
        </div>
      </div>
    </div>
  );
}
