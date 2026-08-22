"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  CreditCard,
  Receipt as ReceiptIcon,
  Smartphone,
  FileText,
  History,
  Printer,
  Eye,
  Download,
} from "lucide-react";
import { PaymentStatusBadge } from "@/components/domain/status-badges";
import { MpesaPaymentModal } from "@/components/domain/mpesa-payment-modal";
import { ReceiptModal } from "@/components/domain/receipt-modal";
import { paymentsApi } from "@/lib/api/payments";
import { useAuth } from "@/lib/auth/auth-context";
import { formatDate, formatKES } from "@/lib/utils/format";
import type { Payment, Receipt, PaymentStatus } from "@/types";

type PaymentTab = "invoices" | "receipts" | "transactions";

export default function ClientPaymentsPage() {
  const { client } = useAuth();
  const [activeTab, setActiveTab] = useState<PaymentTab>("invoices");
  const [page, setPage] = useState(1);

  // Modal states
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Payment | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);

  // 1. Fetch Client Invoices
  const {
    data: invoicesData,
    isLoading: isInvoicesLoading,
    isError: invoicesError,
    refetch: refetchInvoices,
  } = useQuery({
    queryKey: ["client-invoices", page],
    queryFn: () => paymentsApi.getInvoices({ page, limit: 10 }),
  });

  // 2. Fetch Client Receipts
  const {
    data: receiptsData,
    isLoading: isReceiptsLoading,
    refetch: refetchReceipts,
  } = useQuery({
    queryKey: ["client-receipts", page],
    queryFn: () => paymentsApi.getReceipts({ page, limit: 10 }),
  });

  // 3. Fetch Client Payment Transactions
  const {
    data: transactionsData,
    isLoading: isTransactionsLoading,
    refetch: refetchTransactions,
  } = useQuery({
    queryKey: ["client-transactions", page],
    queryFn: () => paymentsApi.getTransactions({ page, limit: 10 }),
  });

  const invoices = invoicesData?.items || [];
  const invoicesMeta = invoicesData?.meta;

  const receipts: Receipt[] = Array.isArray(receiptsData)
    ? receiptsData
    : (receiptsData as any)?.items || [];

  const transactions = transactionsData?.items || [];

  // Calculate totals
  const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + Number(inv.amountPaid || 0), 0);
  const totalDue = invoices.reduce(
    (sum, inv) => sum + Number(inv.amountDue || Number(inv.totalAmount) - Number(inv.amountPaid || 0)),
    0
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-4 sm:p-5 lg:p-6 space-y-4 max-w-[1550px] mx-auto font-sans">
      {/* ------------------------------------------------------------------ */}
      {/* 1. HEADER SECTION */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Payments &amp; Official Receipts
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Settle statutory filing fees via Safaricom M-Pesa Express, track transaction ledgers, and download verified VAT payment receipts.
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. METRIC CARDS */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            Total Invoiced Amount
          </span>
          <div className="font-mono text-xl font-extrabold text-slate-900">
            {formatKES(totalInvoiced)}
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-emerald-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-1 bg-emerald-50/20">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
            Total Settled (Reconciled)
          </span>
          <div className="font-mono text-xl font-extrabold text-emerald-600">
            {formatKES(totalPaid)}
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-amber-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-1 bg-amber-50/20">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800">
            Outstanding Payable
          </span>
          <div className="font-mono text-xl font-extrabold text-amber-600">
            {formatKES(totalDue)}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. TABS NAVIGATION */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-px text-xs">
        <button
          onClick={() => {
            setActiveTab("invoices");
            setPage(1);
          }}
          className={`flex items-center gap-2 border-b-2 px-3.5 py-2.5 font-bold transition-all ${
            activeTab === "invoices"
              ? "border-amber-500 text-amber-700 bg-amber-50/40 rounded-t-lg"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <FileText className="size-3.5" />
          <span>Statutory Invoices ({invoices.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("receipts");
            setPage(1);
          }}
          className={`flex items-center gap-2 border-b-2 px-3.5 py-2.5 font-bold transition-all ${
            activeTab === "receipts"
              ? "border-amber-500 text-amber-700 bg-amber-50/40 rounded-t-lg"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <ReceiptIcon className="size-3.5" />
          <span>Official Receipts ({receipts.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("transactions");
            setPage(1);
          }}
          className={`flex items-center gap-2 border-b-2 px-3.5 py-2.5 font-bold transition-all ${
            activeTab === "transactions"
              ? "border-amber-500 text-amber-700 bg-amber-50/40 rounded-t-lg"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <History className="size-3.5" />
          <span>M-Pesa Transaction Log</span>
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 4. TAB CONTENTS */}
      {/* ------------------------------------------------------------------ */}

      {/* INVOICES TAB */}
      {activeTab === "invoices" && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
          {isInvoicesLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
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
                Retry
              </button>
            </div>
          ) : invoices.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="size-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                <CreditCard className="size-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No invoices generated</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Invoices generated for statutory document applications will display here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Statutory Filing</th>
                    <th className="py-3 px-4">Total Fee</th>
                    <th className="py-3 px-4">Amount Paid</th>
                    <th className="py-3 px-4">Balance Due</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {invoices.map((inv) => {
                    const dueNum = Number(inv.amountDue || Number(inv.totalAmount) - Number(inv.amountPaid || 0));
                    const isFullyPaid = dueNum <= 0 || inv.status === "PAID";

                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          #{inv.invoiceNumber}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {inv.application?.service?.name || "Statutory Application"}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {formatKES(inv.totalAmount)}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500">
                          {formatKES(inv.amountPaid || 0)}
                        </td>
                        <td className="py-3 px-4 font-mono">
                          {dueNum > 0 ? (
                            <span className="font-bold text-amber-600">
                              {formatKES(dueNum)}
                            </span>
                          ) : (
                            <span className="text-emerald-600 font-bold">
                              KES 0.00
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <PaymentStatusBadge status={inv.status as PaymentStatus} size="sm" />
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-medium">
                          {inv.dueAt ? formatDate(inv.dueAt) : "Immediate"}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link href={`/client/invoices/${inv.id}/document`}>
                              <button
                                title="View A4 Commercial Invoice"
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                              >
                                <Eye className="size-3.5 text-slate-500" />
                                <span>Invoice</span>
                              </button>
                            </Link>

                            {!isFullyPaid ? (
                              <button
                                onClick={() => setSelectedInvoiceForPayment(inv)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1 rounded-lg shadow-xs flex items-center gap-1 transition-colors"
                              >
                                <Smartphone className="size-3.5" />
                                <span>Pay M-Pesa</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  if (inv.receipts && inv.receipts.length > 0) {
                                    setSelectedReceipt(inv.receipts[0]);
                                  }
                                }}
                                className="px-2.5 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg border border-amber-200/60 text-xs font-bold flex items-center gap-1 transition-colors"
                              >
                                <ReceiptIcon className="size-3.5" />
                                <span>Receipt</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {invoicesMeta && (invoicesMeta.totalPages ?? 0) > 1 && (
            <div className="px-4 py-3 bg-slate-50/60 border-t border-slate-200/80 flex items-center justify-between text-xs font-semibold text-slate-600">
              <span>
                Showing Page {invoicesMeta.page ?? 1} of {invoicesMeta.totalPages ?? 1} ({invoicesMeta.total ?? 0} total invoices)
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={(invoicesMeta.page ?? 1) <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
                >
                  Previous
                </button>
                <button
                  disabled={(invoicesMeta.page ?? 1) >= (invoicesMeta.totalPages ?? 1)}
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

      {/* RECEIPTS TAB */}
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
              <div className="size-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                <ReceiptIcon className="size-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No payment receipts</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Official VAT receipts will appear here automatically after M-Pesa payment settlement.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Receipt #</th>
                    <th className="py-3 px-4">Amount Settled</th>
                    <th className="py-3 px-4">Payment Method</th>
                    <th className="py-3 px-4">Transaction Ref</th>
                    <th className="py-3 px-4">Date Issued</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {receipts.map((rcpt) => (
                    <tr key={rcpt.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        #{rcpt.receiptNumber}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-600">
                        {formatKES(rcpt.amountPaid || rcpt.amount)}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        {rcpt.paymentMethod || "M-PESA EXPRESS"}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {rcpt.transactionReference || "DAR-" + rcpt.id.substring(0, 8).toUpperCase()}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-medium">
                        {formatDate(rcpt.issuedAt || rcpt.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedReceipt(rcpt)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors bg-amber-50 hover:bg-amber-100/80 px-2.5 py-1 rounded-lg border border-amber-200/60 ml-auto"
                        >
                          <Printer className="size-3.5" />
                          <span>View Receipt</span>
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

      {/* TRANSACTIONS TAB */}
      {activeTab === "transactions" && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
          {isTransactionsLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-slate-100 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="size-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                <History className="size-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No transaction logs</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Detailed gateway logs and Daraja payment references will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Reference #</th>
                    <th className="py-3 px-4">Channel</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Handset / Payer</th>
                    <th className="py-3 px-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {tx.providerRef || tx.transactionRef || tx.id.substring(0, 10).toUpperCase()}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        {tx.channel || "MPESA"}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {formatKES(tx.amount)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                            tx.status === "COMPLETED" || tx.status === "PAID"
                              ? "bg-emerald-50 text-emerald-700"
                              : tx.status === "FAILED"
                              ? "bg-rose-50 text-rose-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {tx.payerPhone || "—"}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-medium">
                        {formatDate(tx.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* M-Pesa STK Push Modal */}
      {selectedInvoiceForPayment && (
        <MpesaPaymentModal
          isOpen={Boolean(selectedInvoiceForPayment)}
          onClose={() => setSelectedInvoiceForPayment(null)}
          invoice={{
            id: selectedInvoiceForPayment.id,
            invoiceNumber: selectedInvoiceForPayment.invoiceNumber,
            totalAmount: selectedInvoiceForPayment.totalAmount,
            amountDue:
              selectedInvoiceForPayment.amountDue ||
              Number(selectedInvoiceForPayment.totalAmount) -
                Number(selectedInvoiceForPayment.amountPaid || 0),
            amountPaid: selectedInvoiceForPayment.amountPaid,
            currency: selectedInvoiceForPayment.currency,
          }}
          clientPhone={client?.phone}
          onPaymentSuccess={() => {
            refetchInvoices();
            refetchReceipts();
            refetchTransactions();
          }}
        />
      )}

      {/* Official VAT Receipt Modal */}
      <ReceiptModal
        isOpen={Boolean(selectedReceipt)}
        onClose={() => setSelectedReceipt(null)}
        receipt={selectedReceipt}
      />
    </div>
  );
}
