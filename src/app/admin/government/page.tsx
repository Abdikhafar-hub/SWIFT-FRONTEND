"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Landmark,
  Search,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Calendar,
  ExternalLink,
  Eye,
  Building2,
  DollarSign,
  UserCheck,
  RefreshCw,
  Filter,
  ShieldCheck,
  MoreVertical,
  Check,
} from "lucide-react";
import { governmentApi } from "@/lib/api/government";
import { notify } from "@/lib/notify";
import { formatDate } from "@/lib/utils/format";
import type { GovernmentApplication, GovernmentStatus } from "@/types/government";

// Modals
import { AdminGovernmentSubmissionModal } from "./components/AdminGovernmentSubmissionModal";
import { AdminGovernmentQueryModal } from "./components/AdminGovernmentQueryModal";
import { AdminGovernmentPaymentModal } from "./components/AdminGovernmentPaymentModal";
import { AdminGovernmentAppointmentModal } from "./components/AdminGovernmentAppointmentModal";
import { AdminGovernmentFollowUpModal } from "./components/AdminGovernmentFollowUpModal";
import { AdminGovernmentExternalUpdateModal } from "./components/AdminGovernmentExternalUpdateModal";
import { AdminGovernmentEvidenceModal } from "./components/AdminGovernmentEvidenceModal";
import { AdminGovernmentAssignModal } from "./components/AdminGovernmentAssignModal";

