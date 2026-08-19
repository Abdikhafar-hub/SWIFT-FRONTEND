"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Printer,
  Download,
  CheckCircle2,
  Building,
  Receipt as ReceiptIcon,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton, ErrorState } from "@/components/ui/feedback-primitives";
import { adminApi } from "@/lib/api/admin";
import { formatCurrency, formatDate, formatKenyanPhone } from "@/lib/utils/format";
import type { Receipt } from "@/types";

interface AdminReceiptDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptId?: string | null;
  receipt?: Receipt | null;
}

export function AdminReceiptDetailModal({
  isOpen,
  onClose,
  receiptId,
  receipt: directReceipt,
}: AdminReceiptDetailModalProps) {
  const actualReceiptId = receiptId || directReceipt?.id || null;

  const {
    data: fetchedReceipt,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-receipt-detail", actualReceiptId],
    queryFn: () => adminApi.getReceiptById(actualReceiptId!),
    enabled: Boolean(actualReceiptId) && isOpen && !directReceipt,
  });

  const receipt = directReceipt || fetchedReceipt;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Official Statutory Receipt Voucher"
      description="Republic of Kenya compliant commercial settlement voucher and proof of payment."
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-emerald-600" />
            <span>KRA / Registrar Authenticated Record</span>
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Printer className="size-3.5" />}
              onClick={handlePrint}
            >
              Print Voucher
            </Button>
          </div>
        </div>
      }
    >
      {isLoading ? (
        <div className="space-y-4 py-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : error || !receipt ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <div className="space-y-6 text-xs print:p-0">
          {/* Printable Receipt Voucher Container */}
          <div className="rounded-xs border border-border bg-card p-5 space-y-5 shadow-xs">
            {/* Header / Brand */}
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-xs bg-navy dark:bg-gold flex items-center justify-center text-white dark:text-navy font-black text-sm">
                    SD
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">SWIFT DOC KENYA</h3>
                    <span className="text-[10px] text-muted-foreground block">
                      Statutory Document & Corporate Compliance Services
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right space-y-1">
                <Badge tone="success" size="md">
                  SETTLED & CONFIRMED
                </Badge>
                <div className="font-mono text-xs font-bold text-foreground">
                  RECEIPT #{receipt.receiptNumber}
                </div>
                <span className="text-[11px] text-muted-foreground block">
                  Date: {formatDate(receipt.issuedAt || receipt.createdAt)}
                </span>
              </div>
            </div>

            {/* Payer & Beneficiary Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xs bg-muted/20 p-3.5 border border-border/50">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Received From (Payer)
                </span>
                <strong className="text-sm font-bold text-foreground block">
                  {receipt.payerName || receipt.client?.fullName || "Verified Entity"}
                </strong>
                {receipt.client?.kraPin && (
                  <span className="text-[11px] font-mono text-muted-foreground block">
                    KRA PIN: {receipt.client.kraPin}
                  </span>
                )}
                {receipt.client?.phone && (
                  <span className="text-[11px] font-mono text-muted-foreground block">
                    Contact: {formatKenyanPhone(receipt.client.phone)}
                  </span>
                )}
              </div>

              <div className="space-y-1 sm:text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Payment Reference Details
                </span>
                <div className="font-mono text-xs text-foreground font-semibold">
                  Channel: {receipt.paymentMethod}
                </div>
                <div className="font-mono text-xs text-foreground font-semibold">
                  Ref Code: {receipt.transactionReference || "—"}
                </div>
                {receipt.organizationId && (
                  <span className="text-[11px] text-muted-foreground block">
                    Org: {receipt.organizationId.slice(0, 8)}
                  </span>
                )}
              </div>
            </div>

            {/* Receipt Amount Summary Box */}
            <div className="rounded-xs border border-emerald-500/30 bg-emerald-500/5 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <span className="text-xs text-emerald-900 dark:text-emerald-300 font-semibold block">
                  Official Total Settled Amount
                </span>
                <span className="text-[11px] text-emerald-800 dark:text-emerald-400">
                  Confirmed through automated clearing
                </span>
              </div>
              <strong className="font-mono text-2xl font-black text-emerald-700 dark:text-emerald-300">
                {formatCurrency(receipt.amount, receipt.currency || "KES")}
              </strong>
            </div>

            {/* Reconciliation Balance Grid */}
            <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
              <div className="rounded-xs border border-border p-2.5 bg-muted/10">
                <span className="text-muted-foreground block text-[11px]">Cumulative Paid:</span>
                <span className="font-mono font-bold text-foreground">
                  {formatCurrency(receipt.amountPaid || receipt.amount, receipt.currency || "KES")}
                </span>
              </div>
              <div className="rounded-xs border border-border p-2.5 bg-muted/10">
                <span className="text-muted-foreground block text-[11px]">Invoice Remaining Due:</span>
                <span className="font-mono font-bold text-gold-dark dark:text-gold">
                  {formatCurrency(receipt.remainingBalance || 0, receipt.currency || "KES")}
                </span>
              </div>
            </div>

            {/* Bottom Official Disclaimer */}
            <div className="border-t border-border pt-3 text-[10px] text-muted-foreground leading-relaxed">
              <p>
                This document serves as an official electronic receipt for statutory compliance and document filing services in the Republic of Kenya. Generated by Swift Doc automated settlement engine.
              </p>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
