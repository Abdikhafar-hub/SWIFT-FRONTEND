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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-4 sm:p-5 lg:p-6 space-y-4 max-w-[1550px] mx-auto font-sans">
      {/* ------------------------------------------------------------------ */}
      {/* 1. HEADER SECTION */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
              STATUTORY RECEIPT • #{receipt.receiptNumber || receipt.id.slice(0, 8)}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2 mt-1">
            {receipt.receiptNumber || `Receipt #${receipt.id.slice(0, 8)}`}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Amount: {formatCurrency(receipt.amount)} • Method: {receipt.paymentMethod} • Issued: {formatDate(receipt.issuedAt || receipt.createdAt)}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <Link href="/admin/receipts">
            <button className="bg-white border border-slate-200 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-xl hover:bg-slate-50 transition-all shadow-xs flex items-center gap-1.5">
              <ArrowLeft className="size-3.5 text-slate-500" />
              <span>Receipts Ledger</span>
            </button>
          </Link>
          <button
            onClick={handlePrint}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
          >
            <Printer className="size-3.5" />
            <span>Print Official Receipt</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. RECEIPT CONTENT GRID */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left 2 Cols: Official Fiscal Receipt Document */}
        <div className="space-y-4 lg:col-span-2">
          <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-5">
            {/* Receipt Header */}
            <div className="flex items-start justify-between border-b border-slate-200/80 pb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-700">
                  SWIFT DOC KENYA • OFFICIAL RECEIPT
                </span>
                <h2 className="text-lg font-extrabold text-slate-900 mt-0.5">
                  Payment Certificate
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Statutory Document Filing &amp; Legal Compliance Services
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/80 inline-block">
                  PAID &amp; CERTIFIED
                </span>
                <span className="block font-mono text-xs font-bold text-slate-900 mt-1.5">
                  {receipt.receiptNumber || `REC-${receipt.id.slice(0, 8).toUpperCase()}`}
                </span>
              </div>
            </div>

            {/* Receipt Meta Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] font-extrabold uppercase tracking-wider">Date Issued</span>
                <strong className="text-slate-800 font-mono mt-0.5 block">
                  {formatDate(receipt.issuedAt || receipt.createdAt)}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-extrabold uppercase tracking-wider">Payment Method</span>
                <strong className="text-slate-800 mt-0.5 block">{receipt.paymentMethod}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-extrabold uppercase tracking-wider">Invoice Reference</span>
                <strong className="text-slate-800 font-mono mt-0.5 block">#{receipt.paymentId.slice(0, 8)}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-extrabold uppercase tracking-wider">Amount Certified</span>
                <strong className="text-emerald-600 font-mono text-sm mt-0.5 block font-extrabold">
                  {formatCurrency(receipt.amount)}
                </strong>
              </div>
            </div>

            {/* Line items table / verification */}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 space-y-2.5 text-xs">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">
                Certification &amp; Fiscal Breakdown
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-200/60 text-slate-600 font-medium">
                  <span>Settlement Subtotal:</span>
                  <span className="font-mono text-slate-900 font-bold">{formatCurrency(receipt.amount)}</span>
                </div>
                <div className="flex justify-between py-1.5 font-extrabold text-slate-900 text-sm border-t border-slate-200">
                  <span>Total Amount Paid in Full:</span>
                  <span className="font-mono text-emerald-600">{formatCurrency(receipt.amount)}</span>
                </div>
              </div>
            </div>

            {/* Official seal watermark / footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200/80 text-[11px] text-slate-500 font-medium">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-600" />
                <span>Digitally Verified Statutory Fiscal Document</span>
              </div>
              <span>Swift Doc Operations Command</span>
            </div>
          </div>
        </div>

        {/* Right Col: Host Invoice & Navigation */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Linked Statutory Invoice</h4>
              <Link
                href={`/admin/invoices/${receipt.paymentId}`}
                className="text-xs font-bold text-amber-700 hover:underline flex items-center gap-1"
              >
                <span>View Invoice</span>
                <ExternalLink className="size-3" />
              </Link>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500 font-medium">Invoice Reference</span>
                <Link
                  href={`/admin/invoices/${receipt.paymentId}`}
                  className="font-mono font-bold text-amber-700 hover:underline"
                >
                  #{receipt.paymentId.slice(0, 8)}
                </Link>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Receipt Status</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/80">Valid &amp; Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
