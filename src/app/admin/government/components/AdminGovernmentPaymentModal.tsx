"use client";

import React, { useState } from "react";
import { X, DollarSign, Check } from "lucide-react";
import { governmentApi } from "@/lib/api/government";
import { notify } from "@/lib/notify";

interface AdminGovernmentPaymentModalProps {
  isOpen: boolean;
  governmentApplicationId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminGovernmentPaymentModal: React.FC<AdminGovernmentPaymentModalProps> = ({
  isOpen,
  governmentApplicationId,
  onClose,
  onSuccess,
}) => {
  const [amount, setAmount] = useState<number | "">(0);
  const [currency, setCurrency] = useState("KES");
  const [paymentMethod, setPaymentMethod] = useState("MPESA");
  const [paymentReference, setPaymentReference] = useState("");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [receiptDocumentUrl, setReceiptDocumentUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      notify.error("Payment amount must be greater than 0");
      return;
    }

    setSubmitting(true);
    try {
      await governmentApi.recordPayment(governmentApplicationId, {
        amount: Number(amount),
        currency,
        paymentMethod,
        paymentReference: paymentReference || undefined,
        receiptNumber: receiptNumber || undefined,
        receiptDocumentUrl: receiptDocumentUrl || undefined,
        status: "PAID",
        notes,
      });

      notify.success("Statutory payment recorded successfully!");
      onSuccess();
      onClose();
    } catch (err: any) {
      notify.error(err.message || "Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-emerald-500/20 bg-slate-900 text-slate-100 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Record Statutory Fee Payment</h3>
              <p className="text-xs text-slate-400">Government Agency Official Payment Receipt</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Amount *</label>
              <input
                type="number"
                required
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="KES">KES (Kenyan Shilling)</option>
                <option value="USD">USD (US Dollar)</option>
                <option value="GBP">GBP (British Pound)</option>
                <option value="EUR">EUR (Euro)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="MPESA">M-Pesa / eCitizen Pay</option>
                <option value="BANK">Bank Transfer / KCB / Equity</option>
                <option value="CARD">Credit / Debit Card</option>
                <option value="CASH">Cash Counter Lodgement</option>
                <option value="OTHER">Other Official Channel</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Reference / Transaction ID</label>
              <input
                type="text"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="e.g. QKH781290, MPESA Ref"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Statutory Receipt Number</label>
            <input
              type="text"
              value={receiptNumber}
              onChange={(e) => setReceiptNumber(e.target.value)}
              placeholder="e.g. BRS-REC-2026-0912"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Receipt Document URL / Attachment</label>
            <input
              type="url"
              value={receiptDocumentUrl}
              onChange={(e) => setReceiptDocumentUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes regarding statutory fee structure or ledger reconciliation..."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
            >
              <Check className="h-4 w-4" /> {submitting ? "Recording..." : "Record Statutory Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
