import React from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, RefreshCw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "./button";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-xs bg-muted/80 dark:bg-muted/40", className)}
      {...props}
    />
  );
}

export function Spinner({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClasses = {
    sm: "size-4",
    md: "size-6",
    lg: "size-8",
  };
  return <Loader2 className={cn("animate-spin text-gold", sizeClasses[size], className)} />;
}

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: "info" | "warning" | "success" | "danger" | "gold";
  title?: string;
  icon?: React.ReactNode;
}

export function Alert({
  className,
  tone = "info",
  title,
  icon,
  children,
  ...props
}: AlertProps) {
  const toneConfigs = {
    info: {
      bg: "bg-blue-500/10 border-blue-500/30 text-blue-900 dark:text-blue-200",
      icon: <Info className="size-5 text-blue-600 shrink-0 mt-0.5" />,
    },
    warning: {
      bg: "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200",
      icon: <AlertTriangle className="size-5 text-amber-600 shrink-0 mt-0.5" />,
    },
    success: {
      bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200",
      icon: <CheckCircle2 className="size-5 text-emerald-600 shrink-0 mt-0.5" />,
    },
    danger: {
      bg: "bg-destructive/10 border-destructive/30 text-destructive-foreground",
      icon: <AlertCircle className="size-5 text-destructive shrink-0 mt-0.5" />,
    },
    gold: {
      bg: "bg-gold/10 border-gold/40 text-foreground",
      icon: <Info className="size-5 text-gold-dark shrink-0 mt-0.5" />,
    },
  };

  const config = toneConfigs[tone];

  return (
    <div
      role="alert"
      className={cn("flex gap-3 p-4 rounded-xs border text-sm", config.bg, className)}
      {...props}
    >
      {icon || config.icon}
      <div className="flex flex-col gap-1">
        {title && <h5 className="font-display font-bold">{title}</h5>}
        <div className="text-xs leading-relaxed opacity-90">{children}</div>
      </div>
    </div>
  );
}

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xs border border-dashed border-border bg-card/40 p-8 text-center sm:p-12",
        className
      )}
      {...props}
    >
      {icon && (
        <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-gold/10 text-gold">
          {icon}
        </div>
      )}
      <h4 className="font-display text-base sm:text-lg font-bold text-foreground">{title}</h4>
      <p className="mt-1.5 max-w-sm text-xs sm:text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-6 flex items-center justify-center">{action}</div>}
    </div>
  );
}

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  message?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export function ErrorState({
  title = "Unable to load information",
  message = "An error occurred while communicating with the Swift Doc platform. Please check your connection and retry.",
  onRetry,
  isRetrying = false,
  className,
  ...props
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xs border border-destructive/30 bg-destructive/5 p-8 text-center sm:p-12",
        className
      )}
      {...props}
    >
      <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-destructive/15 text-destructive">
        <AlertCircle className="size-7" />
      </div>
      <h4 className="font-display text-base sm:text-lg font-bold text-foreground">{title}</h4>
      <p className="mt-1.5 max-w-md text-xs sm:text-sm text-muted-foreground leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <div className="mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            isLoading={isRetrying}
            leftIcon={<RefreshCw className="size-3.5" />}
          >
            Retry Connection
          </Button>
        </div>
      )}
    </div>
  );
}
