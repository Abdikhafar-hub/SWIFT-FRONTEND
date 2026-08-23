"use client";

import React, { useState } from "react";
import { X, RefreshCw, Send } from "lucide-react";
import { governmentApi } from "@/lib/api/government";
import { notify } from "@/lib/notify";

interface AdminGovernmentExternalUpdateModalProps {
  isOpen: boolean;
  governmentApplicationId: string;
  currentStatus: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminGovernmentExternalUpdateModal: React.FC<AdminGovernmentExternalUpdateModalProps> = ({
  isOpen,
  governmentApplicationId,
  currentStatus,
  onClose,
  onSuccess,
}) => {
  const [status, setStatus] = useState(currentStatus || "UNDER_PROCESSING");
  const [source, setSource] = useState("PORTAL");
  const [summary, setSummary] = useState("");
  const [fullNotes, setFullNotes] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [governmentOfficer, setGovernmentOfficer] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim()) {
      notify.error("Please enter a summary of the external update");
      return;
    }

    setSubmitting(true);
    try {
      await governmentApi.recordExternalUpdate(governmentApplicationId, {
        status,
        source,
        summary,
        fullNotes,
        referenceNumber: referenceNumber || undefined,
        governmentOfficer: governmentOfficer || undefined,
        evidenceUrl: evidenceUrl || undefined,
      });

      notify.success("External registry update recorded & dossier status updated!");
      onSuccess();
      onClose();
    } catch (err: any) {
      notify.error(err.message || "Failed to record external update");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-800 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200/80 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200/80">
              <RefreshCw className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Record External Registry Update</h3>
              <p className="text-xs text-slate-500 font-medium">Portal Callback / Official Letter / Desk Update Entry</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Update Source Channel</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 font-semibold focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
              >
                <option value="PORTAL">Online Registry Portal Check</option>
                <option value="EMAIL">Official Registry Email Notification</option>
                <option value="OFFICIAL_LETTER">Formal Physical Letter / Notice</option>
                <option value="PHONE_CALL">Direct Phone Call from Officer</option>
                <option value="PHYSICAL_VISIT">Counter Inspection Update</option>
                <option value="SMS">Automated Registry SMS</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">New Government Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 font-semibold focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
              >
                <option value="SUBMITTED">SUBMITTED</option>
                <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
                <option value="UNDER_PROCESSING">UNDER_PROCESSING</option>
                <option value="QUERY_RAISED">QUERY_RAISED</option>
                <option value="CORRECTION_REQUIRED">CORRECTION_REQUIRED</option>
                <option value="PAYMENT_REQUIRED">PAYMENT_REQUIRED</option>
                <option value="APPOINTMENT_REQUIRED">APPOINTMENT_REQUIRED</option>
                <option value="APPROVED">APPROVED</option>
                <option value="CERTIFICATE_READY">CERTIFICATE_READY</option>
                <option value="READY_FOR_COLLECTION">READY_FOR_COLLECTION</option>
                <option value="COLLECTED">COLLECTED</option>
                <option value="REJECTED">REJECTED</option>
                <option value="ON_HOLD">ON_HOLD</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Update Headline Summary *</label>
            <input
              type="text"
              required
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="e.g. Application passed primary verification, moved to final registrar approval desk."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 font-medium focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Official Reference # / Notice ID</label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g. REF-2026-98124"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 font-mono font-bold focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Government Officer Name / Title</label>
              <input
                type="text"
                value={governmentOfficer}
                onChange={(e) => setGovernmentOfficer(e.target.value)}
                placeholder="e.g. Senior Assistant Registrar"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 font-medium focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Update Transcript / Official Text</label>
            <textarea
              rows={3}
              value={fullNotes}
              onChange={(e) => setFullNotes(e.target.value)}
              placeholder="Paste official portal message text or desk conversation summary..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 font-medium focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Evidence Document URL / Proof Attachment</label>
            <input
              type="url"
              value={evidenceUrl}
              onChange={(e) => setEvidenceUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 font-medium focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#C5A059] to-[#D4AF37] hover:from-[#b49049] hover:to-[#c39e26] px-5 py-2 text-xs font-bold text-white transition-all shadow-xs disabled:opacity-50"
            >
              <Send className="h-4 w-4" /> {submitting ? "Recording..." : "Record External Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
