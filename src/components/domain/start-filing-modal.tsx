"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Clock,
  ShieldCheck,
  ArrowRight,
  X,
  AlertCircle,
  Sparkles,
  Globe,
  Plane,
  Calendar,
  User,
} from "lucide-react";
import { applicationsApi } from "@/lib/api/applications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatKES } from "@/lib/utils/format";
import type { Service } from "@/types";

import { z } from "zod";

const visaIntakeSchema = z.object({
  destinationCountry: z.string().min(2, "Destination country is required"),
  visaCategory: z.string().min(2, "Visa category is required"),
  passportNumber: z.string().optional(),
  passportExpiry: z.string().optional().refine((val) => {
    if (!val) return true;
    const expiry = new Date(val);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return expiry > today;
  }, "Passport expiry date must be in the future"),
  travelStartDate: z.string().optional(),
  travelEndDate: z.string().optional(),
}).refine((data) => {
  if (data.travelStartDate && data.travelEndDate) {
    return new Date(data.travelEndDate) >= new Date(data.travelStartDate);
  }
  return true;
}, {
  message: "Return date must be on or after travel start date",
  path: ["travelEndDate"],
});

interface StartFilingModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service | null;
}

export function StartFilingModal({ isOpen, onClose, service }: StartFilingModalProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [notesSummary, setNotesSummary] = useState("");
  // Business Registration specific fields
  const [proposedName1, setProposedName1] = useState("");
  const [proposedName2, setProposedName2] = useState("");

  // Visa Application specific fields
  const [destinationCountry, setDestinationCountry] = useState("");
  const [visaCategory, setVisaCategory] = useState("Visitor / Tourist");
  const [passportNumber, setPassportNumber] = useState("");
  const [passportExpiry, setPassportExpiry] = useState("");
  const [travelStartDate, setTravelStartDate] = useState("");
  const [travelEndDate, setTravelEndDate] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isVisaService =
    service?.category?.code === "CAT-VISA" ||
    service?.category?.slug === "visa-applications" ||
    service?.code?.startsWith("SRV-VISA") ||
    service?.name?.toLowerCase().includes("visa");

  const isBusinessIncorporation =
    !isVisaService &&
    (service?.category?.slug === "business-registration" ||
      service?.code?.toLowerCase().includes("incorporation") ||
      service?.name?.toLowerCase().includes("company") ||
      service?.name?.toLowerCase().includes("business"));

  // Reset errors and prefill default visa country and category if applicable
  useEffect(() => {
    setFieldErrors({});
    setErrorMessage(null);
    if (service && isVisaService) {
      const name = service.name;
      if (name.includes("UK") || name.includes("United Kingdom")) setDestinationCountry("United Kingdom");
      else if (name.includes("Canada")) setDestinationCountry("Canada");
      else if (name.includes("US") || name.includes("B1/B2") || name.includes("F1")) setDestinationCountry("United States");
      else if (name.includes("Australia")) setDestinationCountry("Australia");
      else if (name.includes("France")) setDestinationCountry("France");
      else if (name.includes("Germany")) setDestinationCountry("Germany");
      else if (name.includes("Belgium")) setDestinationCountry("Belgium");
      else if (name.includes("Czech")) setDestinationCountry("Czech Republic");
      else if (name.includes("China")) setDestinationCountry("China");
      else if (name.includes("UAE") || name.includes("Dubai")) setDestinationCountry("United Arab Emirates");
      else if (name.includes("Saudi")) setDestinationCountry("Saudi Arabia");
      else if (name.includes("Japan")) setDestinationCountry("Japan");
      else if (name.includes("India")) setDestinationCountry("India");
      else if (name.includes("South Africa")) setDestinationCountry("South Africa");
      else if (name.includes("Kenya")) setDestinationCountry("Kenya");
      else if (name.includes("Tanzania")) setDestinationCountry("Tanzania");
      else if (name.includes("Uganda")) setDestinationCountry("Uganda");
      else if (name.includes("Rwanda")) setDestinationCountry("Rwanda");

      if (name.toLowerCase().includes("student") || name.toLowerCase().includes("study")) setVisaCategory("Student & Education");
      else if (name.toLowerCase().includes("work") || name.toLowerCase().includes("skilled")) setVisaCategory("Work & Employment");
      else if (name.toLowerCase().includes("business")) setVisaCategory("Business & Investment");
      else if (name.toLowerCase().includes("transit")) setVisaCategory("Transit / Courtesy");
      else setVisaCategory("Visitor / Tourist");
    }
  }, [service, isVisaService]);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!service) throw new Error("No service selected");
      setErrorMessage(null);
      setFieldErrors({});

      const metadata: Record<string, unknown> = {};

      if (isVisaService) {
        // Run Zod Validation
        const result = visaIntakeSchema.safeParse({
          destinationCountry: destinationCountry.trim(),
          visaCategory: visaCategory.trim(),
          passportNumber: passportNumber.trim(),
          passportExpiry,
          travelStartDate,
          travelEndDate,
        });

        if (!result.success) {
          const errors: Record<string, string> = {};
          result.error.issues.forEach((issue) => {
            const field = issue.path[0] as string;
            if (field) errors[field] = issue.message;
          });
          setFieldErrors(errors);
          throw new Error("Please correct the highlighted validation errors before proceeding.");
        }

        if (destinationCountry) metadata.destinationCountry = destinationCountry.trim();
        if (visaCategory) metadata.visaCategory = visaCategory.trim();
        if (passportNumber) metadata.passportNumber = passportNumber.trim().toUpperCase();
        if (passportExpiry) metadata.passportExpiry = passportExpiry;
        if (travelStartDate) metadata.travelStartDate = travelStartDate;
        if (travelEndDate) metadata.travelEndDate = travelEndDate;
        if (service.defaultGovernmentAgency) metadata.processingEmbassy = service.defaultGovernmentAgency;
      } else if (isBusinessIncorporation) {
        if (proposedName1) metadata.proposedName1 = proposedName1.trim();
        if (proposedName2) metadata.proposedName2 = proposedName2.trim();
      }

      const newApp = await applicationsApi.createApplication({
        serviceId: service.id,
        notesSummary: notesSummary.trim() || undefined,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      });

      return newApp;
    },
    onSuccess: (newApp) => {
      queryClient.invalidateQueries({ queryKey: ["client-applications"] });
      queryClient.invalidateQueries({ queryKey: ["client-dashboard-overview"] });
      onClose();
      router.push(`/client/applications/${newApp.id}`);
    },
    onError: (err: any) => {
      setErrorMessage(err.message || "Failed to initiate filing application.");
    },
  });

  if (!isOpen || !service) return null;

  const govFee = Number(service.governmentFee || 0);
  const svcFee = Number(service.serviceFee || service.basePrice || 0);
  const totalFee = Number(service.totalFee || (govFee + svcFee));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-ink/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-[calc(100vw-2rem)] max-w-xl max-h-[90vh] flex flex-col rounded-sm border border-border bg-card shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/70 px-4 sm:px-6 py-3.5 sm:py-4 bg-muted/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-xs bg-gold/20 text-gold-dark dark:text-gold font-bold">
              {isVisaService ? <Globe className="size-4" /> : <Sparkles className="size-4" />}
            </div>
            <div>
              <h3 className="font-display text-xs sm:text-sm font-bold text-foreground">
                {isVisaService ? "Initiate Visa Application Dossier" : "Initiate Statutory Filing"}
              </h3>
              <p className="text-[10px] text-muted-foreground">
                {isVisaService ? "Consular Intake & Document Verification Workflow" : "Official Kenya Registry Application"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Close modal"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
          {/* Service Summary Highlight Box */}
          <div className="rounded-xs border border-gold/30 bg-gold/5 p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gold-dark dark:text-gold flex items-center gap-1">
                  {isVisaService && <Plane className="size-3" />}
                  {service.category?.name || (isVisaService ? "Visa Applications" : "Statutory Service")}
                </span>
                <h4 className="font-display text-base font-bold text-foreground">
                  {service.name}
                </h4>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  Gross Total Fee
                </span>
                <span className="font-mono text-base font-extrabold text-foreground">
                  {formatKES(totalFee)}
                </span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {service.description}
            </p>

            {/* Fee Breakdown Bar */}
            <div className="grid grid-cols-2 gap-2 text-xs bg-background/60 p-2.5 rounded-xs border border-gold/20">
              <div>
                <span className="text-[9px] uppercase font-bold text-muted-foreground block">Government Fee</span>
                <span className="font-mono font-semibold text-foreground">{formatKES(govFee)}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-muted-foreground block">Swift Doc Processing Fee</span>
                <span className="font-mono font-semibold text-foreground">{formatKES(svcFee)}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-muted-foreground font-semibold">
              <span className="flex items-center gap-1.5">
                <Clock className="size-3.5 text-gold" />
                Est. Turnaround: {service.slaHours ? `${service.slaHours} Hours` : "3-5 Days"}
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-emerald-500" />
                {service.defaultGovernmentAgency || "Official Processing Desk"}
              </span>
            </div>
          </div>

          {/* Visa Dynamic Intake Fields */}
          {isVisaService && (
            <div className="space-y-4 rounded-xs border border-border bg-muted/20 p-4">
              <span className="block text-xs font-bold text-foreground flex items-center gap-1.5 border-b border-border/60 pb-2">
                <Globe className="size-3.5 text-gold" />
                <span>Visa Application & Travel Details</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="destination-country-input" className="block text-[11px] font-bold text-muted-foreground mb-1">Destination Country *</label>
                  <Input
                    id="destination-country-input"
                    value={destinationCountry}
                    onChange={(e) => {
                      setDestinationCountry(e.target.value);
                      if (fieldErrors.destinationCountry) setFieldErrors((prev) => ({ ...prev, destinationCountry: "" }));
                    }}
                    placeholder="e.g. United Kingdom, USA, Canada"
                    className={`text-xs ${fieldErrors.destinationCountry ? "border-destructive focus:ring-destructive" : ""}`}
                  />
                  {fieldErrors.destinationCountry && (
                    <span className="text-[10px] text-destructive font-semibold mt-0.5 block">{fieldErrors.destinationCountry}</span>
                  )}
                </div>

                <div>
                  <label htmlFor="visa-category-select" className="block text-[11px] font-bold text-muted-foreground mb-1">Visa Category *</label>
                  <select
                    id="visa-category-select"
                    value={visaCategory}
                    onChange={(e) => {
                      setVisaCategory(e.target.value);
                      if (fieldErrors.visaCategory) setFieldErrors((prev) => ({ ...prev, visaCategory: "" }));
                    }}
                    className={`w-full bg-background border rounded-xs px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 ${fieldErrors.visaCategory ? "border-destructive focus:ring-destructive" : "border-input focus:ring-gold"}`}
                  >
                    <option value="Visitor / Tourist">Visitor / Tourist</option>
                    <option value="Business & Investment">Business & Investment</option>
                    <option value="Student & Education">Student & Education</option>
                    <option value="Work & Employment">Work & Employment</option>
                    <option value="Transit / Courtesy">Transit / Courtesy</option>
                    <option value="Family & Settlement">Family & Settlement</option>
                  </select>
                  {fieldErrors.visaCategory && (
                    <span className="text-[10px] text-destructive font-semibold mt-0.5 block">{fieldErrors.visaCategory}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="passport-number-input" className="block text-[11px] font-bold text-muted-foreground mb-1">Passport Number</label>
                  <Input
                    id="passport-number-input"
                    value={passportNumber}
                    onChange={(e) => {
                      setPassportNumber(e.target.value);
                      if (fieldErrors.passportNumber) setFieldErrors((prev) => ({ ...prev, passportNumber: "" }));
                    }}
                    placeholder="e.g. A12345678"
                    className="text-xs font-mono uppercase"
                  />
                  {fieldErrors.passportNumber && (
                    <span className="text-[10px] text-destructive font-semibold mt-0.5 block">{fieldErrors.passportNumber}</span>
                  )}
                </div>

                <div>
                  <label htmlFor="passport-expiry-input" className="block text-[11px] font-bold text-muted-foreground mb-1">Passport Expiry Date</label>
                  <Input
                    id="passport-expiry-input"
                    type="date"
                    value={passportExpiry}
                    onChange={(e) => {
                      setPassportExpiry(e.target.value);
                      if (fieldErrors.passportExpiry) setFieldErrors((prev) => ({ ...prev, passportExpiry: "" }));
                    }}
                    className={`text-xs ${fieldErrors.passportExpiry ? "border-destructive focus:ring-destructive" : ""}`}
                  />
                  {fieldErrors.passportExpiry && (
                    <span className="text-[10px] text-destructive font-semibold mt-0.5 block">{fieldErrors.passportExpiry}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="travel-start-date-input" className="block text-[11px] font-bold text-muted-foreground mb-1">Intended Travel Start Date</label>
                  <Input
                    id="travel-start-date-input"
                    type="date"
                    value={travelStartDate}
                    onChange={(e) => {
                      setTravelStartDate(e.target.value);
                      if (fieldErrors.travelStartDate) setFieldErrors((prev) => ({ ...prev, travelStartDate: "" }));
                    }}
                    className={`text-xs ${fieldErrors.travelStartDate ? "border-destructive focus:ring-destructive" : ""}`}
                  />
                  {fieldErrors.travelStartDate && (
                    <span className="text-[10px] text-destructive font-semibold mt-0.5 block">{fieldErrors.travelStartDate}</span>
                  )}
                </div>

                <div>
                  <label htmlFor="travel-end-date-input" className="block text-[11px] font-bold text-muted-foreground mb-1">Intended Return Date</label>
                  <Input
                    id="travel-end-date-input"
                    type="date"
                    value={travelEndDate}
                    onChange={(e) => {
                      setTravelEndDate(e.target.value);
                      if (fieldErrors.travelEndDate) setFieldErrors((prev) => ({ ...prev, travelEndDate: "" }));
                    }}
                    className={`text-xs ${fieldErrors.travelEndDate ? "border-destructive focus:ring-destructive" : ""}`}
                  />
                  {fieldErrors.travelEndDate && (
                    <span className="text-[10px] text-destructive font-semibold mt-0.5 block">{fieldErrors.travelEndDate}</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Business Name Proposals (if incorporation) */}
          {isBusinessIncorporation && (
            <div className="space-y-3 rounded-xs border border-border bg-muted/20 p-3.5">
              <span className="block text-xs font-bold text-foreground">
                Proposed Company / Business Names (Order of Preference)
              </span>
              <div className="space-y-2">
                <Input
                  value={proposedName1}
                  onChange={(e) => setProposedName1(e.target.value)}
                  placeholder="Primary Choice (e.g. Acme East Africa Limited)"
                  className="text-xs"
                />
                <Input
                  value={proposedName2}
                  onChange={(e) => setProposedName2(e.target.value)}
                  placeholder="Alternative Choice (Optional)"
                  className="text-xs"
                />
              </div>
            </div>
          )}

          {/* Initial Client Notes */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-foreground">
              {isVisaService ? "Consular Notes & Special Travel Circumstances (Optional)" : "Initial Instructions or Specific Requirements (Optional)"}
            </label>
            <textarea
              value={notesSummary}
              onChange={(e) => setNotesSummary(e.target.value)}
              placeholder={isVisaService ? "Include any previous visa history, conference details, sponsor info, or priority deadlines..." : "Provide any specific details for our compliance officers..."}
              rows={3}
              className="w-full rounded-xs border border-input bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>

          {errorMessage && (
            <div className="flex items-start gap-2 rounded-xs border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={createMutation.isPending}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => createMutation.mutate()}
              isLoading={createMutation.isPending}
              className="bg-gold hover:bg-gold-light text-ink font-bold text-xs gap-1.5 shadow-xs"
            >
              <span>{isVisaService ? "Create Visa Application Dossier" : "Create Application Dossier"}</span>
              <ArrowRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
