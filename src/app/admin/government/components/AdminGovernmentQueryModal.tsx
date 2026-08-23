"use client";

import React, { useState } from "react";
import { X, AlertCircle, Send } from "lucide-react";
import { governmentApi } from "@/lib/api/government";
import { notify } from "@/lib/notify";

interface AdminGovernmentQueryModalProps {
  isOpen: boolean;
  governmentApplicationId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminGovernmentQueryModal: React.FC<AdminGovernmentQueryModalProps> = ({
  isOpen,
  governmentApplicationId,
  onClose,
  onSuccess,
}) => {
  const [queryType, setQueryType] = useState("MISSING_DOCUMENT");
  const [severity, setSeverity] = useState("MEDIUM");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [description, setDescription] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [responseDeadlineDays, setResponseDeadlineDays] = useState(5);
  const [createClientAction, setCreateClientAction] = useState(true);
  const [clientActionType, setClientActionType] = useState("PROVIDE_INFORMATION");
  const [clientActionTitle, setClientActionTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    setSubmitting(true);
    try {
      const deadline = new Date(Date.now() + responseDeadlineDays * 86400000).toISOString();
      await governmentApi.recordQuery(governmentApplicationId, {
        queryType,
        severity,
        referenceNumber: referenceNumber || undefined,
        description,
        internalNotes,
        responseDeadline: deadline,
        createClientAction,
        clientActionType,
        clientActionTitle: clientActionTitle || `Government Query: ${description.substring(0, 50)}`,
        clientActionDescription: description,
      });

      notify.success("Government query & client action logged successfully!");
      onSuccess();
      onClose();
    } catch (err: any) {
      notify.error(err.message || "Failed to record query");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-xl overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-800 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200/80 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Record Official Registry Query</h3>
              <p className="text-xs text-slate-500 font-medium">Log Deficiency &amp; Trigger Automatic Client Action Required</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Query Type</label>
              <select
                value={queryType}
                onChange={(e) => setQueryType(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 font-semibold focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 focus:outline-none"
              >
                <option value="MISSING_DOCUMENT">Missing Document</option>
                <option value="INCORRECT_INFORMATION">Incorrect Information / Typo</option>
                <option value="PAYMENT_ISSUE">Statutory Payment Deficiency</option>
                <option value="IDENTITY_VERIFICATION">Identity Verification Issue</option>
                <option value="ADDITIONAL_INFORMATION">Additional Statutory Info Needed</option>
                <option value="CORRECTION_REQUIRED">Correction / Resubmission Needed</option>
                <option value="TECHNICAL_PORTAL_ISSUE">Registry Technical Portal Issue</option>
                <option value="OTHER">Other Registry Rejection/Query</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Severity Level</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 font-semibold focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 focus:outline-none"
              >
                <option value="LOW">Low (Minor info)</option>
                <option value="MEDIUM">Medium (Standard query)</option>
                <option value="HIGH">High (Urgent replacement)</option>
                <option value="CRITICAL">Critical (Risk of rejection)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Official Registry Reference # / Notice ID</label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g. BRS-DEF-88124, KRA-NOTICE-001"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 font-mono font-bold focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Query Description &amp; Registry Instructions *</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail exact statutory query instructions issued by government officer..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 font-medium focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Response Deadline (Days)</label>
              <input
                type="number"
                min={1}
                max={60}
                value={responseDeadlineDays}
                onChange={(e) => setResponseDeadlineDays(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 font-semibold focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Client Action Required Type</label>
              <select
                value={clientActionType}
                onChange={(e) => setClientActionType(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 font-semibold focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 focus:outline-none"
              >
                <option value="UPLOAD_DOCUMENT">Upload New Document</option>
                <option value="REPLACE_DOCUMENT">Replace Existing Document</option>
                <option value="PROVIDE_INFORMATION">Provide Written Information</option>
                <option value="CONFIRM_INFORMATION">Confirm Information</option>
                <option value="MAKE_PAYMENT">Make Statutory Payment</option>
                <option value="SIGN_DECLARATION">Sign Declaration</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
            <input
              type="checkbox"
              id="createClientAction"
              checked={createClientAction}
              onChange={(e) => setCreateClientAction(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 bg-white text-rose-600 focus:ring-rose-500"
            />
            <label htmlFor="createClientAction" className="text-xs text-rose-900 font-bold cursor-pointer">
              Auto-create Client Portal Action Directive &amp; Notify Client
            </label>
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
              className="flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 px-5 py-2 text-xs font-bold text-white transition-colors shadow-xs disabled:opacity-50"
            >
              <Send className="h-4 w-4" /> {submitting ? "Logging Query..." : "Log Official Query"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
