"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RotateCcw, CheckCircle, XCircle, AlertCircle, AlertTriangle } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { FormField, Textarea } from "@/components/ui/form-primitives";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { adminApi } from "@/lib/api/admin";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { Refund, PaymentTransaction } from "@/types";

interface AdminRequestRefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction?: PaymentTransaction;
  paymentId?: string;
  onRequested?: () => void;
}

export function AdminRequestRefundModal({
  isOpen,
  onClose,
  transaction,
  paymentId: defaultPaymentId = "",
  onRequested,
}: AdminRequestRefundModalProps) {
  const queryClient = useQueryClient();

  const [paymentId, setPaymentId] = useState(transaction?.paymentId || defaultPaymentId);
  const [transactionId, setTransactionId] = useState(transaction?.id || "");
  const [amount, setAmount] = useState<number>(
    transaction?.amount ? Number(transaction.amount) : 0
  );
  const [reason, setReason] = useState("");

  const requestMutation = useMutation({
    mutationFn: () => {
      if (!paymentId || !transactionId) {
        throw new Error("Payment ID and Transaction ID are required");
      }
      if (amount <= 0) {
        throw new Error("Refund amount must be greater than zero");
      }
      if (!reason.trim()) {
        throw new Error("A statutory audit reason is required for refunds");
      }
      return adminApi.requestRefund({
        paymentId,
        transactionId,
        amount: Number(amount),
        reason: reason.trim(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-refunds-list"] });
      queryClient.invalidateQueries({ queryKey: ["admin-financial-summary"] });
      queryClient.invalidateQueries({ queryKey: ["admin-invoices-list"] });
      onClose();
      if (onRequested) onRequested();
    },
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Request Financial Refund"
      description="Initiate an official statutory refund request subject to administrative approval."
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="gold"
            size="sm"
            isLoading={requestMutation.isPending}
            disabled={amount <= 0 || !reason.trim()}
            onClick={() => requestMutation.mutate()}
          >
            Submit Refund Request
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {transaction && (
          <div className="rounded-xs border border-border bg-muted/20 p-3 space-y-1">
            <span className="text-muted-foreground block text-[11px]">Linked Transaction:</span>
            <div className="flex justify-between font-mono font-semibold text-foreground">
              <span>#{transaction.transactionNumber}</span>
              <span>{formatCurrency(transaction.amount, transaction.currency || "KES")}</span>
            </div>
          </div>
        )}

        {!transaction && (
          <>
            <FormField label="Payment / Invoice ID" required>
              <Input
                placeholder="Enter Payment UUID..."
                value={paymentId}
                onChange={(e) => setPaymentId(e.target.value)}
              />
            </FormField>

            <FormField label="Transaction ID" required>
              <Input
                placeholder="Enter Transaction UUID..."
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
              />
            </FormField>
          </>
        )}

        <FormField label="Refund Amount (KES)" required>
          <Input
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
        </FormField>

        <FormField label="Refund Justification / Reason" required>
          <Textarea
            placeholder="State client cancellation reason, duplicate billing note, or statutory claim..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </FormField>

        {requestMutation.isError && (
          <div className="flex items-center gap-2 rounded-xs bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <span>{(requestMutation.error as Error)?.message || "Failed to submit refund request"}</span>
          </div>
        )}
      </div>
    </Modal>
  );
}

interface AdminRefundReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  refund: Refund | null;
  onReviewed?: () => void;
}

export function AdminRefundReviewModal({
  isOpen,
  onClose,
  refund,
  onReviewed,
}: AdminRefundReviewModalProps) {
  const queryClient = useQueryClient();
  const [reviewNotes, setReviewNotes] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [mode, setMode] = useState<"view" | "reject">("view");

  const approveMutation = useMutation({
    mutationFn: () => {
      if (!refund) throw new Error("No refund selected");
      return adminApi.approveRefund(refund.id, {
        notes: reviewNotes || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-refunds-list"] });
      queryClient.invalidateQueries({ queryKey: ["admin-financial-summary"] });
      queryClient.invalidateQueries({ queryKey: ["admin-invoices-list"] });
      onClose();
      if (onReviewed) onReviewed();
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => {
      if (!refund) throw new Error("No refund selected");
      if (!rejectReason.trim()) throw new Error("Rejection reason is required");
      return adminApi.rejectRefund(refund.id, {
        reason: rejectReason.trim(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-refunds-list"] });
      queryClient.invalidateQueries({ queryKey: ["admin-financial-summary"] });
      queryClient.invalidateQueries({ queryKey: ["admin-invoices-list"] });
      onClose();
      if (onReviewed) onReviewed();
    },
  });

  if (!refund) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Audit & Review Refund Request"
      description={`Review refund voucher #${refund.refundNumber}.`}
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          {refund.status === "REQUESTED" && (
            <div className="flex items-center gap-2">
              {mode === "view" ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => setMode("reject")}
                  >
                    Reject Claim
                  </Button>
                  <Button
                    variant="gold"
                    size="sm"
                    leftIcon={<CheckCircle className="size-3.5" />}
                    isLoading={approveMutation.isPending}
                    onClick={() => approveMutation.mutate()}
                  >
                    Approve Refund
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" onClick={() => setMode("view")}>
                    Back
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    isLoading={rejectMutation.isPending}
                    disabled={!rejectReason.trim()}
                    onClick={() => rejectMutation.mutate()}
                  >
                    Confirm Rejection
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Refund Details */}
        <div className="rounded-xs border border-border bg-muted/20 p-3 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Claim Amount:</span>
            <strong className="font-mono text-base font-bold text-foreground">
              {formatCurrency(refund.amount, refund.currency || "KES")}
            </strong>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Current Status:</span>
            <Badge
              tone={
                refund.status === "COMPLETED" || refund.status === "APPROVED"
                  ? "success"
                  : refund.status === "FAILED" || refund.status === "CANCELLED"
                  ? "destructive"
                  : "warning"
              }
              size="sm"
            >
              {refund.status}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Date Requested:</span>
            <span className="text-foreground">{formatDate(refund.createdAt)}</span>
          </div>
        </div>

        {/* Claim Reason */}
        <div className="rounded-xs border border-border p-3 space-y-1 bg-card">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Client / Officer Stated Reason
          </span>
          <p className="text-foreground text-xs leading-relaxed">{refund.reason}</p>
        </div>

        {/* Mode View: Optional Approval Notes */}
        {refund.status === "REQUESTED" && mode === "view" && (
          <FormField label="Auditor Approval Notes (Optional)">
            <Textarea
              placeholder="State payment authorization reference or transaction code..."
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              rows={2}
            />
          </FormField>
        )}

        {/* Mode Reject: Required Rejection Reason */}
        {refund.status === "REQUESTED" && mode === "reject" && (
          <FormField label="Statutory Rejection Reason" required>
            <Textarea
              placeholder="Explain why this refund claim is being rejected..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
          </FormField>
        )}

        {(approveMutation.isError || rejectMutation.error) && (
          <div className="flex items-center gap-2 rounded-xs bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <span>
              {((approveMutation.error || rejectMutation.error) as Error)?.message ||
                "Failed to process refund"}
            </span>
          </div>
        )}
      </div>
    </Modal>
  );
}

export interface AdminApproveRefundModalProps {
  refundId: string;
  refundNumber?: string;
  amount?: number | string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AdminApproveRefundModal({
  refundId,
  refundNumber,
  amount,
  isOpen,
  onClose,
  onSuccess,
}: AdminApproveRefundModalProps) {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState("");

  const approveMutation = useMutation({
    mutationFn: () => adminApi.approveRefund(refundId, { notes: notes || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-refunds-list"] });
      queryClient.invalidateQueries({ queryKey: ["admin-refund", refundId] });
      queryClient.invalidateQueries({ queryKey: ["admin-financial-summary"] });
      onClose();
      if (onSuccess) onSuccess();
    },
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Approve Refund #${refundNumber || refundId.slice(0, 8)}`}
      description="Authorize processing of this customer statutory refund voucher."
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={approveMutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="gold"
            size="sm"
            isLoading={approveMutation.isPending}
            onClick={() => approveMutation.mutate()}
          >
            Confirm Approval
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {amount !== undefined && (
          <div className="rounded-xs border border-border bg-muted/20 p-3 flex justify-between">
            <span className="text-muted-foreground">Authorized Refund Amount:</span>
            <strong className="font-mono text-foreground font-bold">{formatCurrency(amount)}</strong>
          </div>
        )}
        <FormField label="Auditor Approval Notes (Optional)">
          <Textarea
            placeholder="Payment batch reference or approval rationale..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </FormField>
      </div>
    </Modal>
  );
}

export interface AdminRejectRefundModalProps {
  refundId: string;
  refundNumber?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AdminRejectRefundModal({
  refundId,
  refundNumber,
  isOpen,
  onClose,
  onSuccess,
}: AdminRejectRefundModalProps) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");

  const rejectMutation = useMutation({
    mutationFn: () => {
      if (!reason.trim()) throw new Error("Rejection reason is required");
      return adminApi.rejectRefund(refundId, { reason: reason.trim() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-refunds-list"] });
      queryClient.invalidateQueries({ queryKey: ["admin-refund", refundId] });
      queryClient.invalidateQueries({ queryKey: ["admin-financial-summary"] });
      onClose();
      if (onSuccess) onSuccess();
    },
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Reject Refund #${refundNumber || refundId.slice(0, 8)}`}
      description="Decline this statutory refund request with compliance justification."
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={rejectMutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            isLoading={rejectMutation.isPending}
            disabled={!reason.trim()}
            onClick={() => rejectMutation.mutate()}
          >
            Confirm Rejection
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        <FormField label="Statutory Rejection Reason" required>
          <Textarea
            placeholder="Explain why this refund claim is not eligible under statutory policies..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </FormField>
      </div>
    </Modal>
  );
}
