"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Receipt,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Sliders,
  Plus,
  Ban,
  FileText,
  ExternalLink,
} from "lucide-react";
import { PageShell } from "@/components/ui/layout-primitives";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { FormField, Textarea } from "@/components/ui/form-primitives";
import {
  AdminManualPaymentModal,
  AdminFinancialAdjustmentModal,
} from "@/components/domain";
import { Skeleton, ErrorState } from "@/components/ui/feedback-primitives";
import { adminApi } from "@/lib/api/admin";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { Payment } from "@/types";

export default function AdminInvoiceDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const queryClient = useQueryClient();

  const [isManualPayModalOpen, setIsManualPayModalOpen] = useState(false);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);
  const [voidReason, setVoidReason] = useState("");

  const {
    data: invoice,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-invoice", id],
    queryFn: () => adminApi.getInvoiceById(id),
  });

  const voidMutation = useMutation({
    mutationFn: () =>
      adminApi.voidInvoice(id, {
        reason: voidReason || "Voided by finance administration officer.",
      }),
    onSuccess: () => {
      setIsVoidModalOpen(false);
      setVoidReason("");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["admin-invoices-list"] });
      queryClient.invalidateQueries({ queryKey: ["admin-financial-summary"] });
    },
  });

  if (isLoading) {
    return (
      <PageShell title="Loading Invoice Dossier...">
        <div className="space-y-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </PageShell>
    );
  }

  if (error || !invoice) {
    return (
      <PageShell title="Invoice Dossier">
        <ErrorState
          title="Invoice Record Not Found"
          message="Could not retrieve the specified invoice."
          onRetry={() => refetch()}
        />
      </PageShell>
    );
  }

  const transactions = invoice.transactions || [];
  const receipts = invoice.receipts || [];
  const balanceRemaining = Number(
    invoice.balanceRemaining !== undefined
      ? invoice.balanceRemaining
      : invoice.status === "PAID"
      ? 0
      : invoice.amount
  );

  return (
    <PageShell
      eyebrow={`STATUTORY BILLING INVOICE • #${invoice.invoiceNumber || invoice.id.slice(0, 8)}`}
      title={invoice.invoiceNumber ? `Invoice ${invoice.invoiceNumber}` : `Invoice #${invoice.id.slice(0, 8)}`}
      description={`Total: ${formatCurrency(invoice.amount)} • Status: ${invoice.status} • Client: ${invoice.user?.fullName || invoice.user?.businessName || invoice.client?.fullName || "Client"}`}
      actions={
        <div className="flex items-center gap-2">
          <Link href="/admin/invoices">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="size-3.5" />}>
              All Invoices
            </Button>
          </Link>
          {invoice.status !== "PAID" && invoice.status !== "CANCELLED" && (
            <>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Sliders className="size-3.5" />}
                onClick={() => setIsAdjustmentModalOpen(true)}
              >
                Adjust Fee
              </Button>
              <Button
                variant="gold"
                size="sm"
                leftIcon={<Plus className="size-3.5" />}
                onClick={() => setIsManualPayModalOpen(true)}
              >
                Record Manual Payment
              </Button>
            </>
          )}
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Financial Itemization & Transactions */}
        <div className="space-y-6 lg:col-span-2">
          {/* Main Invoice Breakdown */}
          <Card padding="md" className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Statutory Breakdown
                </span>
                <h3 className="text-base font-bold text-foreground">
                  {invoice.description || "Statutory Legal Documentation Service"}
                </h3>
              </div>
              <Badge
                tone={
                  invoice.status === "PAID"
                    ? "success"
                    : invoice.status === "OVERDUE"
                    ? "destructive"
                    : invoice.status === "PARTIALLY_PAID"
                    ? "gold"
                    : "warning"
                }
                size="md"
              >
                {invoice.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="rounded-xs border border-border bg-muted/20 p-2.5">
                <span className="text-muted-foreground block text-[11px]">Total Invoice</span>
                <strong className="text-foreground font-mono text-sm">{formatCurrency(invoice.amount)}</strong>
              </div>

              <div className="rounded-xs border border-border bg-muted/20 p-2.5">
                <span className="text-muted-foreground block text-[11px]">Paid to Date</span>
                <strong className="text-emerald-600 font-mono text-sm">
                  {formatCurrency(invoice.paidAmount || (invoice.status === "PAID" ? invoice.amount : 0))}
                </strong>
              </div>

              <div className="rounded-xs border border-border bg-muted/20 p-2.5">
                <span className="text-muted-foreground block text-[11px]">Balance Due</span>
                <strong className={`font-mono text-sm ${balanceRemaining > 0 ? "text-destructive" : "text-foreground"}`}>
                  {formatCurrency(balanceRemaining)}
                </strong>
              </div>

              <div className="rounded-xs border border-border bg-muted/20 p-2.5">
                <span className="text-muted-foreground block text-[11px]">Due Date</span>
                <span className="text-foreground font-mono">
                  {invoice.dueDate ? formatDate(invoice.dueDate) : "Immediate"}
                </span>
              </div>
            </div>

            {/* Itemized Line Items */}
            <div className="space-y-2 pt-2 border-t border-border text-xs">
              <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">Line Item Summary</h4>
              <div className="space-y-1.5">
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Professional Legal Service Fee:</span>
                  <span className="font-mono text-foreground">{formatCurrency(invoice.serviceFee || invoice.amount)}</span>
                </div>
                {invoice.registryFee !== undefined && Number(invoice.registryFee) > 0 && (
                  <div className="flex justify-between py-1 border-b border-border/40">
                    <span className="text-muted-foreground">Government Registry Fee (Statutory):</span>
                    <span className="font-mono text-foreground">{formatCurrency(invoice.registryFee)}</span>
                  </div>
                )}
                {invoice.convenienceFee !== undefined && Number(invoice.convenienceFee) > 0 && (
                  <div className="flex justify-between py-1 border-b border-border/40">
                    <span className="text-muted-foreground">Processing & Convenience Fee:</span>
                    <span className="font-mono text-foreground">{formatCurrency(invoice.convenienceFee)}</span>
                  </div>
                )}
                {invoice.discount !== undefined && Number(invoice.discount) > 0 && (
                  <div className="flex justify-between py-1 border-b border-border/40 text-emerald-600">
                    <span>Applied Statutory Credit / Discount:</span>
                    <span className="font-mono">-{formatCurrency(invoice.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between py-1.5 font-bold text-foreground text-sm border-t border-border">
                  <span>Gross Invoice Total:</span>
                  <span className="font-mono text-gold-dark dark:text-gold">{formatCurrency(invoice.amount)}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Settled Payment Transactions */}
          <Card padding="md" className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h4 className="text-sm font-bold text-foreground">Settled Transactions & Receipts</h4>
              <span className="text-xs text-muted-foreground font-mono">{transactions.length} record(s)</span>
            </div>

            {transactions.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">No payment transactions recorded against this invoice.</p>
            ) : (
              <div className="space-y-2 text-xs">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between rounded-xs border border-border bg-muted/20 p-3"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/transactions/${tx.id}`}
                          className="font-mono font-bold text-navy dark:text-gold hover:underline"
                        >
                          {tx.reference || tx.id.slice(0, 8)}
                        </Link>
                        <Badge tone={tx.status === "COMPLETED" ? "success" : "neutral"} size="sm">
                          {tx.status}
                        </Badge>
                      </div>
                      <span className="text-[11px] text-muted-foreground block">
                        Method: {tx.paymentMethod} {tx.channel ? `(${tx.channel})` : ""}
                      </span>
                    </div>

                    <div className="text-right space-y-0.5">
                      <span className="font-mono font-bold text-emerald-600 block">
                        {formatCurrency(tx.amount)}
                      </span>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {formatDate(tx.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Col: Host Application & Client Profile */}
        <div className="space-y-6">
          {invoice.application && (
            <Card padding="md" className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-foreground">Linked Application</h4>
                <Link
                  href={`/admin/applications/${invoice.application.id}`}
                  className="text-xs font-semibold text-gold-dark dark:text-gold hover:underline flex items-center gap-1"
                >
                  <span>Open Dossier</span>
                  <ExternalLink className="size-3" />
                </Link>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Dossier #</span>
                  <Link
                    href={`/admin/applications/${invoice.application.id}`}
                    className="font-mono font-bold text-navy dark:text-gold hover:underline"
                  >
                    #{invoice.application.applicationNumber}
                  </Link>
                </div>
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Service</span>
                  <span className="font-semibold text-foreground">{invoice.application.service?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge tone="neutral" size="sm">{invoice.application.status}</Badge>
                </div>
              </div>
            </Card>
          )}

          {/* Client Entity Card */}
          {(invoice.user || invoice.client) && (
            <Card padding="md" className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-foreground">Billed Client Entity</h4>
                {(invoice.user?.id || invoice.client?.id) && (
                  <Link
                    href={`/admin/clients/${invoice.user?.id || invoice.client?.id}`}
                    className="text-xs font-semibold text-gold-dark dark:text-gold hover:underline"
                  >
                    Client 360
                  </Link>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-bold text-foreground">
                    {invoice.user?.fullName || invoice.user?.businessName || invoice.client?.fullName || "Client"}
                  </span>
                </div>
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Email</span>
                  <span className="text-foreground">{invoice.user?.email || invoice.client?.email || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="font-mono text-foreground">{invoice.user?.phone || invoice.client?.phone || "—"}</span>
                </div>
              </div>
            </Card>
          )}

          {/* Void / Cancel Control */}
          {invoice.status !== "CANCELLED" && invoice.status !== "PAID" && (
            <Card padding="md" className="space-y-3 text-xs border-destructive/30 bg-destructive/5">
              <h4 className="text-sm font-bold text-destructive flex items-center gap-1.5">
                <Ban className="size-4" />
                <span>Void Statutory Invoice</span>
              </h4>
              <p className="text-muted-foreground">
                Cancel this invoice if issued in error. An audit trail record will be immutably preserved.
              </p>
              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={() => setIsVoidModalOpen(true)}
              >
                Void Invoice
              </Button>
            </Card>
          )}
        </div>
      </div>

      {/* MANUAL PAYMENT MODAL */}
      {isManualPayModalOpen && (
        <AdminManualPaymentModal
          applicationId={invoice.applicationId || ""}
          applicationNumber={invoice.application?.applicationNumber}
          outstandingAmount={balanceRemaining}
          isOpen={isManualPayModalOpen}
          onClose={() => setIsManualPayModalOpen(false)}
          onSuccess={() => {
            refetch();
            queryClient.invalidateQueries({ queryKey: ["admin-financial-summary"] });
          }}
        />
      )}

      {/* FINANCIAL ADJUSTMENT MODAL */}
      {isAdjustmentModalOpen && (
        <AdminFinancialAdjustmentModal
          paymentId={invoice.id}
          invoiceNumber={invoice.invoiceNumber}
          currentAmount={invoice.amount}
          isOpen={isAdjustmentModalOpen}
          onClose={() => setIsAdjustmentModalOpen(false)}
          onSuccess={() => {
            refetch();
            queryClient.invalidateQueries({ queryKey: ["admin-financial-summary"] });
          }}
        />
      )}

      {/* VOID INVOICE MODAL */}
      {isVoidModalOpen && (
        <Modal
          isOpen={isVoidModalOpen}
          onClose={() => setIsVoidModalOpen(false)}
          title={`Void Invoice #${invoice.invoiceNumber || invoice.id.slice(0, 8)}`}
          description="Provide compliance justification for voiding this statutory invoice."
          size="sm"
        >
          <div className="space-y-4 text-xs">
            <FormField label="Void Justification Reason" required>
              <Textarea
                placeholder="Reason why this invoice is voided..."
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                rows={3}
              />
            </FormField>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsVoidModalOpen(false)}
                disabled={voidMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                isLoading={voidMutation.isPending}
                disabled={!voidReason.trim()}
                onClick={() => voidMutation.mutate()}
              >
                Confirm Void
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </PageShell>
  );
}
