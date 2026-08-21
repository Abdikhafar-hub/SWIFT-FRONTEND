"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CreditCard,
  DollarSign,
  Receipt as ReceiptIcon,
  RotateCcw,
  Search,
  Plus,
  ArrowRight,
  TrendingUp,
  Download,
  AlertTriangle,
  Building,
  User,
  Sliders,
  Calendar,
  Clock,
  Eye,
  CheckCircle2,
  PieChart,
  ShieldCheck,
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
import { Modal } from "@/components/ui/modal";
import { FormField, Textarea } from "@/components/ui/form-primitives";
import { PaymentStatusBadge } from "@/components/domain/status-badges";
import {
  AdminManualPaymentModal,
  AdminCreateInvoiceModal,
  AdminInvoiceDetailModal,
  AdminFinancialAdjustmentModal,
  AdminReverseTransactionModal,
  AdminReceiptDetailModal,
  AdminInitiateRefundModal,
  AdminApproveRefundModal,
} from "@/components/domain";
import { EmptyState, Skeleton, ErrorState } from "@/components/ui/feedback-primitives";
import { adminApi } from "@/lib/api/admin";
import { formatDate, formatCurrency } from "@/lib/utils/format";
import type {
  Payment,
  PaymentTransaction,
  Receipt,
  Refund,
  AgingBucket,
  OutstandingInvoice,
} from "@/types";

type FinancialTab = "invoices" | "transactions" | "receipts" | "refunds" | "aging";

