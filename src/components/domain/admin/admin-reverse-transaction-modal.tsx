"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RotateCcw, AlertTriangle, AlertCircle } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { FormField, Textarea } from "@/components/ui/form-primitives";
import { adminApi } from "@/lib/api/admin";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { PaymentTransaction } from "@/types";

interface AdminReverseTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction?: PaymentTransaction | null;
  transactionId?: string;
  reference?: string;
  amount?: number | string;
  currency?: string;
  onReversed?: () => void;
  onSuccess?: () => void;
}

export function AdminReverseTransactionModal({
  isOpen,
  onClose,
  transaction,
  transactionId: explicitTxId,
  reference: explicitRef,
  amount: explicitAmount,
  currency: explicitCurrency,
  onReversed,
  onSuccess,
}: AdminReverseTransactionModalProps) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");

  const targetTxId = transaction?.id || explicitTxId || "";
  const displayRef = explicitRef || transaction?.transactionNumber || transaction?.externalReference || targetTxId.slice(0, 8);
  const displayAmount = transaction?.amount !== undefined ? transaction.amount : explicitAmount || 0;
  const displayCurrency = transaction?.currency || explicitCurrency || "KES";

  const reverseMutation = useMutation({
    mutationFn: () => {
      if (!reason.trim()) throw new Error("A statutory audit reason is required to reverse transactions");
      return adminApi.reverseTransaction(targetTxId, {
        reason: reason.trim(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-transactions-list"] });
      queryClient.invalidateQueries({ queryKey: ["admin-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-invoices-list"] });
      queryClient.invalidateQueries({ queryKey: ["admin-financial-summary"] });
      onClose();
      if (onReversed) onReversed();
      if (onSuccess) onSuccess();
    },
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reverse Payment Transaction"
      description={`Initiate formal transaction reversal for Tx #${displayRef}.`}
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            isLoading={reverseMutation.isPending}
            disabled={!reason.trim()}
            onClick={() => reverseMutation.mutate()}
          >
            Confirm Reversal
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Warning Alert */}
        <div className="flex items-start gap-2.5 rounded-xs border border-destructive/30 bg-destructive/10 p-3 text-destructive">
          <AlertTriangle className="size-4 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="block font-bold">Irreversible Financial Audit Action</strong>
            <p className="text-[11px] text-destructive/90">
              Reversing this transaction will restore the unpaid balance on the linked commercial invoice and log a high-priority statutory audit record.
            </p>
          </div>
        </div>

        {/* Transaction Details */}
        <div className="rounded-xs border border-border bg-muted/20 p-3 space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Settlement Amount:</span>
            <strong className="font-mono text-foreground font-bold">
              {formatCurrency(displayAmount, displayCurrency)}
            </strong>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Payment Channel:</span>
            <span className="font-bold text-foreground">{transaction?.paymentMethod || "BANK"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">External Reference:</span>
            <span className="font-mono text-foreground">{transaction?.externalReference || explicitRef || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Date Settled:</span>
            <span className="text-foreground">{formatDate(transaction?.paidAt || transaction?.createdAt || new Date().toISOString())}</span>
          </div>
        </div>

        {/* Mandatory Reason */}
        <FormField label="Statutory Reason / Bank Reversal Justification" required>
          <Textarea
            placeholder="Explain why this transaction is being reversed (e.g. Bank chargeback, double payment, fraudulent claim)..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </FormField>

        {reverseMutation.isError && (
          <div className="flex items-center gap-2 rounded-xs bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <span>{(reverseMutation.error as Error)?.message || "Failed to reverse transaction"}</span>
          </div>
        )}
      </div>
    </Modal>
  );
}
