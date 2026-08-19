import React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options?: SelectOption[];
  error?: string | boolean;
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, placeholder, error, disabled, children, ...props }, ref) => {
    return (
      <div className="relative flex w-full items-center">
        <select
          ref={ref}
          disabled={disabled}
          className={cn(
            "flex h-11 w-full appearance-none rounded-xs border border-border bg-card px-3.5 py-2 pr-10 text-sm text-foreground transition-all duration-150",
            "focus-visible:border-gold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold",
            "disabled:cursor-not-allowed disabled:bg-muted/50 disabled:opacity-60 cursor-pointer",
            error && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive",
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        <div className="pointer-events-none absolute right-3 flex items-center text-muted-foreground">
          <ChevronDown className="size-4" />
        </div>
      </div>
    );
  }
);
Select.displayName = "Select";
