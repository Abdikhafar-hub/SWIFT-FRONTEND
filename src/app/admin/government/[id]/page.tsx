"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Calendar,
  ExternalLink,
  ShieldCheck,
  DollarSign,
  UserCheck,
  RefreshCw,
  Plus,
  Lock,
  MessageSquare,
  History,
  Download,
  AlertCircle,
} from "lucide-react";
import { governmentApi } from "@/lib/api/government";
import { notify } from "@/lib/notify";
import { formatDate } from "@/lib/utils/format";
import type { GovernmentStatus } from "@/types/government";

// Modals
import { AdminGovernmentQueryModal } from "../components/AdminGovernmentQueryModal";
import { AdminGovernmentPaymentModal } from "../components/AdminGovernmentPaymentModal";
import { AdminGovernmentAppointmentModal } from "../components/AdminGovernmentAppointmentModal";
import { AdminGovernmentFollowUpModal } from "../components/AdminGovernmentFollowUpModal";
import { AdminGovernmentExternalUpdateModal } from "../components/AdminGovernmentExternalUpdateModal";
import { AdminGovernmentEvidenceModal } from "../components/AdminGovernmentEvidenceModal";
import { AdminGovernmentAssignModal } from "../components/AdminGovernmentAssignModal";

export default function AdminGovernmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<
    "TIMELINE" | "QUERIES" | "PAYMENTS" | "APPOINTMENTS" | "EVIDENCE" | "FOLLOWUPS" | "READINESS"
  >("TIMELINE");

  // Modal Control
  const [modalType, setModalType] = useState<
    "QUERY" | "PAYMENT" | "APPOINTMENT" | "FOLLOWUP" | "EXTERNAL_UPDATE" | "EVIDENCE" | "ASSIGN" | null
  >(null);

  // Fetch 360 Dossier
  const {
    data: dossierData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-government-dossier", id],
    queryFn: () => governmentApi.getSubmissionDossier(id),
    enabled: Boolean(id),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-8 flex items-center justify-center text-slate-600 font-medium">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-6 w-6 animate-spin text-amber-600" />
          <span>Loading 360° Government Dossier...</span>
        </div>
      </div>
    );
  }

  if (error || !dossierData) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-8 text-slate-800 space-y-4 max-w-4xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-xs font-bold text-amber-700 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Registry Queue
        </button>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-800">
          <h3 className="font-bold text-base">Failed to Load Dossier</h3>
          <p className="text-xs">{(error as any)?.message || "Government record not found."}</p>
        </div>
      </div>
    );
  }

  const { govApp, readinessReport } = dossierData;

  const getStatusBadge = (status: GovernmentStatus) => {
    switch (status) {
      case "SUBMITTED":
      case "ACKNOWLEDGED":
        return "bg-sky-50 text-sky-700 border-sky-200";
      case "UNDER_PROCESSING":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "QUERY_RAISED":
      case "ADDITIONAL_INFORMATION_REQUIRED":
      case "CORRECTION_REQUIRED":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "PAYMENT_REQUIRED":
      case "PAYMENT_PENDING":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "APPOINTMENT_REQUIRED":
      case "BIOMETRICS_REQUIRED":
      case "INTERVIEW_REQUIRED":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "APPROVED":
      case "CERTIFICATE_READY":
      case "READY_FOR_COLLECTION":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "COLLECTED":
      case "CLOSED":
        return "bg-slate-100 text-slate-700 border-slate-200";
      case "REJECTED":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-4 sm:p-5 lg:p-6 space-y-4 max-w-[1550px] mx-auto font-sans">
      {/* Back Button */}
      <div>
        <Link
          href="/admin/government"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
        >
          <ArrowLeft className="h-4 w-4 text-amber-600" /> Return to Government Registry Operations
        </Link>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 1. DOSSIER HEADER CARD */}
      {/* ------------------------------------------------------------------ */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-6 space-y-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200/60 pb-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200/80 shrink-0">
              <Building2 className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs font-mono font-bold text-amber-700 uppercase tracking-wider">
                  {govApp.platform}
                </span>
                <span className="rounded bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                  {govApp.submissionChannel}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-0.5 text-xs font-bold ${getStatusBadge(
                    govApp.status
                  )}`}
                >
                  {govApp.status}
                </span>
                {govApp.isSlaPaused && (
                  <span className="rounded bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-700 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> SLA Paused
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1 tracking-tight">
                Ref: {govApp.externalReference}
              </h1>

              <div className="flex items-center gap-4 text-xs text-slate-500 mt-1 flex-wrap font-medium">
                <span>Agency: <strong className="text-slate-800">{govApp.governmentAgency}</strong></span>
                <span>• Service: <strong className="text-slate-800">{govApp.governmentService || govApp.application?.service?.name}</strong></span>
                <span>• Host App: <strong className="text-amber-700 font-mono">{govApp.application?.applicationNumber}</strong></span>
                <span>• Client: <strong className="text-slate-800">{govApp.application?.client?.fullName}</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setModalType("EXTERNAL_UPDATE")}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#C5A059] to-[#D4AF37] hover:from-[#b49049] hover:to-[#c39e26] px-3.5 py-2 text-xs font-bold text-white transition-all shadow-xs"
            >
              <RefreshCw className="h-4 w-4" /> External Update
            </button>

            <button
              onClick={() => setModalType("QUERY")}
              className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-800 hover:bg-rose-100/80 transition-colors"
            >
              <AlertTriangle className="h-4 w-4 text-rose-600" /> Query
            </button>

            <button
              onClick={() => setModalType("PAYMENT")}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100/80 transition-colors"
            >
              <DollarSign className="h-4 w-4 text-emerald-600" /> Fee Payment
            </button>

            <button
              onClick={() => setModalType("APPOINTMENT")}
              className="flex items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-2 text-xs font-bold text-sky-800 hover:bg-sky-100/80 transition-colors"
            >
              <Calendar className="h-4 w-4 text-sky-600" /> Appointment
            </button>

            <button
              onClick={() => setModalType("FOLLOWUP")}
              className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-bold text-indigo-800 hover:bg-indigo-100/80 transition-colors"
            >
              <Clock className="h-4 w-4 text-indigo-600" /> Follow-up
            </button>

            <button
              onClick={() => setModalType("EVIDENCE")}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <FileText className="h-4 w-4 text-slate-500" /> Attach Document
            </button>
          </div>
        </div>

        {/* 2. STATS GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <span className="text-slate-500 block mb-1 font-medium">Submission Date</span>
            <p className="font-bold text-slate-900">{govApp.submittedAt ? formatDate(govApp.submittedAt) : "N/A"}</p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <span className="text-slate-500 block mb-1 font-medium">Target Response Date</span>
            <p className="font-bold text-amber-800">{govApp.expectedResponseDate ? formatDate(govApp.expectedResponseDate) : "N/A"}</p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <span className="text-slate-500 block mb-1 font-medium">Next Follow-up Chaser</span>
            <p className="font-bold text-sky-700">{govApp.nextFollowUpDate ? formatDate(govApp.nextFollowUpDate) : "N/A"}</p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <span className="text-slate-500 block mb-1 font-medium">Statutory Fee</span>
            <p className="font-bold text-emerald-700 font-mono">
              KES {govApp.statutoryFeeAmount.toLocaleString()} ({govApp.statutoryPaymentStatus})
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <span className="text-slate-500 block mb-1 font-medium">Desk Officer</span>
            <p className="font-bold text-slate-900">
              {govApp.primaryOfficer ? `${govApp.primaryOfficer.firstName} ${govApp.primaryOfficer.lastName}` : "Unassigned"}
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <span className="text-slate-500 block mb-1 font-medium">Readiness Score</span>
            <p className={`font-bold ${readinessReport?.ready ? "text-emerald-700" : "text-rose-700"}`}>
              {readinessReport?.score ?? 0}% ({readinessReport?.ready ? "Verified" : "Blockers Found"})
            </p>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. TABBED DOSSIER PANELS */}
      {/* ------------------------------------------------------------------ */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200/60 pb-2 text-xs font-bold">
          {[
            { id: "TIMELINE", label: `Status History & Audit (${govApp.statusHistory?.length || 0})` },
            { id: "QUERIES", label: `Queries & Deficiencies (${govApp.queries?.length || 0})` },
            { id: "PAYMENTS", label: `Statutory Payments (${govApp.payments?.length || 0})` },
            { id: "APPOINTMENTS", label: `Appointments (${govApp.appointments?.length || 0})` },
            { id: "EVIDENCE", label: `Evidence Vault (${govApp.evidenceDocs?.length || 0})` },
            { id: "FOLLOWUPS", label: `Follow-up Logs (${govApp.followUps?.length || 0})` },
            { id: "READINESS", label: `Readiness Audit` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`rounded-xl px-4 py-2 transition-all ${
                activeTab === tab.id
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: TIMELINE & AUDIT HISTORY */}
        {activeTab === "TIMELINE" && (
          <div className="rounded-xl border border-slate-200/80 bg-white p-6 space-y-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <History className="h-4 w-4 text-amber-600" /> Chronological Government Lifecycle Trail
            </h3>

            <div className="relative border-l-2 border-slate-200 pl-6 space-y-6 ml-2 text-xs">
              {govApp.statusHistory?.map((item, idx) => (
                <div key={item.id} className="relative group">
                  <div className="absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-amber-500" />

                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-1.5">
                    <div className="flex items-center justify-between text-slate-500">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">
                          {item.fromStatus ? `${item.fromStatus} → ${item.toStatus}` : item.toStatus}
                        </span>
                        <span className="rounded bg-slate-200 px-2 py-0.5 text-[9px] font-bold uppercase text-slate-700">
                          Source: {item.source}
                        </span>
                      </div>
                      <span>{formatDate(item.createdAt)}</span>
                    </div>

                    {item.statusDescription && (
                      <p className="text-slate-800 font-medium">{item.statusDescription}</p>
                    )}

                    {item.notes && <p className="text-slate-500 text-[11px] italic">"{item.notes}"</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: QUERIES & DEFICIENCIES */}
        {activeTab === "QUERIES" && (
          <div className="rounded-xl border border-slate-200/80 bg-white p-6 space-y-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-600" /> Official Government Queries
              </h3>
              <button
                onClick={() => setModalType("QUERY")}
                className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 transition-colors"
              >
                + Record New Query
              </button>
            </div>

            {govApp.queries?.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No government queries recorded for this submission.</p>
            ) : (
              <div className="space-y-3 text-xs">
                {govApp.queries?.map((query) => (
                  <div key={query.id} className="rounded-xl border border-rose-200 bg-rose-50/40 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-rose-800">{query.queryType}</span>
                        <span className="rounded bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                          Severity: {query.severity}
                        </span>
                        {query.isResolved ? (
                          <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                            RESOLVED
                          </span>
                        ) : (
                          <span className="rounded bg-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-900">
                            OPEN DEFICIENCY
                          </span>
                        )}
                      </div>
                      <span className="text-slate-500">Received: {formatDate(query.receivedAt)}</span>
                    </div>

                    <p className="text-slate-800 font-medium">{query.description}</p>

                    {query.clientAction && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-[11px] text-amber-900">
                        <strong>Linked Client Action:</strong> {query.clientAction.title} (Status: {query.clientAction.status})
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: STATUTORY PAYMENTS */}
        {activeTab === "PAYMENTS" && (
          <div className="rounded-xl border border-slate-200/80 bg-white p-6 space-y-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-600" /> Statutory Fee Receipts
              </h3>
              <button
                onClick={() => setModalType("PAYMENT")}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors"
              >
                + Record Payment
              </button>
            </div>

            {govApp.payments?.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No statutory fee payments recorded.</p>
            ) : (
              <div className="space-y-3 text-xs">
                {govApp.payments?.map((payment) => (
                  <div key={payment.id} className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 font-mono text-sm">
                        {payment.currency} {payment.amount.toLocaleString()}
                      </div>
                      <div className="text-slate-600 text-[11px]">
                        Method: {payment.paymentMethod} • Ref: <span className="font-mono text-amber-700 font-bold">{payment.paymentReference || "N/A"}</span>
                      </div>
                      {payment.receiptNumber && (
                        <div className="text-[10px] text-slate-500 font-mono">Receipt: {payment.receiptNumber}</div>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="rounded bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                        {payment.status}
                      </span>
                      <div className="text-[10px] text-slate-500 mt-1">{formatDate(payment.createdAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: APPOINTMENTS & BIOMETRICS */}
        {activeTab === "APPOINTMENTS" && (
          <div className="rounded-xl border border-slate-200/80 bg-white p-6 space-y-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="h-4 w-4 text-sky-600" /> Scheduled Registry Appointments
              </h3>
              <button
                onClick={() => setModalType("APPOINTMENT")}
                className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-sky-700 transition-colors"
              >
                + Schedule Appointment
              </button>
            </div>

            {govApp.appointments?.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No registry appointments scheduled.</p>
            ) : (
              <div className="space-y-3 text-xs">
                {govApp.appointments?.map((apt) => (
                  <div key={apt.id} className="rounded-xl border border-sky-200 bg-sky-50/40 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-sky-900 text-sm">{apt.appointmentType} - {apt.authorityName}</div>
                      <span className="rounded bg-sky-100 px-2 py-0.5 text-xs font-bold text-sky-800">{apt.status}</span>
                    </div>

                    <div className="text-slate-800 font-medium">
                      Date &amp; Time: {new Date(apt.scheduledAt).toLocaleString()}
                    </div>
                    {apt.location && <div className="text-slate-600">Location: {apt.location}</div>}
                    {apt.clientInstructions && (
                      <div className="text-amber-900 bg-amber-50 p-2 rounded border border-amber-200">
                        Instructions: {apt.clientInstructions}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: EVIDENCE VAULT */}
        {activeTab === "EVIDENCE" && (
          <div className="rounded-xl border border-slate-200/80 bg-white p-6 space-y-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FileText className="h-4 w-4 text-amber-600" /> Dossier Evidence Documents
              </h3>
              <button
                onClick={() => setModalType("EVIDENCE")}
                className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700 transition-colors"
              >
                + Attach Evidence
              </button>
            </div>

            {govApp.evidenceDocs?.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No evidence documents attached.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {govApp.evidenceDocs?.map((doc) => (
                  <div key={doc.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">{doc.documentName}</div>
                      <div className="text-slate-500 text-[10px]">Type: {doc.documentType} • {formatDate(doc.uploadedAt)}</div>
                    </div>

                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-100 flex items-center gap-1 transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" /> View
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: FOLLOW-UP LOGS */}
        {activeTab === "FOLLOWUPS" && (
          <div className="rounded-xl border border-slate-200/80 bg-white p-6 space-y-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Clock className="h-4 w-4 text-indigo-600" /> Registry Desk Chasing History
              </h3>
              <button
                onClick={() => setModalType("FOLLOWUP")}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition-colors"
              >
                + Log Follow-up
              </button>
            </div>

            {govApp.followUps?.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No follow-up attempts logged.</p>
            ) : (
              <div className="space-y-3 text-xs">
                {govApp.followUps?.map((fu) => (
                  <div key={fu.id} className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 space-y-1">
                    <div className="flex items-center justify-between text-indigo-800 font-bold">
                      <span>Method: {fu.method} • Officer: {fu.contactPerson || "N/A"}</span>
                      <span className="text-slate-500 text-[10px]">{formatDate(fu.attemptedAt)}</span>
                    </div>

                    <p className="text-slate-800 font-medium">{fu.outcome}</p>
                    {fu.notes && <p className="text-slate-500 text-[11px] italic">"{fu.notes}"</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 7: READINESS AUDIT */}
        {activeTab === "READINESS" && (
          <div className="rounded-xl border border-slate-200/80 bg-white p-6 space-y-4 text-xs shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" /> Statutory Prerequisite Audit Evaluation
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {readinessReport?.checklist?.map((item: any) => (
                <div
                  key={item.key}
                  className={`flex items-center justify-between rounded-lg p-3 border ${
                    item.status === "PASSED"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                      : "border-rose-200 bg-rose-50 text-rose-900"
                  }`}
                >
                  <span className="font-medium">{item.label}</span>
                  <span className="font-bold">{item.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}
      {modalType === "QUERY" && (
        <AdminGovernmentQueryModal
          isOpen={true}
          governmentApplicationId={govApp.id}
          onClose={() => setModalType(null)}
          onSuccess={() => refetch()}
        />
      )}

      {modalType === "PAYMENT" && (
        <AdminGovernmentPaymentModal
          isOpen={true}
          governmentApplicationId={govApp.id}
          onClose={() => setModalType(null)}
          onSuccess={() => refetch()}
        />
      )}

      {modalType === "APPOINTMENT" && (
        <AdminGovernmentAppointmentModal
          isOpen={true}
          governmentApplicationId={govApp.id}
          onClose={() => setModalType(null)}
          onSuccess={() => refetch()}
        />
      )}

      {modalType === "FOLLOWUP" && (
        <AdminGovernmentFollowUpModal
          isOpen={true}
          governmentApplicationId={govApp.id}
          onClose={() => setModalType(null)}
          onSuccess={() => refetch()}
        />
      )}

      {modalType === "EXTERNAL_UPDATE" && (
        <AdminGovernmentExternalUpdateModal
          isOpen={true}
          governmentApplicationId={govApp.id}
          currentStatus={govApp.status}
          onClose={() => setModalType(null)}
          onSuccess={() => refetch()}
        />
      )}

      {modalType === "EVIDENCE" && (
        <AdminGovernmentEvidenceModal
          isOpen={true}
          governmentApplicationId={govApp.id}
          onClose={() => setModalType(null)}
          onSuccess={() => refetch()}
        />
      )}

      {modalType === "ASSIGN" && (
        <AdminGovernmentAssignModal
          isOpen={true}
          governmentApplicationId={govApp.id}
          currentPrimaryOfficerId={govApp.primaryOfficerId}
          currentTeam={govApp.team}
          onClose={() => setModalType(null)}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}
