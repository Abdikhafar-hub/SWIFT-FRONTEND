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
      <div className="min-h-screen bg-slate-950 p-8 flex items-center justify-center text-slate-400">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-6 w-6 animate-spin text-amber-400" />
          <span>Loading 360° Government Dossier...</span>
        </div>
      </div>
    );
  }

  if (error || !dossierData) {
    return (
      <div className="min-h-screen bg-slate-950 p-8 text-slate-100 space-y-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-xs text-amber-400 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Registry Queue
        </button>
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-300">
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
        return "bg-sky-500/10 text-sky-400 border-sky-500/30";
      case "UNDER_PROCESSING":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/30";
      case "QUERY_RAISED":
      case "ADDITIONAL_INFORMATION_REQUIRED":
      case "CORRECTION_REQUIRED":
        return "bg-rose-500/10 text-rose-400 border-rose-500/30";
      case "PAYMENT_REQUIRED":
      case "PAYMENT_PENDING":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "APPOINTMENT_REQUIRED":
      case "BIOMETRICS_REQUIRED":
      case "INTERVIEW_REQUIRED":
        return "bg-purple-500/10 text-purple-400 border-purple-500/30";
      case "APPROVED":
      case "CERTIFICATE_READY":
      case "READY_FOR_COLLECTION":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case "COLLECTED":
      case "CLOSED":
        return "bg-slate-800 text-slate-300 border-slate-700";
      case "REJECTED":
        return "bg-red-500/10 text-red-400 border-red-500/30";
      default:
        return "bg-slate-800 text-slate-400 border-slate-700";
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto font-sans">
      {/* Back Button */}
      <div>
        <Link
          href="/admin/government"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-amber-400" /> Return to Government Registry Operations
        </Link>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 1. DOSSIER HEADER CARD */}
      {/* ------------------------------------------------------------------ */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 space-y-6 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
              <Building2 className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                  {govApp.platform}
                </span>
                <span className="rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-[10px] font-bold text-slate-300">
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
                  <span className="rounded bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold text-rose-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> SLA Paused
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
                Ref: {govApp.externalReference}
              </h1>

              <div className="flex items-center gap-4 text-xs text-slate-400 mt-1 flex-wrap">
                <span>Agency: <strong className="text-slate-200">{govApp.governmentAgency}</strong></span>
                <span>• Service: <strong className="text-slate-200">{govApp.governmentService || govApp.application?.service?.name}</strong></span>
                <span>• Host App: <strong className="text-amber-400 font-mono">{govApp.application?.applicationNumber}</strong></span>
                <span>• Client: <strong className="text-slate-200">{govApp.application?.client?.fullName}</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setModalType("EXTERNAL_UPDATE")}
              className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors shadow-md shadow-amber-500/10"
            >
              <RefreshCw className="h-4 w-4" /> External Update
            </button>

            <button
              onClick={() => setModalType("QUERY")}
              className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/20"
            >
              <AlertTriangle className="h-4 w-4" /> Query
            </button>

            <button
              onClick={() => setModalType("PAYMENT")}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20"
            >
              <DollarSign className="h-4 w-4" /> Fee Payment
            </button>

            <button
              onClick={() => setModalType("APPOINTMENT")}
              className="flex items-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3.5 py-2 text-xs font-bold text-sky-300 hover:bg-sky-500/20"
            >
              <Calendar className="h-4 w-4" /> Appointment
            </button>

            <button
              onClick={() => setModalType("FOLLOWUP")}
              className="flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-2 text-xs font-bold text-indigo-300 hover:bg-indigo-500/20"
            >
              <Clock className="h-4 w-4" /> Follow-up
            </button>

            <button
              onClick={() => setModalType("EVIDENCE")}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700"
            >
              <FileText className="h-4 w-4" /> Attach Document
            </button>
          </div>
        </div>

        {/* 2. STATS GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 text-xs">
          <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
            <span className="text-slate-500 block mb-1">Submission Date</span>
            <p className="font-bold text-white">{govApp.submittedAt ? formatDate(govApp.submittedAt) : "N/A"}</p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
            <span className="text-slate-500 block mb-1">Target Response Date</span>
            <p className="font-bold text-amber-300">{govApp.expectedResponseDate ? formatDate(govApp.expectedResponseDate) : "N/A"}</p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
            <span className="text-slate-500 block mb-1">Next Follow-up Chaser</span>
            <p className="font-bold text-sky-300">{govApp.nextFollowUpDate ? formatDate(govApp.nextFollowUpDate) : "N/A"}</p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
            <span className="text-slate-500 block mb-1">Statutory Fee</span>
            <p className="font-bold text-emerald-400 font-mono">
              KES {govApp.statutoryFeeAmount.toLocaleString()} ({govApp.statutoryPaymentStatus})
            </p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
            <span className="text-slate-500 block mb-1">Desk Officer</span>
            <p className="font-bold text-white">
              {govApp.primaryOfficer ? `${govApp.primaryOfficer.firstName} ${govApp.primaryOfficer.lastName}` : "Unassigned"}
            </p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
            <span className="text-slate-500 block mb-1">Readiness Score</span>
            <p className={`font-bold ${readinessReport.ready ? "text-emerald-400" : "text-rose-400"}`}>
              {readinessReport.score}% ({readinessReport.ready ? "Verified" : "Blockers Found"})
            </p>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. TABBED DOSSIER PANELS */}
      {/* ------------------------------------------------------------------ */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-800 pb-2 text-xs font-bold">
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
              className={`rounded-lg px-4 py-2 transition-colors ${
                activeTab === tab.id
                  ? "bg-amber-500 text-slate-950 shadow-md"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: TIMELINE & AUDIT HISTORY */}
        {activeTab === "TIMELINE" && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 space-y-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <History className="h-4 w-4 text-amber-400" /> Chronological Government Lifecycle Trail
            </h3>

            <div className="relative border-l-2 border-slate-800 pl-6 space-y-6 ml-2 text-xs">
              {govApp.statusHistory?.map((item, idx) => (
                <div key={item.id} className="relative group">
                  <div className="absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-slate-950 bg-amber-400" />

                  <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 space-y-1.5">
                    <div className="flex items-center justify-between text-slate-400">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">
                          {item.fromStatus ? `${item.fromStatus} → ${item.toStatus}` : item.toStatus}
                        </span>
                        <span className="rounded bg-slate-800 px-2 py-0.5 text-[9px] font-bold uppercase text-slate-400">
                          Source: {item.source}
                        </span>
                      </div>
                      <span>{formatDate(item.createdAt)}</span>
                    </div>

                    {item.statusDescription && (
                      <p className="text-slate-200 font-medium">{item.statusDescription}</p>
                    )}

                    {item.notes && <p className="text-slate-400 text-[11px] italic">"{item.notes}"</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: QUERIES & DEFICIENCIES */}
        {activeTab === "QUERIES" && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-400" /> Official Government Queries
              </h3>
              <button
                onClick={() => setModalType("QUERY")}
                className="rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-rose-400"
              >
                + Record New Query
              </button>
            </div>

            {govApp.queries?.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No government queries recorded for this submission.</p>
            ) : (
              <div className="space-y-3 text-xs">
                {govApp.queries?.map((query) => (
                  <div key={query.id} className="rounded-xl border border-rose-500/20 bg-slate-950 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-rose-400">{query.queryType}</span>
                        <span className="rounded bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                          Severity: {query.severity}
                        </span>
                        {query.isResolved ? (
                          <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                            RESOLVED
                          </span>
                        ) : (
                          <span className="rounded bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                            OPEN DEFICIENCY
                          </span>
                        )}
                      </div>
                      <span className="text-slate-400">Received: {formatDate(query.receivedAt)}</span>
                    </div>

                    <p className="text-slate-200">{query.description}</p>

                    {query.clientAction && (
                      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5 text-[11px] text-amber-300">
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
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-400" /> Statutory Fee Receipts
              </h3>
              <button
                onClick={() => setModalType("PAYMENT")}
                className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-400"
              >
                + Record Payment
              </button>
            </div>

            {govApp.payments?.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No statutory fee payments recorded.</p>
            ) : (
              <div className="space-y-3 text-xs">
                {govApp.payments?.map((payment) => (
                  <div key={payment.id} className="rounded-xl border border-emerald-500/20 bg-slate-950 p-4 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white font-mono text-sm">
                        {payment.currency} {payment.amount.toLocaleString()}
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        Method: {payment.paymentMethod} • Ref: <span className="font-mono text-amber-400">{payment.paymentReference || "N/A"}</span>
                      </div>
                      {payment.receiptNumber && (
                        <div className="text-[10px] text-slate-500 font-mono">Receipt: {payment.receiptNumber}</div>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="rounded bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
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
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Calendar className="h-4 w-4 text-sky-400" /> Scheduled Registry Appointments
              </h3>
              <button
                onClick={() => setModalType("APPOINTMENT")}
                className="rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-sky-400"
              >
                + Schedule Appointment
              </button>
            </div>

            {govApp.appointments?.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No registry appointments scheduled.</p>
            ) : (
              <div className="space-y-3 text-xs">
                {govApp.appointments?.map((apt) => (
                  <div key={apt.id} className="rounded-xl border border-sky-500/20 bg-slate-950 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-sky-300 text-sm">{apt.appointmentType} - {apt.authorityName}</div>
                      <span className="rounded bg-sky-500/10 px-2 py-0.5 text-xs font-bold text-sky-400">{apt.status}</span>
                    </div>

                    <div className="text-slate-300 font-medium">
                      Date & Time: {new Date(apt.scheduledAt).toLocaleString()}
                    </div>
                    {apt.location && <div className="text-slate-400">Location: {apt.location}</div>}
                    {apt.clientInstructions && (
                      <div className="text-amber-300/80 bg-amber-500/5 p-2 rounded border border-amber-500/10">
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
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FileText className="h-4 w-4 text-amber-400" /> Dossier Evidence Documents
              </h3>
              <button
                onClick={() => setModalType("EVIDENCE")}
                className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400"
              >
                + Attach Evidence
              </button>
            </div>

            {govApp.evidenceDocs?.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No evidence documents attached.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {govApp.evidenceDocs?.map((doc) => (
                  <div key={doc.id} className="rounded-xl border border-slate-800 bg-slate-950 p-4 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">{doc.documentName}</div>
                      <div className="text-slate-400 text-[10px]">Type: {doc.documentType} • {formatDate(doc.uploadedAt)}</div>
                    </div>

                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-400 hover:bg-amber-500/20 flex items-center gap-1"
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
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Clock className="h-4 w-4 text-indigo-400" /> Registry Desk Chasing History
              </h3>
              <button
                onClick={() => setModalType("FOLLOWUP")}
                className="rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-indigo-400"
              >
                + Log Follow-up
              </button>
            </div>

            {govApp.followUps?.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No follow-up attempts logged.</p>
            ) : (
              <div className="space-y-3 text-xs">
                {govApp.followUps?.map((fu) => (
                  <div key={fu.id} className="rounded-xl border border-indigo-500/20 bg-slate-950 p-4 space-y-1">
                    <div className="flex items-center justify-between text-indigo-400 font-bold">
                      <span>Method: {fu.method} • Officer: {fu.contactPerson || "N/A"}</span>
                      <span className="text-slate-400 text-[10px]">{formatDate(fu.attemptedAt)}</span>
                    </div>

                    <p className="text-slate-200 font-medium">{fu.outcome}</p>
                    {fu.notes && <p className="text-slate-400 text-[11px] italic">"{fu.notes}"</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 7: READINESS AUDIT */}
        {activeTab === "READINESS" && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" /> Statutory Prerequisite Audit Evaluation
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {readinessReport.checklist.map((item: any) => (
                <div
                  key={item.key}
                  className={`flex items-center justify-between rounded-lg p-3 border ${
                    item.status === "PASSED"
                      ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-300"
                      : "border-rose-500/20 bg-rose-500/5 text-rose-300"
                  }`}
                >
                  <span>{item.label}</span>
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
