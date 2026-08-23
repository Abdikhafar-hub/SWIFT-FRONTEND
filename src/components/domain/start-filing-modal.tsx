"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Clock,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  X,
  AlertCircle,
  Sparkles,
  Globe,
  Plane,
  Building2,
  Receipt,
  CheckCircle2,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  Lock,
  CheckSquare,
  Square,
  HelpCircle,
  AlertTriangle,
  Upload,
} from "lucide-react";
import { applicationsApi } from "@/lib/api/applications";
import { servicesApi } from "@/lib/api/services";
import { useAuth } from "@/lib/auth/auth-context";
import { parseApiError } from "@/lib/utils/error";
import { notify } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatKES } from "@/lib/utils/format";
import type { Service, ServiceRequirement } from "@/types";
import { z } from "zod";

// Zod schemas for validation
const visaIntakeSchema = z.object({
  destinationCountry: z.string().min(2, "Destination country is required"),
  visaCategory: z.string().min(2, "Visa category is required"),
  purposeOfTravel: z.string().min(2, "Purpose of travel is required"),
  passportNumber: z.string().min(2, "Passport number is required"),
  passportExpiry: z.string().min(1, "Passport expiry date is required").refine((val) => {
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
  message: "Intended return date must be on or after travel start date",
  path: ["travelEndDate"],
});

const businessIntakeSchema = z.object({
  proposedName1: z.string().min(3, "Primary proposed business name is required"),
  businessType: z.string().min(2, "Business type selection is required"),
  businessActivity: z.string().min(3, "Nature of business activity is required"),
});

const kraIntakeSchema = z.object({
  kraPinNumber: z.string().min(5, "Valid KRA PIN is required"),
  taxObligation: z.string().min(2, "Tax obligation type is required"),
});

interface StartFilingModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service | null;
}

export function StartFilingModal({ isOpen, onClose, service }: StartFilingModalProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, client } = useAuth();

  // Wizard Navigation State: 1 = Service Overview, 2 = Applicant Details, 3 = Service Details, 4 = Requirements Preview, 5 = Review & Submit
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [createdAppNumber, setCreatedAppNumber] = useState<string | null>(null);
  const [createdAppId, setCreatedAppId] = useState<string | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // STEP 2: Applicant Details State
  const [clientType, setClientType] = useState<"INDIVIDUAL" | "BUSINESS">("INDIVIDUAL");
  const [applicantFullName, setApplicantFullName] = useState("");
  const [applicantEmail, setApplicantEmail] = useState("");
  const [applicantPhone, setApplicantPhone] = useState("");
  const [applicantNationality, setApplicantNationality] = useState("Kenyan");
  const [applicantIdOrPassport, setApplicantIdOrPassport] = useState("");
  const [applicantAddress, setApplicantAddress] = useState("");
  // Corporate fields
  const [companyName, setCompanyName] = useState("");
  const [companyRegNumber, setCompanyRegNumber] = useState("");
  const [companyKraPin, setCompanyKraPin] = useState("");
  const [contactPerson, setContactPerson] = useState("");

  // STEP 3: Service-Specific Intake Fields
  // Visa Fields
  const [destinationCountry, setDestinationCountry] = useState("");
  const [visaCategory, setVisaCategory] = useState("Visitor / Tourist");
  const [purposeOfTravel, setPurposeOfTravel] = useState("Tourism & Visiting Family");
  const [passportNumber, setPassportNumber] = useState("");
  const [passportExpiry, setPassportExpiry] = useState("");
  const [passportCountry, setPassportCountry] = useState("Kenya");
  const [travelStartDate, setTravelStartDate] = useState("");
  const [travelEndDate, setTravelEndDate] = useState("");
  const [consularNotes, setConsularNotes] = useState("");

  // Business Incorporation Fields
  const [proposedName1, setProposedName1] = useState("");
  const [proposedName2, setProposedName2] = useState("");
  const [businessType, setBusinessType] = useState("Private Limited Company (Ltd)");
  const [businessActivity, setBusinessActivity] = useState("");
  const [businessCounty, setBusinessCounty] = useState("Nairobi");
  const [registeredAddress, setRegisteredAddress] = useState("");

  // KRA / Tax Fields
  const [kraPinNumber, setKraPinNumber] = useState("");
  const [taxObligation, setTaxObligation] = useState("Income Tax Individual (IT1)");
  const [taxPeriod, setTaxPeriod] = useState("");
  const [noticeReference, setNoticeReference] = useState("");

  // Statutory / Generic Fields
  const [generalNotes, setGeneralNotes] = useState("");

  // STEP 5: Declaration
  const [declarationAccepted, setDeclarationAccepted] = useState(false);

  // Errors state
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Categorization flags
  const isVisaService = useMemo(() => {
    if (!service) return false;
    return (
      service.category?.code === "CAT-VISA" ||
      service.category?.slug === "visa-applications" ||
      service.code?.startsWith("SRV-VISA") ||
      service.name?.toLowerCase().includes("visa")
    );
  }, [service]);

  const isBusinessService = useMemo(() => {
    if (!service || isVisaService) return false;
    return (
      service.category?.slug === "business-registration" ||
      service.code?.toLowerCase().includes("incorporation") ||
      service.name?.toLowerCase().includes("company") ||
      service.name?.toLowerCase().includes("business") ||
      service.name?.toLowerCase().includes("brs")
    );
  }, [service, isVisaService]);

  const isKraService = useMemo(() => {
    if (!service || isVisaService || isBusinessService) return false;
    return (
      service.category?.slug === "tax-compliance" ||
      service.code?.toLowerCase().includes("kra") ||
      service.name?.toLowerCase().includes("kra") ||
      service.name?.toLowerCase().includes("tax") ||
      service.name?.toLowerCase().includes("pin")
    );
  }, [service, isVisaService, isBusinessService]);

  // Fetch Service Requirements for Step 4 Preview
  const { data: fetchedRequirements = [] } = useQuery<ServiceRequirement[]>({
    queryKey: ["service-requirements-preview", service?.id],
    queryFn: () => (service?.id ? servicesApi.getServiceRequirements(service.id) : Promise.resolve([])),
    enabled: Boolean(service?.id && isOpen),
  });

  const activeRequirements = useMemo(() => {
    if (service?.requirements && service.requirements.length > 0) {
      return service.requirements;
    }
    if (fetchedRequirements && fetchedRequirements.length > 0) {
      return fetchedRequirements;
    }
    // Fallback default requirement preview list if none in DB for visual clarity
    if (isVisaService) {
      return [
        { id: "req-1", name: "Passport Bio-Data Page", description: "Clear color scan of valid passport photo page", type: "FILE", required: true, displayOrder: 1 },
        { id: "req-2", name: "Passport Size Photograph", description: "Recent passport photo with light background", type: "FILE", required: true, displayOrder: 2 },
        { id: "req-3", name: "Bank Statements (6 Months)", description: "Certified bank statements showing sufficient funds", type: "FILE", required: true, displayOrder: 3 },
        { id: "req-4", name: "Employment / Income Evidence", description: "Payslips, job letter, or business registration proof", type: "FILE", required: false, displayOrder: 4 },
        { id: "req-5", name: "Flight & Hotel Accommodation Itinerary", description: "Reserved travel itinerary and lodging booking", type: "FILE", required: false, displayOrder: 5 },
      ] as unknown as ServiceRequirement[];
    }
    return [
      { id: "req-stat-1", name: "National ID / Passport Scan", description: "Copy of legal identity document of applicant or director", type: "FILE", required: true, displayOrder: 1 },
      { id: "req-stat-2", name: "KRA PIN Certificate", description: "Official KRA tax PIN registration certificate", type: "FILE", required: true, displayOrder: 2 },
      { id: "req-stat-3", name: "Supporting Authorization Document", description: "Signed resolution or authorization letter if applicable", type: "FILE", required: false, displayOrder: 3 },
    ] as unknown as ServiceRequirement[];
  }, [service, fetchedRequirements, isVisaService]);

  // Pre-populate applicant details when modal opens or user profile is loaded
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setCreatedAppNumber(null);
      setCreatedAppId(null);
      setShowExitConfirm(false);
      setDeclarationAccepted(false);
      setFieldErrors({});
      setErrorMessage(null);

      // Pre-fill Applicant Details from Auth Profile
      if (client) {
        setApplicantFullName(client.fullName || `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "");
        setApplicantEmail(client.email || user?.email || "");
        setApplicantPhone(client.phone || user?.phone || "");
        setApplicantNationality(client.nationality || "Kenyan");
        setApplicantIdOrPassport(client.passportNumber || client.nationalId || client.idNumber || "");
        setApplicantAddress(client.address || `${client.city || ""}, ${client.county || ""}`.trim() || "");

        if (client.clientType === "BUSINESS" || client.clientType === "ORGANIZATION" || Boolean(client.businessName)) {
          setClientType("BUSINESS");
          setCompanyName(client.businessName || client.fullName || "");
          setCompanyRegNumber(client.clientNumber || "");
          setCompanyKraPin(client.kraPin || "");
          setContactPerson(client.fullName || "");
        } else {
          setClientType("INDIVIDUAL");
        }
      } else if (user) {
        setApplicantFullName(`${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email);
        setApplicantEmail(user.email || "");
        setApplicantPhone(user.phone || "");
      }

      // Pre-fill Visa Defaults
      if (service && isVisaService) {
        const name = service.name;
        if (name.includes("UK") || name.includes("United Kingdom")) setDestinationCountry("United Kingdom");
        else if (name.includes("Canada")) setDestinationCountry("Canada");
        else if (name.includes("US") || name.includes("B1/B2") || name.includes("F1")) setDestinationCountry("United States");
        else if (name.includes("Australia")) setDestinationCountry("Australia");
        else if (name.includes("Schengen") || name.includes("France")) setDestinationCountry("France");
        else if (name.includes("Germany")) setDestinationCountry("Germany");
        else if (name.includes("UAE") || name.includes("Dubai")) setDestinationCountry("United Arab Emirates");
        else if (name.includes("Saudi")) setDestinationCountry("Saudi Arabia");
        else if (name.includes("China")) setDestinationCountry("China");
        else if (name.includes("Japan")) setDestinationCountry("Japan");

        if (name.toLowerCase().includes("student") || name.toLowerCase().includes("study")) setVisaCategory("Student & Education");
        else if (name.toLowerCase().includes("work") || name.toLowerCase().includes("skilled")) setVisaCategory("Work & Employment");
        else if (name.toLowerCase().includes("business")) setVisaCategory("Business & Investment");
        else if (name.toLowerCase().includes("transit")) setVisaCategory("Transit / Courtesy");
        else setVisaCategory("Visitor / Tourist");
      }
    }
  }, [isOpen, service, client, user, isVisaService]);

  // Create Application Mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!service) throw new Error("No service selected");
      setErrorMessage(null);

      // Collect Consolidated Applicant Data Snapshot
      const applicantData = clientType === "BUSINESS"
        ? {
            clientType: "BUSINESS",
            companyName: companyName.trim(),
            registrationNumber: companyRegNumber.trim(),
            kraPin: companyKraPin.trim(),
            contactPerson: contactPerson.trim() || applicantFullName.trim(),
            email: applicantEmail.trim(),
            phone: applicantPhone.trim(),
          }
        : {
            clientType: "INDIVIDUAL",
            fullName: applicantFullName.trim(),
            email: applicantEmail.trim(),
            phone: applicantPhone.trim(),
            nationality: applicantNationality.trim(),
            idOrPassportNumber: applicantIdOrPassport.trim(),
            address: applicantAddress.trim(),
          };

      // Collect Intake Data
      const serviceData: Record<string, unknown> = {};

      if (isVisaService) {
        serviceData.destinationCountry = destinationCountry.trim();
        serviceData.visaCategory = visaCategory.trim();
        serviceData.purposeOfTravel = purposeOfTravel.trim();
        serviceData.passportNumber = passportNumber.trim().toUpperCase();
        serviceData.passportExpiry = passportExpiry;
        serviceData.passportCountry = passportCountry.trim();
        if (travelStartDate) serviceData.travelStartDate = travelStartDate;
        if (travelEndDate) serviceData.travelEndDate = travelEndDate;
        if (consularNotes) serviceData.consularNotes = consularNotes.trim();
        if (service.defaultGovernmentAgency) serviceData.processingEmbassy = service.defaultGovernmentAgency;
      } else if (isBusinessService) {
        serviceData.proposedName1 = proposedName1.trim();
        if (proposedName2) serviceData.proposedName2 = proposedName2.trim();
        serviceData.businessType = businessType;
        serviceData.businessActivity = businessActivity.trim();
        serviceData.businessCounty = businessCounty;
        if (registeredAddress) serviceData.registeredAddress = registeredAddress.trim();
      } else if (isKraService) {
        serviceData.kraPinNumber = kraPinNumber.trim().toUpperCase();
        serviceData.taxObligation = taxObligation;
        if (taxPeriod) serviceData.taxPeriod = taxPeriod.trim();
        if (noticeReference) serviceData.noticeReference = noticeReference.trim();
      }

      const combinedMetadata: Record<string, unknown> = {
        applicantData,
        serviceData,
        declarationAccepted: true,
        declarationTimestamp: new Date().toISOString(),
        // Spread direct keys for legacy UI compatibility
        ...serviceData,
      };

      const newApp = await applicationsApi.createApplication({
        serviceId: service.id,
        notesSummary: (consularNotes || generalNotes).trim() || undefined,
        metadata: combinedMetadata,
      });

      return newApp;
    },
    onSuccess: (newApp) => {
      queryClient.invalidateQueries({ queryKey: ["client-applications"] });
      queryClient.invalidateQueries({ queryKey: ["client-dashboard-overview"] });
      setCreatedAppNumber(newApp.applicationNumber);
      setCreatedAppId(newApp.id);
      notify.success(`Application #${newApp.applicationNumber} created successfully!`, { id: "app-create" });
    },
    onError: (err: any) => {
      const parsed = parseApiError(err);
      setErrorMessage(parsed.message);
      notify.error(err, { id: "app-create", title: "Application Creation Failed" });
    },
  });

  // Step Validation Handlers
  const handleNextStep = () => {
    setFieldErrors({});
    setErrorMessage(null);

    if (step === 1) {
      setStep(2);
      return;
    }

    if (step === 2) {
      // Validate Step 2 Applicant Details
      const errors: Record<string, string> = {};
      if (clientType === "INDIVIDUAL") {
        if (!applicantFullName.trim()) errors.applicantFullName = "Full legal name is required";
        if (!applicantEmail.trim() || !applicantEmail.includes("@")) errors.applicantEmail = "Valid email address is required";
        if (!applicantPhone.trim()) errors.applicantPhone = "Phone number is required";
      } else {
        if (!companyName.trim()) errors.companyName = "Company or entity name is required";
        if (!applicantEmail.trim() || !applicantEmail.includes("@")) errors.applicantEmail = "Valid contact email is required";
        if (!applicantPhone.trim()) errors.applicantPhone = "Valid contact phone is required";
      }

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        return;
      }
      setStep(3);
      return;
    }

    if (step === 3) {
      // Validate Step 3 Service Details
      const errors: Record<string, string> = {};

      if (isVisaService) {
        const parseResult = visaIntakeSchema.safeParse({
          destinationCountry: destinationCountry.trim(),
          visaCategory: visaCategory.trim(),
          purposeOfTravel: purposeOfTravel.trim(),
          passportNumber: passportNumber.trim(),
          passportExpiry,
          travelStartDate,
          travelEndDate,
        });

        if (!parseResult.success) {
          parseResult.error.issues.forEach((issue) => {
            const field = issue.path[0] as string;
            if (field) errors[field] = issue.message;
          });
          setFieldErrors(errors);
          return;
        }
      } else if (isBusinessService) {
        const parseResult = businessIntakeSchema.safeParse({
          proposedName1: proposedName1.trim(),
          businessType: businessType.trim(),
          businessActivity: businessActivity.trim(),
        });

        if (!parseResult.success) {
          parseResult.error.issues.forEach((issue) => {
            const field = issue.path[0] as string;
            if (field) errors[field] = issue.message;
          });
          setFieldErrors(errors);
          return;
        }
      } else if (isKraService) {
        const parseResult = kraIntakeSchema.safeParse({
          kraPinNumber: kraPinNumber.trim(),
          taxObligation: taxObligation.trim(),
        });

        if (!parseResult.success) {
          parseResult.error.issues.forEach((issue) => {
            const field = issue.path[0] as string;
            if (field) errors[field] = issue.message;
          });
          setFieldErrors(errors);
          return;
        }
      }

      setStep(4);
      return;
    }

    if (step === 4) {
      setStep(5);
      return;
    }
  };

  const handlePrevStep = () => {
    setFieldErrors({});
    setErrorMessage(null);
    if (step > 1) {
      setStep((prev) => (prev - 1) as 1 | 2 | 3 | 4 | 5);
    }
  };

  const handleCloseAttempt = () => {
    // If successfully created or still on Step 1 with no inputs, close directly
    if (createdAppId || step === 1) {
      onClose();
    } else {
      setShowExitConfirm(true);
    }
  };

  const handleConfirmExit = () => {
    setShowExitConfirm(false);
    onClose();
  };

  if (!isOpen || !service) return null;

  const govFee = Number(service.governmentFee || 0);
  const svcFee = Number(service.serviceFee || service.basePrice || 0);
  const totalFee = Number(service.totalFee || (govFee + svcFee));

  // Masked passport number representation for Step 5 Review
  const maskedPassportNumber = passportNumber.length > 4
    ? `${passportNumber.slice(0, 2)}***${passportNumber.slice(-2)}`
    : passportNumber;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 lg:p-6 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      {/* ------------------------------------------------------------------ */}
      {/* EXIT CONFIRMATION MODAL OVERLAY */}
      {/* ------------------------------------------------------------------ */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-amber-600">
              <AlertTriangle className="size-6 shrink-0" />
              <h4 className="font-extrabold text-slate-900 text-sm">Discard Application Progress?</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              You have entered information in this application intake session. Closing now will discard your progress.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExitConfirm(false)}
                className="text-xs font-bold"
              >
                Keep Editing
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmExit}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                Discard &amp; Exit
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MAIN WIZARD MODAL CONTAINER */}
      {/* ------------------------------------------------------------------ */}
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col my-auto mx-auto rounded-2xl border border-slate-200/90 bg-white shadow-2xl overflow-hidden font-sans">
        
        {/* WIZARD HEADER */}
        <div className="border-b border-slate-200/80 bg-slate-900 text-white p-4 sm:p-5 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-400 font-bold shrink-0">
                {isVisaService ? <Globe className="size-5" /> : isBusinessService ? <Building2 className="size-5" /> : <Sparkles className="size-5" />}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 block truncate">
                  Application Intake Wizard &bull; {service.category?.name || "Statutory Services"}
                </span>
                <h3 className="text-sm sm:text-base font-extrabold text-white truncate">
                  {service.name}
                </h3>
              </div>
            </div>

            <button
              onClick={handleCloseAttempt}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
              aria-label="Close modal"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* STEP INDICATOR HEADER */}
          {!createdAppNumber && (
            <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
              {/* Desktop Stepper Labels */}
              <div className="hidden sm:grid grid-cols-5 gap-1 text-[11px] font-bold text-center">
                <div className={`py-1 rounded-md transition-colors ${step === 1 ? "bg-amber-500 text-slate-950 font-black shadow-xs" : step > 1 ? "text-amber-400" : "text-slate-500"}`}>
                  1. Overview
                </div>
                <div className={`py-1 rounded-md transition-colors ${step === 2 ? "bg-amber-500 text-slate-950 font-black shadow-xs" : step > 2 ? "text-amber-400" : "text-slate-500"}`}>
                  2. Applicant
                </div>
                <div className={`py-1 rounded-md transition-colors ${step === 3 ? "bg-amber-500 text-slate-950 font-black shadow-xs" : step > 3 ? "text-amber-400" : "text-slate-500"}`}>
                  3. Details
                </div>
                <div className={`py-1 rounded-md transition-colors ${step === 4 ? "bg-amber-500 text-slate-950 font-black shadow-xs" : step > 4 ? "text-amber-400" : "text-slate-500"}`}>
                  4. Requirements
                </div>
                <div className={`py-1 rounded-md transition-colors ${step === 5 ? "bg-amber-500 text-slate-950 font-black shadow-xs" : "text-slate-500"}`}>
                  5. Review
                </div>
              </div>

              {/* Mobile Stepper Text & Progress Bar */}
              <div className="flex sm:hidden items-center justify-between text-xs font-bold text-slate-300">
                <span>
                  Step {step} of 5: {step === 1 ? "Service Overview" : step === 2 ? "Applicant Details" : step === 3 ? "Application Information" : step === 4 ? "Requirements Preview" : "Review & Submit"}
                </span>
                <span className="font-mono text-amber-400">{Math.round((step / 5) * 100)}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-300 rounded-full"
                  style={{ width: `${(step / 5) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* MODAL BODY (SCROLLABLE CONTENT AREA) */}
        {/* ------------------------------------------------------------------ */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1 text-slate-800">

          {/* SUCCESS SCREEN STATE */}
          {createdAppNumber ? (
            <div className="py-6 text-center space-y-5 animate-in zoom-in-95">
              <div className="size-16 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="size-10" />
              </div>

              <div className="space-y-1 max-w-md mx-auto">
                <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Application Created Successfully
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 pt-2">
                  Application Number
                </h3>
                <div className="font-mono text-2xl font-black text-slate-900 bg-slate-100 py-2 px-4 rounded-xl border border-slate-200 inline-block tracking-wider">
                  #{createdAppNumber}
                </div>
              </div>

              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                Your application dossier for <strong className="text-slate-900">{service.name}</strong> has been registered in the database.
                Next Step: Upload your required statutory documents so our compliance officers can begin processing your file.
              </p>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  onClick={() => {
                    onClose();
                    router.push(`/client/applications/${createdAppId}`);
                  }}
                  className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md flex items-center justify-center gap-2"
                >
                  <FileText className="size-4" />
                  <span>View My Application Dossier</span>
                </Button>
                <Button
                  onClick={() => {
                    onClose();
                    router.push(`/client/applications/${createdAppId}`);
                  }}
                  className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-md flex items-center justify-center gap-2"
                >
                  <Upload className="size-4" />
                  <span>Upload Requirements Now</span>
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* ------------------------------------------------------------ */}
              {/* STEP 1: SERVICE OVERVIEW & CONFIRMATION */}
              {/* ------------------------------------------------------------ */}
              {step === 1 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="rounded-xl border border-amber-300/80 bg-amber-50/50 p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3 border-b border-amber-200/80 pb-3">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-1">
                          {isVisaService ? <Plane className="size-3.5" /> : <Building2 className="size-3.5" />}
                          {service.category?.name || "Swift Doc Filing"}
                        </span>
                        <h4 className="text-base font-extrabold text-slate-900 mt-0.5">
                          {service.name}
                        </h4>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[9px] uppercase font-bold text-slate-500 block">Total Cost</span>
                        <span className="font-mono text-base font-black text-slate-900">
                          {formatKES(totalFee)}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {service.description || "Official preparation, statutory review, government filing, and progress tracking."}
                    </p>

                    {/* Financial & Processing Metrics */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs bg-white p-3 rounded-lg border border-amber-200/60 shadow-2xs">
                      <div>
                        <span className="text-[9px] uppercase font-extrabold text-slate-400 block">Government Fee</span>
                        <span className="font-mono font-bold text-slate-800">{formatKES(govFee)}</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-extrabold text-slate-400 block">Swift Doc Processing Fee</span>
                        <span className="font-mono font-bold text-slate-800">{formatKES(svcFee)}</span>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <span className="text-[9px] uppercase font-extrabold text-slate-400 block">Requirements</span>
                        <span className="font-bold text-slate-800">{activeRequirements.length} Documents</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600 pt-1">
                      <span className="flex items-center gap-1.5">
                        <Clock className="size-3.5 text-amber-600" />
                        Est. Processing: {service.slaHours ? `${service.slaHours} Hours` : service.estimatedTurnaroundDays ? `${service.estimatedTurnaroundDays} Business Days` : "3-5 Business Days"}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="size-3.5 text-emerald-600" />
                        Authority: {service.defaultGovernmentAgency || "Official Processing Registry"}
                      </span>
                    </div>
                  </div>

                  {/* Mandatory Regulatory Disclaimer */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 flex items-start gap-2.5 text-xs text-slate-600">
                    <HelpCircle className="size-4 text-slate-400 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      <strong>Important Notice:</strong> Government fees and external authority requirements may change depending on official regulations and specific applicant circumstances. Swift Doc ensures complete fee transparency before final submission.
                    </p>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------ */}
              {/* STEP 2: APPLICANT DETAILS */}
              {/* ------------------------------------------------------------ */}
              {step === 2 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="size-4 text-amber-600" />
                      <span>Applicant Legal Identity &amp; Profile</span>
                    </h4>

                    {/* Client Type Toggle */}
                    <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setClientType("INDIVIDUAL")}
                        className={`px-2.5 py-1 rounded-md transition-all ${clientType === "INDIVIDUAL" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500"}`}
                      >
                        Individual
                      </button>
                      <button
                        type="button"
                        onClick={() => setClientType("BUSINESS")}
                        className={`px-2.5 py-1 rounded-md transition-all ${clientType === "BUSINESS" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500"}`}
                      >
                        Corporate
                      </button>
                    </div>
                  </div>

                  {clientType === "INDIVIDUAL" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                      <div className="sm:col-span-2">
                        <label className="block font-bold text-slate-700 mb-1">Full Legal Name *</label>
                        <Input
                          value={applicantFullName}
                          onChange={(e) => setApplicantFullName(e.target.value)}
                          placeholder="e.g. John Mwangi Kamau"
                          className={fieldErrors.applicantFullName ? "border-rose-500" : ""}
                        />
                        {fieldErrors.applicantFullName && <span className="text-[10px] text-rose-600 font-bold mt-0.5 block">{fieldErrors.applicantFullName}</span>}
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                        <Input
                          type="email"
                          value={applicantEmail}
                          onChange={(e) => setApplicantEmail(e.target.value)}
                          placeholder="john@example.com"
                          className={fieldErrors.applicantEmail ? "border-rose-500" : ""}
                        />
                        {fieldErrors.applicantEmail && <span className="text-[10px] text-rose-600 font-bold mt-0.5 block">{fieldErrors.applicantEmail}</span>}
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Phone Number *</label>
                        <Input
                          value={applicantPhone}
                          onChange={(e) => setApplicantPhone(e.target.value)}
                          placeholder="+254 7XX XXX XXX"
                          className={fieldErrors.applicantPhone ? "border-rose-500" : ""}
                        />
                        {fieldErrors.applicantPhone && <span className="text-[10px] text-rose-600 font-bold mt-0.5 block">{fieldErrors.applicantPhone}</span>}
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Nationality</label>
                        <Input
                          value={applicantNationality}
                          onChange={(e) => setApplicantNationality(e.target.value)}
                          placeholder="Kenyan"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">National ID or Passport No.</label>
                        <Input
                          value={applicantIdOrPassport}
                          onChange={(e) => setApplicantIdOrPassport(e.target.value)}
                          placeholder="e.g. 12345678 or A1234567"
                          className="font-mono uppercase"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block font-bold text-slate-700 mb-1">Residential Address / City</label>
                        <Input
                          value={applicantAddress}
                          onChange={(e) => setApplicantAddress(e.target.value)}
                          placeholder="Kilimani, Nairobi, Kenya"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                      <div className="sm:col-span-2">
                        <label className="block font-bold text-slate-700 mb-1">Company / Entity Name *</label>
                        <Input
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="e.g. Acme East Africa Limited"
                          className={fieldErrors.companyName ? "border-rose-500" : ""}
                        />
                        {fieldErrors.companyName && <span className="text-[10px] text-rose-600 font-bold mt-0.5 block">{fieldErrors.companyName}</span>}
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Registration Number</label>
                        <Input
                          value={companyRegNumber}
                          onChange={(e) => setCompanyRegNumber(e.target.value)}
                          placeholder="CPR/2024/XXXXX"
                          className="font-mono"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">KRA PIN</label>
                        <Input
                          value={companyKraPin}
                          onChange={(e) => setCompanyKraPin(e.target.value)}
                          placeholder="P051234567Z"
                          className="font-mono uppercase"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Contact Person / Director</label>
                        <Input
                          value={contactPerson}
                          onChange={(e) => setContactPerson(e.target.value)}
                          placeholder="John Kamau (Managing Director)"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Official Contact Email *</label>
                        <Input
                          type="email"
                          value={applicantEmail}
                          onChange={(e) => setApplicantEmail(e.target.value)}
                          placeholder="contact@company.co.ke"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ------------------------------------------------------------ */}
              {/* STEP 3: SERVICE-SPECIFIC APPLICATION DETAILS */}
              {/* ------------------------------------------------------------ */}
              {step === 3 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      {isVisaService ? <Globe className="size-4 text-amber-600" /> : <FileText className="size-4 text-amber-600" />}
                      <span>{isVisaService ? "Visa & Consular Travel Details" : isBusinessService ? "Business Incorporation Details" : isKraService ? "Tax & KRA Obligation Details" : "Specific Application Information"}</span>
                    </h4>
                  </div>

                  {/* VISA SERVICE INTAKE FORM */}
                  {isVisaService && (
                    <div className="space-y-3 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="modal-dest-country" className="block font-bold text-slate-700 mb-1">Destination Country *</label>
                          <Input
                            id="modal-dest-country"
                            value={destinationCountry}
                            onChange={(e) => setDestinationCountry(e.target.value)}
                            placeholder="e.g. United Kingdom, USA, Canada"
                            className={fieldErrors.destinationCountry ? "border-rose-500" : ""}
                          />
                          {fieldErrors.destinationCountry && <span className="text-[10px] text-rose-600 font-bold mt-0.5 block">{fieldErrors.destinationCountry}</span>}
                        </div>

                        <div>
                          <label htmlFor="modal-visa-category" className="block font-bold text-slate-700 mb-1">Visa Category *</label>
                          <select
                            id="modal-visa-category"
                            value={visaCategory}
                            onChange={(e) => setVisaCategory(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                          >
                            <option value="Visitor / Tourist">Visitor / Tourist</option>
                            <option value="Business & Investment">Business &amp; Investment</option>
                            <option value="Student & Education">Student &amp; Education</option>
                            <option value="Work & Employment">Work &amp; Employment</option>
                            <option value="Transit / Courtesy">Transit / Courtesy</option>
                            <option value="Family & Settlement">Family &amp; Settlement</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="modal-passport-num" className="block font-bold text-slate-700 mb-1">Passport Number *</label>
                          <Input
                            id="modal-passport-num"
                            value={passportNumber}
                            onChange={(e) => setPassportNumber(e.target.value)}
                            placeholder="e.g. A12345678"
                            className={`font-mono uppercase ${fieldErrors.passportNumber ? "border-rose-500" : ""}`}
                          />
                          {fieldErrors.passportNumber && <span className="text-[10px] text-rose-600 font-bold mt-0.5 block">{fieldErrors.passportNumber}</span>}
                        </div>

                        <div>
                          <label htmlFor="modal-passport-exp" className="block font-bold text-slate-700 mb-1">Passport Expiry Date *</label>
                          <Input
                            id="modal-passport-exp"
                            type="date"
                            value={passportExpiry}
                            onChange={(e) => setPassportExpiry(e.target.value)}
                            className={fieldErrors.passportExpiry ? "border-rose-500" : ""}
                          />
                          {fieldErrors.passportExpiry && <span className="text-[10px] text-rose-600 font-bold mt-0.5 block">{fieldErrors.passportExpiry}</span>}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="modal-travel-start" className="block font-bold text-slate-700 mb-1">Intended Travel Start Date</label>
                          <Input
                            id="modal-travel-start"
                            type="date"
                            value={travelStartDate}
                            onChange={(e) => setTravelStartDate(e.target.value)}
                          />
                        </div>

                        <div>
                          <label htmlFor="modal-travel-end" className="block font-bold text-slate-700 mb-1">Intended Return Date</label>
                          <Input
                            id="modal-travel-end"
                            type="date"
                            value={travelEndDate}
                            onChange={(e) => setTravelEndDate(e.target.value)}
                            className={fieldErrors.travelEndDate ? "border-rose-500" : ""}
                          />
                          {fieldErrors.travelEndDate && <span className="text-[10px] text-rose-600 font-bold mt-0.5 block">{fieldErrors.travelEndDate}</span>}
                        </div>
                      </div>

                      <div>
                        <label htmlFor="modal-travel-purpose" className="block font-bold text-slate-700 mb-1">Purpose of Travel &amp; Consular Notes</label>
                        <textarea
                          id="modal-travel-purpose"
                          value={purposeOfTravel}
                          onChange={(e) => setPurposeOfTravel(e.target.value)}
                          placeholder="State your travel goals, previous visa history, or embassy processing preferences..."
                          rows={3}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* BUSINESS REGISTRATION INTAKE FORM */}
                  {isBusinessService && (
                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Primary Proposed Business Name *</label>
                        <Input
                          value={proposedName1}
                          onChange={(e) => setProposedName1(e.target.value)}
                          placeholder="Choice 1 (e.g. Apex Global Solutions Limited)"
                          className={fieldErrors.proposedName1 ? "border-rose-500" : ""}
                        />
                        {fieldErrors.proposedName1 && <span className="text-[10px] text-rose-600 font-bold mt-0.5 block">{fieldErrors.proposedName1}</span>}
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Alternative Proposed Business Name (Choice 2)</label>
                        <Input
                          value={proposedName2}
                          onChange={(e) => setProposedName2(e.target.value)}
                          placeholder="Choice 2 (Optional backup name)"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Business Type *</label>
                          <select
                            value={businessType}
                            onChange={(e) => setBusinessType(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                          >
                            <option value="Private Limited Company (Ltd)">Private Limited Company (Ltd)</option>
                            <option value="Business Name / Sole Proprietorship">Business Name / Sole Proprietorship</option>
                            <option value="Partnership">Partnership</option>
                            <option value="Foreign Branch Office">Foreign Branch Office</option>
                          </select>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">County of Registration</label>
                          <Input
                            value={businessCounty}
                            onChange={(e) => setBusinessCounty(e.target.value)}
                            placeholder="Nairobi, Mombasa, Kisumu..."
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Nature of Business / Industry Activity *</label>
                        <textarea
                          value={businessActivity}
                          onChange={(e) => setBusinessActivity(e.target.value)}
                          placeholder="Describe the main business activity (e.g. ICT consultancy, general trade, import/export)..."
                          rows={2}
                          className={`w-full bg-white border rounded-lg p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 ${fieldErrors.businessActivity ? "border-rose-500" : "border-slate-200"}`}
                        />
                        {fieldErrors.businessActivity && <span className="text-[10px] text-rose-600 font-bold mt-0.5 block">{fieldErrors.businessActivity}</span>}
                      </div>
                    </div>
                  )}

                  {/* KRA / TAX INTAKE FORM */}
                  {isKraService && (
                    <div className="space-y-3 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">KRA PIN Number *</label>
                          <Input
                            value={kraPinNumber}
                            onChange={(e) => setKraPinNumber(e.target.value)}
                            placeholder="P051234567Z"
                            className={`font-mono uppercase ${fieldErrors.kraPinNumber ? "border-rose-500" : ""}`}
                          />
                          {fieldErrors.kraPinNumber && <span className="text-[10px] text-rose-600 font-bold mt-0.5 block">{fieldErrors.kraPinNumber}</span>}
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Tax Obligation Type *</label>
                          <select
                            value={taxObligation}
                            onChange={(e) => setTaxObligation(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                          >
                            <option value="Income Tax Individual (IT1)">Income Tax Individual (IT1)</option>
                            <option value="Income Tax Company (IT2C)">Income Tax Company (IT2C)</option>
                            <option value="Value Added Tax (VAT)">Value Added Tax (VAT)</option>
                            <option value="Pay As You Earn (PAYE)">Pay As You Earn (PAYE)</option>
                            <option value="Turnover Tax (TOT)">Turnover Tax (TOT)</option>
                            <option value="Monthly Rental Income (MRI)">Monthly Rental Income (MRI)</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Filing Period / Tax Year</label>
                          <Input
                            value={taxPeriod}
                            onChange={(e) => setTaxPeriod(e.target.value)}
                            placeholder="e.g. 2025 Annual Return or Q3 2026"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Notice / Assessment Ref (Optional)</label>
                          <Input
                            value={noticeReference}
                            onChange={(e) => setNoticeReference(e.target.value)}
                            placeholder="KRA Notice Ref if applicable"
                            className="font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* GENERIC / STATUTORY INTAKE FORM */}
                  {!isVisaService && !isBusinessService && !isKraService && (
                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Filing Notes &amp; Specific Instructions</label>
                        <textarea
                          value={generalNotes}
                          onChange={(e) => setGeneralNotes(e.target.value)}
                          placeholder="Provide any specific instructions, registration numbers, or reference details for our officers..."
                          rows={4}
                          className="w-full bg-white border border-slate-200 rounded-lg p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ------------------------------------------------------------ */}
              {/* STEP 4: REQUIREMENTS PREVIEW */}
              {/* ------------------------------------------------------------ */}
              {step === 4 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="size-4 text-amber-600" />
                      <span>Document Requirements Preview ({activeRequirements.length})</span>
                    </h4>
                  </div>

                  <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-3.5 text-xs text-slate-700 space-y-1">
                    <div className="flex items-center gap-2 font-extrabold text-amber-900">
                      <HelpCircle className="size-4 text-amber-600" />
                      <span>Requirement Snapshot Preview</span>
                    </div>
                    <p className="leading-relaxed">
                      Below are the statutory document requirements that will be assigned to your application dossier upon submission.
                      <strong> You do not need to upload files right now</strong> — you will upload them from your dedicated Application Dossier page after creation.
                    </p>
                  </div>

                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {activeRequirements.map((req, idx) => (
                      <div
                        key={req.id || idx}
                        className="rounded-xl border border-slate-200 bg-white p-3 space-y-1 hover:border-amber-300 transition-colors shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                            <span className="size-5 rounded-full bg-slate-100 text-slate-700 font-mono text-[10px] flex items-center justify-center font-bold">
                              {idx + 1}
                            </span>
                            {req.name}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${req.required ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-slate-100 text-slate-600"}`}>
                            {req.required ? "Mandatory" : "Optional"}
                          </span>
                        </div>
                        {req.description && (
                          <p className="text-[11px] text-slate-500 pl-6 leading-relaxed">
                            {req.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------ */}
              {/* STEP 5: REVIEW & SUBMIT */}
              {/* ------------------------------------------------------------ */}
              {step === 5 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Receipt className="size-4 text-amber-600" />
                      <span>Review Application Summary &amp; Submit</span>
                    </h4>
                  </div>

                  {/* Summary Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* Service & Pricing Card */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Service Details</span>
                      <div className="font-bold text-slate-900 text-sm">{service.name}</div>
                      <div className="text-slate-500">{service.category?.name}</div>
                      <div className="pt-2 border-t border-slate-200/80 space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Government Fee</span>
                          <span className="font-mono font-semibold text-slate-800">{formatKES(govFee)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Swift Doc Fee</span>
                          <span className="font-mono font-semibold text-slate-800">{formatKES(svcFee)}</span>
                        </div>
                        <div className="flex justify-between font-bold pt-1 border-t border-slate-200 text-slate-900">
                          <span>Total Amount</span>
                          <span className="font-mono">{formatKES(totalFee)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Applicant Identity Card */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Applicant Details</span>
                      <div className="font-bold text-slate-900">
                        {clientType === "BUSINESS" ? companyName : applicantFullName}
                      </div>
                      <div className="text-slate-600">{applicantEmail}</div>
                      <div className="text-slate-600">{applicantPhone}</div>
                      {clientType === "INDIVIDUAL" && applicantIdOrPassport && (
                        <div className="text-slate-500 font-mono text-[11px]">ID/Passport: {applicantIdOrPassport}</div>
                      )}
                    </div>
                  </div>

                  {/* Application Data Summary */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs space-y-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Application Intake Data</span>
                    {isVisaService ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-400 font-bold block">Destination</span>
                          <span className="font-bold text-slate-900">{destinationCountry}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold block">Visa Category</span>
                          <span className="font-bold text-slate-900">{visaCategory}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold block">Passport No.</span>
                          <span className="font-mono font-bold text-slate-900">{maskedPassportNumber}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold block">Passport Expiry</span>
                          <span className="font-mono text-slate-800">{passportExpiry || "N/A"}</span>
                        </div>
                      </div>
                    ) : isBusinessService ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-400 font-bold block">Proposed Name</span>
                          <span className="font-bold text-slate-900">{proposedName1}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold block">Business Type</span>
                          <span className="font-bold text-slate-900">{businessType}</span>
                        </div>
                      </div>
                    ) : isKraService ? (
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-400 font-bold block">KRA PIN</span>
                          <span className="font-mono font-bold text-slate-900">{kraPinNumber}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold block">Tax Obligation</span>
                          <span className="font-bold text-slate-900">{taxObligation}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-600 leading-relaxed">
                        {generalNotes || "Standard statutory prep & compliance request."}
                      </p>
                    )}
                  </div>

                  {/* Requirements Summary Badge */}
                  <div className="rounded-xl border border-slate-200 p-3 bg-white text-xs flex items-center justify-between">
                    <span className="text-slate-600 font-medium">Requirements to be requested:</span>
                    <span className="font-bold text-slate-900 font-mono bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                      {activeRequirements.length} Document Snapshots
                    </span>
                  </div>

                  {/* Legal Declaration Checkbox */}
                  <div
                    onClick={() => setDeclarationAccepted(!declarationAccepted)}
                    className={`rounded-xl border p-3.5 cursor-pointer transition-all flex items-start gap-3 text-xs select-none ${declarationAccepted ? "border-amber-500 bg-amber-50/60 text-slate-900" : "border-slate-300 bg-white hover:bg-slate-50 text-slate-700"}`}
                  >
                    <button
                      type="button"
                      className="mt-0.5 text-amber-600 shrink-0"
                    >
                      {declarationAccepted ? <CheckSquare className="size-5" /> : <Square className="size-5" />}
                    </button>
                    <p className="leading-relaxed font-semibold">
                      I confirm that the information provided is accurate and I understand that incorrect or incomplete information may delay the processing of my application.
                    </p>
                  </div>
                </div>
              )}

              {/* Error Banner */}
              {errorMessage && (
                <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800 animate-in fade-in">
                  <AlertCircle className="size-4 shrink-0 mt-0.5 text-rose-600" />
                  <span className="leading-relaxed font-medium">{errorMessage}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* WIZARD FOOTER (STICKY BOTTOM NAVIGATION CONTROLS) */}
        {/* ------------------------------------------------------------------ */}
        {!createdAppNumber && (
          <div className="border-t border-slate-200/80 p-3.5 sm:p-4 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
            {step > 1 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevStep}
                disabled={createMutation.isPending}
                className="text-xs font-bold gap-1.5"
              >
                <ArrowLeft className="size-3.5" />
                <span>Back</span>
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCloseAttempt}
                disabled={createMutation.isPending}
                className="text-xs font-bold"
              >
                Cancel
              </Button>
            )}

            {step < 5 ? (
              <Button
                size="sm"
                onClick={handleNextStep}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs gap-1.5 px-5 shadow-xs"
              >
                <span>Continue</span>
                <ArrowRight className="size-3.5" />
              </Button>
            ) : (
              <Button
                size="sm"
                disabled={!declarationAccepted || createMutation.isPending}
                onClick={() => createMutation.mutate()}
                isLoading={createMutation.isPending}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold text-xs px-6 gap-2 shadow-md disabled:opacity-50"
              >
                <span>Create Application</span>
                <ArrowRight className="size-3.5" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
