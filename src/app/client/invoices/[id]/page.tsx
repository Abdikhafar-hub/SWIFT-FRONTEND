"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Receipt,
  FileText,
  Eye,
  Download,
  CreditCard,
  Upload,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { paymentsApi } from "@/lib/api/payments";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { Skeleton, ErrorState } from "@/components/ui/feedback-primitives";
import { MpesaPaymentModal } from "@/components/domain/mpesa-payment-modal";
import { ClientPaymentProofModal } from "@/components/domain/client-payment-proof-modal";
import type { Payment } from "@/types";

export default function ClientInvoiceDetailPage() {
  const params = useParams();
  const id = String(params.id);

  const [isMpesaModalOpen, setIsMpesaModalOpen] = useState(false);
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);

  const {
    data: invoice,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["client-invoice", id],
    queryFn: () => paymentsApi.getInvoiceById(id),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-6 space-y-4 max-w-[1200px] mx-auto">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-6 max-w-[1200px] mx-auto">
        <ErrorState
          title="Invoice Not Found"
          message="Could not retrieve the requested commercial invoice details."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const invoiceNum = invoice.invoiceNumber || `INV-${invoice.id.slice(0, 8).toUpperCase()}`;
  const totalAmount = Number(invoice.amount || invoice.totalAmount || 0);
  const paidAmount = Number(invoice.paidAmount || invoice.amountPaid || 0);
  const amountDue = Number(
    invoice.balanceRemaining ??
      invoice.amountDue ??
      (invoice.status === "PAID" ? 0 : totalAmount)
  );

  const transactions = invoice.transactions || [];
  const receipts = invoice.receipts || [];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-4 sm:p-5 lg:p-6 space-y-4 max-w-[1400px] mx-auto font-sans">
      {/* ------------------------------------------------------------------ */}
      {/* 1. HEADER SECTION */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/client/invoices" className="text-slate-400 hover:text-slate-700 transition-colors">
              <ArrowLeft className="size-4" />
            </Link>
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/80">
              Commercial Invoice #{invoiceNum}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Invoice Details &amp; Payment Options
          </h1>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/client/invoices/${id}/document`}>
            <button className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 border border-slate-800">
              <Eye className="size-3.5 text-amber-400" />
              <span>View Official A4 Invoice</span>
            </button>
          </Link>

          {invoice.status !== "PAID" && invoice.status !== "CANCELLED" && (
            <>
              <button
                onClick={() => setIsMpesaModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
              >
                <CreditCard className="size-3.5" />
                <span>Pay via M-Pesa (Instant)</span>
              </button>

              <button
                onClick={() => setIsProofModalOpen(true)}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
              >
                <Upload className="size-3.5" />
                <span>Upload Payment Proof</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. INVOICE OVERVIEW CARDS */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Itemization & Line Items */}
        <div className="space-y-4 lg:col-span-2">
          <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Service Designation
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {invoice.description || "Statutory Legal Documentation Service"}
                </h3>
                {invoice.application && (
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Application Ref: {invoice.application.applicationNumber}
                  </p>
                )}
              </div>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border ${
                  invoice.status === "PAID"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200/80"
                    : invoice.status === "PAYMENT_UNDER_REVIEW"
                    ? "bg-blue-50 text-blue-800 border-blue-200/80"
                    : invoice.status === "PARTIALLY_PAID"
                    ? "bg-amber-50 text-amber-800 border-amber-200/80"
                    : "bg-slate-100 text-slate-600 border-slate-200"
                }`}
              >
                {invoice.status === "PAYMENT_UNDER_REVIEW" ? "Under Verification Review" : invoice.status}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3">
                <span className="text-slate-400 block text-[10px] font-extrabold uppercase tracking-wider">Total Billed</span>
                <strong className="text-slate-900 font-mono text-sm block mt-0.5">{formatCurrency(totalAmount)}</strong>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3">
                <span className="text-slate-400 block text-[10px] font-extrabold uppercase tracking-wider">Amount Paid</span>
                <strong className="text-emerald-600 font-mono text-sm block mt-0.5">{formatCurrency(paidAmount)}</strong>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3">
                <span className="text-slate-400 block text-[10px] font-extrabold uppercase tracking-wider">Remaining Balance</span>
                <strong className="text-amber-600 font-mono text-sm block mt-0.5">{formatCurrency(amountDue)}</strong>
              </div>
            </div>

            {/* Line Items */}
            {invoice.lineItems && invoice.lineItems.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Itemized Fee Breakdown
                </h4>
                <div className="border border-slate-200/80 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200/80 text-[10px] uppercase font-bold text-slate-400">
                      <tr>
                        <th className="py-2 px-3">Description</th>
                        <th className="py-2 px-3 text-center">Qty</th>
                        <th className="py-2 px-3 text-right">Unit Price</th>
                        <th className="py-2 px-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {invoice.lineItems.map((item, idx) => (
                        <tr key={item.id || idx}>
                          <td className="py-2.5 px-3 text-slate-800">{item.description}</td>
                          <td className="py-2.5 px-3 text-center font-mono">{item.quantity || 1}</td>
                          <td className="py-2.5 px-3 text-right font-mono">{formatCurrency((item as any).unitAmount || (item as any).unitPrice || 0)}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{formatCurrency((item as any).totalAmount || (item as any).amount || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Payment Status Under Review Alert Banner */}
          {invoice.status === "PAYMENT_UNDER_REVIEW" && (
            <div className="bg-blue-50/90 border border-blue-200 rounded-xl p-4 text-blue-900 text-xs font-medium space-y-1">
              <div className="flex items-center gap-2 font-bold text-blue-950">
                <Clock className="size-4 text-blue-600" />
                <span>Payment Verification Pending</span>
              </div>
              <p>
                Your manual payment proof submission is currently being reviewed by Swift Doc Finance Officers. Verification typically takes 15–30 minutes during business hours. Once verified, your statutory receipt will be generated automatically.
              </p>
            </div>
          )}

          {/* Transactions & Receipts History */}
          <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Receipt className="size-4 text-amber-500" />
              <span>Settlement Transactions &amp; Receipts</span>
            </h3>

            {receipts.length > 0 && (
              <div className="space-y-2">
                {receipts.map((rec) => (
                  <div key={rec.id} className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="size-4 text-emerald-600" />
                      <div>
                        <strong className="block text-slate-900 font-mono">Receipt #{rec.receiptNumber}</strong>
                        <span className="text-[10px] text-slate-500 font-medium">{formatDate(rec.createdAt)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-emerald-700 text-sm block">{formatCurrency(rec.amount)}</span>
                      <span className="text-[10px] text-slate-500 uppercase">{rec.paymentMethod}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {transactions.length === 0 && receipts.length === 0 && (
              <p className="text-xs text-slate-400 italic">No payments or receipts recorded yet for this invoice.</p>
            )}
          </div>
        </div>

        {/* Right 1 Col: Quick Payment Portal Card */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              Settlement Portal
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Invoice Status:</span>
                <strong className="text-slate-900 font-bold">{invoice.status}</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Issue Date:</span>
                <span className="font-medium text-slate-800">{formatDate(invoice.createdAt)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Due Date:</span>
                <span className="font-medium text-slate-800">{invoice.dueAt ? formatDate(invoice.dueAt) : "Upon Receipt"}</span>
              </div>
              <div className="flex justify-between text-slate-600 border-t border-slate-100 pt-2 font-mono">
                <span className="font-sans">Balance Payable:</span>
                <strong className="text-amber-600 font-bold text-sm">{formatCurrency(amountDue)}</strong>
              </div>
            </div>

            {invoice.status !== "PAID" && invoice.status !== "CANCELLED" && (
              <div className="space-y-2.5 pt-2">
                <button
                  onClick={() => setIsMpesaModalOpen(true)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <CreditCard className="size-4" />
                  <span>Pay with M-Pesa Express</span>
                </button>

                <button
                  onClick={() => setIsProofModalOpen(true)}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 px-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 border border-slate-800"
                >
                  <Upload className="size-4 text-amber-400" />
                  <span>Upload Bank / M-Pesa Proof</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {isMpesaModalOpen && (
        <MpesaPaymentModal
          isOpen={isMpesaModalOpen}
          onClose={() => setIsMpesaModalOpen(false)}
          invoice={{
            id: invoice.id,
            invoiceNumber: invoiceNum,
            totalAmount: totalAmount,
            amountDue: amountDue,
          }}
          onPaymentSuccess={() => {
            refetch();
          }}
        />
      )}

      {isProofModalOpen && (
        <ClientPaymentProofModal
          isOpen={isProofModalOpen}
          onClose={() => setIsProofModalOpen(false)}
          invoice={invoice}
          onSuccess={() => {
            refetch();
          }}
        />
      )}
    </div>
  );
}
