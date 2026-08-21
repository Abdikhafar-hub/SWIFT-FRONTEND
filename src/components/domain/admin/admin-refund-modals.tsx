"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RotateCcw, CheckCircle, XCircle, AlertCircle, AlertTriangle, Play, CheckCircle2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { FormField, Textarea } from "@/components/ui/form-primitives";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { adminApi } from "@/lib/api/admin";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { Refund, PaymentTransaction } from "@/types";

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

export interface AdminProcessRefundModalProps {
  refundId: string;
  refundNumber?: string;
  amount?: number | string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AdminProcessRefundModal({
  refundId,
  refundNumber,
  amount,
  isOpen,
  onClose,
  onSuccess,
}: AdminProcessRefundModalProps) {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState("");

  const processMutation = useMutation({
    mutationFn: () => adminApi.processRefund(refundId, { notes: notes || undefined }),
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
      title={`Start Processing Refund #${refundNumber || refundId.slice(0, 8)}`}
      description="Mark disbursement as actively processing in payment provider / bank queue."
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={processMutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="gold"
            size="sm"
            leftIcon={<Play className="size-3.5" />}
            isLoading={processMutation.isPending}
            onClick={() => processMutation.mutate()}
          >
            Start Processing
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {amount !== undefined && (
          <div className="rounded-xs border border-border bg-muted/20 p-3 flex justify-between">
            <span className="text-muted-foreground">Disbursement Amount:</span>
            <strong className="font-mono text-foreground font-bold">{formatCurrency(amount)}</strong>
          </div>
        )}
        <FormField label="Disbursement Processing Notes (Optional)">
          <Textarea
            placeholder="Provider batch #, queue status, or dispatcher reference..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </FormField>
      </div>
    </Modal>
  );
}

export interface AdminCompleteRefundModalProps {
  refundId: string;
  refundNumber?: string;
  amount?: number | string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AdminCompleteRefundModal({
  refundId,
  refundNumber,
  amount,
  isOpen,
  onClose,
  onSuccess,
}: AdminCompleteRefundModalProps) {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState("");
  const [externalReference, setExternalReference] = useState("");

  const completeMutation = useMutation({
    mutationFn: () =>
      adminApi.completeRefund(refundId, {
        notes: notes || undefined,
        externalReference: externalReference.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-refunds-list"] });
      queryClient.invalidateQueries({ queryKey: ["admin-refund", refundId] });
      queryClient.invalidateQueries({ queryKey: ["admin-financial-summary"] });
      queryClient.invalidateQueries({ queryKey: ["admin-invoices-list"] });
      onClose();
      if (onSuccess) onSuccess();
    },
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Mark Refund #${refundNumber || refundId.slice(0, 8)} Completed`}
      description="Finalize financial disbursement, update invoice balances, and notify client."
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={completeMutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="gold"
            size="sm"
            leftIcon={<CheckCircle2 className="size-3.5" />}
            isLoading={completeMutation.isPending}
            onClick={() => completeMutation.mutate()}
          >
            Finalize Disbursement
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {amount !== undefined && (
          <div className="rounded-xs border border-emerald-500/20 bg-emerald-500/10 p-3 flex justify-between">
            <span className="text-muted-foreground">Disbursed Refund Amount:</span>
            <strong className="font-mono text-emerald-400 font-bold">{formatCurrency(amount)}</strong>
          </div>
        )}
        <FormField label="External Payment / Provider Reference (e.g. M-Pesa Reversal ID or Bank Wire Ref)">
          <Input
            placeholder="e.g. RF982318237..."
            value={externalReference}
            onChange={(e) => setExternalReference(e.target.value)}
          />
        </FormField>
        <FormField label="Settlement Audit Notes (Optional)">
          <Textarea
            placeholder="Final settlement details or accounting verification note..."
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

export interface AdminCancelRefundModalProps {
  refundId: string;
  refundNumber?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AdminCancelRefundModal({
  refundId,
  refundNumber,
  isOpen,
  onClose,
  onSuccess,
}: AdminCancelRefundModalProps) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");

  const cancelMutation = useMutation({
    mutationFn: () => adminApi.cancelRefund(refundId, { reason: reason.trim() || undefined }),
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
      title={`Cancel Refund #${refundNumber || refundId.slice(0, 8)}`}
      description="Cancel this pending refund claim."
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={cancelMutation.isPending}>
            Dismiss
          </Button>
          <Button
            variant="destructive"
            size="sm"
            isLoading={cancelMutation.isPending}
            onClick={() => cancelMutation.mutate()}
          >
            Confirm Cancellation
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        <FormField label="Cancellation Reason (Optional)">
          <Textarea
            placeholder="State why this refund claim is being cancelled..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </FormField>
      </div>
    </Modal>
  );
}

export { AdminInitiateRefundModal as AdminRequestRefundModal } from "./admin-initiate-refund-modal";
export { AdminApproveRefundModal as AdminRefundReviewModal } from "./admin-refund-modals";

