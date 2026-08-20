"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, ChevronRight, Filter, FileText, ArrowRight, Folder } from "lucide-react";
import { ApplicationStatusBadge, PriorityBadge, SlaIndicator } from "@/components/domain/status-badges";
import { applicationsApi } from "@/lib/api/applications";
import { formatDate, formatKES } from "@/lib/utils/format";
import type { ApplicationStatus } from "@/types";

export default function ClientApplicationsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["client-applications", page, search, statusFilter],
    queryFn: () =>
      applicationsApi.getApplications({
        page,
        limit: 10,
        search: search || undefined,
        status: statusFilter || undefined,
      }),
  });

  const applications = data?.items || [];
  const meta = data?.meta;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-4 sm:p-5 lg:p-6 space-y-4 max-w-[1550px] mx-auto font-sans">
      {/* ------------------------------------------------------------------ */}
      {/* 1. HEADER SECTION */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            My Statutory Applications
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Real-time statutory filing tracker • Monitor approvals, reviews, and official deliveries.
          </p>
        </div>

        <Link href="/client/services">
          <button className="bg-gradient-to-r from-[#C5A059] to-[#D4AF37] hover:from-[#b49049] hover:to-[#c39e26] text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition-all transform hover:-translate-y-0.5 flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
            <Plus className="size-3.5 stroke-[3]" />
            <span>New Statutory Application</span>
          </button>
        </Link>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. SEARCH & FILTER BAR */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by application # or service..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium text-slate-800 placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="size-3.5 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-56 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-semibold text-slate-700"
          >
            <option value="">All Application Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="PENDING_PAYMENT">Pending Payment</option>
            <option value="PAID">Paid</option>
            <option value="REQUIREMENTS_PENDING">Requirements Pending</option>
            <option value="REQUIREMENTS_SUBMITTED">Requirements Submitted</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="READY_FOR_SUBMISSION">Ready for Submission</option>
            <option value="GOVERNMENT_PROCESSING">Government Processing</option>
            <option value="DOCUMENT_RECEIVED">Document Received</option>
            <option value="READY_FOR_DELIVERY">Ready for Delivery</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CLOSED">Closed &amp; Completed</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. DOSSIER TABLE CONTAINER */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-slate-100 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : isError ? (
          <div className="p-8 text-center space-y-3">
            <p className="text-xs font-bold text-rose-600">Failed to load applications dossier.</p>
            <button
              onClick={() => refetch()}
              className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
            >
              Retry Loading
            </button>
          </div>
        ) : applications.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="size-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
              <Folder className="size-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">No statutory filings found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {search || statusFilter
                  ? "No applications match your selected filter. Clear filters to view all records."
                  : "You have not initiated any statutory document applications yet."}
              </p>
            </div>
            <Link href="/client/services" className="inline-block mt-2">
              <button className="bg-gradient-to-r from-[#C5A059] to-[#D4AF37] text-white font-bold text-xs px-4 py-2 rounded-xl">
                Browse Service Catalog
              </button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Application #</th>
                  <th className="py-3 px-4">Statutory Service</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">SLA / Priority</th>
                  <th className="py-3 px-4">Billing</th>
                  <th className="py-3 px-4">Date Initiated</th>
                  <th className="py-3 px-4 text-right">Dossier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      #{app.applicationNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 text-xs group-hover:text-amber-700 transition-colors">
                          {app.service?.name || "Statutory Service"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {app.service?.authority || "Official Registry"}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <ApplicationStatusBadge status={app.status as ApplicationStatus} size="sm" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        {app.slaStatus && <SlaIndicator status={app.slaStatus} size="sm" />}
                        <PriorityBadge priority={app.priority} size="sm" />
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {Number(app.dueAmount) > 0 ? (
                        <span className="font-bold text-amber-600">
                          Due: {formatKES(app.dueAmount)}
                        </span>
                      ) : (
                        <span className="font-bold text-emerald-600">
                          Settled
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-medium">
                      {formatDate(app.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link href={`/client/applications/${app.id}`}>
                        <button className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors bg-amber-50 hover:bg-amber-100/80 px-2.5 py-1 rounded-lg border border-amber-200/60">
                          <span>Open Dossier</span>
                          <ChevronRight className="size-3.5" />
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION FOOTER */}
        {meta && (meta.totalPages ?? 0) > 1 && (
          <div className="px-4 py-3 bg-slate-50/60 border-t border-slate-200/80 flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>
              Showing Page {meta.page ?? 1} of {meta.totalPages ?? 1} ({meta.total ?? 0} total records)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={(meta.page ?? 1) <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
              >
                Previous
              </button>
              <button
                disabled={(meta.page ?? 1) >= (meta.totalPages ?? 1)}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
