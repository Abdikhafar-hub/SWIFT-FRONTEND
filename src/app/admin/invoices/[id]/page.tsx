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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-4 sm:p-5 lg:p-6 space-y-4 max-w-[1550px] mx-auto font-sans">
      {/* ------------------------------------------------------------------ */}
      {/* 1. HEADER SECTION */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/80">
              Invoice #{invoice.invoiceNumber || invoice.id.slice(0, 8)}
            </span>
            <span className="text-xs text-slate-500 font-mono font-medium">
              Total: {formatCurrency(invoice.amount)}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            {invoice.invoiceNumber ? `Invoice ${invoice.invoiceNumber}` : `Invoice #${invoice.id.slice(0, 8)}`}
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <Link href="/admin/invoices">
            <button className="bg-white border border-slate-200 text-slate-700 font-bold text-xs px-3 py-2 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-1.5 shadow-xs">
              <ArrowLeft className="size-3.5 text-slate-500" />
              <span>All Invoices</span>
            </button>
          </Link>
          {invoice.status !== "PAID" && invoice.status !== "CANCELLED" && (
            <>
              <button
                onClick={() => setIsAdjustmentModalOpen(true)}
                className="bg-white border border-slate-200 text-slate-700 font-bold text-xs px-3 py-2 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-1.5 shadow-xs"
              >
                <Sliders className="size-3.5 text-slate-500" />
                <span>Adjust Fee</span>
              </button>
              <button
                onClick={() => setIsManualPayModalOpen(true)}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
              >
                <Plus className="size-3.5" />
                <span>Record Manual Payment</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left 2 Cols: Financial Itemization & Transactions */}
        <div className="space-y-4 lg:col-span-2">
          {/* Main Invoice Breakdown */}
          <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Statutory Breakdown
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {invoice.description || "Statutory Legal Documentation Service"}
                </h3>
              </div>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border ${
                  invoice.status === "PAID"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200/80"
                    : invoice.status === "OVERDUE"
                    ? "bg-rose-50 text-rose-800 border-rose-200/80"
                    : invoice.status === "PARTIALLY_PAID"
                    ? "bg-amber-50 text-amber-800 border-amber-200/80"
                    : "bg-slate-100 text-slate-600 border-slate-200"
                }`}
              >
                {invoice.status}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3">
                <span className="text-slate-400 block text-[10px] font-extrabold uppercase tracking-wider">Total Invoice</span>
                <strong className="text-slate-900 font-mono text-sm block mt-0.5">{formatCurrency(invoice.amount)}</strong>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3">
                <span className="text-slate-400 block text-[10px] font-extrabold uppercase tracking-wider">Paid to Date</span>
                <strong className="text-emerald-600 font-mono text-sm block mt-0.5">
                  {formatCurrency(invoice.paidAmount || (invoice.status === "PAID" ? invoice.amount : 0))}
                </strong>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3">
                <span className="text-slate-400 block text-[10px] font-extrabold uppercase tracking-wider">Balance Due</span>
                <strong className={`font-mono text-sm block mt-0.5 ${balanceRemaining > 0 ? "text-rose-600" : "text-slate-900"}`}>
                  {formatCurrency(balanceRemaining)}
                </strong>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3">
                <span className="text-slate-400 block text-[10px] font-extrabold uppercase tracking-wider">Due Date</span>
                <span className="text-slate-700 font-mono font-semibold block mt-0.5">
                  {invoice.dueDate ? formatDate(invoice.dueDate) : "Immediate"}
                </span>
              </div>
            </div>

            {/* Itemized Line Items */}
            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Line Item Summary</h4>
              <div className="space-y-1.5">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Professional Legal Service Fee:</span>
                  <span className="font-mono text-slate-900 font-bold">{formatCurrency(invoice.serviceFee || invoice.amount)}</span>
                </div>
                {invoice.registryFee !== undefined && Number(invoice.registryFee) > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Government Registry Fee (Statutory):</span>
                    <span className="font-mono text-slate-900 font-bold">{formatCurrency(invoice.registryFee)}</span>
                  </div>
                )}
                {invoice.convenienceFee !== undefined && Number(invoice.convenienceFee) > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Processing &amp; Convenience Fee:</span>
                    <span className="font-mono text-slate-900 font-bold">{formatCurrency(invoice.convenienceFee)}</span>
                  </div>
                )}
                {invoice.discount !== undefined && Number(invoice.discount) > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-100 text-emerald-600 font-semibold">
                    <span>Applied Statutory Credit / Discount:</span>
                    <span className="font-mono">-{formatCurrency(invoice.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between py-1.5 font-bold text-slate-900 text-sm border-t border-slate-200">
                  <span>Gross Invoice Total:</span>
                  <span className="font-mono text-amber-700">{formatCurrency(invoice.amount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Settled Payment Transactions */}
          <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-sm font-bold text-slate-900">Settled Transactions &amp; Receipts</h4>
              <span className="text-xs text-slate-400 font-mono">{transactions.length} record(s)</span>
            </div>

            {transactions.length === 0 ? (
              <p className="text-xs text-slate-500 font-medium py-2">No payment transactions recorded against this invoice.</p>
            ) : (
              <div className="space-y-2 text-xs">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50 p-3"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/transactions/${tx.id}`}
                          className="font-mono font-bold text-amber-700 hover:underline"
                        >
                          {tx.reference || tx.id.slice(0, 8)}
                        </Link>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                            tx.status === "COMPLETED"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200/80"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {tx.status}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium block">
                        Method: {tx.paymentMethod} {tx.channel ? `(${tx.channel})` : ""}
                      </span>
                    </div>

                    <div className="text-right space-y-0.5">
                      <span className="font-mono font-bold text-emerald-600 block">
                        {formatCurrency(tx.amount)}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {formatDate(tx.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Host Application & Client Profile */}
        <div className="space-y-4">
          {invoice.application && (
            <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-sm font-bold text-slate-900">Linked Application</h4>
                <Link
                  href={`/admin/applications/${invoice.application.id}`}
                  className="text-xs font-bold text-amber-700 hover:underline flex items-center gap-1"
                >
                  <span>Open Dossier</span>
                  <ExternalLink className="size-3" />
                </Link>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-medium">Dossier #</span>
                  <Link
                    href={`/admin/applications/${invoice.application.id}`}
                    className="font-mono font-bold text-amber-700 hover:underline"
                  >
                    #{invoice.application.applicationNumber}
                  </Link>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-medium">Service</span>
                  <span className="font-bold text-slate-900">{invoice.application.service?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Status</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                    {invoice.application.status}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Client Entity Card */}
          {(invoice.user || invoice.client) && (
            <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-sm font-bold text-slate-900">Billed Client Entity</h4>
                {(invoice.user?.id || invoice.client?.id) && (
                  <Link
                    href={`/admin/clients/${invoice.user?.id || invoice.client?.id}`}
                    className="text-xs font-bold text-amber-700 hover:underline"
                  >
                    Client 360
                  </Link>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-medium">Name</span>
                  <span className="font-bold text-slate-900">
                    {invoice.user?.fullName || invoice.user?.businessName || invoice.client?.fullName || "Client"}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-medium">Email</span>
                  <span className="text-slate-800 font-medium">{invoice.user?.email || invoice.client?.email || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Phone</span>
                  <span className="font-mono text-slate-800 font-medium">{invoice.user?.phone || invoice.client?.phone || "—"}</span>
                </div>
              </div>
            </div>
          )}

          {/* Void / Cancel Control */}
          {invoice.status !== "CANCELLED" && invoice.status !== "PAID" && (
            <div className="bg-white rounded-xl p-4 border border-rose-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-3 text-xs">
              <h4 className="text-sm font-bold text-rose-700 flex items-center gap-1.5">
                <Ban className="size-4" />
                <span>Void Statutory Invoice</span>
              </h4>
              <p className="text-slate-500 font-medium">
                Cancel this invoice if issued in error. An audit trail record will be immutably preserved.
              </p>
              <button
                onClick={() => setIsVoidModalOpen(true)}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                <span>Void Invoice</span>
              </button>
            </div>
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

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
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
    </div>
  );
}
