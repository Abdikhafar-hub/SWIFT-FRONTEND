"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Sliders, AlertCircle } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { FormField, Textarea } from "@/components/ui/form-primitives";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { adminApi } from "@/lib/api/admin";
import { formatCurrency } from "@/lib/utils/format";
import type { Payment, AdjustmentType } from "@/types";

interface AdminFinancialAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice?: Payment | null;
  paymentId?: string;
  invoiceNumber?: string;
  currentAmount?: number | string;
  onAdjusted?: () => void;
  onSuccess?: () => void;
}

export function AdminFinancialAdjustmentModal({
  isOpen,
  onClose,
  invoice,
  paymentId: explicitPaymentId,
  invoiceNumber: explicitInvoiceNumber,
  currentAmount: explicitCurrentAmount,
  onAdjusted,
  onSuccess,
}: AdminFinancialAdjustmentModalProps) {
  const queryClient = useQueryClient();

  const targetPaymentId = invoice?.id || explicitPaymentId || "";
  const displayInvoiceNum = explicitInvoiceNumber || invoice?.invoiceNumber || targetPaymentId.slice(0, 8);
  const displayTotal = invoice?.totalAmount !== undefined ? invoice.totalAmount : explicitCurrentAmount || 0;
  const displayDue = invoice?.amountDue !== undefined ? invoice.amountDue : displayTotal;

  const [type, setType] = useState<AdjustmentType>("DISCOUNT");
  const [amount, setAmount] = useState<number>(0);
  const [reason, setReason] = useState("");

  const adjustMutation = useMutation({
    mutationFn: () => {
      if (amount <= 0) throw new Error("Adjustment amount must be greater than zero");
      if (!reason.trim()) throw new Error("A statutory audit reason is required");
      return adminApi.applyFinancialAdjustment(targetPaymentId, {
        type,
        amount: Number(amount),
        reason: reason.trim(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-invoices-list"] });
      queryClient.invalidateQueries({ queryKey: ["admin-invoices"] });
      if (targetPaymentId) {
        queryClient.invalidateQueries({ queryKey: ["admin-invoice", targetPaymentId] });
      }
      queryClient.invalidateQueries({ queryKey: ["admin-financial-summary"] });
      queryClient.invalidateQueries({ queryKey: ["admin-financial-collections"] });
      if (invoice?.applicationId) {
        queryClient.invalidateQueries({ queryKey: ["admin-application", invoice.applicationId] });
      }
      onClose();
      if (onAdjusted) onAdjusted();
      if (onSuccess) onSuccess();
    },
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Apply Financial Adjustment"
      description={`Apply authorized fee waiver, discount, penalty, or rounding adjustment to Invoice #${displayInvoiceNum}.`}
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="gold"
            size="sm"
            isLoading={adjustMutation.isPending}
            disabled={amount <= 0 || !reason.trim()}
            onClick={() => adjustMutation.mutate()}
          >
            Apply Adjustment
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Invoice Current State */}
        <div className="rounded-xs border border-border bg-muted/20 p-3 grid grid-cols-2 gap-3">
          <div>
            <span className="text-muted-foreground block text-[11px]">Total Invoiced:</span>
            <strong className="font-mono text-foreground font-bold">
              {formatCurrency(displayTotal, invoice?.currency || "KES")}
            </strong>
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px]">Outstanding Due:</span>
            <strong className="font-mono text-gold-dark dark:text-gold font-bold">
              {formatCurrency(displayDue, invoice?.currency || "KES")}
            </strong>
          </div>
        </div>

        <FormField label="Adjustment Category" required>
          <Select
            value={type}
            onChange={(e) => setType(e.target.value as AdjustmentType)}
            options={[
              { value: "DISCOUNT", label: "Discount / Promotional Rebate" },
              { value: "WAIVER", label: "Official Statutory Fee Waiver" },
              { value: "PENALTY", label: "Late Statutory Filing Surcharge / Penalty" },
              { value: "ROUNDING", label: "Banking Currency Rounding Adjustment" },
              { value: "OTHER", label: "Other Authorized Adjustment" },
            ]}
          />
        </FormField>

        <FormField label="Adjustment Amount (KES)" required>
          <Input
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
        </FormField>

        <FormField label="Statutory Reason / Authorization Reference" required>
          <Textarea
            placeholder="State executive approval reference, gazette waiver notice, or reason..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </FormField>

        {adjustMutation.isError && (
          <div className="flex items-center gap-2 rounded-xs bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <span>{(adjustMutation.error as Error)?.message || "Failed to apply adjustment"}</span>
          </div>
        )}
      </div>
    </Modal>
  );
}
