"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FileCheck,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  AlertTriangle,
  FileText,
  User,
  Filter,
} from "lucide-react";
import { adminApi } from "@/lib/api/admin";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { Skeleton, ErrorState, EmptyState } from "@/components/ui/feedback-primitives";
import { AdminReviewPaymentProofModal } from "@/components/domain/admin-review-payment-proof-modal";

export default function AdminPaymentVerificationsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("PENDING_REVIEW");
  const [page, setPage] = useState(1);

  const [selectedProofId, setSelectedProofId] = useState<string | null>(null);

  const {
    data: proofData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-payment-proofs", page, statusFilter, search],
    queryFn: () =>
      adminApi.getPaymentProofs({
        page,
        limit: 20,
        status: statusFilter || undefined,
        search: search || undefined,
      }),
  });

  const submissions = proofData?.data || [];
  const pagination = proofData?.pagination;

  const pendingCount = submissions.filter((s: any) => s.status === "PENDING_REVIEW").length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-4 sm:p-5 lg:p-6 space-y-4 max-w-[1550px] mx-auto font-sans">
      {/* ------------------------------------------------------------------ */}
      {/* 1. HEADER SECTION */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/80">
            Financial Audit Queue
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Manual Payment Verifications
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Audit client bank deposit slips, M-Pesa transfer references, and execute atomic receipt approvals.
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. SEARCH & FILTERS */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search reference #, client name, or invoice..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium text-slate-800 placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-semibold text-slate-700"
          >
            <option value="PENDING_REVIEW">Pending Review Queue</option>
            <option value="APPROVED">Approved Payment Proofs</option>
            <option value="REJECTED">Rejected Proofs</option>
            <option value="">All Verification Submissions</option>
          </select>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. VERIFICATIONS QUEUE TABLE */}
      {/* ------------------------------------------------------------------ */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      ) : error ? (
        <ErrorState title="Unable to Load Queue" message="Failed to retrieve payment proof submissions." onRetry={() => refetch()} />
      ) : submissions.length === 0 ? (
        <EmptyState
          icon={<FileCheck className="size-8" />}
          title="No Payment Proof Submissions"
          description="There are currently no manual payment proofs waiting for verification in this view."
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Target Invoice</th>
                  <th className="py-3 px-4">Claimed Amount</th>
                  <th className="py-3 px-4">Method &amp; Ref</th>
                  <th className="py-3 px-4">Submitted At</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {submissions.map((sub: any) => {
                  const clientName = sub.client?.fullName || "Client";
                  const invNum = sub.payment?.invoiceNumber || "INV";
                  const status = sub.status;

                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        <div>
                          <strong className="block text-slate-900">{clientName}</strong>
                          <span className="text-[10px] text-slate-400 font-mono">{sub.client?.email}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        <Link href={`/admin/invoices/${sub.paymentId}`} className="hover:text-amber-600 underline decoration-slate-300">
                          #{invNum}
                        </Link>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {formatCurrency(sub.claimedAmount)}
                      </td>

                      <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200 uppercase mr-1">
                          {sub.paymentMethod}
                        </span>
                        <strong className="text-slate-900 uppercase">{sub.referenceNumber || "N/A"}</strong>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 font-medium whitespace-nowrap">
                        {formatDate(sub.createdAt)}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border ${
                            status === "APPROVED"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200/80"
                              : status === "REJECTED"
                              ? "bg-rose-50 text-rose-800 border-rose-200/80"
                              : "bg-amber-50 text-amber-800 border-amber-200/80"
                          }`}
                        >
                          {status === "PENDING_REVIEW" ? "Pending Review" : status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedProofId(sub.id)}
                          className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ml-auto shadow-xs"
                        >
                          <Eye className="size-3.5 text-amber-400" />
                          <span>Review Proof</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {selectedProofId && (
        <AdminReviewPaymentProofModal
          isOpen={!!selectedProofId}
          onClose={() => setSelectedProofId(null)}
          proofId={selectedProofId}
          onSuccess={() => {
            refetch();
            queryClient.invalidateQueries({ queryKey: ["admin-invoices-list"] });
          }}
        />
      )}
    </div>
  );
}
