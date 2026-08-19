"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  RotateCcw,
  DollarSign,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ExternalLink,
  ShieldCheck,
  FileText,
} from "lucide-react";
import { PageShell } from "@/components/ui/layout-primitives";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AdminApproveRefundModal,
  AdminRejectRefundModal,
} from "@/components/domain";
import { Skeleton, ErrorState } from "@/components/ui/feedback-primitives";
import { adminApi } from "@/lib/api/admin";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { Refund } from "@/types";

export default function AdminRefundDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const queryClient = useQueryClient();

  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  const {
    data: refund,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-refund", id],
    queryFn: () => adminApi.getRefundById(id),
  });

  if (isLoading) {
    return (
      <PageShell title="Loading Refund Claim Dossier...">
        <div className="space-y-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </PageShell>
    );
  }

  if (error || !refund) {
    return (
      <PageShell title="Refund Claim Dossier">
        <ErrorState
          title="Refund Claim Not Found"
          message="Could not locate the requested statutory refund claim."
          onRetry={() => refetch()}
        />
      </PageShell>
    );
  }

  return (
    <PageShell
      eyebrow={`REFUND CLAIM • #${refund.refundNumber || refund.id.slice(0, 8)}`}
      title={refund.refundNumber ? `Refund ${refund.refundNumber}` : "Refund Claim"}
      description={`Claim Amount: ${formatCurrency(refund.amount)} • Status: ${refund.status} • Payment Ref: #${refund.paymentId?.slice(0, 8)}`}
      actions={
        <div className="flex items-center gap-2">
          <Link href="/admin/refunds">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="size-3.5" />}>
              All Refunds
            </Button>
          </Link>
          {refund.status === "REQUESTED" && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:bg-destructive/10"
                leftIcon={<XCircle className="size-3.5" />}
                onClick={() => setIsRejectModalOpen(true)}
              >
                Reject Claim
              </Button>
              <Button
                variant="gold"
                size="sm"
                leftIcon={<CheckCircle2 className="size-3.5" />}
                onClick={() => setIsApproveModalOpen(true)}
              >
                Approve Refund
              </Button>
            </>
          )}
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Claim Specifications & Audit */}
        <div className="space-y-6 lg:col-span-2">
          <Card padding="md" className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Statutory Refund Determination
                </span>
                <h3 className="text-base font-bold text-foreground">
                  {refund.reason || "Customer Refund Request"}
                </h3>
              </div>
              <Badge
                tone={
                  refund.status === "COMPLETED"
                    ? "success"
                    : refund.status === "REJECTED"
                    ? "destructive"
                    : refund.status === "APPROVED" || refund.status === "PROCESSING"
                    ? "gold"
                    : "warning"
                }
                size="md"
              >
                {refund.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="rounded-xs border border-border bg-muted/20 p-2.5">
                <span className="text-muted-foreground block text-[11px]">Claim Amount</span>
                <strong className="text-foreground font-mono text-sm">
                  {formatCurrency(refund.amount)}
                </strong>
              </div>

              <div className="rounded-xs border border-border bg-muted/20 p-2.5">
                <span className="text-muted-foreground block text-[11px]">Requested Date</span>
                <span className="text-foreground">{formatDate(refund.createdAt)}</span>
              </div>

              <div className="rounded-xs border border-border bg-muted/20 p-2.5">
                <span className="text-muted-foreground block text-[11px]">Processed Date</span>
                <span className="text-foreground">
                  {refund.processedAt ? formatDate(refund.processedAt) : "Pending"}
                </span>
              </div>

              <div className="rounded-xs border border-border bg-muted/20 p-2.5">
                <span className="text-muted-foreground block text-[11px]">Payment Method</span>
                <strong className="text-foreground">
                  {refund.paymentMethod || "Original Payment Source"}
                </strong>
              </div>
            </div>

            <div className="rounded-xs border border-border bg-muted/20 p-3.5 space-y-2 text-xs">
              <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px]">
                Reason & Statutory Justification
              </h4>
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                {refund.reason || "No explicit customer rationale documented."}
              </p>
            </div>

            {refund.rejectionReason && (
              <div className="rounded-xs border border-destructive/30 bg-destructive/5 p-3.5 space-y-1 text-xs text-destructive">
                <h4 className="font-bold uppercase tracking-wider text-[11px]">Rejection Reason</h4>
                <p>{refund.rejectionReason}</p>
              </div>
            )}
          </Card>
        </div>

        {/* Right Col: Host Invoice & Action Card */}
        <div className="space-y-6">
          {refund.paymentId && (
            <Card padding="md" className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-foreground">Linked Statutory Invoice</h4>
                <Link
                  href={`/admin/invoices/${refund.paymentId}`}
                  className="text-xs font-semibold text-gold-dark dark:text-gold hover:underline flex items-center gap-1"
                >
                  <span>View Invoice</span>
                  <ExternalLink className="size-3" />
                </Link>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Invoice Reference</span>
                  <Link
                    href={`/admin/invoices/${refund.paymentId}`}
                    className="font-mono font-bold text-navy dark:text-gold hover:underline"
                  >
                    #{refund.paymentId.slice(0, 8)}
                  </Link>
                </div>
                {refund.transactionId && (
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <span className="text-muted-foreground">Transaction ID</span>
                    <Link
                      href={`/admin/transactions/${refund.transactionId}`}
                      className="font-mono text-muted-foreground hover:underline"
                    >
                      #{refund.transactionId.slice(0, 8)}
                    </Link>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Claim State</span>
                  <Badge tone="neutral" size="sm">{refund.status}</Badge>
                </div>
              </div>
            </Card>
          )}

          {/* Direct Compliance Review Trigger */}
          {refund.status === "REQUESTED" && (
            <Card padding="md" className="space-y-3 text-xs border-gold/40 bg-gold/5">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-gold" />
                <span>Statutory Compliance Authorization</span>
              </h4>
              <p className="text-muted-foreground">
                Authorize or decline this refund claim after reviewing customer payment logs.
              </p>
              <div className="flex flex-col gap-2 pt-1">
                <Button
                  variant="gold"
                  size="sm"
                  leftIcon={<CheckCircle2 className="size-3.5" />}
                  onClick={() => setIsApproveModalOpen(true)}
                >
                  Approve Claim
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10"
                  leftIcon={<XCircle className="size-3.5" />}
                  onClick={() => setIsRejectModalOpen(true)}
                >
                  Reject Claim
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* APPROVE MODAL */}
      {isApproveModalOpen && (
        <AdminApproveRefundModal
          refundId={refund.id}
          refundNumber={refund.refundNumber}
          amount={refund.amount}
          isOpen={isApproveModalOpen}
          onClose={() => setIsApproveModalOpen(false)}
          onSuccess={() => {
            refetch();
            queryClient.invalidateQueries({ queryKey: ["admin-refunds-list"] });
          }}
        />
      )}

      {/* REJECT MODAL */}
      {isRejectModalOpen && (
        <AdminRejectRefundModal
          refundId={refund.id}
          refundNumber={refund.refundNumber}
          isOpen={isRejectModalOpen}
          onClose={() => setIsRejectModalOpen(false)}
          onSuccess={() => {
            refetch();
            queryClient.invalidateQueries({ queryKey: ["admin-refunds-list"] });
          }}
        />
      )}
    </PageShell>
  );
}
