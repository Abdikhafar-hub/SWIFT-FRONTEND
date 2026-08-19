import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: React.ReactNode;
  description?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, checked, disabled, onChange, id, ...props }, ref) => {
    const inputId = id || (label ? String(label).toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <label
        htmlFor={inputId}
        className={cn(
          "inline-flex items-start gap-3 cursor-pointer select-none",
          disabled && "cursor-not-allowed opacity-60",
          className
        )}
      >
        <div className="relative mt-0.5 flex items-center justify-center">
          <input
            id={inputId}
            ref={ref}
            type="checkbox"
            checked={checked}
            disabled={disabled}
            onChange={onChange}
            className="peer sr-only"
            {...props}
          />
          <div
            className={cn(
              "size-4 rounded-xs border border-border bg-card transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-gold",
              "peer-checked:border-gold peer-checked:bg-gold peer-checked:text-ink flex items-center justify-center"
            )}
          >
            {checked && <Check className="size-3 stroke-[3]" />}
          </div>
        </div>
        {(label || description) && (
          <div className="flex flex-col">
            {label && <span className="text-sm font-medium text-foreground">{label}</span>}
            {description && <span className="text-xs text-muted-foreground">{description}</span>}
          </div>
        )}
      </label>
    );
  }
);
Checkbox.displayName = "Checkbox";
