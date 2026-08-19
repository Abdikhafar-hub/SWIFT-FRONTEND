import React from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { buttonVariants, type ButtonProps } from "./button";

export interface IconButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  icon: React.ReactNode;
  "aria-label": string;
  variant?: "gold" | "navy" | "outline" | "secondary" | "ghost" | "danger" | "emerald";
  size?: "xs" | "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      className,
      icon,
      variant = "ghost",
      size = "md",
      isLoading = false,
      disabled,
      "aria-label": ariaLabel,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      xs: "size-7 p-0",
      sm: "size-9 p-0",
      md: "size-11 p-0",
      lg: "size-12 p-0",
    };

    return (
      <button
        ref={ref}
        aria-label={ariaLabel}
        disabled={disabled || isLoading}
        className={cn(
          buttonVariants({ variant }),
          sizeClasses[size],
          "rounded-xs flex items-center justify-center shrink-0",
          className
        )}
        {...props}
      >
        {isLoading ? <Loader2 className="size-4 animate-spin" /> : icon}
      </button>
    );
  }
);
IconButton.displayName = "IconButton";

export interface LinkButtonProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: "gold" | "navy" | "outline" | "secondary" | "ghost" | "danger" | "emerald";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function LinkButton({
  href,
  className,
  variant = "gold",
  size = "md",
  fullWidth,
  leftIcon,
  rightIcon,
  children,
  ...props
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      {...props}
    >
      {leftIcon && <span className="shrink-0">{leftIcon}</span>}
      <span>{children}</span>
      {rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </Link>
  );
}

export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  attached?: boolean;
}

export function ButtonGroup({ className, attached = false, children, ...props }: ButtonGroupProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center",
        attached
          ? "[&>button]:rounded-none [&>button:first-child]:rounded-l-xs [&>button:last-child]:rounded-r-xs [&>button:not(:first-child)]:-ml-px"
          : "gap-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
