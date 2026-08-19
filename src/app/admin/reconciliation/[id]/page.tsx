"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Scale,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  Landmark,
  CreditCard,
  Sliders,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { PageShell } from "@/components/ui/layout-primitives";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
  const [resolutionStatus, setResolutionStatus] = useState<"MANUAL_MATCH" | "IGNORE" | "REFUND_REQUIRED">("MANUAL_MATCH");
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
      adminApi.resolveReconciliationRecord(id, {
        resolutionStatus,
        resolvedTransactionId: targetTxId || undefined,
        notes: notes || undefined,
      }),
    onSuccess: () => {
      setIsResolveModalOpen(false);
      refetch();
      queryClient.invalidateQueries({ queryKey: ["admin-reconciliation"] });
    },
  });

  if (isLoading) {
    return (
      <PageShell title="Loading Reconciliation Dossier...">
        <div className="space-y-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </PageShell>
    );
  }

  if (error || !record) {
    return (
      <PageShell title="Reconciliation Record Dossier">
        <ErrorState
          title="Reconciliation Record Not Found"
          message="Could not retrieve the specified bank statement reconciliation entry."
          onRetry={() => refetch()}
        />
      </PageShell>
    );
  }

  const isMatched = record.status === "MATCHED" || record.status === "RESOLVED";

  return (
    <PageShell
      eyebrow={`BANK RECONCILIATION • #${record.id.slice(0, 8)}`}
      title={record.bankName ? `${record.bankName} Statement Line` : "Bank Reconciliation Line"}
      description={`Statement Ref: ${record.statementReference || "—"} • Amount: ${formatCurrency(record.statementAmount || record.amount || 0)} • Status: ${record.status}`}
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
              onClick={() => setIsResolveModalOpen(true)}
            >
              Resolve Discrepancy
            </Button>
          )}
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Statement Record & Match Audit */}
        <div className="space-y-6 lg:col-span-2">
          <Card padding="md" className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Statement Verification Record
                </span>
                <h3 className="text-base font-bold text-foreground">
                  {record.bankName || "Statutory Escrow Account"}
                </h3>
              </div>
              <Badge
                tone={
                  record.status === "MATCHED" || record.status === "RESOLVED"
                    ? "success"
                    : record.status === "UNMATCHED" || record.status === "DISCREPANCY"
                    ? "destructive"
                    : "warning"
                }
                size="md"
              >
                {record.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="rounded-xs border border-border bg-muted/20 p-2.5">
                <span className="text-muted-foreground block text-[11px]">Statement Amount</span>
                <strong className="text-foreground font-mono text-sm">
                  {formatCurrency(record.statementAmount || record.amount || 0)}
                </strong>
              </div>

              <div className="rounded-xs border border-border bg-muted/20 p-2.5">
                <span className="text-muted-foreground block text-[11px]">Ledger Amount</span>
                <strong className="text-emerald-600 font-mono text-sm">
                  {formatCurrency(record.ledgerAmount || record.transaction?.amount || record.statementAmount || 0)}
                </strong>
              </div>

              <div className="rounded-xs border border-border bg-muted/20 p-2.5">
                <span className="text-muted-foreground block text-[11px]">Difference</span>
                <strong
                  className={`font-mono text-sm ${
                    record.difference && record.difference !== 0 ? "text-destructive" : "text-foreground"
                  }`}
                >
                  {formatCurrency(record.difference || 0)}
                </strong>
              </div>

              <div className="rounded-xs border border-border bg-muted/20 p-2.5">
                <span className="text-muted-foreground block text-[11px]">Statement Date</span>
                <span className="text-foreground font-mono">
                  {formatDate(record.statementDate || record.createdAt)}
                </span>
              </div>
            </div>

            <div className="rounded-xs border border-border bg-muted/20 p-3.5 space-y-2 text-xs">
              <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px]">
                Bank Statement Metadata
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Statement Reference</span>
                  <span className="font-mono text-foreground font-bold">{record.statementReference || "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Account Number</span>
                  <span className="font-mono text-foreground">{record.accountNumber || "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Transaction Description</span>
                  <p className="text-foreground">{record.statementDescription || record.description || "N/A"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Reconciled Timestamp</span>
                  <span className="text-foreground">
                    {record.reconciledAt ? formatDate(record.reconciledAt) : "Pending"}
                  </span>
                </div>
              </div>
            </div>

            {record.notes && (
              <div className="rounded-xs border border-border bg-muted/20 p-3 text-xs space-y-1">
                <span className="text-[11px] font-bold text-muted-foreground">Officer Audit Notes:</span>
                <p className="text-foreground">{record.notes}</p>
              </div>
            )}
          </Card>
        </div>

        {/* Right Col: Matched Internal Transaction & Controls */}
        <div className="space-y-6">
          {record.transactionId && (
            <Card padding="md" className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-foreground">Matched Internal Ledger</h4>
                <Link
                  href={`/admin/transactions/${record.transactionId}`}
                  className="text-xs font-semibold text-gold-dark dark:text-gold hover:underline flex items-center gap-1"
                >
                  <span>Transaction Dossier</span>
                  <ExternalLink className="size-3" />
                </Link>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Transaction ID</span>
                  <Link
                    href={`/admin/transactions/${record.transactionId}`}
                    className="font-mono font-bold text-navy dark:text-gold hover:underline"
                  >
                    #{record.transactionId.slice(0, 8)}
                  </Link>
                </div>
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Method</span>
                  <span className="font-semibold text-foreground">{record.transaction?.paymentMethod || "Direct"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ledger Sync</span>
                  <Badge tone="success" size="sm">Synchronized</Badge>
                </div>
              </div>
            </Card>
          )}

          {!isMatched && (
            <Card padding="md" className="space-y-3 text-xs border-gold/40 bg-gold/5">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <Scale className="size-4 text-gold" />
                <span>Manual Reconciliation Action</span>
              </h4>
              <p className="text-muted-foreground">
                Match this unlinked bank line item to an internal transaction or document resolution.
              </p>
              <Button
                variant="gold"
                size="sm"
                className="w-full"
                onClick={() => setIsResolveModalOpen(true)}
              >
                Resolve Discrepancy
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
          description="Link to an existing transaction or mark resolution category."
          size="md"
        >
          <div className="space-y-4 text-xs">
            <FormField label="Resolution Strategy" required>
              <Select
                value={resolutionStatus}
                onChange={(e) => setResolutionStatus(e.target.value as any)}
                options={[
                  { value: "MANUAL_MATCH", label: "Manual Match to Internal Transaction" },
                  { value: "IGNORE", label: "Ignore / Non-Statutory Bank Charge" },
                  { value: "REFUND_REQUIRED", label: "Flag for Customer Refund" },
                ]}
              />
            </FormField>

            {resolutionStatus === "MANUAL_MATCH" && (
              <FormField label="Target Transaction ID / Reference" required>
                <Input
                  value={targetTxId}
                  onChange={(e) => setTargetTxId(e.target.value)}
                  placeholder="Paste Transaction ID or M-Pesa Code"
                />
              </FormField>
            )}

            <FormField label="Compliance Audit Remarks" required>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Explain the reconciliation rationale..."
                rows={3}
              />
            </FormField>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
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
                disabled={resolutionStatus === "MANUAL_MATCH" && !targetTxId.trim()}
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
