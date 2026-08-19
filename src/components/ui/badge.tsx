import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

export const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-xs px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors uppercase font-display",
  {
    variants: {
      tone: {
        neutral: "bg-muted text-muted-foreground border border-border/80",
        info: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
        warning: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20",
        success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20",
        danger: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20",
        destructive: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20",
        gold: "bg-gold/15 text-gold-dark dark:text-gold border border-gold/30 font-bold",
        ink: "bg-ink text-white dark:bg-sand-dark dark:text-ink font-bold",
      },
      size: {
        sm: "text-[10px] px-1.5 py-0.25 leading-tight",
        md: "text-xs px-2.5 py-0.5",
        lg: "text-sm px-3 py-1 font-bold",
      },
    },
    defaultVariants: {
      tone: "neutral",
      size: "md",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

export function Badge({
  className,
  tone,
  size,
  dot = false,
  children,
  ...props
}: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone, size }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            "size-1.5 rounded-full shrink-0",
            tone === "gold" && "bg-gold animate-pulse",
            tone === "success" && "bg-emerald-brand",
            (tone === "danger" || tone === "destructive") && "bg-rose-600",
            tone === "warning" && "bg-amber-600",
            tone === "info" && "bg-blue-600",
            (!tone || tone === "neutral") && "bg-muted-foreground"
          )}
        />
      )}
      {children}
    </span>
  );
}
