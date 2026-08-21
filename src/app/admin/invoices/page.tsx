"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Receipt,
  Search,
  Plus,
  ArrowRight,
  Eye,
  Sliders,
  DollarSign,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileText,
  Send,
  Loader2,
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
  AdminCreateInvoiceModal,
  AdminInvoiceDetailModal,
  AdminFinancialAdjustmentModal,
} from "@/components/domain";
import { EmptyState, Skeleton, ErrorState } from "@/components/ui/feedback-primitives";
import { adminApi } from "@/lib/api/admin";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { Payment, PaymentStatus } from "@/types";

export default function AdminInvoicesPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedInvoiceForDetail, setSelectedInvoiceForDetail] = useState<Payment | null>(null);
  const [selectedInvoiceForAdjustment, setSelectedInvoiceForAdjustment] = useState<Payment | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Financial summary query
  const { data: summary } = useQuery({
    queryKey: ["admin-financial-summary"],
    queryFn: () => adminApi.getFinancialSummary(),
  });

  // Invoices list query
  const {
    data: invoicesData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-invoices-list", page, statusFilter, search],
    queryFn: () =>
      adminApi.getInvoices({
        page,
        limit: 15,
        status: (statusFilter as PaymentStatus) || undefined,
        search: search || undefined,
      }),
  });

  // Issue & send invoice mutation
  const issueMutation = useMutation({
    mutationFn: (invoiceId: string) => adminApi.resendInvoiceNotification(invoiceId),
    onSuccess: (updatedInvoice) => {
      setToastMessage({
        type: "success",
        text: `Invoice #${updatedInvoice.invoiceNumber || updatedInvoice.id.slice(0, 8)} notification successfully sent to client via in-app & email!`,
      });
      refetch();
      queryClient.invalidateQueries({ queryKey: ["admin-financial-summary"] });
    },
    onError: (err: any) => {
      setToastMessage({
        type: "error",
        text: err?.message || "Failed to send invoice notification to client.",
      });
    },
  });

  const invoices = invoicesData?.items || [];
  const pagination = invoicesData?.pagination;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-4 sm:p-5 lg:p-6 space-y-4 max-w-[1550px] mx-auto font-sans">
      {toastMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-900 font-bold flex items-center justify-between shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-700 hover:text-emerald-950 font-bold text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 1. HEADER SECTION */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Invoices &amp; Billing Command
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Statutory billing ledger, manual invoice generation, outstanding balance tracking, and adjustments.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
        >
          <Plus className="size-3.5" />
          <span>Create Manual Invoice</span>
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. FINANCIAL SUMMARY METRICS */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Billed</span>
            <span className="text-xl font-extrabold text-slate-900 font-mono mt-0.5 block">{formatCurrency(summary?.totalRevenue || 0)}</span>
            <span className="text-[10px] text-slate-500 font-medium">Cumulative gross billing</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
            <DollarSign className="size-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Collected Revenue</span>
            <span className="text-xl font-extrabold text-emerald-600 font-mono mt-0.5 block">{formatCurrency(summary?.totalCollected || 0)}</span>
            <span className="text-[10px] text-slate-500 font-medium">Realized settled payments</span>
          </div>
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60">
            <CheckCircle2 className="size-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Outstanding Receivables</span>
            <span className="text-xl font-extrabold text-amber-600 font-mono mt-0.5 block">{formatCurrency(summary?.totalPending || 0)}</span>
            <span className="text-[10px] text-slate-500 font-medium">Uncollected balances</span>
          </div>
          <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60">
            <Clock className="size-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Overdue Accounts</span>
            <span className="text-xl font-extrabold text-rose-600 font-mono mt-0.5 block">{formatCurrency(summary?.totalOverdue || 0)}</span>
            <span className="text-[10px] text-slate-500 font-medium">Past statutory due date</span>
          </div>
          <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200/60">
            <AlertTriangle className="size-4" />
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
            placeholder="Search by invoice #, client name, or reference..."
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
            <option value="PAID">Paid in Full</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="PENDING">Pending Payment</option>
            <option value="OVERDUE">Overdue</option>
            <option value="CANCELLED">Cancelled / Voided</option>
          </select>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 4. INVOICES TABLE */}
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
            <p className="text-xs font-bold text-rose-600">Failed to load invoices list.</p>
            <button
              onClick={() => refetch()}
              className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
            >
              Retry Loading
            </button>
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Receipt className="size-8 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No invoices found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No billing records match the current filter criteria.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition-colors inline-flex items-center gap-1.5"
            >
              <Plus className="size-3.5" />
              <span>Create Invoice</span>
            </button>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Dossier #</th>
                    <th className="py-3 px-4">Client Entity</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Balance Due</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-3 px-4">
                        <Link
                          href={`/admin/invoices/${inv.id}`}
                          className="font-mono text-xs font-bold text-amber-700 hover:underline"
                        >
                          #{inv.invoiceNumber || inv.id.slice(0, 8)}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        {inv.application ? (
                          <Link
                            href={`/admin/applications/${inv.application.id}`}
                            className="font-mono text-xs font-bold text-slate-900 hover:underline"
                          >
                            #{inv.application.applicationNumber}
                          </Link>
                        ) : (
                          <span className="text-xs text-slate-400 font-mono">
                            {inv.applicationId?.slice(0, 8) || "—"}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-800 font-bold">
                        {inv.user?.fullName || inv.user?.businessName || inv.client?.fullName || "Client"}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs font-bold text-slate-900">
                        {formatCurrency(inv.amount)}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-500 font-semibold">
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
                              : inv.status === "PARTIALLY_PAID"
                              ? "bg-amber-50 text-amber-800 border-amber-200/80"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500 font-mono">
                        {inv.dueDate ? formatDate(inv.dueDate) : "Immediate"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => issueMutation.mutate(inv.id)}
                            disabled={issueMutation.isPending}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-2.5 py-1 rounded-lg transition-all inline-flex items-center gap-1 shadow-xs disabled:opacity-50"
                            title="Send / Resend Invoice Notification to Client (In-App & Email)"
                          >
                            {issueMutation.isPending ? (
                              <Loader2 className="size-3 animate-spin text-white" />
                            ) : (
                              <Send className="size-3 text-emerald-200" />
                            )}
                            <span>{inv.status === "DRAFT" ? "Send to Client" : "Resend"}</span>
                          </button>
                          <button
                            onClick={() => setSelectedInvoiceForAdjustment(inv)}
                            className="bg-white border border-slate-200 text-slate-700 font-bold text-xs px-2.5 py-1 rounded-lg hover:bg-slate-50 transition-all inline-flex items-center gap-1"
                          >
                            <Sliders className="size-3 text-slate-500" />
                            <span>Adjust</span>
                          </button>
                          <Link href={`/admin/invoices/${inv.id}`}>
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

      {/* CREATE INVOICE MODAL */}
      {isCreateModalOpen && (
        <AdminCreateInvoiceModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setToastMessage({
              type: "success",
              text: "Commercial Invoice successfully generated and dispatched to client ledger.",
            });
            refetch();
            queryClient.invalidateQueries({ queryKey: ["admin-financial-summary"] });
          }}
        />
      )}

      {/* FINANCIAL ADJUSTMENT MODAL */}
      {selectedInvoiceForAdjustment && (
        <AdminFinancialAdjustmentModal
          paymentId={selectedInvoiceForAdjustment.id}
          invoiceNumber={selectedInvoiceForAdjustment.invoiceNumber}
          currentAmount={selectedInvoiceForAdjustment.amount}
          isOpen={Boolean(selectedInvoiceForAdjustment)}
          onClose={() => setSelectedInvoiceForAdjustment(null)}
          onSuccess={() => {
            refetch();
            queryClient.invalidateQueries({ queryKey: ["admin-financial-summary"] });
          }}
        />
      )}
    </div>
  );
}
