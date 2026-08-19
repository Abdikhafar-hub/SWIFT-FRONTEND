"use client";

/**
 * Swift Doc — Services Index Client Component
 * Handles search/filter interactivity for the services catalog.
 */

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  ArrowRight,
  Building2,
  FileText,
  Award,
  Shield,
  Heart,
  ClipboardCheck,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ServiceSeoData } from "@/../content/services";

const ICON_MAP: Record<string, React.ElementType> = {
  Building2,
  FileText,
  Award,
  Shield,
  Heart,
  ClipboardCheck,
  CheckCircle,
};

interface ServicesPageClientProps {
  services: ServiceSeoData[];
}

export function ServicesPageClient({ services }: ServicesPageClientProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return services;
    const q = searchQuery.toLowerCase();
    return services.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.introduction.toLowerCase().includes(q) ||
        s.seoDescription.toLowerCase().includes(q)
    );
  }, [services, searchQuery]);

  return (
    <div className="space-y-8">
      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search services..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xs border border-border bg-card pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-colors"
          id="service-search"
        />
      </div>

      {/* Service Cards */}
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No services found matching &ldquo;{searchQuery}&rdquo;
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((service) => {
            const Icon = ICON_MAP[service.icon] || FileText;
            return (
              <Link
                key={service.slug}
                href={`/services/${service.slug}`}
                className="group block"
              >
                <Card
                  variant="default"
                  padding="lg"
                  className="h-full hover:border-gold hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xs bg-gold/15 text-gold">
                      <Icon className="size-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-base font-bold text-foreground group-hover:text-gold transition-colors">
                        {service.name}
                      </h3>
                      <p className="mt-2 text-xs text-muted-foreground leading-relaxed line-clamp-3">
                        {service.introduction.slice(0, 160)}...
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {service.governmentBody}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-gold group-hover:gap-2 transition-all">
                      Learn More <ArrowRight className="size-3" />
                    </span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
