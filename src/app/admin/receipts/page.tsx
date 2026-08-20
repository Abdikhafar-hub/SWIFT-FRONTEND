"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  FileCheck,
  Search,
  ArrowRight,
  Eye,
  DollarSign,
  Calendar,
  CheckCircle2,
  FileText,
  Download,
  CreditCard,
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdminReceiptDetailModal } from "@/components/domain";
import { EmptyState, Skeleton, ErrorState } from "@/components/ui/feedback-primitives";
import { adminApi } from "@/lib/api/admin";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { Receipt } from "@/types";

export default function AdminReceiptsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);

  // Financial summary
  const { data: summary } = useQuery({
    queryKey: ["admin-financial-summary"],
    queryFn: () => adminApi.getFinancialSummary(),
  });

  // Receipts query
  const {
    data: receiptsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-receipts-list", page],
    queryFn: () => adminApi.getReceipts({ page, limit: 15 }),
  });

  const rawReceipts = Array.isArray(receiptsData) ? receiptsData : receiptsData?.items || [];
  const pagination = Array.isArray(receiptsData) ? null : receiptsData?.pagination;

  // Filter receipts by search
  const filteredReceipts = rawReceipts.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const matchNum = r.receiptNumber?.toLowerCase().includes(q);
    const matchPay = r.paymentId?.toLowerCase().includes(q);
    const matchClient =
      (r as any).payment?.user?.fullName?.toLowerCase().includes(q) ||
      (r as any).payment?.user?.businessName?.toLowerCase().includes(q);
    return matchNum || matchPay || matchClient;
  });

  const totalReceiptsAmount = filteredReceipts.reduce((sum, r) => sum + (r.amount || 0), 0);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-4 sm:p-5 lg:p-6 space-y-4 max-w-[1550px] mx-auto font-sans">
      {/* ------------------------------------------------------------------ */}
      {/* 1. HEADER SECTION */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Official Statutory Receipts
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Fiscal receipts, automated VAT invoices, and statutory payment certifications issued to clients.
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. RECEIPTS METRICS */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Receipts Issued</span>
            <span className="text-xl font-extrabold text-slate-900 font-mono mt-0.5 block">{pagination?.total || rawReceipts.length}</span>
            <span className="text-[10px] text-slate-500 font-medium">Certified official receipts</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
            <FileCheck className="size-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Gross Value Receipted</span>
            <span className="text-xl font-extrabold text-emerald-600 font-mono mt-0.5 block">{formatCurrency(summary?.totalCollected || totalReceiptsAmount)}</span>
            <span className="text-[10px] text-slate-500 font-medium">Cumulative receipted revenue</span>
          </div>
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60">
            <DollarSign className="size-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">M-Pesa Receipts</span>
            <span className="text-xl font-extrabold text-amber-700 font-mono mt-0.5 block">{rawReceipts.filter((r) => r.paymentMethod === "MPESA").length}</span>
            <span className="text-[10px] text-slate-500 font-medium">Mobile money confirmations</span>
          </div>
          <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60">
            <CreditCard className="size-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Bank / EFT Receipts</span>
            <span className="text-xl font-extrabold text-slate-700 font-mono mt-0.5 block">{rawReceipts.filter((r) => r.paymentMethod !== "MPESA").length}</span>
            <span className="text-[10px] text-slate-500 font-medium">Wire &amp; direct transfers</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-100 text-slate-600 border border-slate-200">
            <FileText className="size-4" />
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
            placeholder="Search by receipt #, payment reference, or client..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium text-slate-800 placeholder-slate-400"
          />
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 4. RECEIPTS TABLE */}
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
            <p className="text-xs font-bold text-rose-600">Failed to load receipts.</p>
            <button
              onClick={() => refetch()}
              className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
            >
              Retry Loading
            </button>
          </div>
        ) : filteredReceipts.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileCheck className="size-8 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No receipts recorded</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Receipts generated upon payment settlement will appear in this ledger.
            </p>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Receipt #</th>
                    <th className="py-3 px-4">Invoice / Payment Ref</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Payment Method</th>
                    <th className="py-3 px-4">Issued Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredReceipts.map((receipt) => (
                    <tr key={receipt.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-3 px-4">
                        <Link
                          href={`/admin/receipts/${receipt.id}`}
                          className="font-mono text-xs font-bold text-amber-700 hover:underline block"
                        >
                          {receipt.receiptNumber || `#${receipt.id.slice(0, 8)}`}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/admin/invoices/${receipt.paymentId}`}
                          className="font-mono text-xs text-slate-500 font-semibold hover:underline"
                        >
                          #{receipt.paymentId.slice(0, 8)}
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs font-bold text-slate-900">
                        {formatCurrency(receipt.amount)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                          {receipt.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500 font-mono">
                        {formatDate(receipt.issuedAt || receipt.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedReceipt(receipt)}
                            className="bg-white border border-slate-200 text-slate-700 font-bold text-xs px-2.5 py-1 rounded-lg hover:bg-slate-50 transition-all inline-flex items-center gap-1"
                          >
                            <Eye className="size-3 text-slate-500" />
                            <span>Preview</span>
                          </button>
                          <Link href={`/admin/receipts/${receipt.id}`}>
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

      {/* RECEIPT PREVIEW MODAL */}
      {selectedReceipt && (
        <AdminReceiptDetailModal
          receipt={selectedReceipt}
          isOpen={Boolean(selectedReceipt)}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
}
