"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CreditCard,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Receipt,
  FileText,
  Clock,
  ExternalLink,
} from "lucide-react";
import { PageShell } from "@/components/ui/layout-primitives";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdminReverseTransactionModal } from "@/components/domain";
import { Skeleton, ErrorState } from "@/components/ui/feedback-primitives";
import { adminApi } from "@/lib/api/admin";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { PaymentTransaction } from "@/types";

export default function AdminTransactionDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const queryClient = useQueryClient();

  const [isReverseModalOpen, setIsReverseModalOpen] = useState(false);

  const {
    data: transaction,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-transaction", id],
    queryFn: () => adminApi.getTransactionById(id),
  });

  if (isLoading) {
    return (
      <PageShell title="Loading Transaction Dossier...">
        <div className="space-y-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </PageShell>
    );
  }

  if (error || !transaction) {
    return (
      <PageShell title="Transaction Dossier">
        <ErrorState
          title="Transaction Record Not Found"
          message="Could not locate the specified payment gateway transaction."
          onRetry={() => refetch()}
        />
      </PageShell>
    );
  }

  return (
    <PageShell
      eyebrow={`PAYMENT TRANSACTION • #${transaction.reference || transaction.id.slice(0, 8)}`}
      title={transaction.reference ? `Ref: ${transaction.reference}` : "Settled Transaction"}
      description={`Amount: ${formatCurrency(transaction.amount)} • Method: ${transaction.paymentMethod} • Status: ${transaction.status}`}
      actions={
        <div className="flex items-center gap-2">
          <Link href="/admin/transactions">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="size-3.5" />}>
              Transactions Ledger
            </Button>
          </Link>
          {transaction.status === "COMPLETED" && (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:bg-destructive/10"
              leftIcon={<RotateCcw className="size-3.5" />}
              onClick={() => setIsReverseModalOpen(true)}
            >
              Reverse Transaction
            </Button>
          )}
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Transaction Overview & Gateway Payload */}
        <div className="space-y-6 lg:col-span-2">
          <Card padding="md" className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Settlement Verification Profile
                </span>
                <h3 className="text-base font-bold text-foreground">
                  {transaction.paymentMethod} Gateway Settlement
                </h3>
              </div>
              <Badge
                tone={
                  transaction.status === "COMPLETED"
                    ? "success"
                    : transaction.status === "FAILED"
                    ? "destructive"
                    : transaction.status === "REVERSED"
                    ? "warning"
                    : "gold"
                }
                size="md"
              >
                {transaction.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="rounded-xs border border-border bg-muted/20 p-2.5">
                <span className="text-muted-foreground block text-[11px]">Settled Amount</span>
                <strong className="text-emerald-600 font-mono text-sm">
                  {formatCurrency(transaction.amount)}
                </strong>
              </div>

              <div className="rounded-xs border border-border bg-muted/20 p-2.5">
                <span className="text-muted-foreground block text-[11px]">Method / Channel</span>
                <strong className="text-foreground">
                  {transaction.paymentMethod} {transaction.channel ? `(${transaction.channel})` : ""}
                </strong>
              </div>

              <div className="rounded-xs border border-border bg-muted/20 p-2.5">
                <span className="text-muted-foreground block text-[11px]">Initiated At</span>
                <span className="text-foreground">{formatDate(transaction.createdAt)}</span>
              </div>

              <div className="rounded-xs border border-border bg-muted/20 p-2.5">
                <span className="text-muted-foreground block text-[11px]">Settled Timestamp</span>
                <span className="text-foreground">
                  {transaction.completedAt ? formatDate(transaction.completedAt) : "Pending"}
                </span>
              </div>
            </div>

            {/* Gateway identifiers */}
            <div className="rounded-xs border border-border bg-muted/20 p-3.5 space-y-2 text-xs">
              <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px]">
                Gateway & Telemetry Identifiers
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Internal Reference</span>
                  <span className="font-mono text-foreground">{transaction.reference || "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">External / Bank Reference</span>
                  <span className="font-mono text-foreground">{transaction.externalReference || "—"}</span>
                </div>
                {transaction.mpesaReceiptNumber && (
                  <div>
                    <span className="text-muted-foreground block text-[11px]">M-Pesa Receipt #</span>
                    <span className="font-mono font-bold text-emerald-600">
                      {transaction.mpesaReceiptNumber}
                    </span>
                  </div>
                )}
                {transaction.checkoutRequestId && (
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Checkout Request ID</span>
                    <span className="font-mono text-muted-foreground text-[11px]">
                      {transaction.checkoutRequestId}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Raw Metadata JSON if present */}
            {transaction.metadata && Object.keys(transaction.metadata).length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Raw Gateway Callback Telemetry
                </h4>
                <pre className="rounded-xs border border-border bg-muted/40 p-3 text-[11px] font-mono text-muted-foreground overflow-x-auto max-h-48">
                  {JSON.stringify(transaction.metadata, null, 2)}
                </pre>
              </div>
            )}
          </Card>
        </div>

        {/* Right Col: Host Invoice & Actions */}
        <div className="space-y-6">
          {transaction.paymentId && (
            <Card padding="md" className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-foreground">Linked Statutory Invoice</h4>
                <Link
                  href={`/admin/invoices/${transaction.paymentId}`}
                  className="text-xs font-semibold text-gold-dark dark:text-gold hover:underline flex items-center gap-1"
                >
                  <span>Open Invoice</span>
                  <ExternalLink className="size-3" />
                </Link>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Invoice ID</span>
                  <Link
                    href={`/admin/invoices/${transaction.paymentId}`}
                    className="font-mono font-bold text-navy dark:text-gold hover:underline"
                  >
                    #{transaction.paymentId.slice(0, 8)}
                  </Link>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ledger Sync</span>
                  <Badge tone="success" size="sm">Synchronized</Badge>
                </div>
              </div>
            </Card>
          )}

          {/* Reversal Warning Card */}
          {transaction.status === "COMPLETED" && (
            <Card padding="md" className="space-y-3 text-xs border-destructive/30 bg-destructive/5">
              <h4 className="text-sm font-bold text-destructive flex items-center gap-1.5">
                <RotateCcw className="size-4" />
                <span>Financial Transaction Reversal</span>
              </h4>
              <p className="text-muted-foreground">
                Reversing this payment transaction will reopen the balance on the linked statutory invoice.
              </p>
              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={() => setIsReverseModalOpen(true)}
              >
                Execute Reversal
              </Button>
            </Card>
          )}
        </div>
      </div>

      {/* REVERSE MODAL */}
      {isReverseModalOpen && (
        <AdminReverseTransactionModal
          transactionId={transaction.id}
          reference={transaction.reference || transaction.id.slice(0, 8)}
          amount={transaction.amount}
          isOpen={isReverseModalOpen}
          onClose={() => setIsReverseModalOpen(false)}
          onSuccess={() => {
            refetch();
            queryClient.invalidateQueries({ queryKey: ["admin-transactions-list"] });
          }}
        />
      )}
    </PageShell>
  );
}
