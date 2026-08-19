"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DollarSign,
  Send,
  XCircle,
  Sliders,
  CreditCard,
  Receipt as ReceiptIcon,
  ExternalLink,
  ShieldCheck,
  Building,
  RotateCcw,
  AlertCircle,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormField, Textarea } from "@/components/ui/form-primitives";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table-primitives";
import { Skeleton, ErrorState } from "@/components/ui/feedback-primitives";
import { AdminManualPaymentModal } from "./admin-manual-payment-modal";
import { AdminFinancialAdjustmentModal } from "./admin-financial-adjustment-modal";
import { AdminReverseTransactionModal } from "./admin-reverse-transaction-modal";
import { AdminReceiptDetailModal } from "./admin-receipt-detail-modal";
import { AdminRequestRefundModal } from "./admin-refund-modals";
import { adminApi } from "@/lib/api/admin";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { Payment, PaymentTransaction, InvoiceLineItem } from "@/types";

interface AdminInvoiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: string | null;
  onUpdated?: () => void;
}

export function AdminInvoiceDetailModal({
  isOpen,
  onClose,
  invoiceId,
  onUpdated,
}: AdminInvoiceDetailModalProps) {
  const queryClient = useQueryClient();

  // Child Modals State
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedTxForReverse, setSelectedTxForReverse] = useState<PaymentTransaction | null>(null);
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);
  const [selectedTxForRefund, setSelectedTxForRefund] = useState<PaymentTransaction | null>(null);

  // Cancellation State
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const {
    data: invoice,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-invoice", invoiceId],
    queryFn: () => adminApi.getInvoiceById(invoiceId!),
    enabled: Boolean(invoiceId) && isOpen,
  });

  const issueMutation = useMutation({
    mutationFn: () => {
      if (!invoice) throw new Error("No invoice selected");
      return adminApi.issueInvoice(invoice.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-invoices-list"] });
      queryClient.invalidateQueries({ queryKey: ["admin-invoice", invoiceId] });
      queryClient.invalidateQueries({ queryKey: ["admin-financial-summary"] });
      if (onUpdated) onUpdated();
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => {
      if (!invoice) throw new Error("No invoice selected");
      if (!cancelReason.trim()) throw new Error("Cancellation reason is required");
      return adminApi.cancelInvoice(invoice.id, { reason: cancelReason.trim() });
    },
    onSuccess: () => {
      setIsCancelConfirmOpen(false);
      setCancelReason("");
      queryClient.invalidateQueries({ queryKey: ["admin-invoices-list"] });
      queryClient.invalidateQueries({ queryKey: ["admin-invoice", invoiceId] });
      queryClient.invalidateQueries({ queryKey: ["admin-financial-summary"] });
      if (onUpdated) onUpdated();
    },
  });

  if (!invoiceId) return null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={invoice ? `Invoice #${invoice.invoiceNumber}` : "Invoice Dossier"}
        description="Comprehensive statutory itemization, settlement transactions, and audit controls."
        size="xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              {invoice?.applicationId && (
                <Link href={`/admin/applications/${invoice.applicationId}`}>
                  <Button variant="outline" size="xs" leftIcon={<ExternalLink className="size-3.5" />}>
                    Application Dossier
                  </Button>
                </Link>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onClose}>
                Close
              </Button>

              {invoice && invoice.status === "DRAFT" && (
                <Button
                  variant="gold"
                  size="sm"
                  leftIcon={<Send className="size-3.5" />}
                  isLoading={issueMutation.isPending}
                  onClick={() => issueMutation.mutate()}
                >
                  Issue Invoice
                </Button>
              )}

              {invoice && invoice.status !== "PAID" && invoice.status !== "CANCELLED" && invoice.status !== "VOID" && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Sliders className="size-3.5" />}
                    onClick={() => setIsAdjustModalOpen(true)}
                  >
                    Adjust
                  </Button>
                  <Button
                    variant="gold"
                    size="sm"
                    leftIcon={<DollarSign className="size-3.5" />}
                    onClick={() => setIsPayModalOpen(true)}
                  >
                    Record Payment
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => setIsCancelConfirmOpen(true)}
                  >
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>
        }
      >
        {isLoading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : error || !invoice ? (
          <ErrorState onRetry={() => refetch()} />
        ) : (
          <div className="space-y-6 text-xs max-h-[72vh] overflow-y-auto pr-1">
            {/* 1. Header Overview Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xs border border-border bg-muted/20 p-3">
                <span className="text-muted-foreground block text-[11px]">Invoice Status</span>
                <Badge
                  tone={
                    invoice.status === "PAID" || invoice.status === "COMPLETED"
                      ? "success"
                      : invoice.status === "OVERDUE"
                      ? "destructive"
                      : invoice.status === "DRAFT"
                      ? "neutral"
                      : "warning"
                  }
                  size="sm"
                  className="mt-1"
                >
                  {invoice.status}
                </Badge>
              </div>

              <div className="rounded-xs border border-border bg-muted/20 p-3">
                <span className="text-muted-foreground block text-[11px]">Total Invoiced</span>
                <strong className="font-mono text-sm font-bold text-foreground">
                  {formatCurrency(invoice.totalAmount, invoice.currency)}
                </strong>
              </div>

              <div className="rounded-xs border border-border bg-muted/20 p-3">
                <span className="text-muted-foreground block text-[11px]">Amount Settled</span>
                <strong className="font-mono text-sm font-bold text-emerald-600">
                  {formatCurrency(invoice.amountPaid, invoice.currency)}
                </strong>
              </div>

              <div className="rounded-xs border border-border bg-muted/20 p-3">
                <span className="text-muted-foreground block text-[11px]">Outstanding Due</span>
                <strong className="font-mono text-sm font-bold text-gold-dark dark:text-gold">
                  {formatCurrency(invoice.amountDue, invoice.currency)}
                </strong>
              </div>
            </div>

            {/* 2. Client & Timeline Information */}
            <div className="rounded-xs border border-border bg-muted/10 p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Client Entity
                </span>
                <strong className="text-sm font-bold text-foreground block">
                  {invoice.client?.fullName || invoice.client?.businessName || "Verified Entity"}
                </strong>
                {invoice.client?.kraPin && (
                  <span className="text-muted-foreground block font-mono">
                    KRA PIN: {invoice.client.kraPin}
                  </span>
                )}
                {invoice.client?.email && (
                  <span className="text-muted-foreground block">{invoice.client.email}</span>
                )}
              </div>

              <div className="space-y-1 sm:text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Key Timeline Dates
                </span>
                <div className="text-muted-foreground">
                  Created: <strong className="text-foreground">{formatDate(invoice.createdAt)}</strong>
                </div>
                {invoice.issuedAt && (
                  <div className="text-muted-foreground">
                    Issued: <strong className="text-foreground">{formatDate(invoice.issuedAt)}</strong>
                  </div>
                )}
                <div className="text-muted-foreground">
                  Due: <strong className="text-foreground">{invoice.dueAt ? formatDate(invoice.dueAt) : "On Demand"}</strong>
                </div>
              </div>
            </div>

            {/* 3. Itemized Line Items Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-border pb-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Itemized Fee Breakdown
                </h4>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {invoice.lineItems?.length || 0} Line Items
                </span>
              </div>

              {invoice.lineItems && invoice.lineItems.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.lineItems.map((item: InvoiceLineItem) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Badge tone={item.isGovernmentFee ? "gold" : "neutral"} size="sm">
                            {item.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold text-foreground">
                          {item.description}
                        </TableCell>
                        <TableCell className="text-right font-mono">{item.quantity}</TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">
                          {formatCurrency(item.unitAmount, invoice.currency)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-foreground">
                          {formatCurrency(item.totalAmount, invoice.currency)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground py-2">No individual line items recorded.</p>
              )}
            </div>

            {/* 4. Statutory Fee Summary Grid */}
            <div className="rounded-xs border border-border bg-card p-3.5 space-y-2 text-xs">
              <div className="flex justify-between border-b border-border/50 pb-1.5">
                <span className="text-muted-foreground">Government Disbursements (Non-Taxable)</span>
                <span className="font-mono font-semibold text-foreground">
                  {formatCurrency(invoice.governmentFee, invoice.currency)}
                </span>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-1.5">
                <span className="text-muted-foreground">Professional Service Fees</span>
                <span className="font-mono font-semibold text-foreground">
                  {formatCurrency(invoice.serviceFee, invoice.currency)}
                </span>
              </div>
              {Number(invoice.discount || 0) > 0 && (
                <div className="flex justify-between border-b border-border/50 pb-1.5 text-emerald-600">
                  <span>Applied Discounts / Waivers</span>
                  <span className="font-mono font-semibold">
                    -{formatCurrency(invoice.discount, invoice.currency)}
                  </span>
                </div>
              )}
              {Number(invoice.tax || 0) > 0 && (
                <div className="flex justify-between border-b border-border/50 pb-1.5">
                  <span className="text-muted-foreground">VAT / Applicable Tax</span>
                  <span className="font-mono font-semibold text-foreground">
                    {formatCurrency(invoice.tax, invoice.currency)}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-1 text-sm font-bold text-foreground">
                <span>Grand Total</span>
                <span className="font-mono text-gold-dark dark:text-gold">
                  {formatCurrency(invoice.totalAmount, invoice.currency)}
                </span>
              </div>
            </div>

            {/* 5. Payment Transactions Ledger */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Payment Transactions Ledger
              </h4>
              {invoice.transactions && invoice.transactions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tx #</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.transactions.map((tx: PaymentTransaction) => (
                      <TableRow key={tx.id}>
                        <TableCell className="font-mono font-semibold text-foreground">
                          {tx.transactionNumber}
                        </TableCell>
                        <TableCell>
                          <Badge tone="neutral" size="sm">{tx.paymentMethod}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-muted-foreground">
                          {tx.externalReference || "—"}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-emerald-600">
                          {formatCurrency(tx.amount, tx.currency || invoice.currency)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            tone={tx.status === "PAID" || tx.status === "COMPLETED" ? "success" : "warning"}
                            size="sm"
                          >
                            {tx.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(tx.paidAt || tx.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {tx.status === "COMPLETED" || tx.status === "PAID" ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="xs"
                                  className="text-gold-dark hover:bg-gold/10"
                                  onClick={() => setSelectedTxForRefund(tx)}
                                >
                                  Refund
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="xs"
                                  className="text-destructive hover:bg-destructive/10"
                                  onClick={() => setSelectedTxForReverse(tx)}
                                >
                                  Reverse
                                </Button>
                              </>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="rounded-xs border border-border bg-muted/10 p-3 text-muted-foreground text-center">
                  No payment transactions recorded against this invoice yet.
                </div>
              )}
            </div>

            {/* 6. Statutory Receipts List */}
            {invoice.receipts && invoice.receipts.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Statutory Receipts Generated
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {invoice.receipts.map((r) => (
                    <div
                      key={r.id}
                      className="rounded-xs border border-border bg-card p-3 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-mono font-bold text-foreground block">
                          Receipt #{r.receiptNumber}
                        </span>
                        <span className="text-muted-foreground text-[11px]">
                          {formatDate(r.issuedAt || r.createdAt)} • {formatCurrency(r.amount, r.currency)}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="xs"
                        leftIcon={<ReceiptIcon className="size-3.5" />}
                        onClick={() => setSelectedReceiptId(r.id)}
                      >
                        View Voucher
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* CANCEL INVOICE CONFIRMATION MODAL */}
      {isCancelConfirmOpen && invoice && (
        <Modal
          isOpen={isCancelConfirmOpen}
          onClose={() => setIsCancelConfirmOpen(false)}
          title="Cancel Commercial Invoice"
          description={`Void and cancel Invoice #${invoice.invoiceNumber}.`}
          footer={
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsCancelConfirmOpen(false)}>
                Go Back
              </Button>
              <Button
                variant="destructive"
                size="sm"
                isLoading={cancelMutation.isPending}
                disabled={!cancelReason.trim()}
                onClick={() => cancelMutation.mutate()}
              >
                Confirm Cancellation
              </Button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <FormField label="Statutory Cancellation Reason" required>
              <Textarea
                placeholder="Explain why this invoice is being cancelled (e.g. Application voided, duplicate bill, revised fee schedule)..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
              />
            </FormField>
          </div>
        </Modal>
      )}

      {/* RECORD MANUAL PAYMENT MODAL */}
      {isPayModalOpen && invoice && (
        <AdminManualPaymentModal
          isOpen={isPayModalOpen}
          onClose={() => setIsPayModalOpen(false)}
          invoice={invoice}
          onRecorded={() => {
            queryClient.invalidateQueries({ queryKey: ["admin-invoice", invoiceId] });
            if (onUpdated) onUpdated();
          }}
        />
      )}

      {/* FINANCIAL ADJUSTMENT MODAL */}
      {isAdjustModalOpen && invoice && (
        <AdminFinancialAdjustmentModal
          isOpen={isAdjustModalOpen}
          onClose={() => setIsAdjustModalOpen(false)}
          invoice={invoice}
          onAdjusted={() => {
            queryClient.invalidateQueries({ queryKey: ["admin-invoice", invoiceId] });
            if (onUpdated) onUpdated();
          }}
        />
      )}

      {/* REVERSE TRANSACTION MODAL */}
      {selectedTxForReverse && (
        <AdminReverseTransactionModal
          isOpen={Boolean(selectedTxForReverse)}
          onClose={() => setSelectedTxForReverse(null)}
          transaction={selectedTxForReverse}
          onReversed={() => {
            queryClient.invalidateQueries({ queryKey: ["admin-invoice", invoiceId] });
            if (onUpdated) onUpdated();
          }}
        />
      )}

      {/* RECEIPT DETAIL MODAL */}
      {selectedReceiptId && (
        <AdminReceiptDetailModal
          isOpen={Boolean(selectedReceiptId)}
          onClose={() => setSelectedReceiptId(null)}
          receiptId={selectedReceiptId}
        />
      )}

      {/* REQUEST REFUND MODAL */}
      {selectedTxForRefund && invoice && (
        <AdminRequestRefundModal
          isOpen={Boolean(selectedTxForRefund)}
          onClose={() => setSelectedTxForRefund(null)}
          transaction={selectedTxForRefund}
          paymentId={invoice.id}
          onRequested={() => {
            queryClient.invalidateQueries({ queryKey: ["admin-invoice", invoiceId] });
            if (onUpdated) onUpdated();
          }}
        />
      )}
    </>
  );
}
