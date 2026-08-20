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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-4 sm:p-5 lg:p-6 space-y-4 max-w-[1550px] mx-auto font-sans">
      {/* ------------------------------------------------------------------ */}
      {/* 1. HEADER SECTION */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
              REFUND CLAIM • #{refund.refundNumber || refund.id.slice(0, 8)}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2 mt-1">
            {refund.refundNumber ? `Refund ${refund.refundNumber}` : "Refund Claim"}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Claim Amount: {formatCurrency(refund.amount)} • Status: {refund.status} • Payment Ref: #{refund.paymentId?.slice(0, 8)}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <Link href="/admin/refunds">
            <button className="bg-white border border-slate-200 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-xl hover:bg-slate-50 transition-all shadow-xs flex items-center gap-1.5">
              <ArrowLeft className="size-3.5 text-slate-500" />
              <span>All Refunds</span>
            </button>
          </Link>
          {refund.status === "REQUESTED" && (
            <>
              <button
                onClick={() => setIsRejectModalOpen(true)}
                className="bg-white border border-rose-200 text-rose-700 font-bold text-xs px-3.5 py-2 rounded-xl hover:bg-rose-50 transition-all shadow-xs flex items-center gap-1.5"
              >
                <XCircle className="size-3.5 text-rose-600" />
                <span>Reject Claim</span>
              </button>
              <button
                onClick={() => setIsApproveModalOpen(true)}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
              >
                <CheckCircle2 className="size-3.5" />
                <span>Approve Refund</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. CONTENT GRID */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left 2 Cols: Claim Specifications & Audit */}
        <div className="space-y-4 lg:col-span-2">
          <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Statutory Refund Determination
                </span>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">
                  {refund.reason || "Customer Refund Request"}
                </h3>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                  refund.status === "COMPLETED"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200/80"
                    : refund.status === "REJECTED"
                    ? "bg-rose-50 text-rose-800 border-rose-200/80"
                    : refund.status === "APPROVED" || refund.status === "PROCESSING"
                    ? "bg-amber-50 text-amber-800 border-amber-200/80"
                    : "bg-slate-100 text-slate-700 border-slate-200"
                }`}
              >
                {refund.status}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-2.5">
                <span className="text-slate-400 block text-[10px] font-extrabold uppercase tracking-wider">Claim Amount</span>
                <strong className="text-slate-900 font-mono text-sm mt-0.5 block font-extrabold">
                  {formatCurrency(refund.amount)}
                </strong>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-2.5">
                <span className="text-slate-400 block text-[10px] font-extrabold uppercase tracking-wider">Requested Date</span>
                <span className="text-slate-800 font-semibold mt-0.5 block">{formatDate(refund.createdAt)}</span>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-2.5">
                <span className="text-slate-400 block text-[10px] font-extrabold uppercase tracking-wider">Processed Date</span>
                <span className="text-slate-800 font-semibold mt-0.5 block">
                  {refund.processedAt ? formatDate(refund.processedAt) : "Pending"}
                </span>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-2.5">
                <span className="text-slate-400 block text-[10px] font-extrabold uppercase tracking-wider">Payment Method</span>
                <strong className="text-slate-800 font-semibold mt-0.5 block">
                  {refund.paymentMethod || "Original Payment Source"}
                </strong>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5 space-y-1.5 text-xs">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">
                Reason &amp; Statutory Justification
              </h4>
              <p className="text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">
                {refund.reason || "No explicit customer rationale documented."}
              </p>
            </div>

            {refund.rejectionReason && (
              <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 space-y-1 text-xs text-rose-800">
                <h4 className="font-bold uppercase tracking-wider text-[10px]">Rejection Reason</h4>
                <p className="font-medium">{refund.rejectionReason}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Host Invoice & Action Card */}
        <div className="space-y-4">
          {refund.paymentId && (
            <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Linked Statutory Invoice</h4>
                <Link
                  href={`/admin/invoices/${refund.paymentId}`}
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
                    href={`/admin/invoices/${refund.paymentId}`}
                    className="font-mono font-bold text-amber-700 hover:underline"
                  >
                    #{refund.paymentId.slice(0, 8)}
                  </Link>
                </div>
                {refund.transactionId && (
                  <div className="flex justify-between border-b border-slate-200/60 pb-2">
                    <span className="text-slate-500 font-medium">Transaction ID</span>
                    <Link
                      href={`/admin/transactions/${refund.transactionId}`}
                      className="font-mono text-slate-500 hover:underline"
                    >
                      #{refund.transactionId.slice(0, 8)}
                    </Link>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Claim State</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">{refund.status}</span>
                </div>
              </div>
            </div>
          )}

          {/* Direct Compliance Review Trigger */}
          {refund.status === "REQUESTED" && (
            <div className="bg-amber-50/60 rounded-xl p-4 border border-amber-200/80 space-y-3 text-xs">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-amber-600" />
                <span>Statutory Compliance Authorization</span>
              </h4>
              <p className="text-slate-600 font-medium leading-relaxed">
                Authorize or decline this refund claim after reviewing customer payment logs.
              </p>
              <div className="flex flex-col gap-2 pt-1">
                <button
                  onClick={() => setIsApproveModalOpen(true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="size-3.5" />
                  <span>Approve Claim</span>
                </button>
                <button
                  onClick={() => setIsRejectModalOpen(true)}
                  className="bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 font-bold text-xs py-2 rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  <XCircle className="size-3.5 text-rose-600" />
                  <span>Reject Claim</span>
                </button>
              </div>
            </div>
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
    </div>
  );
}
