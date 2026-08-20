"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Building,
} from "lucide-react";
import { PageShell } from "@/components/ui/layout-primitives";
import { Card, StatCard } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Pagination,
} from "@/components/ui/table-primitives";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdminGovernmentSubmissionModal } from "@/components/domain";
import { EmptyState, Skeleton, ErrorState } from "@/components/ui/feedback-primitives";
import { adminApi } from "@/lib/api/admin";
import { formatDate } from "@/lib/utils/format";
import type { GovernmentApplication, GovernmentStatus } from "@/types";

export default function AdminGovernmentPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [agencyFilter, setAgencyFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  // Submission modal state
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedAppIdForSubmit, setSelectedAppIdForSubmit] = useState("");

  // Query government queue
  const {
    data: queueData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-government-queue", page, agencyFilter, statusFilter],
    queryFn: () =>
      adminApi.getGovernmentQueue({
        page,
        limit: 15,
        agency: agencyFilter || undefined,
        status: statusFilter || undefined,
      }),
  });

  const filings = queueData?.items || [];
  const pagination = queueData?.pagination;

  // Filter local search
  const filteredFilings = filings.filter((f) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const matchRef = f.externalReference?.toLowerCase().includes(q);
    const matchAgency = f.governmentAgency?.toLowerCase().includes(q);
    const matchApp = f.application?.applicationNumber?.toLowerCase().includes(q);
    const matchClient =
      f.application?.client?.fullName?.toLowerCase().includes(q) ||
      f.application?.client?.businessName?.toLowerCase().includes(q);
    return matchRef || matchAgency || matchApp || matchClient;
  });

  // Derived metrics
  const totalSubmissions = filings.length;
  const inReviewCount = filings.filter((f) => f.status === "IN_REVIEW" || f.status === "SUBMITTED").length;
  const queryCount = filings.filter((f) => f.status === "QUERY_RAISED" || f.status === "REJECTED").length;
  const approvedCount = filings.filter((f) => f.status === "APPROVED").length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-4 sm:p-5 lg:p-6 space-y-4 max-w-[1550px] mx-auto font-sans">
      {/* ------------------------------------------------------------------ */}
      {/* 1. HEADER SECTION */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Government Registry Operations
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Agency tracking across eCitizen, BRS, ArdhiSasa, NTSA, KRA, and statutory registries with reference mapping.
          </p>
        </div>

        <button
          onClick={() => setIsSubmitModalOpen(true)}
          className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
        >
          <Plus className="size-3.5" />
          <span>Register Agency Filing</span>
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. REGISTRY METRICS */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Agency Filings</span>
            <span className="text-xl font-extrabold text-slate-900 font-mono mt-0.5 block">{totalSubmissions}</span>
            <span className="text-[10px] text-slate-500 font-medium">Monitored in queue</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
            <Landmark className="size-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Processing / In Review</span>
            <span className="text-xl font-extrabold text-amber-600 font-mono mt-0.5 block">{inReviewCount}</span>
            <span className="text-[10px] text-slate-500 font-medium">Active at registry</span>
          </div>
          <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60">
            <Clock className="size-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Registry Queries</span>
            <span className="text-xl font-extrabold text-rose-600 font-mono mt-0.5 block">{queryCount}</span>
            <span className="text-[10px] text-slate-500 font-medium">Action required from agency</span>
          </div>
          <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200/60">
            <AlertTriangle className="size-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Statutory Approvals</span>
            <span className="text-xl font-extrabold text-emerald-600 font-mono mt-0.5 block">{approvedCount}</span>
            <span className="text-[10px] text-slate-500 font-medium">Certified official approvals</span>
          </div>
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60">
            <CheckCircle2 className="size-4" />
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. FILTERS & SEARCH */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by registry reference, agency, or dossier #..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium text-slate-800 placeholder-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={agencyFilter}
            onChange={(e) => {
              setAgencyFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-semibold text-slate-700"
          >
            <option value="">All Government Registries</option>
            <option value="BRS">BRS (Business Registration)</option>
            <option value="eCitizen">eCitizen Portal</option>
            <option value="Ardhi">ArdhiSasa Land Registry</option>
            <option value="iTax">KRA iTax</option>
            <option value="TIMS">NTSA TIMS</option>
            <option value="Immigration">Immigration</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-semibold text-slate-700"
          >
            <option value="">All Registry Statuses</option>
            <option value="SUBMITTED">Submitted to Agency</option>
            <option value="IN_REVIEW">In Review / Processing</option>
            <option value="QUERY_RAISED">Query Raised</option>
            <option value="APPROVED">Approved &amp; Certified</option>
            <option value="REJECTED">Rejected by Registry</option>
          </select>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 4. GOVERNMENT FILINGS TABLE */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-slate-100 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <p className="text-xs font-bold text-rose-600">Failed to load government registry queue.</p>
            <button
              onClick={() => refetch()}
              className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
            >
              Retry Loading
            </button>
          </div>
        ) : filteredFilings.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Landmark className="size-8 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No government filings recorded</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Agency submissions registered for statutory applications will appear here.
            </p>
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition-colors inline-flex items-center gap-1.5"
            >
              <Plus className="size-3.5" />
              <span>Register First Filing</span>
            </button>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Agency / Registry</th>
                    <th className="py-3 px-4">External Reference</th>
                    <th className="py-3 px-4">Dossier #</th>
                    <th className="py-3 px-4">Client Entity</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Submitted Date</th>
                    <th className="py-3 px-4">Follow-up Due</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredFilings.map((filing) => (
                    <tr key={filing.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <Link
                            href={`/admin/government/${filing.id}`}
                            className="font-bold text-xs text-slate-900 hover:text-amber-700 hover:underline block"
                          >
                            {filing.governmentAgency || filing.platform}
                          </Link>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {filing.governmentService || filing.platform}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs font-bold text-slate-900">
                        {filing.externalReference || "—"}
                      </td>
                      <td className="py-3 px-4">
                        {filing.application ? (
                          <Link
                            href={`/admin/applications/${filing.application.id}`}
                            className="font-mono text-xs font-bold text-amber-700 hover:text-amber-800 hover:underline"
                          >
                            #{filing.application.applicationNumber}
                          </Link>
                        ) : (
                          <span className="text-xs text-slate-500 font-mono">
                            {filing.applicationId?.slice(0, 8)}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-800 font-bold">
                        {filing.application?.client?.fullName ||
                          filing.application?.client?.businessName ||
                          "Verified Client"}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                            filing.status === "APPROVED"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200/80"
                              : filing.status === "REJECTED" || filing.status === "QUERY_RAISED"
                              ? "bg-rose-50 text-rose-800 border-rose-200/80"
                              : filing.status === "IN_REVIEW"
                              ? "bg-amber-50 text-amber-800 border-amber-200/80"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {filing.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500 font-mono">
                        {formatDate(filing.submittedAt || filing.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-xs font-mono">
                        {filing.followUpDate ? (
                          <span className="flex items-center gap-1 text-amber-700 font-bold">
                            <Calendar className="size-3" />
                            {formatDate(filing.followUpDate)}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link href={`/admin/government/${filing.id}`}>
                          <button className="bg-white border border-slate-200 text-slate-700 font-bold text-xs px-2.5 py-1 rounded-lg hover:bg-slate-50 transition-all inline-flex items-center gap-1">
                            <Eye className="size-3 text-slate-500" />
                            <span>Dossier</span>
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="px-4 py-3 bg-slate-50/60 border-t border-slate-200/80 flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>
                  Page {pagination.page} of {pagination.totalPages} ({pagination.total} total items)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* REGISTER SUBMISSION MODAL */}
      {isSubmitModalOpen && (
        <AdminGovernmentSubmissionModal
          applicationId={selectedAppIdForSubmit || ""}
          isOpen={isSubmitModalOpen}
          onClose={() => setIsSubmitModalOpen(false)}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}
