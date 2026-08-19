import React from "react";
import { cn } from "@/lib/utils/cn";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string | boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, disabled, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        disabled={disabled}
        className={cn(
          "flex min-h-[96px] w-full rounded-xs border border-border bg-card px-3.5 py-2.5 text-sm text-foreground transition-all duration-150 placeholder:text-muted-foreground/70",
          "focus-visible:border-gold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold",
          "disabled:cursor-not-allowed disabled:bg-muted/50 disabled:opacity-60",
          error && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive",
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

export function FormField({
  className,
  label,
  htmlFor,
  error,
  hint,
  required = false,
  children,
  ...props
}: FormFieldProps) {
  return (
    <div className={cn("flex w-full flex-col gap-1.5", className)} {...props}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="flex items-center text-xs font-bold uppercase tracking-wider text-foreground/90"
        >
          <span>{label}</span>
          {required && <span className="ml-1 text-destructive font-bold">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && (
        <p role="alert" className="text-xs font-semibold text-destructive animate-fadeIn">
          {error}
        </p>
      )}
    </div>
  );
}
