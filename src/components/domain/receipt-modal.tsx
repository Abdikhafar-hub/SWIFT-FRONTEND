"use client";

import React, { useRef } from "react";
import { Printer, Download, X, CheckCircle, ShieldCheck, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatKES } from "@/lib/utils/format";
import type { Receipt } from "@/types";

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: Receipt | null;
}

export function ReceiptModal({ isOpen, onClose, receipt }: ReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-sm border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-200 text-foreground">
        {/* Top Control Bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/80 bg-muted/90 px-6 py-3.5 backdrop-blur-xs print:hidden">
          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
            <FileText className="size-4 text-gold" />
            <span>Official Statutory Payment Receipt</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="h-8 gap-1.5 text-xs font-semibold"
            >
              <Printer className="size-3.5" />
              <span>Print Receipt</span>
            </Button>
            <button
              onClick={onClose}
              className="p-1 rounded-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Close modal"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Printable Official Receipt Body */}
        <div ref={receiptRef} className="p-8 sm:p-10 space-y-8 bg-card print:p-0">
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-gold/40 pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xs bg-ink text-gold font-serif font-black text-lg border border-gold/50">
                  SD
                </div>
                <span className="font-display text-xl font-extrabold tracking-tight text-foreground">
                  SWIFT DOC
                </span>
              </div>
              <p className="text-xs text-muted-foreground max-w-xs pt-1 leading-relaxed">
                Kenya Statutory Document Masters & Compliance Advisory
                <br />
                The Address, Muthangari Drive, Westlands, Nairobi
                <br />
                support@swiftdoc.co.ke | +254 729 732 142
              </p>
            </div>

            <div className="text-right space-y-1">
              <span className="inline-block rounded-xs bg-gold/20 px-2.5 py-1 text-xs font-black uppercase tracking-wider text-gold-dark dark:text-gold">
                Official Receipt
              </span>
              <div className="font-mono text-sm font-bold text-foreground pt-1">
                #{receipt.receiptNumber}
              </div>
              <div className="text-xs text-muted-foreground">
                Date: {new Date(receipt.issuedAt || receipt.createdAt).toLocaleDateString("en-KE", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </div>
            </div>
          </div>

          {/* Payer & Transaction Metadata Grid */}
          <div className="grid grid-cols-2 gap-6 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Received From (Payer)
              </span>
              <div className="font-bold text-foreground text-sm">
                {receipt.payerName || receipt.client?.fullName || "Valued Client"}
              </div>
              {receipt.client?.businessName && (
                <div className="text-muted-foreground font-medium">
                  {receipt.client.businessName}
                </div>
              )}
              {receipt.client?.kraPin && (
                <div className="font-mono text-muted-foreground text-[11px]">
                  KRA PIN: {receipt.client.kraPin}
                </div>
              )}
            </div>

            <div className="space-y-1 text-right sm:text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Payment Channel Details
              </span>
              <div className="font-bold text-foreground">
                Method: {receipt.paymentMethod || "M-PESA EXPRESS"}
              </div>
              <div className="font-mono text-muted-foreground text-[11px]">
                Ref: {receipt.transactionReference || "DAR-" + receipt.id.substring(0, 10).toUpperCase()}
              </div>
              <div className="text-[11px] text-muted-foreground">
                Status: <strong className="text-emerald-600 dark:text-emerald-400">SETTLED & RECONCILED</strong>
              </div>
            </div>
          </div>

          {/* Financial Breakdown Table */}
          <div className="border border-border/80 rounded-xs overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 font-bold text-muted-foreground border-b border-border/80">
                <tr>
                  <th className="p-3">Description</th>
                  <th className="p-3 text-right">Amount ({receipt.currency || "KES"})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                <tr>
                  <td className="p-3 font-medium text-foreground">
                    Settlement for Statutory Filing / Document Processing
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-foreground">
                    {formatKES(receipt.amountPaid || receipt.amount)}
                  </td>
                </tr>
              </tbody>
              <tfoot className="bg-muted/20 font-bold border-t border-border/80">
                <tr>
                  <td className="p-3 text-foreground">Total Amount Paid</td>
                  <td className="p-3 text-right font-mono text-sm text-gold-dark dark:text-gold">
                    {formatKES(receipt.amountPaid || receipt.amount)}
                  </td>
                </tr>
                {Number(receipt.remainingBalance) > 0 && (
                  <tr className="text-muted-foreground">
                    <td className="p-3 font-normal">Remaining Invoice Balance</td>
                    <td className="p-3 text-right font-mono">
                      {formatKES(receipt.remainingBalance)}
                    </td>
                  </tr>
                )}
              </tfoot>
            </table>
          </div>

          {/* Footer Verification Stamp & Seal */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border/70 text-xs">
            <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="size-5 shrink-0" />
              <div className="flex flex-col text-left">
                <span className="font-bold text-[11px]">Officially Verified Stamp</span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  Auth Hash: {receipt.id.substring(0, 16).toUpperCase()}
                </span>
              </div>
            </div>

            <div className="text-center sm:text-right text-[10px] text-muted-foreground">
              Thank you for trusting Swift Doc.
              <br />
              Generated electronically under the Kenya Electronic Transactions Act.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
