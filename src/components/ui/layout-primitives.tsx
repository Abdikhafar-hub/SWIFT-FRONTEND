import React from "react";
import { cn } from "@/lib/utils/cn";

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

export function Container({
  className,
  size = "xl",
  children,
  ...props
}: ContainerProps) {
  const sizeClasses = {
    sm: "max-w-3xl",
    md: "max-w-5xl",
    lg: "max-w-6xl",
    xl: "max-w-7xl",
    full: "max-w-full",
  };

  return (
    <div className={cn("mx-auto w-full px-4 sm:px-6 lg:px-8", sizeClasses[size], className)} {...props}>
      {children}
    </div>
  );
}

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  background?: "default" | "sand" | "card" | "ink";
}

export function Section({
  className,
  padding = "md",
  background = "default",
  children,
  ...props
}: SectionProps) {
  const paddingClasses = {
    none: "py-0",
    sm: "py-6 sm:py-8",
    md: "py-10 sm:py-14",
    lg: "py-16 sm:py-24",
    xl: "py-20 sm:py-32",
  };

  const bgClasses = {
    default: "bg-background text-foreground",
    sand: "bg-sand text-foreground",
    card: "bg-card text-card-foreground",
    ink: "bg-ink text-white",
  };

  return (
    <section
      className={cn("w-full transition-colors", paddingClasses[padding], bgClasses[background], className)}
      {...props}
    >
      {children}
    </section>
  );
}

export interface PageShellProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode;
  actions?: React.ReactNode;
  eyebrow?: string;
  title?: string;
  description?: string;
}

export function PageShell({
  className,
  header,
  actions,
  eyebrow,
  title,
  description,
  children,
  ...props
}: PageShellProps) {
  return (
    <div className={cn("min-h-screen w-full pb-16", className)} {...props}>
      {(title || header || actions) && (
        <div className="border-b border-border bg-card/60 px-4 py-6 backdrop-blur-md sm:px-8 sm:py-8">
          {header ? (
            header
          ) : (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                {eyebrow && (
                  <span className="text-xs font-bold uppercase tracking-widest text-gold">
                    {eyebrow}
                  </span>
                )}
                {title && (
                  <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    {title}
                  </h1>
                )}
                {description && (
                  <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                )}
              </div>
              {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
            </div>
          )}
        </div>
      )}
      <div className="px-4 pt-6 sm:px-8">{children}</div>
    </div>
  );
}

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: "row" | "col";
  gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "between";
}

export function Stack({
  className,
  direction = "col",
  gap = "md",
  align = "stretch",
  justify = "start",
  children,
  ...props
}: StackProps) {
  const gapClasses = {
    none: "gap-0",
    xs: "gap-1.5",
    sm: "gap-3",
    md: "gap-4",
    lg: "gap-6",
    xl: "gap-8",
  };

  const alignClasses = {
    start: "items-start",
    center: "items-center",
    end: "items-end",
    stretch: "items-stretch",
  };

  const justifyClasses = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
    between: "justify-between",
  };

  return (
    <div
      className={cn(
        "flex",
        direction === "row" ? "flex-row" : "flex-col",
        gapClasses[gap],
        alignClasses[align],
        justifyClasses[justify],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
  gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
}

export function Grid({
  className,
  cols = 3,
  gap = "md",
  children,
  ...props
}: GridProps) {
  const colClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5",
    6: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
    12: "grid-cols-12",
  };

  const gapClasses = {
    none: "gap-0",
    xs: "gap-2",
    sm: "gap-4",
    md: "gap-6",
    lg: "gap-8",
    xl: "gap-10",
  };

  return (
    <div className={cn("grid w-full", colClasses[cols], gapClasses[gap], className)} {...props}>
      {children}
    </div>
  );
}

export interface DividerProps extends React.HTMLAttributes<HTMLHRElement> {
  label?: string;
}

export function Divider({ className, label, ...props }: DividerProps) {
  if (label) {
    return (
      <div className={cn("relative my-6 flex items-center justify-center", className)}>
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative bg-card px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
      </div>
    );
  }

  return <hr className={cn("my-6 border-t border-border", className)} {...props} />;
}
