import React from "react";
import { cn } from "@/lib/utils/cn";

export interface EyebrowProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: "gold" | "navy" | "emerald" | "muted";
}

export function Eyebrow({
  className,
  tone = "gold",
  children,
  ...props
}: EyebrowProps) {
  const toneClasses = {
    gold: "text-gold dark:text-gold-light border-l-2 border-gold pl-2",
    navy: "text-ink-light dark:text-sand-light border-l-2 border-ink pl-2",
    emerald: "text-emerald-brand border-l-2 border-emerald-brand pl-2",
    muted: "text-muted-foreground border-l-2 border-border pl-2",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center text-xs font-bold uppercase tracking-widest",
        toneClasses[tone],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
