"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  FileCheck,
  Search,
  Eye,
  DollarSign,
  FileText,
  CreditCard,
  Filter,
  ExternalLink,
} from "lucide-react";
import { AdminReceiptDetailModal } from "@/components/domain";
import { adminApi } from "@/lib/api/admin";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { Receipt, PaymentMethod } from "@/types";

export default function AdminReceiptsPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);

  // Debounce search input for server queries
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset pagination when filters change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handlePaymentMethodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPaymentMethod(e.target.value);
    setPage(1);
  };

  // Fetch receipts list, pagination, and authoritative summary from backend
  const {
    data: receiptsRes,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-receipts-list", page, debouncedSearch, paymentMethod],
    queryFn: () =>
      adminApi.getReceipts({
        page,
        limit: 15,
        search: debouncedSearch || undefined,
        paymentMethod: paymentMethod === "ALL" ? undefined : (paymentMethod as PaymentMethod),
      }),
  });

  const receipts = receiptsRes?.items || [];
  const pagination = receiptsRes?.pagination;
  const metrics = receiptsRes?.summary;

  // Safe fallback calculation ensuring strictly numeric arithmetic (prevents string concatenation)
  const safeTotalAmount = receipts.reduce((sum, r) => {
    const val = typeof r.amount === "string" ? parseFloat(r.amount) : Number(r.amount || 0);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  const grossValueDisplay = metrics?.grossValue
    ? formatCurrency(Number(metrics.grossValue))
    : formatCurrency(safeTotalAmount);

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
            Fiscal receipts, automated VAT vouchers, and statutory payment certifications issued to clients.
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. AUTHORITATIVE SUMMARY METRICS */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between min-w-0">
          <div className="min-w-0">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block truncate">
              Total Receipts Issued
            </span>
            <span className="text-xl font-extrabold text-slate-900 font-mono mt-0.5 block truncate">
              {metrics?.totalReceipts ?? pagination?.total ?? receipts.length}
            </span>
            <span className="text-[10px] text-slate-500 font-medium truncate block">
              Certified official receipts
            </span>
          </div>
          <div className="p-2 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
            <FileCheck className="size-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between min-w-0">
          <div className="min-w-0">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block truncate">
              Gross Value Receipted
            </span>
            <span className="text-xl font-extrabold text-emerald-600 font-mono mt-0.5 block truncate">
              {grossValueDisplay}
            </span>
            <span className="text-[10px] text-slate-500 font-medium truncate block">
              Cumulative receipted revenue
            </span>
          </div>
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 shrink-0">
            <DollarSign className="size-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between min-w-0">
          <div className="min-w-0">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block truncate">
              M-Pesa Receipts
            </span>
            <span className="text-xl font-extrabold text-amber-700 font-mono mt-0.5 block truncate">
              {metrics?.mpesaReceipts ?? receipts.filter((r) => r.paymentMethod === "MPESA").length}
            </span>
            <span className="text-[10px] text-slate-500 font-medium truncate block">
              Mobile money confirmations
            </span>
          </div>
          <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60 shrink-0">
            <CreditCard className="size-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between min-w-0">
          <div className="min-w-0">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block truncate">
              Bank / EFT Receipts
            </span>
            <span className="text-xl font-extrabold text-slate-700 font-mono mt-0.5 block truncate">
              {metrics?.bankReceipts ?? receipts.filter((r) => r.paymentMethod !== "MPESA").length}
            </span>
            <span className="text-[10px] text-slate-500 font-medium truncate block">
              Wire &amp; direct transfers
            </span>
          </div>
          <div className="p-2 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
            <FileText className="size-4" />
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. FILTERS & SERVER-SIDE SEARCH */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by receipt #, transaction ref, client name..."
            value={search}
            onChange={handleSearchChange}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium text-slate-800 placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Filter className="size-3.5 text-slate-400" />
            <span>Method:</span>
          </div>
          <select
            value={paymentMethod}
            onChange={handlePaymentMethodChange}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-semibold text-slate-700 transition-all"
          >
            <option value="ALL">All Payment Methods</option>
            <option value="MPESA">M-Pesa</option>
            <option value="BANK">Bank Transfer / EFT</option>
            <option value="CASH">Cash</option>
            <option value="CARD">Card</option>
          </select>
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
            <p className="text-xs font-bold text-rose-600">Failed to load official receipts ledger.</p>
            <button
              onClick={() => refetch()}
              className="px-3.5 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
            >
              Retry Loading
            </button>
          </div>
        ) : receipts.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileCheck className="size-8 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No official receipts found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {debouncedSearch || paymentMethod !== "ALL"
                ? "No receipts match the specified search or filter criteria."
                : "Receipts generated upon payment settlement will appear in this ledger."}
            </p>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Receipt #</th>
                    <th className="py-3 px-4">Payer / Client</th>
                    <th className="py-3 px-4">Invoice / Payment Ref</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Payment Method</th>
                    <th className="py-3 px-4">Issued Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {receipts.map((receipt) => {
                    const clientName = receipt.payerName || receipt.client?.fullName || "Verified Entity";
                    const clientNo = receipt.client?.clientNumber;
                    const appId = receipt.applicationId || (receipt.application as any)?.id;

                    return (
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
                          <div className="font-semibold text-slate-900">{clientName}</div>
                          {clientNo && (
                            <span className="text-[10px] font-mono text-slate-400 block">{clientNo}</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <Link
                            href={`/admin/invoices/${receipt.paymentId}`}
                            className="font-mono text-xs text-slate-500 font-semibold hover:underline block"
                          >
                            #{receipt.paymentId ? receipt.paymentId.slice(0, 8) : "—"}
                          </Link>
                          {receipt.transactionReference && (
                            <span className="text-[10px] font-mono text-emerald-700 block">
                              Ref: {receipt.transactionReference}
                            </span>
                          )}
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
                            {appId ? (
                              <Link href={`/admin/applications/${appId}`}>
                                <span className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-2.5 py-1 rounded-lg transition-all inline-flex items-center gap-1">
                                  <span>Dossier</span>
                                  <ExternalLink className="size-3" />
                                </span>
                              </Link>
                            ) : (
                              <span className="bg-slate-100 text-slate-400 font-medium text-xs px-2.5 py-1 rounded-lg cursor-not-allowed">
                                No App
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
