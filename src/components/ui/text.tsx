import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const textVariants = cva("leading-relaxed", {
  variants: {
    variant: {
      default: "text-foreground",
      muted: "text-muted-foreground",
      subtle: "text-muted-foreground/80 text-xs",
      lead: "text-lg sm:text-xl font-medium text-foreground/90 leading-relaxed",
      caption: "text-xs text-muted-foreground uppercase tracking-wider font-semibold",
    },
    size: {
      xs: "text-xs",
      sm: "text-sm",
      base: "text-base",
      lg: "text-lg",
      xl: "text-xl",
    },
    weight: {
      normal: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "base",
  },
});

export interface TextProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof textVariants> {
  as?: "p" | "span" | "div" | "label";
}

export function Text({
  className,
  variant,
  size,
  weight,
  as: Component = "p",
  children,
  ...props
}: TextProps) {
  const Comp = Component as React.ElementType;
  return (
    <Comp className={cn(textVariants({ variant, size, weight }), className)} {...props}>
      {children}
    </Comp>
  );
}