export default function AdminPaymentsPage() {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<FinancialTab>("invoices");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selectedAgingBucket, setSelectedAgingBucket] = useState<AgingBucket | undefined>(undefined);

  // Modals state
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [selectedInvoiceForPay, setSelectedInvoiceForPay] = useState<Payment | null>(null);
  const [selectedInvoiceForAdjust, setSelectedInvoiceForAdjust] = useState<Payment | null>(null);
  const [selectedTxForReverse, setSelectedTxForReverse] = useState<PaymentTransaction | null>(null);
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);
  const [selectedTxForRefund, setSelectedTxForRefund] = useState<PaymentTransaction | null>(null);
  const [isRequestRefundOpen, setIsRequestRefundOpen] = useState(false);
  const [selectedRefundForReview, setSelectedRefundForReview] = useState<Refund | null>(null);
  const [isBreakdownModalOpen, setIsBreakdownModalOpen] = useState(false);

  // Financial summary KPIs
  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ["admin-financial-summary"],
    queryFn: () => adminApi.getFinancialSummary(),
  });

  // Collections by method
  const { data: collectionsData } = useQuery({
    queryKey: ["admin-financial-collections"],
    queryFn: () => adminApi.getFinancialCollections(),
    enabled: activeTab === "aging",
  });

  // Outstanding / Aging Query
  const { data: outstandingData, isLoading: isOutstandingLoading } = useQuery({
    queryKey: ["admin-outstanding-invoices", selectedAgingBucket, page],
    queryFn: () =>
      adminApi.getOutstandingInvoices({
        page,
        limit: 15,
        agingBucket: selectedAgingBucket,
      }),
    enabled: activeTab === "aging",
  });

  // Invoices Query
  const {
    data: invoicesData,
    isLoading: isInvoicesLoading,
    error: invoicesError,
    refetch: refetchInvoices,
  } = useQuery({
    queryKey: ["admin-invoices-list", page, search, statusFilter],
    queryFn: () =>
      adminApi.getInvoices({
        page,
        limit: 10,
        search: search || undefined,
        status: statusFilter || undefined,
      }),
    enabled: activeTab === "invoices",
  });

  // Transactions Query
  const {
    data: transactionsData,
    isLoading: isTxLoading,
    error: txError,
  } = useQuery({
    queryKey: ["admin-transactions-list", page, search],
    queryFn: () =>
      adminApi.getTransactions({
        page,
        limit: 10,
        search: search || undefined,
      }),
    enabled: activeTab === "transactions",
  });

  // Receipts Query
  const {
    data: receiptsData,
    isLoading: isReceiptsLoading,
  } = useQuery({
    queryKey: ["admin-receipts-list", page],
    queryFn: () => adminApi.getReceipts({ page, limit: 10 }),
    enabled: activeTab === "receipts",
  });

  // Refunds Query
  const {
    data: refundsData,
    isLoading: isRefundsLoading,
  } = useQuery({
    queryKey: ["admin-refunds-list", page],
    queryFn: () => adminApi.getRefunds({ page, limit: 10 }),
    enabled: activeTab === "refunds",
  });

  const invoices = invoicesData?.items || [];
  const transactions = transactionsData?.items || [];
  const receipts = Array.isArray(receiptsData) ? receiptsData : receiptsData?.items || [];
  const refunds = Array.isArray(refundsData) ? refundsData : refundsData?.items || [];
  const outstandingList = outstandingData?.items || [];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-4 sm:p-5 lg:p-6 space-y-4 max-w-[1550px] mx-auto font-sans">
      {/* ------------------------------------------------------------------ */}
      {/* 1. HEADER SECTION */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Financial Operations &amp; Invoicing
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Commercial revenue tracking, statutory fee disbursements, M-Pesa automated settlement, aging analysis, and bank deposits.
          </p>
        </div>

        {activeTab === "invoices" && (
          <button
            onClick={() => setIsCreateInvoiceOpen(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
          >
            <Plus className="size-3.5" />
            <span>Create Commercial Invoice</span>
          </button>
        )}

        {activeTab === "refunds" && (
          <button
            onClick={() => setIsRequestRefundOpen(true)}
            className="bg-white border border-slate-200 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-xl hover:bg-slate-50 transition-all shadow-xs flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
          >
            <Plus className="size-3.5 text-slate-500" />
            <span>Request Refund Claim</span>
          </button>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. FINANCIAL EXECUTIVE KPIS */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Gross Invoiced</span>
            <span className="text-xl font-extrabold text-slate-900 font-mono mt-0.5 block">{formatCurrency(Number(summary?.metrics.totalInvoiced || 0))}</span>
            <span className="text-[10px] text-slate-500 font-medium">{summary?.metrics.totalInvoices ?? 0} total invoices</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
            <DollarSign className="size-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Settled Collections</span>
            <span className="text-xl font-extrabold text-emerald-600 font-mono mt-0.5 block">{formatCurrency(Number(summary?.metrics.totalCollected || 0))}</span>
            <span className="text-[10px] text-slate-500 font-medium">M-Pesa + Bank clearing</span>
          </div>
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60">
            <TrendingUp className="size-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Outstanding Due</span>
            <span className="text-xl font-extrabold text-amber-600 font-mono mt-0.5 block">{formatCurrency(Number(summary?.metrics.totalOutstanding || 0))}</span>
            <span className="text-[10px] text-slate-500 font-medium">Awaiting client settlement</span>
          </div>
          <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60">
            <CreditCard className="size-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Overdue Aging</span>
            <span className="text-xl font-extrabold text-rose-600 font-mono mt-0.5 block">{formatCurrency(Number(summary?.metrics.totalOverdue || 0))}</span>
            <span className="text-[10px] text-slate-500 font-medium">{summary?.metrics.overdueInvoicesCount ?? 0} overdue invoices</span>
          </div>
          <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200/60">
            <AlertTriangle className="size-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Net Rev</span>
            <button
              type="button"
              onClick={() => setIsBreakdownModalOpen(true)}
              className="text-[10px] text-amber-700 hover:underline font-bold flex items-center gap-1"
            >
              <PieChart className="size-3" />
              <span>Breakdown</span>
            </button>
          </div>
          <div className="font-mono text-xl font-extrabold text-slate-900 mt-0.5">
            {formatCurrency(Number(summary?.metrics.netRevenue || 0))}
          </div>
          <span className="text-[10px] text-slate-500 font-medium">
            Refunds: {formatCurrency(Number(summary?.metrics.totalRefunded || 0))}
          </span>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. TAB CONTROLS */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-xl p-1.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-wrap items-center gap-1">
        <button
          type="button"
          onClick={() => {
            setActiveTab("invoices");
            setPage(1);
          }}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
            activeTab === "invoices"
              ? "bg-amber-50 text-amber-900 border border-amber-200/80 shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <DollarSign className="size-3.5 text-amber-700" />
          <span>Invoices Directory</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("transactions");
            setPage(1);
          }}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
            activeTab === "transactions"
              ? "bg-amber-50 text-amber-900 border border-amber-200/80 shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <CreditCard className="size-3.5 text-amber-700" />
          <span>Payment Transactions</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("receipts");
            setPage(1);
          }}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
            activeTab === "receipts"
              ? "bg-amber-50 text-amber-900 border border-amber-200/80 shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <ReceiptIcon className="size-3.5 text-amber-700" />
          <span>Statutory Receipts</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("refunds");
            setPage(1);
          }}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
            activeTab === "refunds"
              ? "bg-amber-50 text-amber-900 border border-amber-200/80 shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <RotateCcw className="size-3.5 text-amber-700" />
          <span>Refunds &amp; Adjustments</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("aging");
            setPage(1);
          }}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
            activeTab === "aging"
              ? "bg-amber-50 text-amber-900 border border-amber-200/80 shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Clock className="size-3.5 text-amber-700" />
          <span>Aging &amp; Collections Analytics</span>
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 4. TAB VIEWS */}
      {/* ------------------------------------------------------------------ */}
      <div>
        {/* TAB 1: INVOICES */}
        {activeTab === "invoices" && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by invoice # or client name..."
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
                  <option value="">All Invoice Statuses</option>
                  <option value="ISSUED">Issued &amp; Active</option>
                  <option value="PAID">Paid in Full</option>
                  <option value="PARTIALLY_PAID">Partially Paid</option>
                  <option value="PENDING">Pending Settlement</option>
                  <option value="OVERDUE">Overdue Receivables</option>
                  <option value="DRAFT">Internal Draft</option>
                  <option value="CANCELLED">Cancelled / Void</option>
                </select>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
              {isInvoicesLoading ? (
                <div className="p-6 space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-12 bg-slate-100 animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : invoicesError ? (
                <div className="p-8 text-center space-y-3">
                  <p className="text-xs font-bold text-rose-600">Failed to load invoices.</p>
                  <button
                    onClick={() => refetchInvoices()}
                    className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
                  >
                    Retry Loading
                  </button>
                </div>
              ) : invoices.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <CreditCard className="size-8 text-slate-300 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-800">No invoices found</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    No commercial invoices match the specified criteria.
                  </p>
                  <button
                    onClick={() => setIsCreateInvoiceOpen(true)}
                    className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition-colors inline-flex items-center gap-1.5"
                  >
                    <Plus className="size-3.5" />
                    <span>Create First Invoice</span>
                  </button>
                </div>
              ) : (
                <div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                          <th className="py-3 px-4">Invoice #</th>
                          <th className="py-3 px-4">Client Entity</th>
                          <th className="py-3 px-4 text-right">Total Amount</th>
                          <th className="py-3 px-4 text-right">Settled</th>
                          <th className="py-3 px-4 text-right">Balance Due</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Issued Date</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {invoices.map((inv) => (
                          <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors group">
                            <td className="py-3 px-4">
                              <button
                                type="button"
                                onClick={() => setSelectedInvoiceId(inv.id)}
                                className="font-mono text-xs font-bold text-amber-700 hover:underline text-left"
                              >
                                #{inv.invoiceNumber}
                              </button>
                            </td>
                            <td className="py-3 px-4 font-bold text-xs text-slate-800">
                              {inv.client?.fullName || "Verified Entity"}
                            </td>
                            <td className="py-3 px-4 font-bold text-xs text-slate-900 font-mono text-right">
                              {formatCurrency(inv.totalAmount, inv.currency)}
                            </td>
                            <td className="py-3 px-4 font-mono text-xs text-emerald-600 font-bold text-right">
                              {formatCurrency(inv.amountPaid, inv.currency)}
                            </td>
                            <td className="py-3 px-4 font-mono text-xs text-amber-700 font-bold text-right">
                              {formatCurrency(inv.amountDue, inv.currency)}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                  inv.status === "PAID"
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-200/80"
                                    : inv.status === "OVERDUE"
                                    ? "bg-rose-50 text-rose-800 border-rose-200/80"
                                    : inv.status === "DRAFT"
                                    ? "bg-slate-100 text-slate-600 border-slate-200"
                                    : "bg-amber-50 text-amber-800 border-amber-200/80"
                                }`}
                              >
                                {inv.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-xs text-slate-500 font-mono">
                              {formatDate(inv.createdAt)}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setSelectedInvoiceId(inv.id)}
                                  className="bg-white border border-slate-200 text-slate-700 font-bold text-xs px-2.5 py-1 rounded-lg hover:bg-slate-50 transition-all inline-flex items-center gap-1"
                                >
                                  <Eye className="size-3 text-slate-500" />
                                  <span>Dossier</span>
                                </button>
                                {inv.status !== "PAID" && inv.status !== "CANCELLED" && (
                                  <>
                                    <button
                                      onClick={() => setSelectedInvoiceForAdjust(inv)}
                                      className="bg-white border border-slate-200 text-slate-700 font-bold text-xs px-2.5 py-1 rounded-lg hover:bg-slate-50 transition-all inline-flex items-center gap-1"
                                    >
                                      <Sliders className="size-3 text-slate-500" />
                                      <span>Adjust</span>
                                    </button>
                                    <button
                                      onClick={() => setSelectedInvoiceForPay(inv)}
                                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-2.5 py-1 rounded-lg transition-all"
                                    >
                                      <span>Pay</span>
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {invoicesData?.pagination && invoicesData.pagination.totalPages > 1 && (
                    <div className="px-4 py-3 bg-slate-50/60 border-t border-slate-200/80 flex items-center justify-between text-xs font-semibold text-slate-600">
                      <span>
                        Page {invoicesData.pagination.page} of {invoicesData.pagination.totalPages} ({invoicesData.pagination.total} total items)
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          disabled={invoicesData.pagination.page <= 1}
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
                        >
                          Previous
                        </button>
                        <button
                          disabled={invoicesData.pagination.page >= invoicesData.pagination.totalPages}
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
        )}

        {/* TAB 2: TRANSACTIONS */}
        {activeTab === "transactions" && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by transaction # or reference..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium text-slate-800 placeholder-slate-400"
                />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
              {isTxLoading ? (
                <div className="p-6 space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-12 bg-slate-100 animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : transactions.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <CreditCard className="size-8 text-slate-300 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-800">No payment transactions recorded</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Transactions from M-Pesa STK push and direct bank wires will show here.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                          <th className="py-3 px-4">Tx #</th>
                          <th className="py-3 px-4">Payment Method</th>
                          <th className="py-3 px-4">Reference Code</th>
                          <th className="py-3 px-4 text-right">Amount (KES)</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Date Settled</th>
                          <th className="py-3 px-4 text-right">Audit Controls</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {transactions.map((tx) => (
                          <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4 font-mono text-xs font-bold text-slate-900">
                              {tx.transactionNumber}
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                                {tx.paymentMethod}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono text-xs text-slate-500 font-semibold">
                              {tx.externalReference || "—"}
                            </td>
                            <td className="py-3 px-4 font-mono text-xs font-bold text-emerald-600 text-right">
                              {formatCurrency(tx.amount, tx.currency || "KES")}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                  tx.status === "PAID" || tx.status === "COMPLETED"
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-200/80"
                                    : tx.status === "FAILED"
                                    ? "bg-rose-50 text-rose-800 border-rose-200/80"
                                    : "bg-amber-50 text-amber-800 border-amber-200/80"
                                }`}
                              >
                                {tx.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-xs text-slate-500 font-mono">
                              {formatDate(tx.paidAt || tx.createdAt)}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {tx.status === "COMPLETED" || tx.status === "PAID" ? (
                                  <>
                                    <button
                                      onClick={() => setSelectedTxForRefund(tx)}
                                      className="bg-white border border-amber-200 text-amber-800 hover:bg-amber-50 font-bold text-xs px-2.5 py-1 rounded-lg transition-all"
                                    >
                                      Refund
                                    </button>
                                    <button
                                      onClick={() => setSelectedTxForReverse(tx)}
                                      className="bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 font-bold text-xs px-2.5 py-1 rounded-lg transition-all"
                                    >
                                      Reverse
                                    </button>
                                  </>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {transactionsData?.pagination && transactionsData.pagination.totalPages > 1 && (
                    <div className="px-4 py-3 bg-slate-50/60 border-t border-slate-200/80 flex items-center justify-between text-xs font-semibold text-slate-600">
                      <span>
                        Page {transactionsData.pagination.page} of {transactionsData.pagination.totalPages} ({transactionsData.pagination.total} total items)
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          disabled={transactionsData.pagination.page <= 1}
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
                        >
                          Previous
                        </button>
                        <button
                          disabled={transactionsData.pagination.page >= transactionsData.pagination.totalPages}
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
        )}

        {/* TAB 3: RECEIPTS */}
        {activeTab === "receipts" && (
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
            {isReceiptsLoading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-slate-100 animate-pulse rounded-lg" />
                ))}
              </div>
            ) : receipts.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <ReceiptIcon className="size-8 text-slate-300 mx-auto" />
                <h3 className="text-sm font-bold text-slate-800">No statutory receipts generated</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Receipts are generated automatically upon completed invoice settlement.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      <th className="py-3 px-4">Receipt #</th>
                      <th className="py-3 px-4">Payer / Client</th>
                      <th className="py-3 px-4 text-right">Amount Settled</th>
                      <th className="py-3 px-4">Payment Method</th>
                      <th className="py-3 px-4">Date Issued</th>
                      <th className="py-3 px-4 text-right">Voucher</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {receipts.map((r: any) => (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono text-xs font-bold text-slate-900">
                          #{r.receiptNumber}
                        </td>
                        <td className="py-3 px-4 font-bold text-xs text-slate-800">
                          {r.payerName || r.client?.fullName || "Verified Entity"}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs font-bold text-emerald-600 text-right">
                          {formatCurrency(r.amount, r.currency || "KES")}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                            {r.paymentMethod || "M-PESA"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-500 font-mono">
                          {formatDate(r.issuedAt || r.createdAt)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setSelectedReceiptId(r.id)}
                            className="bg-white border border-slate-200 text-slate-700 font-bold text-xs px-2.5 py-1 rounded-lg hover:bg-slate-50 transition-all inline-flex items-center gap-1"
                          >
                            <ReceiptIcon className="size-3 text-slate-500" />
                            <span>View Voucher</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: REFUNDS */}
        {activeTab === "refunds" && (
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
            {isRefundsLoading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-slate-100 animate-pulse rounded-lg" />
                ))}
              </div>
            ) : refunds.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <RotateCcw className="size-8 text-slate-300 mx-auto" />
                <h3 className="text-sm font-bold text-slate-800">No refund requests recorded</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Any customer refund requests or reversals will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      <th className="py-3 px-4">Refund #</th>
                      <th className="py-3 px-4 text-right">Claim Amount</th>
                      <th className="py-3 px-4">Stated Justification</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Requested Date</th>
                      <th className="py-3 px-4 text-right">Audit Review</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {refunds.map((ref: any) => (
                      <tr key={ref.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono text-xs font-bold text-slate-900">
                          #{ref.refundNumber}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs font-bold text-slate-900 text-right">
                          {formatCurrency(ref.amount, "KES")}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600 font-medium max-w-xs truncate">
                          {ref.reason}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                              ref.status === "COMPLETED" || ref.status === "APPROVED"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200/80"
                                : ref.status === "FAILED" || ref.status === "CANCELLED"
                                ? "bg-rose-50 text-rose-800 border-rose-200/80"
                                : "bg-amber-50 text-amber-800 border-amber-200/80"
                            }`}
                          >
                            {ref.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-500 font-mono">
                          {formatDate(ref.createdAt)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setSelectedRefundForReview(ref)}
                            className="bg-white border border-slate-200 text-slate-700 font-bold text-xs px-2.5 py-1 rounded-lg hover:bg-slate-50 transition-all inline-flex items-center gap-1"
                          >
                            <span>Review &amp; Settle</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: AGING & COLLECTIONS ANALYTICS */}
        {activeTab === "aging" && (
          <div className="space-y-4">
            {/* Collections by Channel */}
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <TrendingUp className="size-4 text-emerald-600" />
                <span>Collections by Payment Channel</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {collectionsData?.collectionsByMethod && collectionsData.collectionsByMethod.length > 0 ? (
                  collectionsData.collectionsByMethod.map((col: any) => (
                    <div
                      key={col.method}
                      className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{col.method}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                          {col.transactionCount} Txs
                        </span>
                      </div>
                      <div className="font-mono text-lg font-bold text-emerald-600">
                        {formatCurrency(Number(col.totalAmount || 0))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full bg-white rounded-xl border border-slate-200/80 p-4 text-xs text-slate-500 text-center font-medium">
                    No payment collection transactions recorded yet.
                  </div>
                )}
              </div>
            </div>

            {/* Aging Schedule Breakdown */}
            <div className="space-y-3">
              <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <Clock className="size-4 text-amber-700" />
                    <span>Accounts Receivable Aging Schedule</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Aging buckets calculated automatically against payment due dates.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => {
                      setSelectedAgingBucket(undefined);
                      setPage(1);
                    }}
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition-all ${
                      selectedAgingBucket === undefined
                        ? "bg-amber-600 text-white border-amber-600"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    All Buckets
                  </button>
                  <button
                    onClick={() => {
                      setSelectedAgingBucket("1-7");
                      setPage(1);
                    }}
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition-all ${
                      selectedAgingBucket === "1-7"
                        ? "bg-amber-600 text-white border-amber-600"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    1-7 Days
                  </button>
                  <button
                    onClick={() => {
                      setSelectedAgingBucket("8-14");
                      setPage(1);
                    }}
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition-all ${
                      selectedAgingBucket === "8-14"
                        ? "bg-amber-600 text-white border-amber-600"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    8-14 Days
                  </button>
                  <button
                    onClick={() => {
                      setSelectedAgingBucket("15-30");
                      setPage(1);
                    }}
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition-all ${
                      selectedAgingBucket === "15-30"
                        ? "bg-amber-600 text-white border-amber-600"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    15-30 Days
                  </button>
                  <button
                    onClick={() => {
                      setSelectedAgingBucket("30+");
                      setPage(1);
                    }}
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition-all ${
                      selectedAgingBucket === "30+"
                        ? "bg-rose-600 text-white border-rose-600"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    30+ Days Overdue
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
                {isOutstandingLoading ? (
                  <div className="p-6 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-12 bg-slate-100 animate-pulse rounded-lg" />
                    ))}
                  </div>
                ) : outstandingList.length === 0 ? (
                  <div className="p-12 text-center space-y-3">
                    <ShieldCheck className="size-8 text-emerald-600 mx-auto" />
                    <h3 className="text-sm font-bold text-slate-800">No outstanding receivables in this aging category</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      All customer accounts in this bucket are completely settled.
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                            <th className="py-3 px-4">Invoice #</th>
                            <th className="py-3 px-4">Client</th>
                            <th className="py-3 px-4">Service / Application</th>
                            <th className="py-3 px-4">Aging Bucket</th>
                            <th className="py-3 px-4">Days Overdue</th>
                            <th className="py-3 px-4 text-right">Balance Due</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                          {outstandingList.map((inv: OutstandingInvoice) => (
                            <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3 px-4 font-mono text-xs font-bold text-slate-900">
                                #{inv.invoiceNumber}
                              </td>
                              <td className="py-3 px-4 font-bold text-xs text-slate-800">
                                {inv.client?.fullName || "Client"}
                              </td>
                              <td className="py-3 px-4 text-xs text-slate-500 font-medium">
                                {inv.application?.service?.name || "Statutory Service"}
                              </td>
                              <td className="py-3 px-4">
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                    inv.agingBucket?.includes("30+")
                                      ? "bg-rose-50 text-rose-800 border-rose-200/80"
                                      : inv.agingBucket?.includes("15-30")
                                      ? "bg-amber-50 text-amber-800 border-amber-200/80"
                                      : "bg-slate-100 text-slate-700 border-slate-200"
                                  }`}
                                >
                                  {inv.agingBucket || "Current"}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-mono text-xs font-bold text-rose-600">
                                {(inv.daysOverdue || 0) > 0 ? `${inv.daysOverdue} days` : "Current"}
                              </td>
                              <td className="py-3 px-4 font-mono text-xs font-bold text-amber-700 text-right">
                                {formatCurrency(inv.amountDue, inv.currency)}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => setSelectedInvoiceId(inv.id)}
                                    className="bg-white border border-slate-200 text-slate-700 font-bold text-xs px-2.5 py-1 rounded-lg hover:bg-slate-50 transition-all"
                                  >
                                    View Dossier
                                  </button>
                                  <button
                                    onClick={() => setSelectedInvoiceForPay(inv)}
                                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-2.5 py-1 rounded-lg transition-all"
                                  >
                                    Record Payment
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {outstandingData?.pagination && outstandingData.pagination.totalPages > 1 && (
                      <div className="px-4 py-3 bg-slate-50/60 border-t border-slate-200/80 flex items-center justify-between text-xs font-semibold text-slate-600">
                        <span>
                          Page {outstandingData.pagination.page} of {outstandingData.pagination.totalPages} ({outstandingData.pagination.total} total items)
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            disabled={outstandingData.pagination.page <= 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
                          >
                            Previous
                          </button>
                          <button
                            disabled={outstandingData.pagination.page >= outstandingData.pagination.totalPages}
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
          </div>
        )}
      </div>

      {/* CREATE INVOICE MODAL */}
      <AdminCreateInvoiceModal
        isOpen={isCreateInvoiceOpen}
        onClose={() => setIsCreateInvoiceOpen(false)}
        onCreated={() => {
          queryClient.invalidateQueries({ queryKey: ["admin-invoices-list"] });
          queryClient.invalidateQueries({ queryKey: ["admin-financial-summary"] });
        }}
      />

      {/* INVOICE DETAIL DOSSIER MODAL */}
      <AdminInvoiceDetailModal
        isOpen={Boolean(selectedInvoiceId)}
        onClose={() => setSelectedInvoiceId(null)}
        invoiceId={selectedInvoiceId}
        onUpdated={() => {
          queryClient.invalidateQueries({ queryKey: ["admin-invoices-list"] });
          queryClient.invalidateQueries({ queryKey: ["admin-financial-summary"] });
        }}
      />

      {/* RECORD MANUAL PAYMENT MODAL */}
      {selectedInvoiceForPay && (
        <AdminManualPaymentModal
          isOpen={Boolean(selectedInvoiceForPay)}
          onClose={() => setSelectedInvoiceForPay(null)}
          invoice={selectedInvoiceForPay}
          onRecorded={() => {
            queryClient.invalidateQueries({ queryKey: ["admin-invoices-list"] });
            queryClient.invalidateQueries({ queryKey: ["admin-financial-summary"] });
          }}
        />
      )}

      {/* FINANCIAL ADJUSTMENT MODAL */}
      {selectedInvoiceForAdjust && (
        <AdminFinancialAdjustmentModal
          isOpen={Boolean(selectedInvoiceForAdjust)}
          onClose={() => setSelectedInvoiceForAdjust(null)}
          invoice={selectedInvoiceForAdjust}
          onAdjusted={() => {
            queryClient.invalidateQueries({ queryKey: ["admin-invoices-list"] });
            queryClient.invalidateQueries({ queryKey: ["admin-financial-summary"] });
          }}
        />
      )}

      {/* REVERSE TRANSACTION MODAL */}
      {selectedTxForReverse && (
        <AdminReverseTransactionModal
          isOpen={Boolean(selectedTxForReverse)}
          onClose={() => setSelectedTxForReverse(null)}
          transaction={selectedTxForReverse}
          onReversed={() => {
            queryClient.invalidateQueries({ queryKey: ["admin-transactions-list"] });
            queryClient.invalidateQueries({ queryKey: ["admin-invoices-list"] });
            queryClient.invalidateQueries({ queryKey: ["admin-financial-summary"] });
          }}
        />
      )}

      {/* RECEIPT DETAIL VOUCHER MODAL */}
      {selectedReceiptId && (
        <AdminReceiptDetailModal
          isOpen={Boolean(selectedReceiptId)}
          onClose={() => setSelectedReceiptId(null)}
          receiptId={selectedReceiptId}
        />
      )}

      {/* INITIATE REFUND MODAL */}
      <AdminInitiateRefundModal
        isOpen={isRequestRefundOpen || Boolean(selectedTxForRefund)}
        onClose={() => {
          setIsRequestRefundOpen(false);
          setSelectedTxForRefund(null);
        }}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["admin-refunds-list"] });
          queryClient.invalidateQueries({ queryKey: ["admin-financial-summary"] });
        }}
      />

      {/* REVIEW REFUND MODAL */}
      {selectedRefundForReview && (
        <AdminApproveRefundModal
          isOpen={Boolean(selectedRefundForReview)}
          onClose={() => setSelectedRefundForReview(null)}
          refundId={selectedRefundForReview.id}
          refundNumber={selectedRefundForReview.refundNumber}
          amount={selectedRefundForReview.amount}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["admin-refunds-list"] });
            queryClient.invalidateQueries({ queryKey: ["admin-financial-summary"] });
          }}
        />
      )}

      {/* REVENUE BREAKDOWN MODAL */}
      {isBreakdownModalOpen && (
        <Modal
          isOpen={isBreakdownModalOpen}
          onClose={() => setIsBreakdownModalOpen(false)}
          title="Statutory Revenue Breakdown"
          description="Itemized distribution of gross invoiced compliance revenue."
          footer={
            <Button variant="ghost" size="sm" onClick={() => setIsBreakdownModalOpen(false)}>
              Close
            </Button>
          }
        >
          <div className="space-y-3 text-xs">
            <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3.5 space-y-2.5">
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500 font-medium">Government Disbursements (Statutory)</span>
                <strong className="font-mono text-slate-900 font-bold">
                  {formatCurrency(Number(summary?.metrics.breakdown?.governmentFees || 0))}
                </strong>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500 font-medium">Professional Service Fees</span>
                <strong className="font-mono text-slate-900 font-bold">
                  {formatCurrency(Number(summary?.metrics.breakdown?.serviceFees || 0))}
                </strong>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500 font-medium">VAT / Commercial Tax</span>
                <strong className="font-mono text-slate-900 font-bold">
                  {formatCurrency(Number(summary?.metrics.breakdown?.tax || 0))}
                </strong>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2 text-emerald-600 font-semibold">
                <span>Promotional Discounts / Waivers</span>
                <strong className="font-mono font-bold">
                  -{formatCurrency(Number(summary?.metrics.breakdown?.discounts || 0))}
                </strong>
              </div>
              <div className="flex justify-between pt-1 text-sm font-bold text-slate-900">
                <span>Net Commercial Invoiced</span>
                <span className="font-mono text-amber-700">
                  {formatCurrency(Number(summary?.metrics.netRevenue || 0))}
                </span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
