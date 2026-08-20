"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Sliders,
  Search,
  Plus,
  ArrowRight,
  Eye,
  DollarSign,
  AlertTriangle,
  Receipt,
  FileText,
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
import { AdminFinancialAdjustmentModal } from "@/components/domain";
import { EmptyState, Skeleton, ErrorState } from "@/components/ui/feedback-primitives";
import { adminApi } from "@/lib/api/admin";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { Payment } from "@/types";

export default function AdminAdjustmentsPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedInvoiceForAdjust, setSelectedInvoiceForAdjust] = useState<Payment | null>(null);

  // Query all invoices
  const {
    data: invoicesData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-invoices-adjustments-queue", page, search],
    queryFn: () =>
      adminApi.getInvoices({
        page,
        limit: 20,
        search: search || undefined,
      }),
  });

  const invoices: Payment[] = invoicesData?.items || [];
  const pagination = invoicesData?.pagination;

  // Filter invoices that have discounts, balance adjustments, or are eligible for adjustments
  const adjustedInvoices = invoices.filter((inv) => (inv.discount && Number(inv.discount) > 0) || inv.balanceRemaining !== undefined);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-4 sm:p-5 lg:p-6 space-y-4 max-w-[1550px] mx-auto font-sans">
      {/* ------------------------------------------------------------------ */}
      {/* 1. HEADER SECTION */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Financial Adjustments &amp; Fee Waivers
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Administrative credit notes, statutory fee waivers, discount overrides, and manual balance reconciliations.
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. ADJUSTMENT METRICS */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Invoices with Adjustments</span>
            <span className="text-xl font-extrabold text-slate-900 font-mono mt-0.5 block">{adjustedInvoices.length}</span>
            <span className="text-[10px] text-slate-500 font-medium">Credit/waiver applied</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
            <Sliders className="size-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Invoices Audited</span>
            <span className="text-xl font-extrabold text-slate-900 font-mono mt-0.5 block">{pagination?.total || invoices.length}</span>
            <span className="text-[10px] text-slate-500 font-medium">Available for fee adjustment</span>
          </div>
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60">
            <Receipt className="size-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Waivers &amp; Discounts</span>
            <span className="text-xl font-extrabold text-amber-700 font-mono mt-0.5 block">
              {formatCurrency(
                adjustedInvoices.reduce((sum, inv) => sum + Number(inv.discount || 0), 0)
              )}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Total concessions granted</span>
          </div>
          <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60">
            <DollarSign className="size-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Adjustable Balances</span>
            <span className="text-xl font-extrabold text-slate-700 font-mono mt-0.5 block">{invoices.filter((i) => i.status !== "PAID" && i.status !== "VOID").length}</span>
            <span className="text-[10px] text-slate-500 font-medium">Open for credit notes</span>
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
            placeholder="Search invoice #, client name, or application..."
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
      {/* 4. ADJUSTMENTS LEDGER TABLE */}
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
            <p className="text-xs font-bold text-rose-600">Failed to load billing records.</p>
            <button
              onClick={() => refetch()}
              className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
            >
              Retry Loading
            </button>
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Sliders className="size-8 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No billing records found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Invoices eligible for fee adjustments will be listed here.
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
                    <th className="py-3 px-4">Gross Amount</th>
                    <th className="py-3 px-4">Discount / Credit</th>
                    <th className="py-3 px-4">Net Balance Due</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-3 px-4">
                        <Link
                          href={`/admin/invoices/${inv.id}`}
                          className="font-mono text-xs font-bold text-amber-700 hover:underline block"
                        >
                          #{inv.invoiceNumber || inv.id.slice(0, 8)}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-xs font-semibold text-slate-800">
                        {inv.user?.fullName || inv.user?.businessName || inv.client?.fullName || "Client"}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-700">
                        {formatCurrency(inv.amount)}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs font-bold text-emerald-600">
                        {inv.discount && Number(inv.discount) > 0 ? `-${formatCurrency(inv.discount)}` : "—"}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs font-bold text-slate-900">
                        {inv.balanceRemaining !== undefined
                          ? formatCurrency(inv.balanceRemaining)
                          : inv.status === "PAID"
                          ? formatCurrency(0)
                          : formatCurrency(inv.amount)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                            inv.status === "PAID"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200/80"
                              : inv.status === "OVERDUE"
                              ? "bg-rose-50 text-rose-800 border-rose-200/80"
                              : "bg-amber-50 text-amber-800 border-amber-200/80"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedInvoiceForAdjust(inv)}
                            className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-2.5 py-1 rounded-lg transition-all inline-flex items-center gap-1 shadow-xs"
                          >
                            <Sliders className="size-3" />
                            <span>Apply Adjustment</span>
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

      {/* ADJUSTMENT MODAL */}
      {selectedInvoiceForAdjust && (
        <AdminFinancialAdjustmentModal
          paymentId={selectedInvoiceForAdjust.id}
          invoiceNumber={selectedInvoiceForAdjust.invoiceNumber}
          currentAmount={selectedInvoiceForAdjust.amount}
          isOpen={Boolean(selectedInvoiceForAdjust)}
          onClose={() => setSelectedInvoiceForAdjust(null)}
          onSuccess={() => {
            refetch();
            queryClient.invalidateQueries({ queryKey: ["admin-invoices-list"] });
            queryClient.invalidateQueries({ queryKey: ["admin-financial-summary"] });
          }}
        />
      )}
    </div>
  );
}
