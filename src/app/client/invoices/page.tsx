"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Receipt,
  Search,
  Eye,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  FileText,
  Upload,
  Download,
} from "lucide-react";
import { paymentsApi } from "@/lib/api/payments";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { Skeleton, ErrorState, EmptyState } from "@/components/ui/feedback-primitives";
import type { Payment } from "@/types";

export default function ClientInvoicesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const {
    data: invoicesData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["client-invoices", statusFilter, search],
    queryFn: () => paymentsApi.getInvoices({ status: statusFilter || undefined, search: search || undefined }),
  });

  const invoices: Payment[] = Array.isArray(invoicesData)
    ? invoicesData
    : (invoicesData as any)?.items || [];

  // Metrics calculation
  const totalBilled = invoices.reduce((acc, inv) => acc + Number(inv.amount || inv.totalAmount || 0), 0);
  const totalPaid = invoices.reduce((acc, inv) => acc + Number(inv.paidAmount || inv.amountPaid || 0), 0);
  const totalDue = invoices.reduce((acc, inv) => {
    const due = Number(inv.balanceRemaining ?? inv.amountDue ?? (inv.status === "PAID" ? 0 : inv.amount));
    return acc + due;
  }, 0);
  const underReviewCount = invoices.filter((inv) => inv.status === "PAYMENT_UNDER_REVIEW").length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-4 sm:p-5 lg:p-6 space-y-4 max-w-[1400px] mx-auto font-sans">
      {/* ------------------------------------------------------------------ */}
      {/* 1. HEADER SECTION */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/80">
            Financial Ledger
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            My Invoices &amp; Statements
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            View commercial invoices, track outstanding balances, download official PDFs, and submit payment proofs.
          </p>
        </div>

        <Link href="/client/payments">
          <button className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 border border-slate-800">
            <CreditCard className="size-3.5 text-amber-400" />
            <span>Payment History &amp; Receipts</span>
          </button>
        </Link>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. KPI SUMMARY METRICS */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Billed</span>
            <span className="text-xl font-extrabold text-slate-900 font-mono mt-0.5 block">{formatCurrency(totalBilled)}</span>
            <span className="text-[10px] text-slate-500 font-medium">{invoices.length} invoices issued</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
            <Receipt className="size-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Paid</span>
            <span className="text-xl font-extrabold text-emerald-600 font-mono mt-0.5 block">{formatCurrency(totalPaid)}</span>
            <span className="text-[10px] text-slate-500 font-medium">Settled to date</span>
          </div>
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60">
            <CheckCircle2 className="size-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Outstanding Balance</span>
            <span className="text-xl font-extrabold text-amber-600 font-mono mt-0.5 block">{formatCurrency(totalDue)}</span>
            <span className="text-[10px] text-slate-500 font-medium">Pending settlement</span>
          </div>
          <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60">
            <Clock className="size-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Under Review</span>
            <span className="text-xl font-extrabold text-blue-600 font-mono mt-0.5 block">{underReviewCount}</span>
            <span className="text-[10px] text-slate-500 font-medium">Proofs in verification queue</span>
          </div>
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/60">
            <Upload className="size-4" />
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. SEARCH & FILTERS */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoice # or service..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium text-slate-800 placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-semibold text-slate-700"
          >
            <option value="">All Invoice Statuses</option>
            <option value="ISSUED">Issued / Pending Payment</option>
            <option value="PAYMENT_UNDER_REVIEW">Payment Under Review</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="PAID">Paid in Full</option>
            <option value="OVERDUE">Overdue</option>
          </select>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 4. INVOICES TABLE */}
      {/* ------------------------------------------------------------------ */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      ) : error ? (
        <ErrorState title="Unable to Load Invoices" message="Failed to retrieve client invoice records." onRetry={() => refetch()} />
      ) : invoices.length === 0 ? (
        <EmptyState
          icon={<Receipt className="size-8" />}
          title="No Commercial Invoices Found"
          description="You currently have no commercial invoices matching the selected criteria."
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Statutory Application</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Total Billed</th>
                  <th className="py-3 px-4">Paid / Due</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {invoices.map((inv) => {
                  const invNum = inv.invoiceNumber || `INV-${inv.id.slice(0, 8).toUpperCase()}`;
                  const total = Number(inv.amount || inv.totalAmount || 0);
                  const paid = Number(inv.paidAmount || inv.amountPaid || 0);
                  const due = Number(inv.balanceRemaining ?? inv.amountDue ?? (inv.status === "PAID" ? 0 : total));

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {invNum}
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        <div>
                          <strong className="block text-slate-900">{inv.description || "Statutory Legal Service"}</strong>
                          {inv.application && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              Ref: {inv.application.applicationNumber}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 font-medium whitespace-nowrap">
                        {formatDate(inv.createdAt)}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {formatCurrency(total)}
                      </td>

                      <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                        <span className="text-emerald-600 font-bold">{formatCurrency(paid)}</span>
                        {" / "}
                        <span className={due > 0 ? "text-amber-600 font-bold" : "text-slate-400"}>
                          {formatCurrency(due)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border ${
                            inv.status === "PAID"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200/80"
                              : inv.status === "PAYMENT_UNDER_REVIEW"
                              ? "bg-blue-50 text-blue-800 border-blue-200/80"
                              : inv.status === "PARTIALLY_PAID"
                              ? "bg-amber-50 text-amber-800 border-amber-200/80"
                              : inv.status === "OVERDUE"
                              ? "bg-rose-50 text-rose-800 border-rose-200/80"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {inv.status === "PAYMENT_UNDER_REVIEW" ? "Under Review" : inv.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/client/invoices/${inv.id}/document`}>
                            <button className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 shadow-xs">
                              <FileText className="size-3.5 text-slate-500" />
                              <span>View PDF</span>
                            </button>
                          </Link>

                          <Link href={`/client/invoices/${inv.id}`}>
                            <button className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 shadow-xs">
                              <span>Pay / Detail</span>
                              <ArrowRight className="size-3.5 text-amber-400" />
                            </button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
