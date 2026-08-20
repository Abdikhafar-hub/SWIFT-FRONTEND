"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  FileText,
  Building2,
  CreditCard,
  MessageSquare,
  History,
  Truck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Smartphone,
  Receipt as ReceiptIcon,
} from "lucide-react";
import {
  ApplicationStatusBadge,
  PriorityBadge,
  SlaIndicator,
} from "@/components/domain/status-badges";
import { RequirementSubmissionCard } from "@/components/domain/requirement-submission-card";
import { GovernmentTrackerCard } from "@/components/domain/government-tracker-card";
import { ApplicationMessages } from "@/components/domain/application-messages";
import { ApplicationTimelineView } from "@/components/domain/application-timeline-view";
import { SlaTimelineView } from "@/components/domain/sla-timeline-view";
import { DeliveryStatusView } from "@/components/domain/delivery-status-view";
import { MpesaPaymentModal } from "@/components/domain/mpesa-payment-modal";
import { ReceiptModal } from "@/components/domain/receipt-modal";
import { applicationsApi } from "@/lib/api/applications";
import { useAuth } from "@/lib/auth/auth-context";
import { formatDate, formatKES } from "@/lib/utils/format";
import type { ApplicationStatus, Receipt } from "@/types";

type DossierTab = "requirements" | "government" | "financials" | "messages" | "timeline" | "delivery" | "sla";

