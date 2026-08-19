import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const headingVariants = cva("font-display font-bold tracking-tight text-foreground", {
  variants: {
    level: {
      h1: "text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight",
      h2: "text-2xl sm:text-3xl lg:text-4xl font-bold",
      h3: "text-xl sm:text-2xl font-bold",
      h4: "text-lg sm:text-xl font-semibold",
      h5: "text-base sm:text-lg font-semibold",
      h6: "text-sm sm:text-base font-semibold",
    },
    serif: {
      true: "font-serif italic font-normal",
    },
  },
  defaultVariants: {
    level: "h2",
  },
});

export interface HeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof headingVariants> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span";
}

export function Heading({
  className,
  level = "h2",
  serif,
  as,
  children,
  ...props
}: HeadingProps) {
  const Component = as || (level as "h1" | "h2" | "h3" | "h4" | "h5" | "h6") || "h2";
  return (
    <Component className={cn(headingVariants({ level, serif }), className)} {...props}>
      {children}
    </Component>
  );
}
