import React from "react";
import { cn } from "@/lib/utils/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string | boolean;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", error, leftAddon, rightAddon, disabled, ...props }, ref) => {
    return (
      <div className="relative flex w-full items-center">
        {leftAddon && (
          <div className="pointer-events-none absolute left-3 flex items-center text-muted-foreground">
            {leftAddon}
          </div>
        )}
        <input
          type={type}
          disabled={disabled}
          ref={ref}
          className={cn(
            "flex h-11 w-full rounded-xs border border-border bg-card px-3.5 py-2 text-sm text-foreground transition-all duration-150 placeholder:text-muted-foreground/70",
            "focus-visible:border-gold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold",
            "disabled:cursor-not-allowed disabled:bg-muted/50 disabled:opacity-60",
            leftAddon && "pl-10",
            rightAddon && "pr-10",
            error && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive",
            className
          )}
          {...props}
        />
        {rightAddon && (
          <div className="absolute right-3 flex items-center text-muted-foreground">
            {rightAddon}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
