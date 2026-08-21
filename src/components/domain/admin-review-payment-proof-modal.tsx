"use client";

import React, { useState } from "react";
import {
  FileCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Download,
  Loader2,
  User,
  Receipt,
  FileText,
  Calendar,
  DollarSign,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { adminApi } from "@/lib/api/admin";
import { formatCurrency, formatDate } from "@/lib/utils/format";

interface AdminReviewPaymentProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  proofId: string;
  onSuccess: () => void;
}

export function AdminReviewPaymentProofModal({
  isOpen,
  onClose,
  proofId,
  onSuccess,
}: AdminReviewPaymentProofModalProps) {
  const [proofData, setProofData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen && proofId) {
      setIsLoading(true);
      setError(null);
      adminApi
        .getPaymentProofById(proofId)
        .then((data) => {
          setProofData(data);
          setIsLoading(false);
        })
        .catch((err) => {
          setError(err.message || "Failed to load payment proof details.");
          setIsLoading(false);
        });
    }
  }, [isOpen, proofId]);

  const handleApprove = async () => {
    setActionError(null);
    setIsApproving(true);
    try {
      await adminApi.approvePaymentProof(proofId);
      setIsApproving(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      setIsApproving(false);
      setActionError(err.message || "Failed to approve payment proof.");
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);

    if (!rejectionReason || rejectionReason.trim().length === 0) {
      setActionError("Rejection reason is mandatory.");
      return;
    }

    setIsRejecting(true);
    try {
      await adminApi.rejectPaymentProof(proofId, rejectionReason.trim());
      setIsRejecting(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      setIsRejecting(false);
      setActionError(err.message || "Failed to reject payment proof.");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Review Manual Payment Proof"
      description="Inspect client deposit receipt, claimed amount, and execute atomic verification"
      size="lg"
    >
      {isLoading ? (
        <div className="py-12 text-center space-y-3 font-sans">
          <Loader2 className="size-8 animate-spin text-amber-600 mx-auto" />
          <p className="text-xs text-slate-500 font-bold">Loading payment proof dossier...</p>
        </div>
      ) : error || !proofData ? (
        <div className="py-6 text-center space-y-3 font-sans">
          <AlertTriangle className="size-8 text-rose-600 mx-auto" />
          <p className="text-xs text-rose-900 font-bold">{error || "Record not found"}</p>
        </div>
      ) : (
        <div className="space-y-4 pt-2 font-sans text-slate-800">
          {actionError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900 font-bold flex items-center gap-2">
              <AlertTriangle className="size-4 shrink-0 text-rose-600" />
              <span>{actionError}</span>
            </div>
          )}

          {/* 1. Client & Invoice Dossier Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3 space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Client Information
              </span>
              <strong className="block text-slate-900 font-bold text-sm">
                {proofData.client?.fullName || "Client User"}
              </strong>
              <p className="text-[11px] text-slate-500">{proofData.client?.email}</p>
              <p className="text-[11px] text-slate-500 font-mono">{proofData.client?.phone}</p>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3 space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Target Invoice
              </span>
              <strong className="block text-slate-900 font-mono font-bold text-sm">
                #{proofData.payment?.invoiceNumber || "INV"}
              </strong>
              <div className="flex justify-between text-[11px] text-slate-600">
                <span>Invoice Total:</span>
                <span className="font-mono font-bold">{formatCurrency(proofData.payment?.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-600">
                <span>Current Balance Due:</span>
                <span className="font-mono font-bold text-amber-600">{formatCurrency(proofData.payment?.amountDue)}</span>
              </div>
            </div>
          </div>

          {/* 2. Verification Metadata */}
          <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900">
                Claimed Payment Details
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                {proofData.status}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
              <div>
                <span className="text-[9px] text-slate-400 block font-sans font-bold">Claimed Amount</span>
                <strong className="text-slate-900 font-bold text-sm">{formatCurrency(proofData.claimedAmount)}</strong>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block font-sans font-bold">Ref / Code</span>
                <strong className="text-slate-900 uppercase font-bold text-xs">{proofData.referenceNumber || "N/A"}</strong>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block font-sans font-bold">Payment Method</span>
                <strong className="text-slate-900 uppercase font-bold text-xs">{proofData.paymentMethod}</strong>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block font-sans font-bold">Payment Date</span>
                <span className="text-slate-800 font-sans font-semibold text-xs">{formatDate(proofData.paymentDate)}</span>
              </div>
            </div>

            {proofData.notes && (
              <p className="text-[11px] text-slate-600 pt-1 border-t border-amber-200/60 italic">
                Notes: &quot;{proofData.notes}&quot;
              </p>
            )}
          </div>

          {/* 3. Document File Viewer */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              Attached Payment Proof File
            </label>
            <div className="rounded-xl border border-slate-200 bg-slate-900 p-3 text-white flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 overflow-hidden">
                <FileText className="size-5 text-amber-400 shrink-0" />
                <div className="truncate">
                  <strong className="block font-bold truncate">{proofData.proofFileName}</strong>
                  <span className="text-[10px] text-slate-400">{proofData.proofMimeType}</span>
                </div>
              </div>

              {proofData.proofFileUrl && (
                <a
                  href={proofData.proofFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 shrink-0"
                >
                  <ExternalLink className="size-3.5" />
                  <span>Inspect Document File</span>
                </a>
              )}
            </div>
          </div>

          {/* Rejection Reason Form */}
          {showRejectForm && (
            <form onSubmit={handleReject} className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-rose-700">
                Mandatory Rejection Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                placeholder="Explain why this payment proof was rejected (e.g. Invalid bank reference, amount mismatch)..."
                className="w-full px-3 py-2 text-xs bg-white border border-rose-200 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-medium text-slate-800"
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRejectForm(false)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel Rejection
                </button>
                <button
                  type="submit"
                  disabled={isRejecting}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg flex items-center gap-1 disabled:opacity-50"
                >
                  {isRejecting ? <Loader2 className="size-3.5 animate-spin" /> : <XCircle className="size-3.5" />}
                  <span>Confirm Rejection</span>
                </button>
              </div>
            </form>
          )}

          {/* Main Action Buttons */}
          {!showRejectForm && proofData.status === "PENDING_REVIEW" && (
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowRejectForm(true)}
                disabled={isApproving}
                className="px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-xl transition-all flex items-center gap-1.5"
              >
                <XCircle className="size-3.5" />
                <span>Reject Proof</span>
              </button>

              <button
                type="button"
                onClick={handleApprove}
                disabled={isApproving}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                {isApproving ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Processing Approval &amp; Receipt...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-3.5 text-emerald-200" />
                    <span>Approve &amp; Issue Receipt</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
