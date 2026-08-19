"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CreditCard, Landmark, Banknote, AlertTriangle } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { FormField, Textarea } from "@/components/ui/form-primitives";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { adminApi } from "@/lib/api/admin";
import { formatCurrency } from "@/lib/utils/format";
import type { Payment, PaymentMethod } from "@/types";

interface AdminManualPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice?: Payment | null;
  paymentId?: string;
  applicationId?: string;
  applicationNumber?: string;
  outstandingAmount?: number | string;
  onRecorded?: () => void;
  onSuccess?: () => void;
}

export function AdminManualPaymentModal({
  isOpen,
  onClose,
  invoice,
  paymentId: explicitPaymentId,
  applicationId: explicitAppId,
  outstandingAmount,
  onRecorded,
  onSuccess,
}: AdminManualPaymentModalProps) {
  const queryClient = useQueryClient();

  const targetPaymentId = invoice?.id || explicitPaymentId || "";
  const invoiceNum = invoice?.invoiceNumber || targetPaymentId.slice(0, 8);
  const targetAppId = invoice?.applicationId || explicitAppId || "";

  const rawDue = outstandingAmount !== undefined
    ? outstandingAmount
    : invoice?.amountDue;

  const dueAmountNum = typeof rawDue === "string"
    ? parseFloat(rawDue)
    : (rawDue || 0);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("BANK");
  const [amount, setAmount] = useState<number>(dueAmountNum > 0 ? dueAmountNum : 0);
  const [externalReference, setExternalReference] = useState("");
  const [notes, setNotes] = useState("");

  const recordMutation = useMutation({
    mutationFn: () =>
      adminApi.recordManualPayment({
        paymentId: targetPaymentId,
        paymentMethod,
        amount: Number(amount),
        externalReference: externalReference || undefined,
        notes: notes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-invoices"] });
      if (targetPaymentId) {
        queryClient.invalidateQueries({ queryKey: ["admin-invoice", targetPaymentId] });
      }
      if (targetAppId) {
        queryClient.invalidateQueries({ queryKey: ["admin-application", targetAppId] });
      }
      queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
      queryClient.invalidateQueries({ queryKey: ["admin-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-financial-collections"] });
      onClose();
      if (onRecorded) onRecorded();
      if (onSuccess) onSuccess();
    },
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Manual Statutory Settlement"
      description={`Record official Bank Wire, Direct Deposit, or Cash settlement for Invoice #${invoiceNum}.`}
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="gold"
            size="sm"
            isLoading={recordMutation.isPending}
            onClick={() => recordMutation.mutate()}
          >
            Record Payment Settlement
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Invoice Balance Summary */}
        <div className="rounded-xs border border-border bg-muted/20 p-3 flex items-center justify-between text-xs">
          <div>
            <span className="text-muted-foreground block">Outstanding Balance:</span>
            <strong className="text-sm font-bold text-gold-dark dark:text-gold">
              {formatCurrency(rawDue || 0, invoice?.currency || "KES")}
            </strong>
          </div>
          <div className="text-right">
            <span className="text-muted-foreground block">Total Invoiced:</span>
            <span className="font-semibold text-foreground">
              {formatCurrency(invoice?.totalAmount || rawDue || 0, invoice?.currency || "KES")}
            </span>
          </div>
        </div>

        <FormField label="Payment Method Channel" required>
          <Select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            options={[
              { value: "BANK", label: "Bank Wire / Direct RTGS Transfer (KCB / Equity / Stanbic)" },
              { value: "CASH", label: "Direct Cash Deposit / Over-the-Counter Deposit" },
              { value: "CARD", label: "Point of Sale (POS) Card Terminal" },
              { value: "OTHER", label: "Other Official Settlement Channel" },
            ]}
          />
        </FormField>

        <FormField label="Settlement Amount (KES)" required>
          <Input
            type="number"
            min={1}
            max={dueAmountNum > 0 ? dueAmountNum * 2 : 10000000}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
        </FormField>

        <FormField label="External Bank / Deposit Reference #" required>
          <Input
            placeholder="e.g. KCB-RTGS-9810234 or Bank Slip Reference"
            value={externalReference}
            onChange={(e) => setExternalReference(e.target.value)}
          />
        </FormField>

        <FormField label="Reconciliation / Audit Notes">
          <Textarea
            placeholder="Record bank statement details, deposit slip batch, or cashier remarks..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </FormField>

        {recordMutation.isError && (
          <div className="flex items-center gap-2 rounded-xs bg-destructive/10 p-3 text-xs text-destructive">
            <AlertTriangle className="size-4 shrink-0" />
            <span>{(recordMutation.error as Error)?.message || "Failed to record manual payment"}</span>
          </div>
        )}
      </div>
    </Modal>
  );
}
