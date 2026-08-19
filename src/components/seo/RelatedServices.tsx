/**
 * Swift Doc — Related Services Component
 * Internal linking block that displays related service cards.
 */

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface RelatedServiceItem {
  slug: string;
  name: string;
  description: string;
}

interface RelatedServicesProps {
  services: RelatedServiceItem[];
  title?: string;
  className?: string;
}

export function RelatedServices({
  services,
  title = "Related Services",
  className,
}: RelatedServicesProps) {
  if (services.length === 0) return null;

  return (
    <section className={cn("space-y-4", className)}>
      <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground">
        {title}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {services.map((service) => (
          <Link
            key={service.slug}
            href={`/services/${service.slug}`}
            className="group flex items-start gap-3 rounded-xs border border-border bg-card p-4 hover:border-gold hover:shadow-sm transition-all"
          >
            <div className="flex-1">
              <h3 className="text-sm font-bold text-foreground group-hover:text-gold transition-colors">
                {service.name}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                {service.description}
              </p>
            </div>
            <ArrowRight className="size-4 text-muted-foreground group-hover:text-gold transition-colors shrink-0 mt-0.5" />
          </Link>
        ))}
      </div>
    </section>
  );
}
