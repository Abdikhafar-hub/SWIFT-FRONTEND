"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  Eye,
  Download,
  FileCheck,
  ShieldAlert,
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
import { EmptyState, Skeleton, ErrorState } from "@/components/ui/feedback-primitives";
import { adminApi } from "@/lib/api/admin";
import { formatDate } from "@/lib/utils/format";
import type { Application, ApplicationRequirement } from "@/types";

export default function AdminDocumentsPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [sweepResult, setSweepResult] = useState<any | null>(null);

  // Query applications to aggregate all documents/requirements
  const {
    data: appsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-documents-vault-applications"],
    queryFn: () => adminApi.getApplications({ page: 1, limit: 100 }),
  });

  const applications: Application[] = appsData?.items || [];

  // Flatten all documents/requirements
  const allDocuments: Array<{
    req: ApplicationRequirement;
    application: Application;
  }> = [];

  applications.forEach((app) => {
    if (app.requirements && app.requirements.length > 0) {
      app.requirements.forEach((r) => {
        allDocuments.push({ req: r, application: app });
      });
    }
  });

  // Expiry sweep mutation
  const sweepMutation = useMutation({
    mutationFn: () => adminApi.triggerExpiryCheck(),
    onSuccess: (data) => {
      setSweepResult(data);
      refetch();
    },
  });

  // Filter documents
  const filteredDocuments = allDocuments.filter(({ req, application }) => {
    if (search) {
      const q = search.toLowerCase();
      const matchKey = req.requirementKey?.toLowerCase().includes(q);
      const matchDocName = req.documentName?.toLowerCase().includes(q);
      const matchApp = application.applicationNumber?.toLowerCase().includes(q);
      const matchClient =
        application.client?.fullName?.toLowerCase().includes(q) ||
        application.client?.businessName?.toLowerCase().includes(q);
      if (!matchKey && !matchDocName && !matchApp && !matchClient) return false;
    }
    if (statusFilter !== "ALL" && req.status !== statusFilter) return false;
    return true;
  });

  // Metrics
  const totalCount = allDocuments.length;
  const approvedCount = allDocuments.filter((d) => d.req.status === "APPROVED").length;
  const submittedCount = allDocuments.filter((d) => d.req.status === "SUBMITTED" || d.req.status === "UNDER_REVIEW").length;
  const rejectedCount = allDocuments.filter((d) => d.req.status === "REJECTED").length;

  const pageSize = 12;
  const totalPages = Math.ceil(filteredDocuments.length / pageSize) || 1;
  const paginatedDocs = filteredDocuments.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-4 sm:p-5 lg:p-6 space-y-4 max-w-[1550px] mx-auto font-sans">
      {/* ------------------------------------------------------------------ */}
      {/* 1. HEADER SECTION */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Central Document Vault &amp; Expiry Monitor
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            All statutory client documents, identity certifications, registry filings, and automatic expiry sweeps.
          </p>
        </div>

        <button
          onClick={() => sweepMutation.mutate()}
          disabled={sweepMutation.isPending}
          className="bg-gradient-to-r from-[#C5A059] to-[#D4AF37] hover:from-[#b49049] hover:to-[#c39e26] text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0 self-start sm:self-auto disabled:opacity-50 transform hover:-translate-y-0.5"
        >
          <RefreshCw className={`size-3.5 ${sweepMutation.isPending ? "animate-spin" : ""}`} />
          <span>Run Document Expiry Sweep</span>
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. VAULT METRICS */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Vault Documents</span>
            <span className="text-xl font-extrabold text-slate-900 font-mono mt-0.5 block">{totalCount}</span>
            <span className="text-[10px] text-slate-500 font-medium">Across active dossiers</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
            <FileText className="size-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Verified &amp; Approved</span>
            <span className="text-xl font-extrabold text-emerald-600 font-mono mt-0.5 block">{approvedCount}</span>
            <span className="text-[10px] text-slate-500 font-medium">Compliance checked</span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60">
            <CheckCircle2 className="size-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Pending Officer Review</span>
            <span className="text-xl font-extrabold text-amber-600 font-mono mt-0.5 block">{submittedCount}</span>
            <span className="text-[10px] text-slate-500 font-medium">Requires verification</span>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60">
            <Clock className="size-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Flagged / Rejected</span>
            <span className="text-xl font-extrabold text-rose-600 font-mono mt-0.5 block">{rejectedCount}</span>
            <span className="text-[10px] text-slate-500 font-medium">Defects identified</span>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200/60">
            <AlertTriangle className="size-4" />
          </div>
        </div>
      </div>

      {/* EXPIRY SWEEP BANNER */}
      {sweepResult && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-600" />
            <span className="font-bold text-emerald-900">
              Document Expiry Sweep Executed: Checked {sweepResult.checkedCount || totalCount} documents.
            </span>
          </div>
          <button
            onClick={() => setSweepResult(null)}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 3. FILTERS & SEARCH */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by document type, file name, client, or case #..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium text-slate-800 placeholder-slate-400"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="w-full sm:w-52 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-semibold text-slate-700"
        >
          <option value="ALL">All Document States</option>
          <option value="SUBMITTED">Pending Review</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="PENDING">Pending Upload</option>
        </select>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 4. DOCUMENTS VAULT TABLE */}
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
            <p className="text-xs font-bold text-rose-600">Failed to load document vault.</p>
            <button
              onClick={() => refetch()}
              className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
            >
              Retry Loading
            </button>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <h3 className="text-sm font-bold text-slate-800">No documents found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Uploaded client documentation will appear in this centralized repository.
            </p>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Document Key / Type</th>
                    <th className="py-3 px-4">Dossier #</th>
                    <th className="py-3 px-4">Client Entity</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">File Size / Format</th>
                    <th className="py-3 px-4">Upload Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {paginatedDocs.map(({ req, application }) => (
                    <tr key={req.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-3 px-4">
                        <Link
                          href={`/admin/documents/${req.id}`}
                          className="font-bold text-xs text-slate-900 group-hover:text-amber-700 transition-colors block"
                        >
                          {req.documentName || req.requirementKey?.replace(/_/g, " ") || "Statutory Document"}
                        </Link>
                        <span className="font-mono text-[10px] text-slate-400 block mt-0.5">
                          {req.requirementKey}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/admin/applications/${application.id}`}
                          className="font-mono text-xs font-bold text-amber-700 hover:text-amber-800 hover:underline"
                        >
                          #{application.applicationNumber}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-800 font-semibold">
                        {application.client?.fullName || application.client?.businessName || "Verified Client"}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                          req.status === "APPROVED"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                            : req.status === "REJECTED"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : req.status === "SUBMITTED"
                            ? "bg-amber-50 text-amber-800 border-amber-200/80"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-slate-500">
                        {req.fileSize ? `${Math.round(req.fileSize / 1024)} KB` : "—"}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500 font-medium">
                        {formatDate(req.uploadedAt || req.updatedAt || req.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link href={`/admin/documents/${req.id}`}>
                          <button className="bg-white border border-slate-200 text-slate-700 font-bold text-xs px-2.5 py-1 rounded-lg hover:bg-slate-50 transition-all inline-flex items-center gap-1">
                            <Eye className="size-3 text-slate-500" />
                            <span>Inspect</span>
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PAGINATION FOOTER */}
            {totalPages > 1 && (
              <div className="px-4 py-3 bg-slate-50/60 border-t border-slate-200/80 flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>
                  Page {page} of {totalPages} ({filteredDocuments.length} total items)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page >= totalPages}
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
    </div>
  );
}
