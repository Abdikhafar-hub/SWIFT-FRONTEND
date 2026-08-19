import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export const buttonVariants = cva(
  "inline-flex items-center justify-center font-display font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] select-none cursor-pointer rounded-xs",
  {
    variants: {
      variant: {
        gold: "bg-gold text-ink font-bold hover:bg-gold-dark hover:shadow-md shadow-xs active:bg-gold-dark",
        navy: "bg-ink text-white hover:bg-ink-light hover:shadow-md shadow-xs",
        outline: "border border-border bg-transparent text-foreground hover:border-gold hover:text-gold hover:bg-gold/5",
        secondary: "bg-muted text-foreground hover:bg-muted/80",
        ghost: "text-foreground hover:bg-muted/60",
        danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-xs",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-xs",
        emerald: "bg-emerald-brand text-white hover:bg-emerald-dark shadow-xs",
      },
      size: {
        xs: "h-7 px-2.5 text-xs gap-1.5",
        sm: "h-9 px-3 text-xs gap-2",
        md: "h-11 px-5 text-sm gap-2.5",
        lg: "h-12 px-6 text-base gap-3",
        xl: "h-14 px-8 text-lg gap-3",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "gold",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      isLoading = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="size-4 animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";
