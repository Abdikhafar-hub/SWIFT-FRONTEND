"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, ArrowRight, Clock, ShieldCheck, Sparkles, Building2, Globe, FileText, Compass, Filter } from "lucide-react";
import { PageShell } from "@/components/ui/layout-primitives";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StartFilingModal } from "@/components/domain/start-filing-modal";
import { Skeleton, ErrorState } from "@/components/ui/feedback-primitives";
import { servicesApi } from "@/lib/api/services";
import { formatKES } from "@/lib/utils/format";
import type { Service } from "@/types";

const VISA_COUNTRIES = [
  "ALL_COUNTRIES",
  "United Kingdom",
  "United States",
  "Canada",
  "Australia",
  "Schengen Area (France, Germany, Belgium, Czech)",
  "United Arab Emirates",
  "Saudi Arabia",
  "China",
  "Japan",
  "India",
  "South Africa",
  "East Africa (Kenya, Uganda, Tanzania, Rwanda)",
  "Nigeria",
];

const VISA_CATEGORIES = [
  "ALL_CATEGORIES",
  "Visitor / Tourist",
  "Business & Investment",
  "Student & Education",
  "Work & Skilled Employment",
  "Transit & Courtesy",
  "Family & Settlement",
];

export default function ClientServicesPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [countryFilter, setCountryFilter] = useState<string>("ALL_COUNTRIES");
  const [visaCategoryFilter, setVisaCategoryFilter] = useState<string>("ALL_CATEGORIES");
  const [selectedServiceForFiling, setSelectedServiceForFiling] = useState<Service | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ["service-categories"],
    queryFn: () => servicesApi.getCategories(),
  });

  const { data: services = [], isLoading: isSvcLoading, error, refetch } = useQuery({
    queryKey: ["services-list"],
    queryFn: () => servicesApi.getServices(),
  });

  const isVisaCategorySelected = useMemo(() => {
    if (selectedCategory === "ALL") return false;
    const catObj = categories.find((c) => c.id === selectedCategory);
    return catObj?.code === "CAT-VISA" || catObj?.slug === "visa-applications";
  }, [selectedCategory, categories]);

  const filteredServices = useMemo(() => {
    return services.filter((svc) => {
      const matchesCategory =
        selectedCategory === "ALL" || svc.categoryId === selectedCategory;

      const matchesSearch =
        svc.name.toLowerCase().includes(search.toLowerCase()) ||
        svc.description?.toLowerCase().includes(search.toLowerCase()) ||
        svc.code?.toLowerCase().includes(search.toLowerCase()) ||
        svc.defaultGovernmentAgency?.toLowerCase().includes(search.toLowerCase());

      let matchesCountry = true;
      if (countryFilter !== "ALL_COUNTRIES") {
        const cLower = countryFilter.toLowerCase();
        const sNameLower = svc.name.toLowerCase();
        const sDescLower = (svc.description || "").toLowerCase();

        if (cLower.includes("uk") || cLower.includes("united kingdom")) {
          matchesCountry = sNameLower.includes("uk") || sDescLower.includes("united kingdom");
        } else if (cLower.includes("us") || cLower.includes("united states")) {
          matchesCountry = sNameLower.includes("us") || sDescLower.includes("united states");
        } else if (cLower.includes("canada")) {
          matchesCountry = sNameLower.includes("canada") || sNameLower.includes("ca ");
        } else if (cLower.includes("australia")) {
          matchesCountry = sNameLower.includes("australia") || sNameLower.includes("au ");
        } else if (cLower.includes("schengen") || cLower.includes("france") || cLower.includes("germany")) {
          matchesCountry =
            sNameLower.includes("france") ||
            sNameLower.includes("germany") ||
            sNameLower.includes("belgium") ||
            sNameLower.includes("czech") ||
            sNameLower.includes("schengen");
        } else if (cLower.includes("uae") || cLower.includes("emirates")) {
          matchesCountry = sNameLower.includes("uae") || sDescLower.includes("dubai");
        } else if (cLower.includes("saudi")) {
          matchesCountry = sNameLower.includes("saudi");
        } else if (cLower.includes("china")) {
          matchesCountry = sNameLower.includes("china");
        } else if (cLower.includes("japan")) {
          matchesCountry = sNameLower.includes("japan");
        } else if (cLower.includes("india")) {
          matchesCountry = sNameLower.includes("india");
        } else if (cLower.includes("south africa")) {
          matchesCountry = sNameLower.includes("south africa");
        } else if (cLower.includes("east africa")) {
          matchesCountry =
            sNameLower.includes("kenya") ||
            sNameLower.includes("tanzania") ||
            sNameLower.includes("uganda") ||
            sNameLower.includes("rwanda") ||
            sNameLower.includes("east africa");
        } else if (cLower.includes("nigeria")) {
          matchesCountry = sNameLower.includes("nigeria");
        }
      }

      let matchesVisaCat = true;
      if (visaCategoryFilter !== "ALL_CATEGORIES") {
        const vLower = visaCategoryFilter.toLowerCase();
        const sNameLower = svc.name.toLowerCase();

        if (vLower.includes("visitor")) {
          matchesVisaCat = sNameLower.includes("visitor") || sNameLower.includes("tourist") || sNameLower.includes("visit");
        } else if (vLower.includes("business")) {
          matchesVisaCat = sNameLower.includes("business") || sNameLower.includes("conference");
        } else if (vLower.includes("student")) {
          matchesVisaCat = sNameLower.includes("student") || sNameLower.includes("study");
        } else if (vLower.includes("work")) {
          matchesVisaCat = sNameLower.includes("work") || sNameLower.includes("skilled") || sNameLower.includes("permit");
        } else if (vLower.includes("transit")) {
          matchesVisaCat = sNameLower.includes("transit") || sNameLower.includes("diplomatic") || sNameLower.includes("courtesy");
        } else if (vLower.includes("settlement")) {
          matchesVisaCat = sNameLower.includes("settlement") || sNameLower.includes("partner") || sNameLower.includes("family") || sNameLower.includes("pr");
        }
      }

      return matchesCategory && matchesSearch && matchesCountry && matchesVisaCat;
    });
  }, [services, selectedCategory, search, countryFilter, visaCategoryFilter]);

  return (
    <PageShell
      eyebrow="GLOBAL SERVICE CATALOG"
      title="Initiate Statutory & Visa Applications"
      description="Official Kenya statutory registrations, tax compliance, and global visa applications across 20+ countries with end-to-end officer management."
    >
      {/* Search & Category Filter Tabs */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="max-w-md w-full">
            <Input
              placeholder="Search services (e.g. UK Visitor Visa, BRS Incorporation, US B1/B2, Schengen)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftAddon={<Search className="size-4" />}
              className="text-xs"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
            <Globe className="size-4 text-gold shrink-0" />
            <span>Showing <strong className="text-foreground font-mono">{filteredServices.length}</strong> available services</span>
          </div>
        </div>

        {/* Category Pill Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            onClick={() => {
              setSelectedCategory("ALL");
              setCountryFilter("ALL_COUNTRIES");
              setVisaCategoryFilter("ALL_CATEGORIES");
            }}
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

        {/* Visa Specific Sub-Filters (Visible when Visa category or All is selected) */}
        {(isVisaCategorySelected || search.toLowerCase().includes("visa") || countryFilter !== "ALL_COUNTRIES") && (
          <div className="p-3.5 rounded-xs border border-gold/30 bg-gold/5 flex flex-wrap items-center gap-3 text-xs animate-in fade-in duration-200">
            <div className="flex items-center gap-1.5 font-bold text-gold-dark dark:text-gold uppercase tracking-wider text-[11px]">
              <Filter className="size-3.5" />
              <span>Visa Catalog Filters:</span>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-[11px] font-semibold text-muted-foreground">Country Group:</label>
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="bg-background border border-input rounded-xs px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-gold"
              >
                {VISA_COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c === "ALL_COUNTRIES" ? "All Destination Countries" : c}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-[11px] font-semibold text-muted-foreground">Visa Type:</label>
              <select
                value={visaCategoryFilter}
                onChange={(e) => setVisaCategoryFilter(e.target.value)}
                className="bg-background border border-input rounded-xs px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-gold"
              >
                {VISA_CATEGORIES.map((vc) => (
                  <option key={vc} value={vc}>
                    {vc === "ALL_CATEGORIES" ? "All Visa Types" : vc}
                  </option>
                ))}
              </select>
            </div>

            {(countryFilter !== "ALL_COUNTRIES" || visaCategoryFilter !== "ALL_CATEGORIES") && (
              <button
                onClick={() => {
                  setCountryFilter("ALL_COUNTRIES");
                  setVisaCategoryFilter("ALL_CATEGORIES");
                }}
                className="text-[10px] uppercase font-bold text-gold hover:underline ml-auto"
              >
                Reset Visa Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Services Grid */}
      {isSvcLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : error ? (
        <ErrorState onRetry={() => refetch()} />
      ) : filteredServices.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground space-y-2 rounded-sm border border-border bg-card">
          <Building2 className="size-10 text-muted-foreground/40 mx-auto" />
          <h4 className="font-bold text-foreground text-sm">No services found</h4>
          <p className="text-xs">No statutory or visa services matched your search query or filter settings.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((svc) => {
            const govFee = Number(svc.governmentFee || 0);
            const svcFee = Number(svc.serviceFee || svc.basePrice || 0);
            const totalFee = Number(svc.totalFee || (govFee + svcFee));
            const isVisa = svc.category?.code === "CAT-VISA" || svc.code?.startsWith("SRV-VISA");

            return (
              <div
                key={svc.id}
                className="flex flex-col justify-between rounded-sm border border-border bg-card p-5 hover:border-gold hover:shadow-md transition-all duration-200 group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-gold-dark dark:text-gold bg-gold/10 px-2 py-0.5 rounded-xs">
                      {isVisa && <Globe className="size-3" />}
                      {svc.category?.name || "Service Catalog"}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-semibold">
                      <Clock className="size-3 text-gold" />
                      <span>{svc.slaHours ? `${svc.slaHours}h SLA` : (svc.estimatedTurnaroundDays ? `${svc.estimatedTurnaroundDays}d SLA` : "72h SLA")}</span>
                    </span>
                  </div>

                  <h3 className="font-display text-base font-bold text-foreground mt-2.5 group-hover:text-gold transition-colors">
                    {svc.name}
                  </h3>

                  <p className="mt-2 text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                    {svc.description || "Official application preparation and compliance processing by Swift Doc specialists."}
                  </p>

                  {svc.defaultGovernmentAgency && (
                    <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium border-t border-border/40 pt-2">
                      <ShieldCheck className="size-3.5 text-emerald-500 shrink-0" />
                      <span className="truncate">Authority: {svc.defaultGovernmentAgency}</span>
                    </div>
                  )}
                </div>

                <div className="mt-5 border-t border-border/60 pt-4 space-y-3">
                  {/* Transparent Fee Breakdown */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-muted/30 p-2 rounded-xs border border-border/40">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-muted-foreground block">Gov / Official Fee</span>
                      <span className="font-mono font-semibold text-foreground">{formatKES(govFee)}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-muted-foreground block">Swift Doc Fee</span>
                      <span className="font-mono font-semibold text-foreground">{formatKES(svcFee)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        Gross Total Fee
                      </span>
                      <p className="font-mono font-black text-base text-foreground">
                        {formatKES(totalFee)}
                      </p>
                    </div>

                    <Button
                      variant="gold"
                      size="xs"
                      disabled={svc.active === false}
                      onClick={() => setSelectedServiceForFiling(svc)}
                      className="font-bold gap-1.5 shadow-xs"
                    >
                      <span>{svc.active === false ? "Service Unavailable" : "Start Application"}</span>
                      {svc.active !== false && <ArrowRight className="size-3.5" />}
                    </Button>
                  </div>
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
