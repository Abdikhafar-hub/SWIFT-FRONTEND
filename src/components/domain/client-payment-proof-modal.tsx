"use client";

import React, { useState } from "react";
import {
  Upload,
  FileCheck,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  CreditCard,
  Building,
  FileText,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { paymentsApi } from "@/lib/api/payments";
import { formatCurrency } from "@/lib/utils/format";
import { parseApiError } from "@/lib/utils/error";
import { notify } from "@/lib/notify";
import type { Payment } from "@/types";

interface ClientPaymentProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Payment;
  onSuccess: () => void;
}

export function ClientPaymentProofModal({
  isOpen,
  onClose,
  invoice,
  onSuccess,
}: ClientPaymentProofModalProps) {
  const amountDue = Number(
    invoice.balanceRemaining ??
      invoice.amountDue ??
      (invoice.status === "PAID" ? 0 : invoice.amount)
  );

  const [paymentMethod, setPaymentMethod] = useState<string>("BANK");
  const [claimedAmount, setClaimedAmount] = useState<string>(String(amountDue || 0));
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [referenceNumber, setReferenceNumber] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const validTypes = ["image/jpeg", "image/png", "application/pdf"];
      if (!validTypes.includes(selectedFile.type.toLowerCase())) {
        setFileError("Invalid file type. Please upload a JPG, PNG, or PDF document.");
        setFile(null);
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        setFileError("File size exceeds 10MB limit.");
        setFile(null);
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!file) {
      setFileError("Please upload a payment proof receipt or bank deposit slip.");
      notify.warning("Please upload a payment proof receipt or bank deposit slip.");
      return;
    }

    if (!referenceNumber || referenceNumber.trim().length === 0) {
      setSubmitError("Transaction Reference Number or M-Pesa Code is required.");
      notify.warning("Transaction Reference Number or M-Pesa Code is required.");
      return;
    }

    const numericAmount = parseFloat(claimedAmount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setSubmitError("Please enter a valid claimed payment amount.");
      notify.warning("Please enter a valid claimed payment amount.");
      return;
    }

    setIsSubmitting(true);
    notify.loading("Submitting payment proof for verification...", { id: "payment-proof" });

    try {
      // Read file to Base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64String = (reader.result as string).split(",")[1];
        try {
          await paymentsApi.submitPaymentProof(invoice.id, {
            paymentMethod,
            claimedAmount: numericAmount,
            paymentDate,
            referenceNumber: referenceNumber.trim(),
            notes: notes.trim() || undefined,
            fileName: file.name,
            mimeType: file.type,
            base64Data: base64String,
          });

          setIsSubmitting(false);
          notify.success("Payment proof submitted successfully! Pending finance team verification.", { id: "payment-proof" });
          onSuccess();
          onClose();
        } catch (err: any) {
          setIsSubmitting(false);
          const parsed = parseApiError(err);
          setSubmitError(parsed.message);
          notify.error(err, { id: "payment-proof", title: "Submission Failed" });
        }
      };
      reader.onerror = () => {
        setIsSubmitting(false);
        setSubmitError("Error reading uploaded file.");
        notify.error("Error reading uploaded file.", { id: "payment-proof" });
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setIsSubmitting(false);
      const parsed = parseApiError(err);
      setSubmitError(parsed.message);
      notify.error(err, { id: "payment-proof", title: "Submission Failed" });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload Payment Proof"
      description={`Submit manual bank transfer receipt or M-Pesa proof for Invoice #${invoice.invoiceNumber || invoice.id.slice(0, 8)}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2 font-sans">
        {submitError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900 font-bold flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0 text-rose-600" />
            <span>{submitError}</span>
          </div>
        )}

        <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3 flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Outstanding Invoice Balance
            </span>
            <strong className="block text-slate-900 font-mono text-sm">
              {formatCurrency(amountDue)}
            </strong>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
            {invoice.status}
          </span>
        </div>

        {/* 1. Payment Channel */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Payment Method / Channel <span className="text-rose-500">*</span>
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-semibold text-slate-800"
          >
            <option value="BANK">Bank Wire Transfer / EFT</option>
            <option value="MPESA">M-Pesa Paybill / Till Transfer</option>
            <option value="CHEQUE">Bank Bankers Cheque</option>
            <option value="CASH">Cash Deposit at Bank Counter</option>
          </select>
        </div>

        {/* 2. Amount & Reference */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Paid Amount (KES) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={claimedAmount}
              onChange={(e) => setClaimedAmount(e.target.value)}
              placeholder="e.g. 15000"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono font-bold text-slate-900"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Transaction Ref / Code <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g. QGH7839201 or BANK-REF"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono font-bold text-slate-900 uppercase"
              required
            />
          </div>
        </div>

        {/* 3. Payment Date & File */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Payment Date <span className="text-rose-500">*</span>
          </label>
          <input
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-semibold text-slate-800"
            required
          />
        </div>

        {/* 4. Document File Upload */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Upload Proof Slip (PDF, JPG, PNG) <span className="text-rose-500">*</span>
          </label>

          <div className="relative border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-amber-500/50 bg-slate-50 transition-colors">
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            />
            {file ? (
              <div className="flex items-center justify-center gap-2 text-slate-800">
                <FileCheck className="size-5 text-emerald-600" />
                <span className="text-xs font-bold truncate max-w-[250px]">{file.name}</span>
                <span className="text-[10px] text-slate-400">({(file.size / 1024).toFixed(0)} KB)</span>
              </div>
            ) : (
              <div className="space-y-1">
                <Upload className="size-6 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-700">Click to select bank receipt or payment slip</p>
                <p className="text-[10px] text-slate-400">Supports PDF, PNG, JPG (Max 10MB)</p>
              </div>
            )}
          </div>
          {fileError && <p className="text-[10px] text-rose-600 font-bold mt-1">{fileError}</p>}
        </div>

        {/* 5. Additional Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Notes / Bank Account Details (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Additional information for finance verification..."
            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium text-slate-800"
          />
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-600 rounded-xl transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Submitting Proof...</span>
              </>
            ) : (
              <>
                <Upload className="size-3.5" />
                <span>Submit for Verification</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
