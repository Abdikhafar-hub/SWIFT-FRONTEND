"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  Building2,
  Smartphone,
  Play,
  User,
  History,
  FileCheck2,
} from "lucide-react";
import { adminApi } from "@/lib/api/admin";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { Refund, RefundStatus } from "@/types";
import {
  AdminApproveRefundModal,
  AdminProcessRefundModal,
  AdminCompleteRefundModal,
  AdminRejectRefundModal,
  AdminCancelRefundModal,
} from "@/components/domain/admin/admin-refund-modals";

export default function AdminRefundDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const queryClient = useQueryClient();

  // Modals state
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isProcessOpen, setIsProcessOpen] = useState(false);
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);

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
      <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-6 space-y-4 max-w-[1550px] mx-auto">
        <div className="h-28 w-full bg-slate-200 animate-pulse rounded-xl" />
        <div className="h-96 w-full bg-slate-200 animate-pulse rounded-xl" />
      </div>
    );
  }

  if (error || !refund) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-6 space-y-4 max-w-[1550px] mx-auto">
        <div className="bg-white rounded-xl p-12 text-center border border-slate-200/80 space-y-3">
          <AlertTriangle className="size-10 text-rose-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">Refund Claim Dossier Not Found</h3>
          <p className="text-xs text-slate-500">
            Could not locate the requested statutory refund claim record.
          </p>
          <Link href="/admin/refunds" className="inline-block">
            <button className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800">
              Return to Refunds List
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: RefundStatus) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="size-3.5 text-emerald-600" />
            COMPLETED
          </span>
        );
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
            <CheckCircle2 className="size-3.5 text-amber-600" />
            APPROVED
          </span>
        );
      case "PROCESSING":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
            <Clock className="size-3.5 text-blue-600 animate-spin" />
            PROCESSING
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-md bg-rose-50 text-rose-800 border border-rose-200">
            <XCircle className="size-3.5 text-rose-600" />
            REJECTED
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
            CANCELLED
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-md bg-rose-100 text-rose-900 border border-rose-300">
            FAILED
          </span>
        );
      case "PENDING_APPROVAL":
      case "REQUESTED":
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-700 border border-amber-500/20">
            <Clock className="size-3.5 text-amber-600" />
            PENDING APPROVAL
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-4 sm:p-5 lg:p-6 space-y-4 max-w-[1550px] mx-auto font-sans">
      {/* ------------------------------------------------------------------ */}
      {/* 1. DOSSIER HEADER */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
              REFUND DOSSIER • #{refund.refundNumber || refund.id.slice(0, 8)}
            </span>
            {getStatusBadge(refund.status)}
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2 mt-1">
            Refund Voucher {refund.refundNumber || refund.id.slice(0, 8)}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Client: {refund.client?.fullName} ({refund.client?.email}) • Invoice: #{refund.payment?.invoiceNumber || refund.paymentId.slice(0, 8)}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <Link href="/admin/refunds">
            <button className="bg-white border border-slate-200 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-xl hover:bg-slate-50 transition-all shadow-xs flex items-center gap-1.5">
              <ArrowLeft className="size-3.5 text-slate-500" />
              <span>Back to Refunds</span>
            </button>
          </Link>

          {(refund.status === "PENDING_APPROVAL" || refund.status === "REQUESTED") && (
            <>
              <button
                onClick={() => setIsRejectOpen(true)}
                className="bg-white border border-rose-200 text-rose-700 font-bold text-xs px-3.5 py-2 rounded-xl hover:bg-rose-50 transition-all shadow-xs flex items-center gap-1.5"
              >
                <XCircle className="size-3.5 text-rose-600" />
                <span>Reject Claim</span>
              </button>
              <button
                onClick={() => setIsApproveOpen(true)}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
              >
                <CheckCircle2 className="size-3.5" />
                <span>Approve Refund</span>
              </button>
            </>
          )}

          {refund.status === "APPROVED" && (
            <button
              onClick={() => setIsProcessOpen(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            >
              <Play className="size-3.5" />
              <span>Start Processing</span>
            </button>
          )}

          {(refund.status === "PROCESSING" || refund.status === "APPROVED") && (
            <button
              onClick={() => setIsCompleteOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            >
              <CheckCircle2 className="size-3.5" />
              <span>Finalize Disbursement</span>
            </button>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. MAIN DOSSIER GRID */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left 2 Cols: Claim Specifications, Financial Summary & Audit Timeline */}
        <div className="space-y-4 lg:col-span-2">
          {/* Claim Specification Card */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Operational Refund Rationale
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  {refund.reasonCategory || refund.reason}
                </h3>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Disbursement Amount</span>
                <span className="text-xl font-extrabold font-mono text-emerald-600">
                  {formatCurrency(refund.amount, refund.currency || "KES")}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-2.5">
                <span className="text-slate-400 block text-[10px] font-extrabold uppercase tracking-wider">
                  Disbursement Method
                </span>
                <strong className="text-slate-900 font-semibold mt-0.5 block">
                  {refund.refundMethod || "MPESA"}
                </strong>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-2.5">
                <span className="text-slate-400 block text-[10px] font-extrabold uppercase tracking-wider">
                  Date Initiated
                </span>
                <span className="text-slate-800 font-medium mt-0.5 block">{formatDate(refund.createdAt)}</span>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-2.5">
                <span className="text-slate-400 block text-[10px] font-extrabold uppercase tracking-wider">
                  Approved Date
                </span>
                <span className="text-slate-800 font-medium mt-0.5 block">
                  {refund.approvedAt ? formatDate(refund.approvedAt) : "Pending"}
                </span>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-2.5">
                <span className="text-slate-400 block text-[10px] font-extrabold uppercase tracking-wider">
                  Completed Date
                </span>
                <span className="text-slate-800 font-medium mt-0.5 block">
                  {refund.completedAt ? formatDate(refund.completedAt) : "Pending"}
                </span>
              </div>
            </div>

            {/* Recipient Details Block */}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5 space-y-2 text-xs">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                <User className="size-3.5 text-amber-600" />
                <span>Recipient Disbursement Details</span>
              </h4>

              {refund.refundMethod === "MPESA" || !refund.refundMethod ? (
                <div className="flex items-center justify-between text-slate-700">
                  <span>M-Pesa Phone Number:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {refund.recipientPhone || refund.client?.phone || "N/A"}
                  </span>
                </div>
              ) : refund.refundMethod === "BANK" ? (
                <div className="grid grid-cols-3 gap-2 text-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Bank Name</span>
                    <span className="font-semibold">{refund.bankName || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Account Holder</span>
                    <span className="font-semibold">{refund.accountHolder || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Account Number</span>
                    <span className="font-mono font-bold">{refund.accountNumber || "N/A"}</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between text-slate-700">
                  <span>Method Reference Details:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {refund.referenceDetails || "N/A"}
                  </span>
                </div>
              )}
            </div>

            {/* Reason & Internal Notes */}
            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">
                Full Reason Description
              </h4>
              <p className="text-slate-700 leading-relaxed font-medium bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                {refund.reason}
              </p>
            </div>

            {refund.internalNotes && (
              <div className="space-y-1 text-xs">
                <h4 className="font-bold text-amber-700 uppercase tracking-wider text-[10px]">
                  Internal Auditor Notes
                </h4>
                <p className="text-slate-700 leading-relaxed font-medium bg-amber-50/50 p-3 rounded-lg border border-amber-200/60">
                  {refund.internalNotes}
                </p>
              </div>
            )}

            {refund.rejectionReason && (
              <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 space-y-1 text-xs text-rose-800">
                <h4 className="font-bold uppercase tracking-wider text-[10px]">Statutory Rejection Reason</h4>
                <p className="font-medium">{refund.rejectionReason}</p>
              </div>
            )}
          </div>

          {/* Audit Logs Timeline */}
          {refund.auditLogs && refund.auditLogs.length > 0 && (
            <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <History className="size-4 text-amber-600" />
                <span>Immutable Financial Audit Log ({refund.auditLogs.length})</span>
              </h3>

              <div className="space-y-3 pt-2">
                {refund.auditLogs.map((log: any) => (
                  <div key={log.id} className="flex items-start space-x-3 text-xs border-l-2 border-amber-500 pl-3 py-1">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{log.action}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {formatDate(log.createdAt)}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-0.5">{log.details || log.description}</p>
                      {log.actor && (
                        <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                          Actor: {log.actor.fullName} ({log.actor.email})
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Host Invoice Breakdown & Financial Ledger Verification */}
        <div className="space-y-4">
          {/* Financial Reconciliation Summary Card */}
          {refund.financialSummary && (
            <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-3 text-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <FileCheck2 className="size-4 text-emerald-600" />
                <span>Financial Ledger Balance Verification</span>
              </h4>

              <div className="space-y-2 border-t border-slate-100 pt-2.5">
                <div className="flex justify-between text-slate-600">
                  <span>Host Invoice Total:</span>
                  <span className="font-mono font-semibold">
                    {formatCurrency(refund.financialSummary.invoiceTotal)}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Total Amount Paid:</span>
                  <span className="font-mono font-semibold text-emerald-600">
                    {formatCurrency(refund.financialSummary.amountPaid)}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Previous Active Refunds:</span>
                  <span className="font-mono font-semibold text-amber-600">
                    {formatCurrency(refund.financialSummary.previousRefundsTotal)}
                  </span>
                </div>

                <div className="flex justify-between text-slate-900 font-bold border-t border-slate-200 pt-2">
                  <span>This Refund Claim:</span>
                  <span className="font-mono text-emerald-700">
                    {formatCurrency(refund.financialSummary.currentRefundAmount)}
                  </span>
                </div>

                <div className="flex justify-between text-slate-700 font-semibold bg-slate-50 p-2 rounded-lg border border-slate-200 mt-1">
                  <span>Remaining Refundable Balance:</span>
                  <span className="font-mono text-emerald-600">
                    {formatCurrency(refund.financialSummary.remainingRefundableBalance)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Linked Statutory Invoice & Payment */}
          {refund.paymentId && (
            <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Linked Statutory Payment
                </h4>
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
                  <span className="text-slate-500 font-medium">Invoice Number</span>
                  <Link
                    href={`/admin/invoices/${refund.paymentId}`}
                    className="font-mono font-bold text-amber-700 hover:underline"
                  >
                    {refund.payment?.invoiceNumber || `#${refund.paymentId.slice(0, 8)}`}
                  </Link>
                </div>
                {refund.transactionId && (
                  <div className="flex justify-between border-b border-slate-200/60 pb-2">
                    <span className="text-slate-500 font-medium">Transaction ID</span>
                    <span className="font-mono text-slate-700">
                      {refund.transaction?.transactionNumber || `#${refund.transactionId.slice(0, 8)}`}
                    </span>
                  </div>
                )}
                {refund.externalReference && (
                  <div className="flex justify-between border-b border-slate-200/60 pb-2">
                    <span className="text-slate-500 font-medium">External Wire / Provider Ref</span>
                    <span className="font-mono font-bold text-slate-900">{refund.externalReference}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Officer Signatures Card */}
          <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-3 text-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Officer Signatures</h4>
            <div className="space-y-2 text-slate-700">
              <div className="flex items-center justify-between">
                <span>Requested By:</span>
                <span className="font-semibold">{refund.requestedBy?.fullName || "Admin Officer"}</span>
              </div>
              {refund.approvedBy && (
                <div className="flex items-center justify-between">
                  <span>Approved By:</span>
                  <span className="font-semibold text-emerald-700">{refund.approvedBy.fullName}</span>
                </div>
              )}
              {refund.completedBy && (
                <div className="flex items-center justify-between">
                  <span>Completed By:</span>
                  <span className="font-semibold text-emerald-700">{refund.completedBy.fullName}</span>
                </div>
              )}
              {refund.rejectedBy && (
                <div className="flex items-center justify-between">
                  <span>Rejected By:</span>
                  <span className="font-semibold text-rose-700">{refund.rejectedBy.fullName}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* APPROVE MODAL */}
      <AdminApproveRefundModal
        refundId={refund.id}
        refundNumber={refund.refundNumber}
        amount={refund.amount}
        isOpen={isApproveOpen}
        onClose={() => setIsApproveOpen(false)}
        onSuccess={() => {
          refetch();
          queryClient.invalidateQueries({ queryKey: ["admin-refunds-list"] });
        }}
      />

      {/* PROCESS MODAL */}
      <AdminProcessRefundModal
        refundId={refund.id}
        refundNumber={refund.refundNumber}
        amount={refund.amount}
        isOpen={isProcessOpen}
        onClose={() => setIsProcessOpen(false)}
        onSuccess={() => {
          refetch();
          queryClient.invalidateQueries({ queryKey: ["admin-refunds-list"] });
        }}
      />

      {/* COMPLETE MODAL */}
      {isCompleteOpen && (
        <AdminCompleteRefundModal
          refundId={refund.id}
          refundNumber={refund.refundNumber}
          amount={refund.amount}
          isOpen={isCompleteOpen}
          onClose={() => setIsCompleteOpen(false)}
          onSuccess={() => {
            refetch();
            queryClient.invalidateQueries({ queryKey: ["admin-refunds-list"] });
            queryClient.invalidateQueries({ queryKey: ["admin-invoices-list"] });
          }}
        />
      )}

      {/* REJECT MODAL */}
      <AdminRejectRefundModal
        refundId={refund.id}
        refundNumber={refund.refundNumber}
        isOpen={isRejectOpen}
        onClose={() => setIsRejectOpen(false)}
        onSuccess={() => {
          refetch();
          queryClient.invalidateQueries({ queryKey: ["admin-refunds-list"] });
        }}
      />

      {/* CANCEL MODAL */}
      <AdminCancelRefundModal
        refundId={refund.id}
        refundNumber={refund.refundNumber}
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        onSuccess={() => {
          refetch();
          queryClient.invalidateQueries({ queryKey: ["admin-refunds-list"] });
        }}
      />
    </div>
  );
}
