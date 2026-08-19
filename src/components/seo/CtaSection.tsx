/**
 * Swift Doc — CTA Section Component
 * Reusable conversion CTA block.
 */

import React from "react";
import Link from "next/link";
import { ArrowRight, PhoneCall } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";

interface CtaSectionProps {
  title?: string;
  description?: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  variant?: "default" | "ink";
  className?: string;
}

export function CtaSection({
  title = "Ready to get started?",
  description = "Create your Swift Doc account and begin your statutory filing in minutes.",
  primaryLabel = "Start Your Filing",
  primaryHref = "/register",
  secondaryLabel = "Talk to Swift Doc",
  secondaryHref = "/contact",
  variant = "ink",
  className,
}: CtaSectionProps) {
  return (
    <section
      className={cn(
        "rounded-xs p-8 sm:p-10 text-center space-y-4",
        variant === "ink"
          ? "bg-ink text-white border border-gold/30"
          : "bg-sand border border-border",
        className
      )}
    >
      <h2
        className={cn(
          "font-display text-2xl sm:text-3xl font-bold",
          variant === "ink" ? "text-white" : "text-foreground"
        )}
      >
        {title}
      </h2>
      <p
        className={cn(
          "text-sm max-w-lg mx-auto",
          variant === "ink" ? "text-white/70" : "text-muted-foreground"
        )}
      >
        {description}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Link href={primaryHref}>
          <Button
            variant="gold"
            size="md"
            rightIcon={<ArrowRight className="size-4" />}
          >
            {primaryLabel}
          </Button>
        </Link>
        <Link href={secondaryHref}>
          <Button
            variant={variant === "ink" ? "outline" : "outline"}
            size="md"
            leftIcon={<PhoneCall className="size-3.5" />}
            className={
              variant === "ink"
                ? "border-white/30 text-white hover:bg-white/10 hover:border-gold"
                : undefined
            }
          >
            {secondaryLabel}
          </Button>
        </Link>
      </div>
    </section>
  );
}
