import React from "react";
import Link from "next/link";
import { ArrowLeft, FileQuestion, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-gold/15 text-gold mb-6">
        <FileQuestion className="size-8" />
      </div>
      <span className="font-display text-4xl font-black text-gold">404</span>
      <Heading level="h2" className="mt-2 text-2xl font-bold">
        Portal Page Not Found
      </Heading>
      <Text variant="muted" className="mt-2 max-w-sm text-xs sm:text-sm">
        The requested portal page or document resource does not exist or has been relocated.
      </Text>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link href="/login">
          <Button variant="gold" size="sm" leftIcon={<LogIn className="size-3.5" />}>
            Go to Login
          </Button>
        </Link>
        <Link href="/client">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="size-3.5" />}>
            Client Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
