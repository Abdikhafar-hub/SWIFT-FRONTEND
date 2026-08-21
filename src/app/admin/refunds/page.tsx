"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  RotateCcw,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  DollarSign,
  Plus,
  Play,
  Filter,
  FileText,
  Building2,
  Smartphone,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import { adminApi } from "@/lib/api/admin";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { Refund, RefundStatus, PaymentMethod } from "@/types";
import { AdminInitiateRefundModal } from "@/components/domain/admin/admin-initiate-refund-modal";
import {
  AdminApproveRefundModal,
  AdminProcessRefundModal,
  AdminCompleteRefundModal,
  AdminRejectRefundModal,
  AdminCancelRefundModal,
} from "@/components/domain/admin/admin-refund-modals";

const REASON_CATEGORIES = [
  { value: "CLIENT_OVERPAYMENT", label: "Client Overpayment" },
  { value: "DUPLICATE_PAYMENT", label: "Duplicate Payment Entry" },
  { value: "SERVICE_CANCELLATION", label: "Service Cancellation" },
  { value: "SERVICE_NOT_DELIVERED", label: "Service Not Delivered" },
  { value: "GOVERNMENT_FEE_ADJUSTMENT", label: "Government Fee Adjustment" },
  { value: "INCORRECT_BILLING", label: "Incorrect Billing / Price Adjustment" },
  { value: "FAILED_SERVICE_PROCESSING", label: "Application Failed Processing" },
  { value: "GOODWILL_ADJUSTMENT", label: "Goodwill Commercial Concession" },
  { value: "OTHER", label: "Other Operational Reason" },
];

