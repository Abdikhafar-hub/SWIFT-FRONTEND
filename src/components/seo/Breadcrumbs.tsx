/**
 * Swift Doc — Visual Breadcrumb Component
 * Renders breadcrumb trail with BreadcrumbList JSON-LD.
 */

import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { createBreadcrumbSchema, type BreadcrumbItem } from "@/lib/seo";
import { JsonLd } from "./JsonLd";

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const allItems: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    ...items,
  ];

  return (
    <>
      <JsonLd data={createBreadcrumbSchema(allItems)} />
      <nav
        aria-label="Breadcrumb"
        className={cn(
          "flex items-center flex-wrap gap-1.5 text-xs font-medium text-muted-foreground",
          className
        )}
      >
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;
          const isHome = index === 0;

          return (
            <React.Fragment key={item.href}>
              {index > 0 && (
                <ChevronRight className="size-3 text-muted-foreground/50 shrink-0" />
              )}
              {isLast ? (
                <span
                  className="text-foreground font-semibold truncate max-w-[200px]"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="inline-flex items-center gap-1 hover:text-gold transition-colors"
                >
                  {isHome && <Home className="size-3" />}
                  <span>{item.label}</span>
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </nav>
    </>
  );
}
