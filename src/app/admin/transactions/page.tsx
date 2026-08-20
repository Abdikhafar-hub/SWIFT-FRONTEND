"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CreditCard,
  Search,
  Plus,
  RotateCcw,
  ArrowRight,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  Smartphone,
  Landmark,
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
  AdminReverseTransactionModal,
} from "@/components/domain";
import { EmptyState, Skeleton, ErrorState } from "@/components/ui/feedback-primitives";
import { adminApi } from "@/lib/api/admin";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { PaymentTransaction, PaymentMethod, PaymentTransactionStatus } from "@/types";

export default function AdminTransactionsPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);

  // Modals state
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [selectedTxForReverse, setSelectedTxForReverse] = useState<PaymentTransaction | null>(null);

  // Financial summary query
  const { data: summary } = useQuery({
    queryKey: ["admin-financial-summary"],
    queryFn: () => adminApi.getFinancialSummary(),
  });

  // Query transactions
  const {
    data: txData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-transactions-list", page, statusFilter, search],
    queryFn: () =>
      adminApi.getTransactions({
        page,
        limit: 15,
        status: statusFilter || undefined,
        search: search || undefined,
      }),
  });

  const transactions = txData?.items || [];
  const pagination = txData?.pagination;

  // Local filter for payment method if selected
  const filteredTransactions = transactions.filter((tx) => {
    if (methodFilter && tx.paymentMethod !== methodFilter) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-4 sm:p-5 lg:p-6 space-y-4 max-w-[1550px] mx-auto font-sans">
      {/* ------------------------------------------------------------------ */}
      {/* 1. HEADER SECTION */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Payment Transactions Ledger
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Real-time payment gateway transactions, M-Pesa C2B callbacks, direct bank settlements, and reversals.
          </p>
        </div>

        <button
          onClick={() => setIsManualModalOpen(true)}
          className="bg-gradient-to-r from-[#C5A059] to-[#D4AF37] hover:from-[#b49049] hover:to-[#c39e26] text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0 self-start sm:self-auto transform hover:-translate-y-0.5"
        >
          <Plus className="size-3.5 stroke-[3]" />
          <span>Record Manual Payment</span>
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. TRANSACTION METRICS */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Collected</span>
            <span className="text-xl font-extrabold text-slate-900 font-mono mt-0.5 block">{formatCurrency(summary?.totalCollected || 0)}</span>
            <span className="text-[10px] text-slate-500 font-medium">Settled transactions</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
            <DollarSign className="size-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">M-Pesa Volumes</span>
            <span className="text-xl font-extrabold text-emerald-600 font-mono mt-0.5 block">{formatCurrency(summary?.byMethod?.MPESA || 0)}</span>
            <span className="text-[10px] text-slate-500 font-medium">Instant mobile settlements</span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60">
            <Smartphone className="size-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Bank / Card Transfers</span>
            <span className="text-xl font-extrabold text-amber-600 font-mono mt-0.5 block">
              {formatCurrency((summary?.byMethod?.BANK_TRANSFER || 0) + (summary?.byMethod?.CREDIT_CARD || 0))}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Direct EFT &amp; Wire</span>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60">
            <Landmark className="size-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Active Transactions</span>
            <span className="text-xl font-extrabold text-slate-900 font-mono mt-0.5 block">{pagination?.total || transactions.length}</span>
            <span className="text-[10px] text-slate-500 font-medium">Audited in ledger</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
            <CreditCard className="size-4" />
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
            placeholder="Search by reference code, M-Pesa receipt, or client..."
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
            value={methodFilter}
            onChange={(e) => {
              setMethodFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-semibold text-slate-700"
          >
            <option value="">All Payment Methods</option>
            <option value="MPESA">M-Pesa (Express &amp; C2B)</option>
            <option value="BANK_TRANSFER">Bank Transfer (EFT/RTGS)</option>
            <option value="CREDIT_CARD">Credit / Debit Card</option>
            <option value="CASH">Direct Cash</option>
            <option value="WALLET">Wallet / Credit</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-semibold text-slate-700"
          >
            <option value="">All Transaction States</option>
            <option value="COMPLETED">Completed / Settled</option>
            <option value="PENDING">Pending Processing</option>
            <option value="FAILED">Failed</option>
            <option value="REVERSED">Reversed</option>
          </select>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 4. TRANSACTIONS TABLE */}
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
            <p className="text-xs font-bold text-rose-600">Failed to load transaction ledger.</p>
            <button
              onClick={() => refetch()}
              className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
            >
              Retry Loading
            </button>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <h3 className="text-sm font-bold text-slate-800">No transactions found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No payment ledger entries match the specified search or filters.
            </p>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Reference / Code</th>
                    <th className="py-3 px-4">Payment Method</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Settlement Timestamp</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-3 px-4">
                        <Link
                          href={`/admin/transactions/${tx.id}`}
                          className="font-mono text-xs font-bold text-amber-700 hover:text-amber-800 hover:underline block"
                        >
                          {tx.reference || tx.externalReference || `#${tx.id.slice(0, 8)}`}
                        </Link>
                        {tx.mpesaReceiptNumber && (
                          <span className="font-mono text-[10px] text-slate-400 block mt-0.5">
                            M-Pesa: {tx.mpesaReceiptNumber}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                          {tx.paymentMethod} {tx.channel ? `• ${tx.channel}` : ""}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs font-extrabold text-slate-900">
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                          tx.status === "COMPLETED"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                            : tx.status === "FAILED"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : tx.status === "REVERSED"
                            ? "bg-amber-50 text-amber-800 border-amber-200/80"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {tx.paymentId ? (
                          <Link
                            href={`/admin/invoices/${tx.paymentId}`}
                            className="font-mono text-xs font-bold text-amber-700 hover:text-amber-800 hover:underline"
                          >
                            #{tx.paymentId.slice(0, 8)}
                          </Link>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500 font-medium">
                        {formatDate(tx.completedAt || tx.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {tx.status === "COMPLETED" && (
                            <button
                              onClick={() => setSelectedTxForReverse(tx)}
                              className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-lg border border-rose-200/60 transition-colors inline-flex items-center gap-1"
                            >
                              <RotateCcw className="size-3" />
                              <span>Reverse</span>
                            </button>
                          )}
                          <Link href={`/admin/transactions/${tx.id}`}>
                            <button className="bg-white border border-slate-200 text-slate-700 font-bold text-xs px-2.5 py-1 rounded-lg hover:bg-slate-50 transition-all inline-flex items-center gap-1">
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

      {/* RECORD MANUAL PAYMENT MODAL */}
      {isManualModalOpen && (
        <AdminManualPaymentModal
          applicationId=""
          isOpen={isManualModalOpen}
          onClose={() => setIsManualModalOpen(false)}
          onSuccess={() => {
            refetch();
            queryClient.invalidateQueries({ queryKey: ["admin-financial-summary"] });
          }}
        />
      )}

      {/* REVERSE TRANSACTION MODAL */}
      {selectedTxForReverse && (
        <AdminReverseTransactionModal
          transactionId={selectedTxForReverse.id}
          reference={selectedTxForReverse.reference || selectedTxForReverse.id.slice(0, 8)}
          amount={selectedTxForReverse.amount}
          isOpen={Boolean(selectedTxForReverse)}
          onClose={() => setSelectedTxForReverse(null)}
          onSuccess={() => {
            refetch();
            queryClient.invalidateQueries({ queryKey: ["admin-financial-summary"] });
          }}
        />
      )}
    </div>
  );
}
