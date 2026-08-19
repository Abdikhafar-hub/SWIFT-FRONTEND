"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/lib/auth/auth-context";

export default function UnauthorizedPage() {
  const { role } = useAuth();
  const returnHref = role === "ADMIN" ? "/admin" : "/client";
  const returnLabel = role === "ADMIN" ? "Return to Admin Command Center" : "Return to Client Portal";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-destructive/15 text-destructive mb-6">
        <ShieldAlert className="size-8" />
      </div>
      <span className="font-display text-4xl font-black text-destructive">403</span>
      <Heading level="h2" className="mt-2 text-2xl font-bold">
        Restricted Operational Zone
      </Heading>
      <Text variant="muted" className="mt-2 max-w-sm text-xs sm:text-sm">
        You do not possess the required security clearance or role permissions to access this administrative portal section.
      </Text>
      <div className="mt-6">
        <Link href={returnHref}>
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="size-3.5" />}>
            {returnLabel}
          </Button>
        </Link>
      </div>
    </div>
  );
}
