"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  RotateCcw,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  DollarSign,
  Eye,
  ArrowRight,
  Sliders,
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
import {
  AdminApproveRefundModal,
  AdminRejectRefundModal,
} from "@/components/domain";
import { EmptyState, Skeleton, ErrorState } from "@/components/ui/feedback-primitives";
import { adminApi } from "@/lib/api/admin";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { Refund, RefundStatus } from "@/types";

export default function AdminRefundsPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);

  // Modals state
  const [selectedRefundForApprove, setSelectedRefundForApprove] = useState<Refund | null>(null);
  const [selectedRefundForReject, setSelectedRefundForReject] = useState<Refund | null>(null);

  // Query refunds
  const {
    data: refundsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-refunds-list", page, statusFilter],
    queryFn: () =>
      adminApi.getRefunds({
        page,
        limit: 15,
        status: statusFilter || undefined,
      }),
  });

  const rawRefunds: Refund[] = Array.isArray(refundsData)
    ? refundsData
    : (refundsData as any)?.items || [];
  const pagination = Array.isArray(refundsData) ? null : (refundsData as any)?.pagination;

  // Search filter
  const filteredRefunds = rawRefunds.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const matchNum = r.refundNumber?.toLowerCase().includes(q);
    const matchReason = r.reason?.toLowerCase().includes(q);
    const matchTx = r.transactionId?.toLowerCase().includes(q);
    const matchPay = r.paymentId?.toLowerCase().includes(q);
    return matchNum || matchReason || matchTx || matchPay;
  });

  // Metrics
  const requestedCount = rawRefunds.filter((r) => r.status === "REQUESTED").length;
  const approvedCount = rawRefunds.filter((r) => r.status === "APPROVED" || r.status === "PROCESSING").length;
  const completedCount = rawRefunds.filter((r) => r.status === "COMPLETED").length;
  const totalRefundedSum = rawRefunds
    .filter((r) => r.status === "COMPLETED")
    .reduce((sum, r) => sum + Number(r.amount || 0), 0);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-4 sm:p-5 lg:p-6 space-y-4 max-w-[1550px] mx-auto font-sans">
      {/* ------------------------------------------------------------------ */}
      {/* 1. HEADER SECTION */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Refund Claims &amp; Reversals
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Disputed statutory payments, customer refund authorizations, and escrow balances.
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. REFUND METRICS */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Pending Approval</span>
            <span className="text-xl font-extrabold text-amber-600 font-mono mt-0.5 block">{requestedCount}</span>
            <span className="text-[10px] text-slate-500 font-medium">Awaiting compliance sign-off</span>
          </div>
          <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60">
            <Clock className="size-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Approved &amp; Queued</span>
            <span className="text-xl font-extrabold text-slate-900 font-mono mt-0.5 block">{approvedCount}</span>
            <span className="text-[10px] text-slate-500 font-medium">Ready for disbursement</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
            <RotateCcw className="size-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Completed Refunds</span>
            <span className="text-xl font-extrabold text-emerald-600 font-mono mt-0.5 block">{completedCount}</span>
            <span className="text-[10px] text-slate-500 font-medium">Disbursed to clients</span>
          </div>
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60">
            <CheckCircle2 className="size-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Value Refunded</span>
            <span className="text-xl font-extrabold text-slate-700 font-mono mt-0.5 block">{formatCurrency(totalRefundedSum)}</span>
            <span className="text-[10px] text-slate-500 font-medium">Cumulative refunded amount</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-100 text-slate-600 border border-slate-200">
            <DollarSign className="size-4" />
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
            placeholder="Search by refund #, reason, or payment reference..."
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
            <option value="">All Refund States</option>
            <option value="REQUESTED">Requested / Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="PROCESSING">Processing</option>
            <option value="COMPLETED">Completed</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 4. REFUNDS TABLE */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-slate-100 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <p className="text-xs font-bold text-rose-600">Failed to load refund claims.</p>
            <button
              onClick={() => refetch()}
              className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
            >
              Retry Loading
            </button>
          </div>
        ) : filteredRefunds.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <RotateCcw className="size-8 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No refund records found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No refund claims match the current filter parameters.
            </p>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Refund #</th>
                    <th className="py-3 px-4">Claim Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Reason &amp; Justification</th>
                    <th className="py-3 px-4">Payment Reference</th>
                    <th className="py-3 px-4">Date Filed</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredRefunds.map((refund) => (
                    <tr key={refund.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-3 px-4">
                        <Link
                          href={`/admin/refunds/${refund.id}`}
                          className="font-mono text-xs font-bold text-amber-700 hover:underline block"
                        >
                          {refund.refundNumber || `#${refund.id.slice(0, 8)}`}
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs font-bold text-slate-900">
                        {formatCurrency(refund.amount)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                            refund.status === "COMPLETED"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200/80"
                              : refund.status === "REJECTED"
                              ? "bg-rose-50 text-rose-800 border-rose-200/80"
                              : refund.status === "APPROVED" || refund.status === "PROCESSING"
                              ? "bg-amber-50 text-amber-800 border-amber-200/80"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {refund.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-700 font-medium max-w-xs truncate">
                        {refund.reason || "Client Refund Claim"}
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/admin/invoices/${refund.paymentId}`}
                          className="font-mono text-xs text-slate-500 font-semibold hover:underline"
                        >
                          #{refund.paymentId.slice(0, 8)}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500 font-mono">
                        {formatDate(refund.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {refund.status === "REQUESTED" && (
                            <>
                              <button
                                onClick={() => setSelectedRefundForApprove(refund)}
                                className="bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold text-xs px-2.5 py-1 rounded-lg transition-all inline-flex items-center gap-1"
                              >
                                <CheckCircle2 className="size-3 text-emerald-600" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => setSelectedRefundForReject(refund)}
                                className="bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 font-bold text-xs px-2.5 py-1 rounded-lg transition-all inline-flex items-center gap-1"
                              >
                                <XCircle className="size-3 text-rose-600" />
                                <span>Reject</span>
                              </button>
                            </>
                          )}
                          <Link href={`/admin/refunds/${refund.id}`}>
                            <span className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-2.5 py-1 rounded-lg transition-all inline-block">
                              Dossier
                            </span>
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

      {/* APPROVE REFUND MODAL */}
      {selectedRefundForApprove && (
        <AdminApproveRefundModal
          refundId={selectedRefundForApprove.id}
          refundNumber={selectedRefundForApprove.refundNumber}
          amount={selectedRefundForApprove.amount}
          isOpen={Boolean(selectedRefundForApprove)}
          onClose={() => setSelectedRefundForApprove(null)}
          onSuccess={() => {
            refetch();
            queryClient.invalidateQueries({ queryKey: ["admin-financial-summary"] });
          }}
        />
      )}

      {/* REJECT REFUND MODAL */}
      {selectedRefundForReject && (
        <AdminRejectRefundModal
          refundId={selectedRefundForReject.id}
          refundNumber={selectedRefundForReject.refundNumber}
          isOpen={Boolean(selectedRefundForReject)}
          onClose={() => setSelectedRefundForReject(null)}
          onSuccess={() => {
            refetch();
            queryClient.invalidateQueries({ queryKey: ["admin-financial-summary"] });
          }}
        />
      )}
    </div>
  );
}