export default function ClientApplicationDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const { client } = useAuth();

  const [activeTab, setActiveTab] = useState<DossierTab>("requirements");
  const [isMpesaModalOpen, setIsMpesaModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);

  // 1. Fetch complete application dossier
  const {
    data: application,
    isLoading: isAppLoading,
    error: appError,
    refetch: refetchApp,
  } = useQuery({
    queryKey: ["client-application", id],
    queryFn: () => applicationsApi.getApplicationById(id),
    enabled: Boolean(id),
  });

  // 2. Fetch live readiness evaluation report
  const { data: readiness } = useQuery({
    queryKey: ["application-readiness", id],
    queryFn: () => applicationsApi.getApplicationReadiness(id),
    enabled: Boolean(id),
  });

  // 3. Fetch activity timeline
  const { data: timelineData = [] } = useQuery({
    queryKey: ["application-timeline", id],
    queryFn: () => applicationsApi.getTimeline(id),
    enabled: Boolean(id),
  });

  // 4. Fetch delivery records
  const { data: deliveryData = [] } = useQuery({
    queryKey: ["application-delivery", id],
    queryFn: () => applicationsApi.getDelivery(id),
    enabled: Boolean(id),
  });

  // 5. Fetch government tracking records
  const { data: governmentData = [] } = useQuery({
    queryKey: ["application-government-tracking", id],
    queryFn: () => applicationsApi.getGovernmentTracking(id),
    enabled: Boolean(id),
  });

  if (isAppLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-5 lg:p-6 space-y-4 max-w-[1550px] mx-auto font-sans">
        <div className="h-10 bg-slate-100 animate-pulse rounded-xl" />
        <div className="h-40 bg-slate-100 animate-pulse rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="h-96 bg-slate-100 animate-pulse rounded-xl lg:col-span-2" />
          <div className="h-96 bg-slate-100 animate-pulse rounded-xl" />
        </div>
      </div>
    );
  }

  if (appError || !application) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-6 max-w-[1550px] mx-auto text-center font-sans space-y-4">
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-rose-800 text-xs font-semibold">
          Failed to load application dossier details.
        </div>
        <button
          onClick={() => refetchApp()}
          className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition-colors"
        >
          Retry Dossier Request
        </button>
      </div>
    );
  }

  const requirements = application.requirements || [];
  const payments = application.payments || [];
  const latestPayment = payments[0];
  const dueAmount = Number(application.dueAmount || latestPayment?.amountDue || 0);
  const paidAmount = Number(application.paidAmount || latestPayment?.amountPaid || 0);
  const isSettled = dueAmount <= 0;

  const governmentApp = governmentData[0] || (application.governmentApps ? application.governmentApps[0] : null);

  const totalReqs = requirements.length || 1;
  const satisfiedReqs =
    requirements.filter((r) => r.isSatisfied && r.status !== "REJECTED" && r.status !== "CORRECTION_REQUIRED").length;
  const progressPercent = Math.min(100, Math.round((satisfiedReqs / totalReqs) * 100));

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-4 sm:p-5 lg:p-6 space-y-4 max-w-[1550px] mx-auto font-sans">
      {/* ------------------------------------------------------------------ */}
      {/* 1. HEADER & TOP ACTIONS */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div className="flex items-center gap-3">
          <Link href="/client/applications">
            <button className="size-9 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors">
              <ArrowLeft className="size-4" />
            </button>
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              {application.service?.name || "Statutory Application"}
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Application #{application.applicationNumber} • Filed on {formatDate(application.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <ApplicationStatusBadge status={application.status as ApplicationStatus} size="md" />
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. EXECUTIVE SUMMARY BANNER */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-black text-slate-900">
                #{application.applicationNumber}
              </span>
              <PriorityBadge priority={application.priority} size="sm" />
              {application.slaStatus && <SlaIndicator status={application.slaStatus} size="sm" />}
            </div>
            <h2 className="text-base font-bold text-slate-900">
              {application.service?.name}
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              Authority: {application.service?.authority || application.service?.defaultGovernmentAgency || application.service?.category?.name || "Official Registry"} &bull; Target SLA:{" "}
              {application.service?.slaHours ? `${application.service.slaHours} Hours` : "2-4 Business Days"}
            </span>
          </div>

          {/* Settle Outstanding Invoice Quick Button */}
          {!isSettled && (
            <div className="flex items-center gap-3 rounded-xl border border-amber-300/80 bg-amber-50/60 p-3 shrink-0">
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800">
                  Outstanding Invoice Fee
                </span>
                <span className="font-mono text-sm font-black text-slate-900">
                  {formatKES(dueAmount)}
                </span>
              </div>
              <button
                onClick={() => setIsMpesaModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-2 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <Smartphone className="size-3.5" />
                <span>Pay via M-Pesa</span>
              </button>
            </div>
          )}
        </div>

        {/* Visa Context Banner if metadata contains Visa details */}
        {(() => {
          const meta = (application.metadata || {}) as Record<string, any>;
          if (!meta.destinationCountry && !meta.passportNumber && !meta.visaCategory) return null;
          const rawPassport = meta.passportNumber ? String(meta.passportNumber) : "";
          const maskedPassport = rawPassport.length > 4 ? `${rawPassport.slice(0, 3)}***${rawPassport.slice(-2)}` : rawPassport;

          return (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-3 rounded-lg border border-amber-200/80 bg-amber-50/40 text-xs">
              {meta.destinationCountry && (
                <div>
                  <span className="text-[9px] uppercase font-extrabold text-amber-800 block">Destination</span>
                  <span className="font-bold text-slate-900">{String(meta.destinationCountry)}</span>
                </div>
              )}
              {meta.visaCategory && (
                <div>
                  <span className="text-[9px] uppercase font-extrabold text-amber-800 block">Visa Type</span>
                  <span className="font-bold text-slate-900">{String(meta.visaCategory)}</span>
                </div>
              )}
              {meta.passportNumber && (
                <div>
                  <span className="text-[9px] uppercase font-extrabold text-amber-800 block">Passport No.</span>
                  <span className="font-mono font-bold text-slate-900" title={rawPassport}>{maskedPassport}</span>
                </div>
              )}
              {meta.passportExpiry && (
                <div>
                  <span className="text-[9px] uppercase font-extrabold text-amber-800 block">Passport Expiry</span>
                  <span className="font-mono font-semibold text-slate-900">{String(meta.passportExpiry)}</span>
                </div>
              )}
              {(meta.travelStartDate || meta.travelEndDate) && (
                <div>
                  <span className="text-[9px] uppercase font-extrabold text-amber-800 block">Travel Dates</span>
                  <span className="font-semibold text-slate-900">
                    {meta.travelStartDate ? String(meta.travelStartDate) : "TBD"}
                    {meta.travelEndDate ? ` - ${String(meta.travelEndDate)}` : ""}
                  </span>
                </div>
              )}
            </div>
          );
        })()}

        {/* Readiness Checklist Progress Bar */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-slate-500">REQUIREMENTS COMPLIANCE SCORE</span>
            <span className="text-slate-900 font-mono">
              {satisfiedReqs} / {totalReqs} Requirements Satisfied ({progressPercent}%)
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Dynamic Readiness Engine Alerts (Blockers / Warnings) */}
        {readiness && (
          <div className="space-y-2 pt-1">
            {readiness.blockers.length > 0 && (
              <div className="rounded-lg border border-rose-200 bg-rose-50/60 p-3 text-xs text-rose-800 space-y-1">
                <div className="flex items-center gap-2 font-bold">
                  <AlertCircle className="size-4 shrink-0 text-rose-600" />
                  <span>Statutory Submission Blockers ({readiness.blockers.length})</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] pl-1">
                  {readiness.blockers.map((b, idx) => (
                    <li key={idx}>{b}</li>
                  ))}
                </ul>
              </div>
            )}

            {readiness.ready && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 text-xs text-emerald-800 flex items-center gap-2 font-bold">
                <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                <span>All mandatory statutory requirements satisfied. Application qualified for government transmission.</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. DOSSIER TABS NAVIGATION */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200/80 pb-px text-xs">
        <button
          onClick={() => setActiveTab("requirements")}
          className={`flex items-center gap-2 border-b-2 px-3.5 py-2.5 font-bold transition-all whitespace-nowrap ${
            activeTab === "requirements"
              ? "border-amber-500 text-amber-700 bg-amber-50/40 rounded-t-lg"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <FileText className="size-3.5" />
          <span>Statutory Requirements ({requirements.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("government")}
          className={`flex items-center gap-2 border-b-2 px-3.5 py-2.5 font-bold transition-all whitespace-nowrap ${
            activeTab === "government"
              ? "border-amber-500 text-amber-700 bg-amber-50/40 rounded-t-lg"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Building2 className="size-3.5" />
          <span>Government Tracking</span>
        </button>

        <button
          onClick={() => setActiveTab("financials")}
          className={`flex items-center gap-2 border-b-2 px-3.5 py-2.5 font-bold transition-all whitespace-nowrap ${
            activeTab === "financials"
              ? "border-amber-500 text-amber-700 bg-amber-50/40 rounded-t-lg"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <CreditCard className="size-3.5" />
          <span>Financials &amp; Invoices</span>
        </button>

        <button
          onClick={() => setActiveTab("messages")}
          className={`flex items-center gap-2 border-b-2 px-3.5 py-2.5 font-bold transition-all whitespace-nowrap ${
            activeTab === "messages"
              ? "border-amber-500 text-amber-700 bg-amber-50/40 rounded-t-lg"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <MessageSquare className="size-3.5" />
          <span>Officer Messages</span>
        </button>

        <button
          onClick={() => setActiveTab("sla")}
          className={`flex items-center gap-2 border-b-2 px-3.5 py-2.5 font-bold transition-all whitespace-nowrap ${
            activeTab === "sla"
              ? "border-amber-500 text-amber-700 bg-amber-50/40 rounded-t-lg"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Clock className="size-3.5" />
          <span>SLA &amp; Performance</span>
        </button>

        <button
          onClick={() => setActiveTab("timeline")}
          className={`flex items-center gap-2 border-b-2 px-3.5 py-2.5 font-bold transition-all whitespace-nowrap ${
            activeTab === "timeline"
              ? "border-amber-500 text-amber-700 bg-amber-50/40 rounded-t-lg"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <History className="size-3.5" />
          <span>Audit Timeline</span>
        </button>

        <button
          onClick={() => setActiveTab("delivery")}
          className={`flex items-center gap-2 border-b-2 px-3.5 py-2.5 font-bold transition-all whitespace-nowrap ${
            activeTab === "delivery"
              ? "border-amber-500 text-amber-700 bg-amber-50/40 rounded-t-lg"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Truck className="size-3.5" />
          <span>Courier Delivery</span>
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 4. TAB CONTENTS */}
      {/* ------------------------------------------------------------------ */}

      {/* REQUIREMENTS TAB */}
      {activeTab === "requirements" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-4">
            {requirements.length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-400 text-xs">
                No custom statutory requirements specified for this filing.
              </div>
            ) : (
              requirements.map((req) => (
                <RequirementSubmissionCard
                  key={req.id}
                  applicationId={application.id}
                  requirement={req}
                />
              ))
            )}
          </div>

          {/* Right Summary Card */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-3 text-xs">
              <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2">
                Application Overview
              </h3>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Application Number</span>
                <span className="font-mono font-bold text-slate-900">
                  #{application.applicationNumber}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Statutory Authority</span>
                <span className="font-semibold text-slate-900">
                  {application.service?.authority || "Official Registry"}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Priority Tier</span>
                <PriorityBadge priority={application.priority} size="sm" />
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Statutory Fee</span>
                <span className="font-mono font-bold text-slate-900">
                  {formatKES(application.totalAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Settlement Status</span>
                {isSettled ? (
                  <span className="font-bold text-emerald-600">
                    Settled in Full
                  </span>
                ) : (
                  <span className="font-bold text-amber-600">
                    Due: {formatKES(dueAmount)}
                  </span>
                )}
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#0F172A] to-[#1E293B] rounded-xl p-4 text-white space-y-2 border border-slate-800">
              <h4 className="font-bold text-sm text-white">
                Direct Compliance Support
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                Need guidance regarding statutory guidelines or document certification? Reach out to your assigned officer.
              </p>
              <button
                onClick={() => setActiveTab("messages")}
                className="w-full mt-2 bg-gradient-to-r from-[#C5A059] to-[#D4AF37] text-white font-bold text-xs py-2 rounded-lg shadow-xs hover:from-[#b49049] hover:to-[#c39e26] transition-colors"
              >
                Open Communication Thread
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GOVERNMENT TRACKING TAB */}
      {activeTab === "government" && (
        <div className="space-y-4">
          {governmentApp ? (
            <GovernmentTrackerCard governmentApp={governmentApp} />
          ) : (
            <div className="bg-white rounded-xl border border-dashed border-slate-200 p-10 text-center space-y-3">
              <Building2 className="size-10 text-slate-300 mx-auto" />
              <h4 className="text-base font-bold text-slate-900">
                Awaiting Registry Transmission
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Once all mandatory documents and filing fees are verified, our compliance team packages and transmits your filing to the official registry. Real-time tracking numbers and registry status milestones will display here.
              </p>
            </div>
          )}
        </div>
      )}

      {/* FINANCIALS TAB */}
      {activeTab === "financials" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-slate-200/80 p-4 space-y-1 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Total Statutory Fee
              </span>
              <div className="font-mono text-xl font-extrabold text-slate-900">
                {formatKES(application.totalAmount)}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/80 p-4 space-y-1 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Amount Paid
              </span>
              <div className="font-mono text-xl font-extrabold text-emerald-600">
                {formatKES(paidAmount)}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/80 p-4 space-y-1 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Outstanding Balance
              </span>
              <div className="font-mono text-xl font-extrabold text-slate-900">
                {formatKES(dueAmount)}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200/80 p-4 bg-slate-50/60">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                Application Billing Ledgers
              </h4>
              {!isSettled && (
                <button
                  onClick={() => setIsMpesaModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <Smartphone className="size-3.5" />
                  <span>Settle Invoice via M-Pesa</span>
                </button>
              )}
            </div>

            {payments.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No invoices generated yet for this application.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {payments.map((pmt) => (
                  <div
                    key={pmt.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">
                          #{pmt.invoiceNumber}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                          Status: {pmt.status}
                        </span>
                      </div>
                      <div className="text-slate-500 font-medium">
                        Issued: {new Date(pmt.createdAt).toLocaleDateString()} &bull; Total:{" "}
                        <strong className="text-slate-900 font-mono">{formatKES(pmt.totalAmount)}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {pmt.receipts && pmt.receipts.length > 0 && (
                        <button
                          onClick={() => setSelectedReceipt(pmt.receipts![0])}
                          className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
                        >
                          <ReceiptIcon className="size-3.5 text-amber-600" />
                          <span>View Official Receipt</span>
                        </button>
                      )}

                      {Number(pmt.amountDue) > 0 && (
                        <button
                          onClick={() => setIsMpesaModalOpen(true)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                        >
                          <Smartphone className="size-3.5" />
                          <span>Pay Now</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MESSAGES TAB */}
      {activeTab === "messages" && (
        <ApplicationMessages applicationId={application.id} />
      )}

      {/* SLA TAB */}
      {activeTab === "sla" && (
        <SlaTimelineView
          slaStatus={application.slaStatus}
          startedAt={application.startedAt}
          dueAt={application.dueAt || application.slaDueAt}
          completedAt={application.completedAt}
          pausedAt={application.pausedAt}
          totalPausedDurationMinutes={application.totalPausedDuration}
          slaEvents={application.slaEvents}
          slaHours={application.service?.slaHours}
        />
      )}

      {/* TIMELINE TAB */}
      {activeTab === "timeline" && (
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
            Application Lifecycle &amp; Audit Trail
          </h3>
          <ApplicationTimelineView activities={timelineData} />
        </div>
      )}

      {/* DELIVERY TAB */}
      {activeTab === "delivery" && (
        <DeliveryStatusView
          deliveries={deliveryData.length > 0 ? deliveryData : application.delivery || application.deliveries || []}
          deliveredAt={application.deliveredAt}
          status={application.status}
        />
      )}

      {/* M-PESA PAYMENT MODAL */}
      {latestPayment && (
        <MpesaPaymentModal
          isOpen={isMpesaModalOpen}
          onClose={() => setIsMpesaModalOpen(false)}
          invoice={{
            id: latestPayment.id,
            invoiceNumber: latestPayment.invoiceNumber,
            totalAmount: latestPayment.totalAmount,
            amountDue: latestPayment.amountDue || application.dueAmount,
            amountPaid: latestPayment.amountPaid,
            currency: latestPayment.currency,
          }}
          clientPhone={client?.phone}
          onPaymentSuccess={() => {
            refetchApp();
          }}
        />
      )}

      {/* OFFICIAL VAT RECEIPT MODAL */}
      <ReceiptModal
        isOpen={Boolean(selectedReceipt)}
        onClose={() => setSelectedReceipt(null)}
        receipt={selectedReceipt}
      />
    </div>
  );
}
