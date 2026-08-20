"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckSquare,
  ShieldCheck,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  FileCheck,
  UserCheck,
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
import { AdminQcModal } from "@/components/domain";
import { EmptyState, Skeleton, ErrorState } from "@/components/ui/feedback-primitives";
import { adminApi } from "@/lib/api/admin";
import { formatDate } from "@/lib/utils/format";
import type { Application } from "@/types";

export default function AdminQcPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [filterState, setFilterState] = useState("ALL");
  const [page, setPage] = useState(1);

  // Selected for QC modal
  const [selectedAppForQc, setSelectedAppForQc] = useState<Application | null>(null);

  // Query QC applications (applications in QUALITY_CHECK state or general queue)
  const { data: appsData, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-qc-queue", page, search],
    queryFn: () =>
      adminApi.getApplications({
        page,
        limit: 20,
        search: search || undefined,
      }),
  });

  const applications: Application[] = appsData?.items || [];
  const pagination = appsData?.pagination;

  // QC Filter
  const qcPendingApps = applications.filter((app) => app.status === "QUALITY_CHECK");
  const filteredApps =
    filterState === "PENDING"
      ? qcPendingApps
      : filterState === "PASSED"
      ? applications.filter((app) => app.status !== "QUALITY_CHECK" && (app.status as string) !== "CANCELLED")
      : applications;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-4 sm:p-5 lg:p-6 space-y-4 max-w-[1550px] mx-auto font-sans">
      {/* ------------------------------------------------------------------ */}
      {/* 1. HEADER SECTION */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Quality Control Command Center
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Rigorous statutory compliance inspection, document legibility audits, identity verification, and formal sign-offs.
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. QC METRICS */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Pending Inspection</span>
            <span className="text-xl font-extrabold text-amber-600 font-mono mt-0.5 block">{qcPendingApps.length}</span>
            <span className="text-[10px] text-slate-500 font-medium">Awaiting compliance sign-off</span>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60">
            <CheckSquare className="size-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Certified QC Passes</span>
            <span className="text-xl font-extrabold text-emerald-600 font-mono mt-0.5 block">
              {applications.filter((a) => a.status === "READY_FOR_SUBMISSION" || a.status === "SUBMITTED" || a.status === "DELIVERED" || a.status === "CLOSED").length}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Passed statutory inspection</span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60">
            <CheckCircle2 className="size-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Returned / Flagged</span>
            <span className="text-xl font-extrabold text-rose-600 font-mono mt-0.5 block">
              {applications.filter((a) => a.status === "ADDITIONAL_INFORMATION_REQUIRED" || a.status === "ON_HOLD" || a.status === "CANCELLED").length}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Deficiencies identified</span>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200/60">
            <AlertTriangle className="size-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Monitored</span>
            <span className="text-xl font-extrabold text-slate-900 font-mono mt-0.5 block">{applications.length}</span>
            <span className="text-[10px] text-slate-500 font-medium">Applications in workstream</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
            <FileCheck className="size-4" />
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
            placeholder="Search by dossier #, client name, or service..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium text-slate-800 placeholder-slate-400"
          />
        </div>

        <select
          value={filterState}
          onChange={(e) => {
            setFilterState(e.target.value);
            setPage(1);
          }}
          className="w-full sm:w-56 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-semibold text-slate-700"
        >
          <option value="ALL">All Workstream Dossiers</option>
          <option value="PENDING">QC Inspection Pending</option>
          <option value="PASSED">Certified / Approved</option>
        </select>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 4. QC QUEUE TABLE */}
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
            <p className="text-xs font-bold text-rose-600">Failed to load quality control queue.</p>
            <button
              onClick={() => refetch()}
              className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
            >
              Retry Loading
            </button>
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <h3 className="text-sm font-bold text-slate-800">No applications pending inspection</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              All candidate dossiers have undergone quality checks or match current criteria.
            </p>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Dossier #</th>
                    <th className="py-3 px-4">Statutory Service</th>
                    <th className="py-3 px-4">Client Entity</th>
                    <th className="py-3 px-4">Current Status</th>
                    <th className="py-3 px-4">Requirements</th>
                    <th className="py-3 px-4">Date Filed</th>
                    <th className="py-3 px-4 text-right">Inspection Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredApps.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-3 px-4">
                        <Link
                          href={`/admin/qc/${app.id}`}
                          className="font-mono text-xs font-bold text-amber-700 hover:text-amber-800 hover:underline"
                        >
                          #{app.applicationNumber}
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-bold text-xs text-slate-900">
                        {app.service?.name || "Statutory Service"}
                      </td>
                      <td className="py-3 px-4 text-xs font-medium text-slate-600">
                        {app.client?.fullName || app.client?.businessName || "Verified Client"}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                          app.status === "QUALITY_CHECK"
                            ? "bg-amber-50 text-amber-800 border-amber-200/80"
                            : app.status === "DELIVERED" || app.status === "CLOSED" || app.status === "READY_FOR_SUBMISSION"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500 font-mono">
                        {app.requirements?.length || 0} items
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500 font-medium">
                        {formatDate(app.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedAppForQc(app)}
                            className="bg-gradient-to-r from-[#C5A059] to-[#D4AF37] hover:from-[#b49049] hover:to-[#c39e26] text-white font-bold text-xs px-2.5 py-1 rounded-lg shadow-xs transition-all flex items-center gap-1"
                          >
                            <ShieldCheck className="size-3 stroke-[2.5]" />
                            <span>QC Inspect</span>
                          </button>
                          <Link href={`/admin/qc/${app.id}`}>
                            <button className="bg-white border border-slate-200 text-slate-700 font-bold text-xs px-2.5 py-1 rounded-lg hover:bg-slate-50 transition-all flex items-center gap-1">
                              <Eye className="size-3 text-slate-500" />
                              <span>Dossier</span>
                            </button>
                          </Link>
                        </div>
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

      {/* QC INSPECTION MODAL */}
      {selectedAppForQc && (
        <AdminQcModal
          applicationId={selectedAppForQc.id}
          applicationNumber={selectedAppForQc.applicationNumber}
          isOpen={Boolean(selectedAppForQc)}
          onClose={() => setSelectedAppForQc(null)}
          onSuccess={() => {
            refetch();
            queryClient.invalidateQueries({ queryKey: ["admin-work-queue"] });
          }}
        />
      )}
    </div>
  );
}
