import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export const cardVariants = cva(
  "rounded-xs transition-all duration-200 overflow-hidden",
  {
    variants: {
      variant: {
        default: "border border-border bg-card text-card-foreground shadow-xs",
        elevated: "border border-border/80 bg-card text-card-foreground shadow-md hover:shadow-lg",
        flat: "bg-muted/40 text-foreground border border-border/50",
        gold: "border border-gold/40 bg-gold/5 text-foreground",
        ink: "bg-ink text-white border border-ink-light shadow-md",
      },
      padding: {
        none: "p-0",
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "md",
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export function Card({ className, variant, padding, children, ...props }: CardProps) {
  return (
    <div className={cn(cardVariants({ variant, padding }), className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col space-y-1.5 pb-4 border-b border-border/60", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("font-display text-lg font-bold tracking-tight text-foreground", className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-xs text-muted-foreground", className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("pt-4", className)} {...props}>{children}</div>;
}

export function CardFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center pt-4 mt-4 border-t border-border/60", className)} {...props}>
      {children}
    </div>
  );
}

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string | number;
    direction: "up" | "down" | "neutral";
    label?: string;
  };
  variant?: "default" | "gold" | "ink" | "elevated";
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = "default",
  className,
  ...props
}: StatCardProps) {
  return (
    <Card variant={variant} padding="md" className={cn("flex flex-col justify-between", className)} {...props}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {title}
          </span>
          <span className="mt-2 font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {value}
          </span>
        </div>
        {icon && (
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xs bg-gold/15 text-gold dark:bg-gold/20">
            {icon}
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-4 flex items-center justify-between gap-2 pt-2 text-xs border-t border-border/40">
          {subtitle && <span className="text-muted-foreground truncate">{subtitle}</span>}
          {trend && (
            <div
              className={cn(
                "inline-flex items-center gap-1 font-bold",
                trend.direction === "up" && "text-emerald-brand",
                trend.direction === "down" && "text-destructive",
                trend.direction === "neutral" && "text-muted-foreground"
              )}
            >
              {trend.direction === "up" && <ArrowUpRight className="size-3.5" />}
              {trend.direction === "down" && <ArrowDownRight className="size-3.5" />}
              {trend.direction === "neutral" && <Minus className="size-3.5" />}
              <span>{trend.value}</span>
              {trend.label && <span className="font-normal text-muted-foreground ml-0.5">{trend.label}</span>}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