export default function AdminRefundsPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [methodFilter, setMethodFilter] = useState<string>("");
  const [page, setPage] = useState(1);

  // Modals state
  const [isInitiateOpen, setIsInitiateOpen] = useState(false);
  const [selectedRefundForApprove, setSelectedRefundForApprove] = useState<Refund | null>(null);
  const [selectedRefundForProcess, setSelectedRefundForProcess] = useState<Refund | null>(null);
  const [selectedRefundForComplete, setSelectedRefundForComplete] = useState<Refund | null>(null);
  const [selectedRefundForReject, setSelectedRefundForReject] = useState<Refund | null>(null);
  const [selectedRefundForCancel, setSelectedRefundForCancel] = useState<Refund | null>(null);

  // Fetch Refunds with filters
  const {
    data: refundsResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-refunds-list", page, statusFilter, categoryFilter, methodFilter, search],
    queryFn: () =>
      adminApi.getRefunds({
        page,
        limit: 15,
        status: statusFilter || undefined,
        reasonCategory: categoryFilter || undefined,
        refundMethod: methodFilter || undefined,
        search: search || undefined,
      }),
  });

  const rawRefunds: Refund[] = refundsResponse?.items || [];
  const pagination = refundsResponse?.pagination;
  const metrics = refundsResponse?.metrics || {
    pendingApproval: rawRefunds.filter((r) => r.status === "PENDING_APPROVAL" || r.status === "REQUESTED").length,
    processingRefunds: rawRefunds.filter((r) => r.status === "PROCESSING").length,
    completedThisMonth: rawRefunds.filter((r) => r.status === "COMPLETED").length,
    totalRefunded: rawRefunds
      .filter((r) => r.status === "COMPLETED")
      .reduce((sum, r) => sum + Number(r.amount || 0), 0)
      .toString(),
    failedOrRejected: rawRefunds.filter((r) => r.status === "FAILED" || r.status === "REJECTED").length,
  };

  const getStatusBadge = (status: RefundStatus) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="size-3 text-emerald-600" />
            COMPLETED
          </span>
        );
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
            <CheckCircle2 className="size-3 text-amber-600" />
            APPROVED
          </span>
        );
      case "PROCESSING":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
            <Clock className="size-3 text-blue-600 animate-spin" />
            PROCESSING
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-200">
            <XCircle className="size-3 text-rose-600" />
            REJECTED
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
            CANCELLED
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-900 border border-rose-300">
            <ShieldAlert className="size-3 text-rose-700" />
            FAILED
          </span>
        );
      case "PENDING_APPROVAL":
      case "REQUESTED":
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 border border-amber-500/20">
            <Clock className="size-3 text-amber-600" />
            PENDING APPROVAL
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-4 sm:p-5 lg:p-6 space-y-4 max-w-[1550px] mx-auto font-sans">
      {/* ------------------------------------------------------------------ */}
      {/* 1. HEADER SECTION & PRIMARY ACTION */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <RotateCcw className="h-6 w-6 text-amber-600" />
            <span>Refund Claims &amp; Financial Reversals</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Operational refund management module, manual disbursement initiation, and ledger audit logs.
          </p>
        </div>

        <div>
          <button
            onClick={() => setIsInitiateOpen(true)}
            className="flex items-center space-x-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-xs font-semibold text-slate-950 hover:from-amber-400 hover:to-amber-500 transition-all shadow-md shadow-amber-500/10"
          >
            <Plus className="h-4 w-4" />
            <span>+ Initiate Refund</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. REAL-TIME KPI METRICS CARDS */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Pending Approval
            </span>
            <span className="text-xl font-extrabold text-amber-600 font-mono mt-0.5 block">
              {metrics.pendingApproval}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Awaiting compliance sign-off</span>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60">
            <Clock className="size-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Processing Refunds
            </span>
            <span className="text-xl font-extrabold text-blue-600 font-mono mt-0.5 block">
              {metrics.processingRefunds}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">In bank / M-Pesa queue</span>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/60">
            <Play className="size-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Completed This Month
            </span>
            <span className="text-xl font-extrabold text-emerald-600 font-mono mt-0.5 block">
              {metrics.completedThisMonth}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Successfully disbursed</span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60">
            <CheckCircle2 className="size-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Total Refunded Value
            </span>
            <span className="text-xl font-extrabold text-slate-900 font-mono mt-0.5 block">
              {formatCurrency(metrics.totalRefunded)}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Cumulative completed</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
            <DollarSign className="size-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between col-span-2 lg:col-span-1">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Failed / Rejected
            </span>
            <span className="text-xl font-extrabold text-rose-600 font-mono mt-0.5 block">
              {metrics.failedOrRejected}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Declined or failed payout</span>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200/60">
            <XCircle className="size-4" />
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. ADVANCED SEARCH & FILTERS */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search refund #, client, invoice, phone, M-Pesa ref..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium text-slate-800 placeholder-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-semibold text-slate-700"
          >
            <option value="">All Refund States</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="PROCESSING">Processing</option>
            <option value="COMPLETED">Completed</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="FAILED">Failed</option>
          </select>

          {/* Reason Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-semibold text-slate-700"
          >
            <option value="">All Reason Categories</option>
            {REASON_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>

          {/* Payment Method Filter */}
          <select
            value={methodFilter}
            onChange={(e) => {
              setMethodFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-semibold text-slate-700"
          >
            <option value="">All Payment Methods</option>
            <option value="MPESA">M-Pesa</option>
            <option value="BANK">Bank Transfer</option>
            <option value="CASH">Cash</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 4. REFUNDS TABLE & MOBILE RESPONSIVE CARDS */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 bg-slate-100 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <p className="text-xs font-bold text-rose-600">Failed to load refund records.</p>
            <button
              onClick={() => refetch()}
              className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
            >
              Retry Loading
            </button>
          </div>
        ) : rawRefunds.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <RotateCcw className="size-8 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No refund records found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No refund claims match the selected search or filter parameters.
            </p>
          </div>
        ) : (
          <div>
            {/* Desktop Table View (>= 768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Refund #</th>
                    <th className="py-3 px-4">Client Entity</th>
                    <th className="py-3 px-4">Claim Amount</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Reason Category</th>
                    <th className="py-3 px-4">Invoice / Tx Ref</th>
                    <th className="py-3 px-4">Date Initiated</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {rawRefunds.map((refund) => (
                    <tr key={refund.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-3 px-4">
                        <Link
                          href={`/admin/refunds/${refund.id}`}
                          className="font-mono text-xs font-bold text-amber-700 hover:underline block"
                        >
                          {refund.refundNumber || `#${refund.id.slice(0, 8)}`}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <span className="font-semibold text-slate-900 block">
                            {refund.client?.fullName || "Client"}
                          </span>
                          <span className="text-[11px] text-slate-500 block">
                            {refund.client?.email || refund.recipientPhone || "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs font-bold text-slate-900">
                        {formatCurrency(refund.amount, refund.currency || "KES")}
                      </td>
                      <td className="py-3 px-4">
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                          {refund.refundMethod || "MPESA"}
                        </span>
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(refund.status)}</td>
                      <td className="py-3 px-4 text-xs text-slate-600 font-medium max-w-xs truncate">
                        {refund.reasonCategory || refund.reason || "General"}
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/admin/invoices/${refund.paymentId}`}
                          className="font-mono text-xs text-slate-500 font-semibold hover:underline block"
                        >
                          {refund.payment?.invoiceNumber || `#${refund.paymentId.slice(0, 8)}`}
                        </Link>
                        {refund.externalReference && (
                          <span className="text-[10px] font-mono text-slate-400 block truncate max-w-[120px]">
                            Ref: {refund.externalReference}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500 font-mono">
                        {formatDate(refund.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {(refund.status === "PENDING_APPROVAL" || refund.status === "REQUESTED") && (
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

                          {refund.status === "APPROVED" && (
                            <button
                              onClick={() => setSelectedRefundForProcess(refund)}
                              className="bg-amber-50 border border-amber-300 text-amber-800 hover:bg-amber-100 font-bold text-xs px-2.5 py-1 rounded-lg transition-all inline-flex items-center gap-1"
                            >
                              <Play className="size-3 text-amber-700" />
                              <span>Process</span>
                            </button>
                          )}

                          {(refund.status === "PROCESSING" || refund.status === "APPROVED") && (
                            <button
                              onClick={() => setSelectedRefundForComplete(refund)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-2.5 py-1 rounded-lg transition-all inline-flex items-center gap-1"
                            >
                              <CheckCircle2 className="size-3" />
                              <span>Complete</span>
                            </button>
                          )}

                          <Link href={`/admin/refunds/${refund.id}`}>
                            <span className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-2.5 py-1 rounded-lg transition-all inline-block">
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

            {/* Mobile Card Grid View (< 768px) */}
            <div className="md:hidden divide-y divide-slate-100">
              {rawRefunds.map((refund) => (
                <div key={refund.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/admin/refunds/${refund.id}`}
                      className="font-mono text-sm font-bold text-amber-700 hover:underline"
                    >
                      {refund.refundNumber || `#${refund.id.slice(0, 8)}`}
                    </Link>
                    {getStatusBadge(refund.status)}
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Client:</span>
                    <span className="font-semibold text-slate-900">{refund.client?.fullName || "Client"}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Claim Amount:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatCurrency(refund.amount, refund.currency || "KES")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Method:</span>
                    <span className="font-medium text-slate-700">{refund.refundMethod || "MPESA"}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-mono">
                      {formatDate(refund.createdAt)}
                    </span>

                    <div className="flex items-center space-x-1.5">
                      {(refund.status === "PENDING_APPROVAL" || refund.status === "REQUESTED") && (
                        <button
                          onClick={() => setSelectedRefundForApprove(refund)}
                          className="bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[11px] px-2.5 py-1 rounded-lg"
                        >
                          Approve
                        </button>
                      )}
                      {(refund.status === "PROCESSING" || refund.status === "APPROVED") && (
                        <button
                          onClick={() => setSelectedRefundForComplete(refund)}
                          className="bg-emerald-600 text-white font-bold text-[11px] px-2.5 py-1 rounded-lg"
                        >
                          Complete
                        </button>
                      )}
                      <Link
                        href={`/admin/refunds/${refund.id}`}
                        className="bg-slate-900 text-white font-bold text-[11px] px-2 py-1 rounded-lg flex items-center gap-0.5"
                      >
                        <span>Dossier</span>
                        <ChevronRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
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

      {/* INITIATE REFUND MODAL */}
      <AdminInitiateRefundModal
        isOpen={isInitiateOpen}
        onClose={() => setIsInitiateOpen(false)}
        onSuccess={() => {
          refetch();
          queryClient.invalidateQueries({ queryKey: ["admin-financial-summary"] });
        }}
      />

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

      {/* PROCESS REFUND MODAL */}
      {selectedRefundForProcess && (
        <AdminProcessRefundModal
          refundId={selectedRefundForProcess.id}
          refundNumber={selectedRefundForProcess.refundNumber}
          amount={selectedRefundForProcess.amount}
          isOpen={Boolean(selectedRefundForProcess)}
          onClose={() => setSelectedRefundForProcess(null)}
          onSuccess={() => {
            refetch();
            queryClient.invalidateQueries({ queryKey: ["admin-financial-summary"] });
          }}
        />
      )}

      {/* COMPLETE REFUND MODAL */}
      {selectedRefundForComplete && (
        <AdminCompleteRefundModal
          refundId={selectedRefundForComplete.id}
          refundNumber={selectedRefundForComplete.refundNumber}
          amount={selectedRefundForComplete.amount}
          isOpen={Boolean(selectedRefundForComplete)}
          onClose={() => setSelectedRefundForComplete(null)}
          onSuccess={() => {
            refetch();
            queryClient.invalidateQueries({ queryKey: ["admin-financial-summary"] });
            queryClient.invalidateQueries({ queryKey: ["admin-invoices-list"] });
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

      {/* CANCEL REFUND MODAL */}
      {selectedRefundForCancel && (
        <AdminCancelRefundModal
          refundId={selectedRefundForCancel.id}
          refundNumber={selectedRefundForCancel.refundNumber}
          isOpen={Boolean(selectedRefundForCancel)}
          onClose={() => setSelectedRefundForCancel(null)}
          onSuccess={() => {
            refetch();
            queryClient.invalidateQueries({ queryKey: ["admin-financial-summary"] });
          }}
        />
      )}
    </div>
  );
}