export default function AdminGovernmentPage() {
  const queryClient = useQueryClient();

  // Filters & State
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState("");
  const [agencyFilter, setAgencyFilter] = useState("");
  const [channelFilter, setChannelFilter] = useState("");
  const [tabView, setTabView] = useState<string>("ALL_ACTIVE");
  const [page, setPage] = useState(1);

  // Modal Triggers State
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [activeGovAppId, setActiveGovAppId] = useState<string | null>(null);
  const [activeGovAppStatus, setActiveGovAppStatus] = useState<string>("");

  const [modalType, setModalType] = useState<
    "QUERY" | "PAYMENT" | "APPOINTMENT" | "FOLLOWUP" | "EXTERNAL_UPDATE" | "EVIDENCE" | "ASSIGN" | null
  >(null);

  // 1. Query Dashboard KPIs
  const { data: kpiData, isLoading: kpiLoading } = useQuery({
    queryKey: ["admin-government-kpis"],
    queryFn: () => governmentApi.getDashboardKpis(),
    refetchInterval: 30000,
  });

  // 2. Query Government Queue
  const {
    data: queueResponse,
    isLoading: queueLoading,
    refetch: refetchQueue,
  } = useQuery({
    queryKey: ["admin-government-queue", page, tabView, platformFilter, agencyFilter, channelFilter, search],
    queryFn: () =>
      governmentApi.getQueue({
        page,
        limit: 15,
        tabView: tabView === "ALL_ACTIVE" ? undefined : tabView,
        platform: platformFilter || undefined,
        agency: agencyFilter || undefined,
        channel: channelFilter || undefined,
        search: search || undefined,
      }),
  });

  const filings = queueResponse?.items || [];
  const pagination = queueResponse?.pagination || { page: 1, limit: 15, total: 0, totalPages: 1 };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-government-kpis"] });
    queryClient.invalidateQueries({ queryKey: ["admin-government-queue"] });
    notify.success("Refreshed Government Registry queue");
  };

  // Helper for Status Badge Styling
  const getStatusBadge = (status: GovernmentStatus) => {
    switch (status) {
      case "SUBMITTED":
      case "SUBMISSION_IN_PROGRESS":
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
      case "ON_HOLD":
        return "bg-orange-500/10 text-orange-400 border-orange-500/30";
      default:
        return "bg-slate-800 text-slate-400 border-slate-700";
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1700px] mx-auto font-sans">
      {/* ------------------------------------------------------------------ */}
      {/* 1. HEADER SECTION */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Government Operations Registry
              </h1>
              <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                Kenya Statutory Hub
              </span>
            </div>
            <p className="text-xs text-slate-400">
              eCitizen, BRS, KRA iTax, TIMS, Immigration & Diplomatic External Submission Management
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <RefreshCw className="h-4 w-4 text-slate-400" /> Refresh Live Queue
          </button>

          <button
            onClick={() => setIsSubmitModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/10"
          >
            <Plus className="h-4 w-4" /> Register Government Submission
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. EXECUTIVE KPI CARDS */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Active Cases</span>
            <Building2 className="h-4 w-4 text-slate-400" />
          </div>
          <p className="text-xl font-bold text-white">{kpiLoading ? "..." : kpiData?.totalActive ?? 0}</p>
          <span className="text-[10px] text-slate-500">In-flight Registry Dossiers</span>
        </div>

        <div className="rounded-xl border border-sky-500/20 bg-slate-900/80 p-3.5 space-y-1">
          <div className="flex items-center justify-between text-xs text-sky-400">
            <span>Ready to Submit</span>
            <CheckCircle2 className="h-4 w-4 text-sky-400" />
          </div>
          <p className="text-xl font-bold text-sky-300">{kpiLoading ? "..." : kpiData?.readyForSubmission ?? 0}</p>
          <span className="text-[10px] text-slate-500">Passed Pre-requisite Audit</span>
        </div>

        <div className="rounded-xl border border-indigo-500/20 bg-slate-900/80 p-3.5 space-y-1">
          <div className="flex items-center justify-between text-xs text-indigo-400">
            <span>Awaiting Registry</span>
            <Clock className="h-4 w-4 text-indigo-400" />
          </div>
          <p className="text-xl font-bold text-indigo-300">{kpiLoading ? "..." : kpiData?.awaitingResponse ?? 0}</p>
          <span className="text-[10px] text-slate-500">Under Authority Review</span>
        </div>

        <div className="rounded-xl border border-rose-500/20 bg-slate-900/80 p-3.5 space-y-1">
          <div className="flex items-center justify-between text-xs text-rose-400">
            <span>Queries Raised</span>
            <AlertTriangle className="h-4 w-4 text-rose-400" />
          </div>
          <p className="text-xl font-bold text-rose-300">{kpiLoading ? "..." : kpiData?.queryRequired ?? 0}</p>
          <span className="text-[10px] text-slate-500">Client Action Triggered</span>
        </div>

        <div className="rounded-xl border border-amber-500/20 bg-slate-900/80 p-3.5 space-y-1">
          <div className="flex items-center justify-between text-xs text-amber-400">
            <span>Payment Needed</span>
            <DollarSign className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-xl font-bold text-amber-300">{kpiLoading ? "..." : kpiData?.paymentRequired ?? 0}</p>
          <span className="text-[10px] text-slate-500">Statutory Fee Pending</span>
        </div>

        <div className="rounded-xl border border-purple-500/20 bg-slate-900/80 p-3.5 space-y-1">
          <div className="flex items-center justify-between text-xs text-purple-400">
            <span>Appointments</span>
            <Calendar className="h-4 w-4 text-purple-400" />
          </div>
          <p className="text-xl font-bold text-purple-300">{kpiLoading ? "..." : kpiData?.appointmentsScheduled ?? 0}</p>
          <span className="text-[10px] text-slate-500">Biometrics / Counter Visit</span>
        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-slate-900/80 p-3.5 space-y-1">
          <div className="flex items-center justify-between text-xs text-emerald-400">
            <span>Approved / Ready</span>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-xl font-bold text-emerald-300">{kpiLoading ? "..." : kpiData?.approvedReady ?? 0}</p>
          <span className="text-[10px] text-slate-500">Certificates Collected</span>
        </div>

        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 space-y-1">
          <div className="flex items-center justify-between text-xs text-red-400 font-bold">
            <span>SLA Overdue Risk</span>
            <Clock className="h-4 w-4 text-red-400" />
          </div>
          <p className="text-xl font-bold text-red-300">{kpiLoading ? "..." : kpiData?.overdueSlaRisk ?? 0}</p>
          <span className="text-[10px] text-red-400/80">Requires Desk Follow-up</span>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. TABS & FILTER BAR */}
      {/* ------------------------------------------------------------------ */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 space-y-4">
        {/* Tab View Selection */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800 text-xs">
          {[
            { id: "ALL_ACTIVE", label: "All Active Dossiers" },
            { id: "READY_FOR_SUBMISSION", label: "Ready to Submit" },
            { id: "AWAITING_RESPONSE", label: "Awaiting Response" },
            { id: "GOVERNMENT_QUERIES", label: "Queries & Deficiencies" },
            { id: "PAYMENT_REQUIRED", label: "Statutory Payment" },
            { id: "APPOINTMENTS", label: "Appointments & Biometrics" },
            { id: "APPROVED", label: "Approved / Ready" },
            { id: "OVERDUE_FOLLOWUPS", label: "Overdue Follow-ups" },
            { id: "CLOSED", label: "Completed / Closed" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setTabView(tab.id);
                setPage(1);
              }}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 font-bold transition-all ${
                tabView === tab.id
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filter Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Ref, Client, Service, Agency..."
              className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
            >
              <option value="">All Government Platforms</option>
              <option value="eCitizen">eCitizen Portal</option>
              <option value="BRS">Business Registration Service (BRS)</option>
              <option value="KRA iTax">KRA iTax</option>
              <option value="TIMS">TIMS / NTSA</option>
              <option value="Immigration">Immigration Services</option>
              <option value="UK Visas">UK Visas & Immigration</option>
              <option value="US traveldocs">US TravelDocs</option>
            </select>
          </div>

          <div>
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
            >
              <option value="">All Submission Channels</option>
              <option value="ONLINE_PORTAL">Online Portal</option>
              <option value="PHYSICAL_OFFICE">Physical Office</option>
              <option value="EMAIL">Email Chaser</option>
              <option value="COURIER">Courier Dispatch</option>
              <option value="MANUAL_COUNTER">Manual Counter</option>
            </select>
          </div>

          <div className="flex items-center justify-end text-slate-400 text-xs font-mono">
            Showing {filings.length} of {pagination.total} Dossiers
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 4. HIGH-DENSITY OPERATIONAL DATA TABLE */}
      {/* ------------------------------------------------------------------ */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/90 shadow-xl">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th className="px-4 py-3.5">Host Application & Client</th>
              <th className="px-4 py-3.5">Platform & Agency</th>
              <th className="px-4 py-3.5">External Reference #</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5">Statutory Payment</th>
              <th className="px-4 py-3.5">SLA & Next Follow-Up</th>
              <th className="px-4 py-3.5">Desk Officer</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {queueLoading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500">
                  Loading Government Registry Records...
                </td>
              </tr>
            ) : filings.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500">
                  No government submission records found matching your filters.
                </td>
              </tr>
            ) : (
              filings.map((govApp) => (
                <tr key={govApp.id} className="hover:bg-slate-800/40 transition-colors">
                  {/* Host Application & Client */}
                  <td className="px-4 py-3">
                    <div className="font-bold text-white font-mono text-xs">
                      {govApp.application?.applicationNumber || "N/A"}
                    </div>
                    <div className="text-slate-300">{govApp.application?.service?.name}</div>
                    <div className="text-[11px] text-slate-400">Client: {govApp.application?.client?.fullName}</div>
                  </td>

                  {/* Platform & Agency */}
                  <td className="px-4 py-3">
                    <div className="font-semibold text-amber-400">{govApp.platform}</div>
                    <div className="text-slate-300 text-[11px]">{govApp.governmentAgency}</div>
                    <span className="inline-block mt-1 rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-bold text-slate-400 uppercase">
                      {govApp.submissionChannel}
                    </span>
                  </td>

                  {/* External Reference */}
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/government/${govApp.id}`}
                      className="font-mono text-amber-400 hover:underline font-bold flex items-center gap-1 text-xs"
                    >
                      {govApp.externalReference}
                      <ExternalLink className="h-3 w-3 text-slate-500" />
                    </Link>
                    {govApp.trackingNumber && (
                      <div className="text-[10px] text-slate-400 font-mono">Track: {govApp.trackingNumber}</div>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${getStatusBadge(
                        govApp.status
                      )}`}
                    >
                      {govApp.status}
                    </span>
                    {govApp.statusDescription && (
                      <div className="text-[10px] text-slate-400 truncate max-w-[180px] mt-0.5">
                        {govApp.statusDescription}
                      </div>
                    )}
                  </td>

                  {/* Statutory Payment */}
                  <td className="px-4 py-3">
                    <div className="font-bold text-white font-mono">
                      KES {govApp.statutoryFeeAmount.toLocaleString()}
                    </div>
                    <span
                      className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                        govApp.statutoryPaymentStatus === "PAID"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}
                    >
                      {govApp.statutoryPaymentStatus}
                    </span>
                  </td>

                  {/* SLA & Next Follow-Up */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-slate-300">
                      <Clock className="h-3.5 w-3.5 text-amber-400" />
                      <span>Follow-up: {govApp.nextFollowUpDate ? formatDate(govApp.nextFollowUpDate) : "Not Set"}</span>
                    </div>
                    {govApp.expectedResponseDate && (
                      <div className="text-[10px] text-slate-400">
                        Target: {formatDate(govApp.expectedResponseDate)}
                      </div>
                    )}
                  </td>

                  {/* Desk Officer */}
                  <td className="px-4 py-3">
                    <div className="text-slate-200">
                      {govApp.primaryOfficer
                        ? `${govApp.primaryOfficer.firstName} ${govApp.primaryOfficer.lastName}`
                        : "Unassigned"}
                    </div>
                    <div className="text-[10px] text-slate-500">{govApp.team || "Statutory Desk"}</div>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/admin/government/${govApp.id}`}
                        className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-[11px] font-bold text-slate-200 hover:bg-slate-700 hover:text-white flex items-center gap-1"
                      >
                        <Eye className="h-3.5 w-3.5 text-amber-400" /> Dossier
                      </Link>

                      <div className="relative group">
                        <button className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-300 hover:bg-slate-700">
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-30 w-48 rounded-xl border border-slate-800 bg-slate-950 p-1.5 shadow-2xl text-left text-xs space-y-0.5">
                          <button
                            onClick={() => {
                              setActiveGovAppId(govApp.id);
                              setActiveGovAppStatus(govApp.status);
                              setModalType("EXTERNAL_UPDATE");
                            }}
                            className="w-full rounded-lg px-2.5 py-1.5 text-left text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2"
                          >
                            <RefreshCw className="h-3.5 w-3.5 text-amber-400" /> External Update
                          </button>

                          <button
                            onClick={() => {
                              setActiveGovAppId(govApp.id);
                              setModalType("QUERY");
                            }}
                            className="w-full rounded-lg px-2.5 py-1.5 text-left text-rose-300 hover:bg-rose-500/10 flex items-center gap-2"
                          >
                            <AlertTriangle className="h-3.5 w-3.5 text-rose-400" /> Record Query
                          </button>

                          <button
                            onClick={() => {
                              setActiveGovAppId(govApp.id);
                              setModalType("PAYMENT");
                            }}
                            className="w-full rounded-lg px-2.5 py-1.5 text-left text-emerald-300 hover:bg-emerald-500/10 flex items-center gap-2"
                          >
                            <DollarSign className="h-3.5 w-3.5 text-emerald-400" /> Record Payment
                          </button>

                          <button
                            onClick={() => {
                              setActiveGovAppId(govApp.id);
                              setModalType("APPOINTMENT");
                            }}
                            className="w-full rounded-lg px-2.5 py-1.5 text-left text-sky-300 hover:bg-sky-500/10 flex items-center gap-2"
                          >
                            <Calendar className="h-3.5 w-3.5 text-sky-400" /> Appointment
                          </button>

                          <button
                            onClick={() => {
                              setActiveGovAppId(govApp.id);
                              setModalType("FOLLOWUP");
                            }}
                            className="w-full rounded-lg px-2.5 py-1.5 text-left text-indigo-300 hover:bg-indigo-500/10 flex items-center gap-2"
                          >
                            <Clock className="h-3.5 w-3.5 text-indigo-400" /> Log Follow-Up
                          </button>

                          <button
                            onClick={() => {
                              setActiveGovAppId(govApp.id);
                              setModalType("EVIDENCE");
                            }}
                            className="w-full rounded-lg px-2.5 py-1.5 text-left text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                          >
                            <FileText className="h-3.5 w-3.5 text-slate-400" /> Attach Evidence
                          </button>

                          <button
                            onClick={() => {
                              setActiveGovAppId(govApp.id);
                              setModalType("ASSIGN");
                            }}
                            className="w-full rounded-lg px-2.5 py-1.5 text-left text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                          >
                            <UserCheck className="h-3.5 w-3.5 text-slate-400" /> Assign Officer
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/80 px-4 py-3 text-xs text-slate-400">
            <div>
              Page {pagination.page} of {pagination.totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded border border-slate-800 bg-slate-900 px-3 py-1 text-slate-300 hover:bg-slate-800 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded border border-slate-800 bg-slate-900 px-3 py-1 text-slate-300 hover:bg-slate-800 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 5. MODAL DIALOGS */}
      {/* ------------------------------------------------------------------ */}

      {/* Submission Wizard */}
      <AdminGovernmentSubmissionModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["admin-government-kpis"] });
          queryClient.invalidateQueries({ queryKey: ["admin-government-queue"] });
        }}
      />

      {/* Query Modal */}
      {modalType === "QUERY" && activeGovAppId && (
        <AdminGovernmentQueryModal
          isOpen={true}
          governmentApplicationId={activeGovAppId}
          onClose={() => setModalType(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["admin-government-kpis"] });
            queryClient.invalidateQueries({ queryKey: ["admin-government-queue"] });
          }}
        />
      )}

      {/* Payment Modal */}
      {modalType === "PAYMENT" && activeGovAppId && (
        <AdminGovernmentPaymentModal
          isOpen={true}
          governmentApplicationId={activeGovAppId}
          onClose={() => setModalType(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["admin-government-kpis"] });
            queryClient.invalidateQueries({ queryKey: ["admin-government-queue"] });
          }}
        />
      )}

      {/* Appointment Modal */}
      {modalType === "APPOINTMENT" && activeGovAppId && (
        <AdminGovernmentAppointmentModal
          isOpen={true}
          governmentApplicationId={activeGovAppId}
          onClose={() => setModalType(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["admin-government-kpis"] });
            queryClient.invalidateQueries({ queryKey: ["admin-government-queue"] });
          }}
        />
      )}

      {/* Follow Up Modal */}
      {modalType === "FOLLOWUP" && activeGovAppId && (
        <AdminGovernmentFollowUpModal
          isOpen={true}
          governmentApplicationId={activeGovAppId}
          onClose={() => setModalType(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["admin-government-kpis"] });
            queryClient.invalidateQueries({ queryKey: ["admin-government-queue"] });
          }}
        />
      )}

      {/* External Update Modal */}
      {modalType === "EXTERNAL_UPDATE" && activeGovAppId && (
        <AdminGovernmentExternalUpdateModal
          isOpen={true}
          governmentApplicationId={activeGovAppId}
          currentStatus={activeGovAppStatus}
          onClose={() => setModalType(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["admin-government-kpis"] });
            queryClient.invalidateQueries({ queryKey: ["admin-government-queue"] });
          }}
        />
      )}

      {/* Evidence Modal */}
      {modalType === "EVIDENCE" && activeGovAppId && (
        <AdminGovernmentEvidenceModal
          isOpen={true}
          governmentApplicationId={activeGovAppId}
          onClose={() => setModalType(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["admin-government-queue"] });
          }}
        />
      )}

      {/* Assign Modal */}
      {modalType === "ASSIGN" && activeGovAppId && (
        <AdminGovernmentAssignModal
          isOpen={true}
          governmentApplicationId={activeGovAppId}
          onClose={() => setModalType(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["admin-government-queue"] });
          }}
        />
      )}
    </div>
  );
}
