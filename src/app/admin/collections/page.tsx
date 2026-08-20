"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  TrendingUp,
  AlertTriangle,
  Clock,
  DollarSign,
  Search,
  Eye,
  Calendar,
  Send,
  Sliders,
  CreditCard,
  Building,
  User,
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
  AdminManualPaymentModal,
  AdminFinancialAdjustmentModal,
} from "@/components/domain";
import { EmptyState, Skeleton, ErrorState } from "@/components/ui/feedback-primitives";
import { adminApi } from "@/lib/api/admin";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { OutstandingInvoice, Payment } from "@/types";

export default function AdminCollectionsPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [bucketFilter, setBucketFilter] = useState<string>("");
  const [page, setPage] = useState(1);

  // Modal states
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<OutstandingInvoice | null>(null);
  const [selectedInvoiceForAdjustment, setSelectedInvoiceForAdjustment] = useState<OutstandingInvoice | null>(null);

  // Collections metrics
  const {
    data: collectionsData,
    isLoading: isMetricsLoading,
    error: metricsError,
  } = useQuery({
    queryKey: ["admin-financial-collections"],
    queryFn: () => adminApi.getFinancialCollections(),
  });

  // Outstanding invoices list query
  const {
    data: outstandingData,
    isLoading: isListLoading,
    error: listError,
    refetch,
  } = useQuery({
    queryKey: ["admin-outstanding-invoices", page, bucketFilter],
    queryFn: () =>
      adminApi.getOutstandingInvoices({
        page,
        limit: 15,
        agingBucket: bucketFilter || undefined,
      }),
  });

  const invoices: OutstandingInvoice[] = outstandingData?.items || [];
  const pagination = outstandingData?.pagination;

  // Search filter
  const filteredInvoices = invoices.filter((inv) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const matchNum = inv.invoiceNumber?.toLowerCase().includes(q);
    const matchClient =
      inv.client?.fullName?.toLowerCase().includes(q) ||
      inv.client?.businessName?.toLowerCase().includes(q) ||
      inv.client?.email?.toLowerCase().includes(q);
    return matchNum || matchClient;
  });

  const aging = collectionsData?.aging;
  const performanceRate = collectionsData?.collectionRate;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-4 sm:p-5 lg:p-6 space-y-4 max-w-[1550px] mx-auto font-sans">
      {/* ------------------------------------------------------------------ */}
      {/* 1. HEADER SECTION */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Collections &amp; Aging Receivables Command
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Aging debt ledger (Current, 30, 60, 90+ days), uncollected statutory fees, and arrears recovery.
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. AGING BUCKETS & RECOVERY METRICS */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Current (&lt; 30 Days)</span>
            <span className="text-lg font-extrabold text-emerald-600 font-mono mt-0.5 block">{formatCurrency(aging?.under30Days?.amount || 0)}</span>
            <span className="text-[10px] text-slate-500 font-medium">{aging?.under30Days?.count || 0} invoices on track</span>
          </div>
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60">
            <Clock className="size-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">30 – 60 Days Arrears</span>
            <span className="text-lg font-extrabold text-amber-600 font-mono mt-0.5 block">{formatCurrency(aging?.days30To60?.amount || 0)}</span>
            <span className="text-[10px] text-slate-500 font-medium">{aging?.days30To60?.count || 0} accounts flagged</span>
          </div>
          <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60">
            <AlertTriangle className="size-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">60 – 90 Days Arrears</span>
            <span className="text-lg font-extrabold text-amber-700 font-mono mt-0.5 block">{formatCurrency(aging?.days60To90?.amount || 0)}</span>
            <span className="text-[10px] text-slate-500 font-medium">{aging?.days60To90?.count || 0} overdue accounts</span>
          </div>
          <div className="p-2 rounded-xl bg-amber-100 text-amber-700 border border-amber-200">
            <AlertTriangle className="size-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Critical (90+ Days)</span>
            <span className="text-lg font-extrabold text-rose-600 font-mono mt-0.5 block">{formatCurrency(aging?.over90Days?.amount || 0)}</span>
            <span className="text-[10px] text-slate-500 font-medium">{aging?.over90Days?.count || 0} legal collection</span>
          </div>
          <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200/60">
            <AlertTriangle className="size-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between col-span-2 sm:col-span-1">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Outstanding</span>
            <span className="text-lg font-extrabold text-slate-900 font-mono mt-0.5 block">{formatCurrency(aging?.totalOutstanding?.amount || 0)}</span>
            <span className="text-[10px] text-slate-500 font-medium">Recovery Rate: {performanceRate ? `${performanceRate}%` : "—"}</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
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
            placeholder="Search by invoice #, client name, or email..."
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
            value={bucketFilter}
            onChange={(e) => {
              setBucketFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-semibold text-slate-700"
          >
            <option value="">All Aging Buckets</option>
            <option value="CURRENT">Current (&lt; 30 Days)</option>
            <option value="30_TO_60">30 to 60 Days</option>
            <option value="60_TO_90">60 to 90 Days</option>
            <option value="OVER_90">Over 90 Days (Critical)</option>
          </select>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 4. RECEIVABLES TABLE */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
        {isListLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-slate-100 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : listError ? (
          <div className="p-8 text-center space-y-3">
            <p className="text-xs font-bold text-rose-600">Failed to load outstanding invoices.</p>
            <button
              onClick={() => refetch()}
              className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
            >
              Retry Loading
            </button>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <TrendingUp className="size-8 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No outstanding arrears in this bucket</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              All candidate accounts have zero overdue balance.
            </p>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Client Entity</th>
                    <th className="py-3 px-4">Total Billed</th>
                    <th className="py-3 px-4">Outstanding Balance</th>
                    <th className="py-3 px-4">Aging Tier</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4 text-right">Collection Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-3 px-4">
                        <Link
                          href={`/admin/invoices/${inv.id}`}
                          className="font-mono text-xs font-bold text-amber-700 hover:underline block"
                        >
                          #{inv.invoiceNumber || inv.id.slice(0, 8)}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <span className="font-semibold text-xs text-slate-800 block">
                            {inv.client?.fullName || inv.client?.businessName || "Verified Client"}
                          </span>
                          <span className="text-[11px] text-slate-400 block font-mono">
                            {inv.client?.phone || inv.client?.email}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-700">
                        {formatCurrency(inv.totalAmount || inv.amount)}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs font-bold text-rose-600">
                        {formatCurrency(inv.outstandingBalance || inv.balanceRemaining || inv.amount)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                            inv.agingBucket === "OVER_90"
                              ? "bg-rose-50 text-rose-800 border-rose-200/80"
                              : inv.agingBucket === "60_TO_90" || inv.agingBucket === "30_TO_60"
                              ? "bg-amber-50 text-amber-800 border-amber-200/80"
                              : "bg-emerald-50 text-emerald-800 border-emerald-200/80"
                          }`}
                        >
                          {inv.agingBucket?.replace(/_/g, " ") || `${inv.daysOverdue || 0} Days`}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500 font-mono">
                        {inv.dueDate ? formatDate(inv.dueDate) : "Immediate"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedInvoiceForPayment(inv)}
                            className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-2.5 py-1 rounded-lg transition-all inline-flex items-center gap-1 shadow-xs"
                          >
                            <DollarSign className="size-3" />
                            <span>Settle</span>
                          </button>
                          <button
                            onClick={() => setSelectedInvoiceForAdjustment(inv)}
                            className="bg-white border border-slate-200 text-slate-700 font-bold text-xs px-2.5 py-1 rounded-lg hover:bg-slate-50 transition-all inline-flex items-center gap-1"
                          >
                            <Sliders className="size-3 text-slate-500" />
                            <span>Adjust</span>
                          </button>
                          <Link href={`/admin/invoices/${inv.id}`}>
                            <span className="bg-white border border-slate-200 text-slate-700 font-bold text-xs px-2.5 py-1 rounded-lg hover:bg-slate-50 transition-all inline-block">
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

      {/* RECORD PAYMENT MODAL */}
      {selectedInvoiceForPayment && (
        <AdminManualPaymentModal
          applicationId={selectedInvoiceForPayment.applicationId || ""}
          outstandingAmount={
            selectedInvoiceForPayment.outstandingBalance ||
            selectedInvoiceForPayment.balanceRemaining ||
            selectedInvoiceForPayment.amount
          }
          isOpen={Boolean(selectedInvoiceForPayment)}
          onClose={() => setSelectedInvoiceForPayment(null)}
          onSuccess={() => {
            refetch();
            queryClient.invalidateQueries({ queryKey: ["admin-financial-collections"] });
          }}
        />
      )}

      {/* ADJUSTMENT MODAL */}
      {selectedInvoiceForAdjustment && (
        <AdminFinancialAdjustmentModal
          paymentId={selectedInvoiceForAdjustment.id}
          invoiceNumber={selectedInvoiceForAdjustment.invoiceNumber}
          currentAmount={selectedInvoiceForAdjustment.totalAmount || selectedInvoiceForAdjustment.amount}
          isOpen={Boolean(selectedInvoiceForAdjustment)}
          onClose={() => setSelectedInvoiceForAdjustment(null)}
          onSuccess={() => {
            refetch();
            queryClient.invalidateQueries({ queryKey: ["admin-financial-collections"] });
          }}
        />
      )}
    </div>
  );
}
