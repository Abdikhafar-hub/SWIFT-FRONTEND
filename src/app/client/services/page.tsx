"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, ArrowRight, Clock, ShieldCheck, Sparkles, Building2 } from "lucide-react";
import { PageShell } from "@/components/ui/layout-primitives";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { StartFilingModal } from "@/components/domain/start-filing-modal";
import { Skeleton, ErrorState } from "@/components/ui/feedback-primitives";
import { servicesApi } from "@/lib/api/services";
import { formatKES } from "@/lib/utils/format";
import type { Service } from "@/types";

export default function ClientServicesPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedServiceForFiling, setSelectedServiceForFiling] = useState<Service | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ["service-categories"],
    queryFn: () => servicesApi.getCategories(),
  });

  const { data: services = [], isLoading: isSvcLoading, error, refetch } = useQuery({
    queryKey: ["services-list"],
    queryFn: () => servicesApi.getServices(),
  });

  const filteredServices = services.filter((svc) => {
    const matchesCategory =
      selectedCategory === "ALL" || svc.categoryId === selectedCategory;
    const matchesSearch =
      svc.name.toLowerCase().includes(search.toLowerCase()) ||
      svc.description?.toLowerCase().includes(search.toLowerCase()) ||
      svc.code?.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <PageShell
      eyebrow="STATUTORY DIRECTORY"
      title="Initiate Statutory Filings"
      description="Official Kenya statutory registrations, tax compliance, licensing, immigration, and registry filings with end-to-end officer management."
    >
      {/* Search & Category Filter Tabs */}
      <div className="mb-8 space-y-4">
        <div className="max-w-md">
          <Input
            placeholder="Search statutory filings (e.g. BRS Incorporation, KRA TCC, SHA, eTA)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftAddon={<Search className="size-4" />}
            className="text-xs"
          />
        </div>

        {/* Category Pill Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`px-3 py-1.5 rounded-xs text-xs font-bold uppercase tracking-wider transition-all ${
              selectedCategory === "ALL"
                ? "bg-gold text-ink shadow-xs"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            All Services ({services.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xs text-xs font-bold uppercase tracking-wider transition-all ${
                selectedCategory === cat.id
                  ? "bg-gold text-ink shadow-xs"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Services Grid */}
      {isSvcLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
      ) : error ? (
        <ErrorState onRetry={() => refetch()} />
      ) : filteredServices.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground space-y-2">
          <Building2 className="size-10 text-muted-foreground/40 mx-auto" />
          <h4 className="font-bold text-foreground text-sm">No services found</h4>
          <p className="text-xs">No statutory filings matched your search query or filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((svc) => {
            const totalFee = Number(svc.totalFee || svc.basePrice || (Number(svc.governmentFee || 0) + Number(svc.serviceFee || 0)));

            return (
              <div
                key={svc.id}
                className="flex flex-col justify-between rounded-sm border border-border bg-card p-5 hover:border-gold hover:shadow-md transition-all duration-200 group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-gold-dark dark:text-gold">
                      {svc.category?.name || svc.authority || "Statutory Service"}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-semibold">
                      <Clock className="size-3 text-gold" />
                      <span>{svc.estimatedTurnaroundDays ? `${svc.estimatedTurnaroundDays}d SLA` : "2-4d"}</span>
                    </span>
                  </div>

                  <h3 className="font-display text-base font-bold text-foreground mt-2 group-hover:text-gold transition-colors">
                    {svc.name}
                  </h3>

                  <p className="mt-2 text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                    {svc.description || "Official statutory filing packaged and processed by certified Kenya compliance officers."}
                  </p>
                </div>

                <div className="mt-6 border-t border-border/60 pt-4 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                      Total Statutory Fee
                    </span>
                    <p className="font-mono font-black text-base text-foreground">
                      {formatKES(totalFee)}
                    </p>
                  </div>

                  <Button
                    variant="gold"
                    size="xs"
                    onClick={() => setSelectedServiceForFiling(svc)}
                    className="font-bold gap-1.5 shadow-xs"
                  >
                    <span>Start Filing</span>
                    <ArrowRight className="size-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Start Filing Modal */}
      <StartFilingModal
        isOpen={Boolean(selectedServiceForFiling)}
        onClose={() => setSelectedServiceForFiling(null)}
        service={selectedServiceForFiling}
      />
    </PageShell>
  );
}
