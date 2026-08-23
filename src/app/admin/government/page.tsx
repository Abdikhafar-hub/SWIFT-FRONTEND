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
      case "ON_HOLD":
        return "bg-orange-50 text-orange-700 border-orange-200";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-4 sm:p-5 lg:p-6 space-y-4 max-w-[1550px] mx-auto font-sans">
      {/* ------------------------------------------------------------------ */}
      {/* 1. HEADER SECTION */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200/80 shrink-0">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Government Operations Registry
              </h1>
              <span className="rounded-full bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                Kenya Statutory Hub
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              eCitizen, BRS, KRA iTax, TIMS, Immigration &amp; Diplomatic External Submission Management
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-500" /> Refresh Live Queue
          </button>

          <button
            onClick={() => setIsSubmitModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#C5A059] to-[#D4AF37] hover:from-[#b49049] hover:to-[#c39e26] px-3.5 py-2 text-xs font-bold text-white transition-all shadow-xs transform hover:-translate-y-0.5"
          >
            <Plus className="h-4 w-4 stroke-[3]" /> Register Government Submission
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. EXECUTIVE KPI CARDS */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 sm:gap-3">
        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 space-y-1 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase text-slate-400">
            <span>Active Cases</span>
            <Building2 className="h-4 w-4 text-slate-400" />
          </div>
          <p className="text-xl font-extrabold text-slate-900">{kpiLoading ? "..." : kpiData?.totalActive ?? 0}</p>
          <span className="text-[10px] text-slate-500 font-medium">In-flight Dossiers</span>
        </div>

        <div className="bg-white rounded-xl border border-sky-200/80 p-3.5 space-y-1 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase text-sky-700">
            <span>Ready to Submit</span>
            <CheckCircle2 className="h-4 w-4 text-sky-600" />
          </div>
          <p className="text-xl font-extrabold text-slate-900">{kpiLoading ? "..." : kpiData?.readyForSubmission ?? 0}</p>
          <span className="text-[10px] text-slate-500 font-medium">Passed Pre-requisite Audit</span>
        </div>

        <div className="bg-white rounded-xl border border-indigo-200/80 p-3.5 space-y-1 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase text-indigo-700">
            <span>Awaiting Registry</span>
            <Clock className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="text-xl font-extrabold text-slate-900">{kpiLoading ? "..." : kpiData?.awaitingResponse ?? 0}</p>
          <span className="text-[10px] text-slate-500 font-medium">Under Authority Review</span>
        </div>

        <div className="bg-white rounded-xl border border-rose-200/80 p-3.5 space-y-1 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase text-rose-700">
            <span>Queries Raised</span>
            <AlertTriangle className="h-4 w-4 text-rose-600" />
          </div>
          <p className="text-xl font-extrabold text-slate-900">{kpiLoading ? "..." : kpiData?.queryRequired ?? 0}</p>
          <span className="text-[10px] text-slate-500 font-medium">Client Action Triggered</span>
        </div>

        <div className="bg-white rounded-xl border border-amber-200/80 p-3.5 space-y-1 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase text-amber-700">
            <span>Payment Needed</span>
            <DollarSign className="h-4 w-4 text-amber-600" />
          </div>
          <p className="text-xl font-extrabold text-slate-900">{kpiLoading ? "..." : kpiData?.paymentRequired ?? 0}</p>
          <span className="text-[10px] text-slate-500 font-medium">Statutory Fee Pending</span>
        </div>

        <div className="bg-white rounded-xl border border-purple-200/80 p-3.5 space-y-1 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase text-purple-700">
            <span>Appointments</span>
            <Calendar className="h-4 w-4 text-purple-600" />
          </div>
          <p className="text-xl font-extrabold text-slate-900">{kpiLoading ? "..." : kpiData?.appointmentsScheduled ?? 0}</p>
          <span className="text-[10px] text-slate-500 font-medium">Biometrics / Visit</span>
        </div>

        <div className="bg-white rounded-xl border border-emerald-200/80 p-3.5 space-y-1 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase text-emerald-700">
            <span>Approved / Ready</span>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-xl font-extrabold text-slate-900">{kpiLoading ? "..." : kpiData?.approvedReady ?? 0}</p>
          <span className="text-[10px] text-slate-500 font-medium">Certificates Collected</span>
        </div>

        <div className="bg-rose-50 rounded-xl border border-rose-200 p-3.5 space-y-1 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase text-rose-800">
            <span>SLA Overdue Risk</span>
            <Clock className="h-4 w-4 text-rose-600" />
          </div>
          <p className="text-xl font-extrabold text-rose-800">{kpiLoading ? "..." : kpiData?.overdueSlaRisk ?? 0}</p>
          <span className="text-[10px] text-rose-700 font-semibold">Requires Desk Follow-up</span>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. TABS & FILTER BAR */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 space-y-3 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        {/* Tab View Selection */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200/60 text-xs">
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
              className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                tabView === tab.id
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filter Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Ref, Client, Service, Agency..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-slate-800 placeholder-slate-400 font-medium focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
            />
          </div>

          <div>
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 font-semibold focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
            >
              <option value="">All Government Platforms</option>
              <option value="eCitizen">eCitizen Portal</option>
              <option value="BRS">Business Registration Service (BRS)</option>
              <option value="KRA iTax">KRA iTax</option>
              <option value="TIMS">TIMS / NTSA</option>
              <option value="Immigration">Immigration Services</option>
              <option value="UK Visas">UK Visas &amp; Immigration</option>
              <option value="US traveldocs">US TravelDocs</option>
            </select>
          </div>

          <div>
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 font-semibold focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
            >
              <option value="">All Submission Channels</option>
              <option value="ONLINE_PORTAL">Online Portal</option>
              <option value="PHYSICAL_OFFICE">Physical Office</option>
              <option value="EMAIL">Email Chaser</option>
              <option value="COURIER">Courier Dispatch</option>
              <option value="MANUAL_COUNTER">Manual Counter</option>
            </select>
          </div>

          <div className="flex items-center justify-end text-slate-500 text-xs font-medium">
            Showing {filings.length} of {pagination.total} Dossiers
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 4. HIGH-DENSITY OPERATIONAL DATA TABLE */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3">Host Application &amp; Client</th>
                <th className="px-4 py-3">Platform &amp; Agency</th>
                <th className="px-4 py-3">External Reference #</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Statutory Payment</th>
                <th className="px-4 py-3">SLA &amp; Next Follow-Up</th>
                <th className="px-4 py-3">Desk Officer</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium">
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
                  <tr key={govApp.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Host Application & Client */}
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 font-mono text-xs">
                        {govApp.application?.applicationNumber || "N/A"}
                      </div>
                      <div className="text-slate-700 font-medium">{govApp.application?.service?.name}</div>
                      <div className="text-[11px] text-slate-500">Client: {govApp.application?.client?.fullName}</div>
                    </td>

                    {/* Platform & Agency */}
                    <td className="px-4 py-3">
                      <div className="font-bold text-amber-700">{govApp.platform}</div>
                      <div className="text-slate-600 text-[11px]">{govApp.governmentAgency}</div>
                      <span className="inline-block mt-1 rounded bg-slate-100 border border-slate-200/60 px-1.5 py-0.5 text-[9px] font-bold text-slate-600 uppercase">
                        {govApp.submissionChannel}
                      </span>
                    </td>

                    {/* External Reference */}
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/government/${govApp.id}`}
                        className="font-mono text-amber-700 hover:underline font-bold flex items-center gap-1 text-xs"
                      >
                        {govApp.externalReference}
                        <ExternalLink className="h-3 w-3 text-slate-400" />
                      </Link>
                      {govApp.trackingNumber && (
                        <div className="text-[10px] text-slate-500 font-mono">Track: {govApp.trackingNumber}</div>
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
                        <div className="text-[10px] text-slate-500 truncate max-w-[180px] mt-0.5">
                          {govApp.statusDescription}
                        </div>
                      )}
                    </td>

                    {/* Statutory Payment */}
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 font-mono">
                        KES {govApp.statutoryFeeAmount.toLocaleString()}
                      </div>
                      <span
                        className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                          govApp.statutoryPaymentStatus === "PAID"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {govApp.statutoryPaymentStatus}
                      </span>
                    </td>

                    {/* SLA & Next Follow-Up */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-slate-700">
                        <Clock className="h-3.5 w-3.5 text-amber-600" />
                        <span>Follow-up: {govApp.nextFollowUpDate ? formatDate(govApp.nextFollowUpDate) : "Not Set"}</span>
                      </div>
                      {govApp.expectedResponseDate && (
                        <div className="text-[10px] text-slate-500">
                          Target: {formatDate(govApp.expectedResponseDate)}
                        </div>
                      )}
                    </td>

                    {/* Desk Officer */}
                    <td className="px-4 py-3">
                      <div className="text-slate-800 font-medium">
                        {govApp.primaryOfficer
                          ? `${govApp.primaryOfficer.firstName} ${govApp.primaryOfficer.lastName}`
                          : "Unassigned"}
                      </div>
                      <div className="text-[10px] text-slate-400">{govApp.team || "Statutory Desk"}</div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/government/${govApp.id}`}
                          className="rounded-lg border border-amber-200/60 bg-amber-50 px-2.5 py-1.5 text-[11px] font-bold text-amber-700 hover:bg-amber-100/80 flex items-center gap-1 transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5 text-amber-600" /> Dossier
                        </Link>

                        <div className="relative group">
                          <button className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50 transition-colors">
                            <MoreVertical className="h-4 w-4" />
                          </button>

                          <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-30 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl text-left text-xs space-y-0.5">
                            <button
                              onClick={() => {
                                setActiveGovAppId(govApp.id);
                                setActiveGovAppStatus(govApp.status);
                                setModalType("EXTERNAL_UPDATE");
                              }}
                              className="w-full rounded-lg px-2.5 py-1.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                            >
                              <RefreshCw className="h-3.5 w-3.5 text-amber-600" /> External Update
                            </button>

                            <button
                              onClick={() => {
                                setActiveGovAppId(govApp.id);
                                setModalType("QUERY");
                              }}
                              className="w-full rounded-lg px-2.5 py-1.5 text-left text-rose-700 hover:bg-rose-50 flex items-center gap-2 font-medium"
                            >
                              <AlertTriangle className="h-3.5 w-3.5 text-rose-600" /> Record Query
                            </button>

                            <button
                              onClick={() => {
                                setActiveGovAppId(govApp.id);
                                setModalType("PAYMENT");
                              }}
                              className="w-full rounded-lg px-2.5 py-1.5 text-left text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 font-medium"
                            >
                              <DollarSign className="h-3.5 w-3.5 text-emerald-600" /> Record Payment
                            </button>

                            <button
                              onClick={() => {
                                setActiveGovAppId(govApp.id);
                                setModalType("APPOINTMENT");
                              }}
                              className="w-full rounded-lg px-2.5 py-1.5 text-left text-sky-700 hover:bg-sky-50 flex items-center gap-2 font-medium"
                            >
                              <Calendar className="h-3.5 w-3.5 text-sky-600" /> Appointment
                            </button>

                            <button
                              onClick={() => {
                                setActiveGovAppId(govApp.id);
                                setModalType("FOLLOWUP");
                              }}
                              className="w-full rounded-lg px-2.5 py-1.5 text-left text-indigo-700 hover:bg-indigo-50 flex items-center gap-2 font-medium"
                            >
                              <Clock className="h-3.5 w-3.5 text-indigo-600" /> Log Follow-Up
                            </button>

                            <button
                              onClick={() => {
                                setActiveGovAppId(govApp.id);
                                setModalType("EVIDENCE");
                              }}
                              className="w-full rounded-lg px-2.5 py-1.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                            >
                              <FileText className="h-3.5 w-3.5 text-slate-500" /> Attach Evidence
                            </button>

                            <button
                              onClick={() => {
                                setActiveGovAppId(govApp.id);
                                setModalType("ASSIGN");
                              }}
                              className="w-full rounded-lg px-2.5 py-1.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                            >
                              <UserCheck className="h-3.5 w-3.5 text-slate-500" /> Assign Officer
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
        </div>

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200/80 bg-slate-50/60 px-4 py-3 text-xs text-slate-600 font-medium">
            <div>
              Page {pagination.page} of {pagination.totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-slate-700 hover:bg-slate-50 disabled:opacity-40 font-bold transition-colors"
              >
                Previous
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-slate-700 hover:bg-slate-50 disabled:opacity-40 font-bold transition-colors"
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
