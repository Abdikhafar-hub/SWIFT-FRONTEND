"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CreditCard,
  Receipt as ReceiptIcon,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  FileText,
  History,
  Download,
  Filter,
  DollarSign,
  Printer,
} from "lucide-react";
import { PageShell } from "@/components/ui/layout-primitives";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Pagination,
} from "@/components/ui/table-primitives";
import { Button } from "@/components/ui/button";
import { PaymentStatusBadge } from "@/components/domain/status-badges";
import { MpesaPaymentModal } from "@/components/domain/mpesa-payment-modal";
import { ReceiptModal } from "@/components/domain/receipt-modal";
import { EmptyState, Skeleton, ErrorState } from "@/components/ui/feedback-primitives";
import { paymentsApi } from "@/lib/api/payments";
import { useAuth } from "@/lib/auth/auth-context";
import { formatDate, formatKES } from "@/lib/utils/format";
import type { Payment, Receipt, PaymentTransaction, PaymentStatus } from "@/types";

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
    error: invoicesError,
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
  const transactionsMeta = transactionsData?.meta;

  // Calculate totals
  const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + Number(inv.amountPaid || 0), 0);
  const totalDue = invoices.reduce(
    (sum, inv) => sum + Number(inv.amountDue || Number(inv.totalAmount) - Number(inv.amountPaid || 0)),
    0
  );

  return (
    <PageShell
      eyebrow="STATUTORY FINANCIALS"
      title="Payments & Official Receipts"
      description="Settle statutory filing fees via Safaricom M-Pesa Express, track transaction ledgers, and download verified VAT payment receipts."
    >
      {/* Financial Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
        <div className="rounded-sm border border-border bg-card p-5 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Total Invoiced Amount
          </span>
          <div className="font-mono text-xl font-bold text-foreground">
            {formatKES(totalInvoiced)}
          </div>
        </div>

        <div className="rounded-sm border border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/10 p-5 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Total Settled (Reconciled)
          </span>
          <div className="font-mono text-xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatKES(totalPaid)}
          </div>
        </div>

        <div className="rounded-sm border border-amber-500/30 bg-amber-50/20 dark:bg-amber-950/10 p-5 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Outstanding Payable
          </span>
          <div className="font-mono text-xl font-bold text-amber-600 dark:text-amber-400">
            {formatKES(totalDue)}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border/80 pb-px mb-6 text-xs">
        <button
          onClick={() => {
            setActiveTab("invoices");
            setPage(1);
          }}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 font-bold transition-all ${
            activeTab === "invoices"
              ? "border-gold text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
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
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 font-bold transition-all ${
            activeTab === "receipts"
              ? "border-gold text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
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
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 font-bold transition-all ${
            activeTab === "transactions"
              ? "border-gold text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <History className="size-3.5" />
          <span>M-Pesa Transaction Log</span>
        </button>
      </div>

      {/* 1. INVOICES TAB */}
      {activeTab === "invoices" && (
        <div>
          {isInvoicesLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : invoicesError ? (
            <ErrorState onRetry={() => refetchInvoices()} />
          ) : invoices.length === 0 ? (
            <EmptyState
              icon={<CreditCard className="size-8" />}
              title="No invoices generated"
              description="Invoices created for statutory document filings will display here."
            />
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Statutory Filing</TableHead>
                    <TableHead>Total Fee</TableHead>
                    <TableHead>Amount Paid</TableHead>
                    <TableHead>Balance Due</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => {
                    const dueNum = Number(inv.amountDue || Number(inv.totalAmount) - Number(inv.amountPaid || 0));
                    const isFullyPaid = dueNum <= 0 || inv.status === "PAID";

                    return (
                      <TableRow key={inv.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-mono text-xs font-bold text-foreground">
                          #{inv.invoiceNumber}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-foreground">
                          {inv.application?.service?.name || "Statutory Application"}
                        </TableCell>
                        <TableCell className="font-mono text-xs font-bold text-foreground">
                          {formatKES(inv.totalAmount)}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {formatKES(inv.amountPaid || 0)}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {dueNum > 0 ? (
                            <span className="font-bold text-amber-600 dark:text-amber-400">
                              {formatKES(dueNum)}
                            </span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                              KES 0.00
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <PaymentStatusBadge status={inv.status as PaymentStatus} size="sm" />
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {inv.dueAt ? formatDate(inv.dueAt) : "Immediate"}
                        </TableCell>
                        <TableCell className="text-right">
                          {!isFullyPaid ? (
                            <Button
                              size="xs"
                              onClick={() => setSelectedInvoiceForPayment(inv)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1 shadow-xs"
                            >
                              <Smartphone className="size-3" />
                              <span>Pay M-Pesa</span>
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => {
                                if (inv.receipts && inv.receipts.length > 0) {
                                  setSelectedReceipt(inv.receipts[0]);
                                }
                              }}
                              className="text-xs gap-1 text-gold-dark dark:text-gold"
                            >
                              <ReceiptIcon className="size-3" />
                              <span>Receipt</span>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {invoicesMeta && (
                <Pagination
                  currentPage={invoicesMeta.page || 1}
                  totalPages={invoicesMeta.totalPages || 1}
                  totalItems={invoicesMeta.total || 0}
                  pageSize={invoicesMeta.limit || 10}
                  onPageChange={(p) => setPage(p)}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* 2. RECEIPTS TAB */}
      {activeTab === "receipts" && (
        <div>
          {isReceiptsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : receipts.length === 0 ? (
            <EmptyState
              icon={<ReceiptIcon className="size-8" />}
              title="No payment receipts"
              description="Official payment receipts will appear immediately upon M-Pesa settlement."
            />
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt #</TableHead>
                    <TableHead>Amount Settled</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Transaction Ref</TableHead>
                    <TableHead>Date Issued</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receipts.map((rcpt) => (
                    <TableRow key={rcpt.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-mono text-xs font-bold text-foreground">
                        #{rcpt.receiptNumber}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {formatKES(rcpt.amountPaid || rcpt.amount)}
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        {rcpt.paymentMethod || "M-PESA EXPRESS"}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {rcpt.transactionReference || "DAR-" + rcpt.id.substring(0, 8).toUpperCase()}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(rcpt.issuedAt || rcpt.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => setSelectedReceipt(rcpt)}
                          className="text-gold-dark dark:text-gold font-bold gap-1 hover:text-gold-light"
                        >
                          <Printer className="size-3" />
                          <span>View Receipt</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {/* 3. TRANSACTIONS TAB */}
      {activeTab === "transactions" && (
        <div>
          {isTransactionsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : transactions.length === 0 ? (
            <EmptyState
              icon={<History className="size-8" />}
              title="No transaction logs"
              description="Detailed gateway logs and Daraja payment references will appear here."
            />
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference #</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Handset / Payer</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-mono text-xs font-bold text-foreground">
                        {tx.providerRef || tx.transactionRef || tx.id.substring(0, 10).toUpperCase()}
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        {tx.channel || "MPESA"}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold text-foreground">
                        {formatKES(tx.amount)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`rounded-xs px-1.5 py-0.5 text-[10px] font-extrabold uppercase ${
                            tx.status === "COMPLETED" || tx.status === "PAID"
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : tx.status === "FAILED"
                              ? "bg-destructive/15 text-destructive"
                              : "bg-amber-500/15 text-amber-600"
                          }`}
                        >
                          {tx.status}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {tx.payerPhone || "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(tx.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
    </PageShell>
  );
}
