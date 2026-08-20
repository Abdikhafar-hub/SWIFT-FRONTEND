"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, ArrowRight, Clock, ShieldCheck, Globe, Building2, Filter } from "lucide-react";
import { StartFilingModal } from "@/components/domain/start-filing-modal";
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

  const { data: services = [], isLoading: isSvcLoading, isError, refetch } = useQuery({
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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-4 sm:p-5 lg:p-6 space-y-4 max-w-[1550px] mx-auto font-sans">
      {/* ------------------------------------------------------------------ */}
      {/* 1. HEADER SECTION */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Service Catalog &amp; Applications
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Official Kenya statutory registrations, tax compliance, and global visa applications across 20+ countries.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium self-start sm:self-auto">
          <Globe className="size-4 text-amber-600 shrink-0" />
          <span>Showing <strong className="text-slate-900 font-mono">{filteredServices.length}</strong> available services</span>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. SEARCH & CATEGORY PILL FILTERS */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-3">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search services (UK Visa, BRS Incorporation, US B1/B2)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium text-slate-800 placeholder-slate-400"
          />
        </div>

        {/* Category Pill Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
          <button
            onClick={() => {
              setSelectedCategory("ALL");
              setCountryFilter("ALL_COUNTRIES");
              setVisaCategoryFilter("ALL_CATEGORIES");
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedCategory === "ALL"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All Services ({services.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedCategory === cat.id
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Visa Specific Sub-Filters */}
        {(isVisaCategorySelected || search.toLowerCase().includes("visa") || countryFilter !== "ALL_COUNTRIES") && (
          <div className="p-3 rounded-lg border border-amber-200/80 bg-amber-50/40 flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-amber-800 uppercase tracking-wider text-[10px]">
              <Filter className="size-3.5" />
              <span>Visa Catalog Filters:</span>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-[11px] font-semibold text-slate-600">Country Group:</label>
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                {VISA_COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c === "ALL_COUNTRIES" ? "All Destination Countries" : c}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-[11px] font-semibold text-slate-600">Visa Type:</label>
              <select
                value={visaCategoryFilter}
                onChange={(e) => setVisaCategoryFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500"
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
                className="text-[10px] uppercase font-bold text-amber-600 hover:underline ml-auto"
              >
                Reset Visa Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. SERVICES GRID */}
      {/* ------------------------------------------------------------------ */}
      {isSvcLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 bg-slate-100 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-8 text-center space-y-3">
          <p className="text-xs font-bold text-rose-800">Failed to load services catalog.</p>
          <button
            onClick={() => refetch()}
            className="px-3.5 py-1.5 bg-white border border-rose-300 text-rose-700 text-xs font-bold rounded-lg hover:bg-rose-100 transition-colors"
          >
            Retry Loading
          </button>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="text-center py-16 text-slate-400 space-y-2 rounded-xl border border-slate-200/80 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <Building2 className="size-10 text-slate-300 mx-auto" />
          <h4 className="font-bold text-slate-800 text-sm">No services found</h4>
          <p className="text-xs">No statutory or visa services matched your search query or filter settings.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
          {filteredServices.map((svc) => {
            const govFee = Number(svc.governmentFee || 0);
            const svcFee = Number(svc.serviceFee || svc.basePrice || 0);
            const totalFee = Number(svc.totalFee || (govFee + svcFee));
            const isVisa = svc.category?.code === "CAT-VISA" || svc.code?.startsWith("SRV-VISA");

            return (
              <div
                key={svc.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-amber-300/80 hover:shadow-md transition-all duration-200 group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                      {isVisa && <Globe className="size-3" />}
                      {svc.category?.name || "Service Catalog"}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-400 font-semibold">
                      <Clock className="size-3 text-amber-500" />
                      <span>{svc.slaHours ? `${svc.slaHours}h SLA` : (svc.estimatedTurnaroundDays ? `${svc.estimatedTurnaroundDays}d SLA` : "72h SLA")}</span>
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mt-2.5 group-hover:text-amber-700 transition-colors leading-snug">
                    {svc.name}
                  </h3>

                  <p className="mt-2 text-xs text-slate-500 line-clamp-3 leading-relaxed">
                    {svc.description || "Official application preparation and compliance processing by Swift Doc specialists."}
                  </p>

                  {svc.defaultGovernmentAgency && (
                    <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500 font-medium border-t border-slate-100 pt-2">
                      <ShieldCheck className="size-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">Authority: {svc.defaultGovernmentAgency}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 border-t border-slate-100 pt-3 space-y-3">
                  {/* Fee Breakdown */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Gov / Official Fee</span>
                      <span className="font-mono font-bold text-slate-800">{formatKES(govFee)}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Swift Doc Fee</span>
                      <span className="font-mono font-bold text-slate-800">{formatKES(svcFee)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">
                        Gross Total Fee
                      </span>
                      <p className="font-mono font-black text-base text-slate-900">
                        {formatKES(totalFee)}
                      </p>
                    </div>

                    <button
                      disabled={svc.active === false}
                      onClick={() => setSelectedServiceForFiling(svc)}
                      className="bg-gradient-to-r from-[#C5A059] to-[#D4AF37] hover:from-[#b49049] hover:to-[#c39e26] text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                    >
                      <span>{svc.active === false ? "Unavailable" : "Start Application"}</span>
                      {svc.active !== false && <ArrowRight className="size-3.5" />}
                    </button>
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
    </div>
  );
}
