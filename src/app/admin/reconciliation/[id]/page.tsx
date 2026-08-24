"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Scale,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  Landmark,
  CreditCard,
  Sliders,
  ExternalLink,
  ShieldCheck,
  Building2,
  Smartphone,
} from "lucide-react";
import { PageShell } from "@/components/ui/layout-primitives";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { FormField, Textarea } from "@/components/ui/form-primitives";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton, ErrorState } from "@/components/ui/feedback-primitives";
import { adminApi } from "@/lib/api/admin";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { ReconciliationRecord, ReconciliationStatus } from "@/types";

export default function AdminReconciliationDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const queryClient = useQueryClient();

  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [resolutionStatus, setResolutionStatus] = useState<ReconciliationStatus>("MATCHED");
  const [targetTxId, setTargetTxId] = useState("");
  const [notes, setNotes] = useState("");

  const {
    data: record,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-reconciliation-record", id],
    queryFn: () => adminApi.getReconciliationRecordById(id),
  });

  const resolveMutation = useMutation({
    mutationFn: () =>
      adminApi.manualResolveReconciliation(id, {
        status: resolutionStatus,
        transactionId: targetTxId.trim() || undefined,
        notes: notes.trim() || undefined,
      }),
    onSuccess: () => {
      setIsResolveModalOpen(false);
      refetch();
      queryClient.invalidateQueries({ queryKey: ["admin-reconciliation-records"] });
      queryClient.invalidateQueries({ queryKey: ["admin-reconciliation-metrics"] });
    },
  });

  if (isLoading) {
    return (
      <PageShell title="Loading Reconciliation Dossier...">
        <div className="space-y-4 max-w-[1400px] mx-auto">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </PageShell>
    );
  }

  if (error || !record) {
    return (
      <PageShell title="Reconciliation Record Dossier">
        <div className="max-w-[1400px] mx-auto">
          <ErrorState
            title="Reconciliation Record Not Found"
            message="Could not retrieve the specified bank or M-Pesa statement entry."
            onRetry={() => refetch()}
          />
        </div>
      </PageShell>
    );
  }

  const isMatched = record.status === "MATCHED";

  return (
    <PageShell
      eyebrow={`FINANCIAL RECONCILIATION DOSSIER • #${record.id.slice(0, 8)}`}
      title={`${record.provider || "Statement"} Line Item — ${record.reference || "Uncoded Entry"}`}
      description={`Amount: ${formatCurrency(Number(record.amount || 0), record.currency || "KES")} • Status: ${record.status}`}
      actions={
        <div className="flex items-center gap-2">
          <Link href="/admin/reconciliation">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="size-3.5" />}>
              Reconciliation Ledger
            </Button>
          </Link>
          {!isMatched && (
            <Button
              variant="gold"
              size="sm"
              leftIcon={<Sliders className="size-3.5" />}
              onClick={() => {
                setResolutionStatus(record.status || "MATCHED");
                setNotes(record.notes || "");
                setTargetTxId(record.transactionId || "");
                setIsResolveModalOpen(true);
              }}
            >
              Resolve Discrepancy
            </Button>
          )}
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 max-w-[1400px] mx-auto">
        {/* Left 2 Cols: Statement Verification & Metadata */}
        <div className="space-y-6 lg:col-span-2">
          <Card padding="md" className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                {record.provider === "MPESA" ? (
                  <Smartphone className="size-5 text-emerald-600" />
                ) : (
                  <Building2 className="size-5 text-amber-700" />
                )}
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Statement Settlement Line
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {record.provider || "Safaricom M-Pesa"} Settlement
                  </h3>
                </div>
              </div>
              <Badge
                tone={
                  record.status === "MATCHED"
                    ? "success"
                    : record.status === "SUSPICIOUS" || record.status === "REVERSED"
                    ? "destructive"
                    : "warning"
                }
                size="md"
              >
                {record.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                <span className="text-slate-500 block text-[10px] font-extrabold uppercase">Statement Amount</span>
                <strong className="text-slate-900 font-mono text-sm font-extrabold">
                  {formatCurrency(Number(record.amount || 0), record.currency || "KES")}
                </strong>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                <span className="text-slate-500 block text-[10px] font-extrabold uppercase">Internal Ledger Amount</span>
                <strong className="text-emerald-600 font-mono text-sm font-extrabold">
                  {record.transaction
                    ? formatCurrency(Number(record.transaction.amount || 0))
                    : "Unlinked"}
                </strong>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                <span className="text-slate-500 block text-[10px] font-extrabold uppercase">Variance / Diff</span>
                <strong
                  className={`font-mono text-sm font-extrabold ${
                    record.transaction && Number(record.transaction.amount) !== Number(record.amount)
                      ? "text-rose-600"
                      : "text-slate-900"
                  }`}
                >
                  {record.transaction
                    ? formatCurrency(Math.abs(Number(record.amount) - Number(record.transaction.amount)))
                    : "KES 0.00"}
                </strong>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                <span className="text-slate-500 block text-[10px] font-extrabold uppercase">Ingested Date</span>
                <span className="text-slate-900 font-mono font-bold">
                  {formatDate(record.createdAt)}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3 text-xs">
              <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px]">
                Statement Verification &amp; Auditor Trail
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-500 block text-[10px] font-extrabold">Statement Reference Code</span>
                  <span className="font-mono text-slate-900 font-bold text-sm">{record.reference || "—"}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-extrabold">Payment Channel</span>
                  <span className="font-semibold text-slate-800">{record.provider || "MPESA"}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-extrabold">Reconciled Timestamp</span>
                  <span className="text-slate-800 font-medium">
                    {record.reconciledAt ? formatDate(record.reconciledAt) : "Pending Resolution"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-extrabold">Auditor Officer</span>
                  <span className="text-slate-800 font-semibold">
                    {record.reconciledBy?.email || record.reconciledBy?.fullName || "Automated Recon Engine"}
                  </span>
                </div>
              </div>
            </div>

            {record.notes && (
              <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-3.5 text-xs space-y-1">
                <span className="text-[11px] font-bold text-amber-800 flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5 text-amber-600" />
                  <span>Audit Remarks &amp; Resolution History:</span>
                </span>
                <p className="text-slate-800 font-medium">{record.notes}</p>
              </div>
            )}
          </Card>
        </div>

        {/* Right Col: Matched Internal Ledger & Actions */}
        <div className="space-y-6">
          {record.transaction ? (
            <Card padding="md" className="space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-sm font-extrabold text-slate-900">Matched Internal Ledger</h4>
                <Link
                  href={`/admin/transactions/${record.transaction.id}`}
                  className="text-xs font-semibold text-amber-700 hover:underline flex items-center gap-1"
                >
                  <span>Transaction Dossier</span>
                  <ExternalLink className="size-3" />
                </Link>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-medium">Transaction #</span>
                  <span className="font-mono font-bold text-slate-900">
                    {record.transaction.transactionNumber || record.transaction.id.slice(0, 8)}
                  </span>
                </div>

                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-medium">Method</span>
                  <span className="font-semibold text-slate-800">{record.transaction.paymentMethod || "MPESA"}</span>
                </div>

                {record.transaction.payment && (
                  <>
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500 font-medium">Invoice #</span>
                      <span className="font-mono font-bold text-slate-900">
                        {record.transaction.payment.invoiceNumber}
                      </span>
                    </div>

                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500 font-medium">Client Profile</span>
                      <span className="font-semibold text-slate-800">
                        {record.transaction.payment.client?.fullName ||
                          record.transaction.payment.client?.businessName ||
                          "Commercial Client"}
                      </span>
                    </div>
                  </>
                )}

                <div className="flex justify-between pt-1">
                  <span className="text-slate-500 font-medium">Ledger Sync State</span>
                  <Badge tone="success" size="sm">Synchronized</Badge>
                </div>
              </div>
            </Card>
          ) : (
            <Card padding="md" className="space-y-3 text-xs border-amber-200 bg-amber-50/20">
              <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <Scale className="size-4 text-amber-600" />
                <span>Unlinked Settlement Line</span>
              </h4>
              <p className="text-slate-600">
                This bank or M-Pesa statement entry has not been automatically matched to an internal invoice.
              </p>
              <Button
                variant="gold"
                size="sm"
                className="w-full"
                onClick={() => {
                  setResolutionStatus(record.status || "MATCHED");
                  setNotes(record.notes || "");
                  setTargetTxId("");
                  setIsResolveModalOpen(true);
                }}
              >
                Resolve &amp; Link Discrepancy
              </Button>
            </Card>
          )}
        </div>
      </div>

      {/* RESOLUTION MODAL */}
      {isResolveModalOpen && (
        <Modal
          isOpen={isResolveModalOpen}
          onClose={() => setIsResolveModalOpen(false)}
          title="Resolve Statement Discrepancy"
          description={`Audit clearance for statement entry #${record.reference}.`}
          size="md"
        >
          <div className="space-y-4 text-xs">
            <FormField label="Resolution Strategy" required>
              <Select
                value={resolutionStatus}
                onChange={(e) => setResolutionStatus(e.target.value as ReconciliationStatus)}
                options={[
                  { value: "MATCHED", label: "Mark as Matched & Clear Invoice" },
                  { value: "UNMATCHED", label: "Keep as Unmatched Discrepancy" },
                  { value: "DUPLICATE", label: "Flag as Duplicate Entry" },
                  { value: "SUSPICIOUS", label: "Flag as Suspicious / Variance" },
                  { value: "REVERSED", label: "Mark as Reversed Settlement" },
                ]}
              />
            </FormField>

            <FormField label="Target Internal Transaction ID / Ref (Optional)">
              <Input
                value={targetTxId}
                onChange={(e) => setTargetTxId(e.target.value)}
                placeholder="Paste Payment Transaction UUID or M-Pesa Ref..."
              />
            </FormField>

            <FormField label="Compliance Audit Remarks" required>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Explain the reconciliation rationale..."
                rows={3}
              />
            </FormField>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsResolveModalOpen(false)}
                disabled={resolveMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="gold"
                size="sm"
                isLoading={resolveMutation.isPending}
                onClick={() => resolveMutation.mutate()}
              >
                Confirm Resolution
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </PageShell>
  );
}
