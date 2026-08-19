"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  FileCheck,
  Printer,
  Download,
  DollarSign,
  Calendar,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { PageShell } from "@/components/ui/layout-primitives";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton, ErrorState } from "@/components/ui/feedback-primitives";
import { adminApi } from "@/lib/api/admin";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export default function AdminReceiptDetailPage() {
  const params = useParams();
  const id = String(params.id);

  const {
    data: receipt,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-receipt", id],
    queryFn: () => adminApi.getReceiptById(id),
  });

  if (isLoading) {
    return (
      <PageShell title="Loading Receipt Certificate...">
        <div className="space-y-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </PageShell>
    );
  }

  if (error || !receipt) {
    return (
      <PageShell title="Receipt Dossier">
        <ErrorState
          title="Receipt Not Found"
          message="Could not retrieve the official receipt certificate."
          onRetry={() => refetch()}
        />
      </PageShell>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <PageShell
      eyebrow={`STATUTORY RECEIPT • #${receipt.receiptNumber || receipt.id.slice(0, 8)}`}
      title={receipt.receiptNumber || `Receipt #${receipt.id.slice(0, 8)}`}
      description={`Amount: ${formatCurrency(receipt.amount)} • Method: ${receipt.paymentMethod} • Issued: ${formatDate(receipt.issuedAt || receipt.createdAt)}`}
      actions={
        <div className="flex items-center gap-2">
          <Link href="/admin/receipts">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="size-3.5" />}>
              Receipts Ledger
            </Button>
          </Link>
          <Button variant="gold" size="sm" leftIcon={<Printer className="size-3.5" />} onClick={handlePrint}>
            Print Official Receipt
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Official Fiscal Receipt Document */}
        <div className="space-y-6 lg:col-span-2">
          <Card padding="lg" className="border border-border space-y-6 bg-card">
            {/* Receipt Header */}
            <div className="flex items-start justify-between border-b border-border pb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-gold-dark dark:text-gold">
                  SWIFT DOC KENYA • OFFICIAL RECEIPT
                </span>
                <h2 className="text-xl font-extrabold text-foreground mt-1">
                  Payment Certificate
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Statutory Document Filing & Legal Compliance Services
                </p>
              </div>
              <div className="text-right">
                <Badge tone="success" size="md">PAID & CERTIFIED</Badge>
                <span className="block font-mono text-xs font-bold text-foreground mt-1.5">
                  {receipt.receiptNumber || `REC-${receipt.id.slice(0, 8).toUpperCase()}`}
                </span>
              </div>
            </div>

            {/* Receipt Meta Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-muted-foreground block text-[11px]">Date Issued</span>
                <strong className="text-foreground font-mono">
                  {formatDate(receipt.issuedAt || receipt.createdAt)}
                </strong>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Payment Method</span>
                <strong className="text-foreground">{receipt.paymentMethod}</strong>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Invoice Reference</span>
                <strong className="text-foreground font-mono">#{receipt.paymentId.slice(0, 8)}</strong>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Amount Certified</span>
                <strong className="text-emerald-600 font-mono text-sm">
                  {formatCurrency(receipt.amount)}
                </strong>
              </div>
            </div>

            {/* Line items table / verification */}
            <div className="rounded-xs border border-border bg-muted/20 p-4 space-y-3 text-xs">
              <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px]">
                Certification & Fiscal Breakdown
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Settlement Subtotal:</span>
                  <span className="font-mono text-foreground">{formatCurrency(receipt.amount)}</span>
                </div>
                <div className="flex justify-between py-1.5 font-bold text-foreground text-sm border-t border-border">
                  <span>Total Amount Paid in Full:</span>
                  <span className="font-mono text-emerald-600">{formatCurrency(receipt.amount)}</span>
                </div>
              </div>
            </div>

            {/* Official seal watermark / footer */}
            <div className="flex items-center justify-between pt-4 border-t border-border text-[11px] text-muted-foreground">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-600" />
                <span>Digitally Verified Statutory Fiscal Document</span>
              </div>
              <span>Swift Doc Operations Command</span>
            </div>
          </Card>
        </div>

        {/* Right Col: Host Invoice & Navigation */}
        <div className="space-y-6">
          <Card padding="md" className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-foreground">Linked Statutory Invoice</h4>
              <Link
                href={`/admin/invoices/${receipt.paymentId}`}
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
                  href={`/admin/invoices/${receipt.paymentId}`}
                  className="font-mono font-bold text-navy dark:text-gold hover:underline"
                >
                  #{receipt.paymentId.slice(0, 8)}
                </Link>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Receipt Status</span>
                <Badge tone="success" size="sm">Valid & Active</Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
