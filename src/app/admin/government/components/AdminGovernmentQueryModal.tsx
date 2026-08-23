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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-xl overflow-hidden rounded-xl border border-rose-500/20 bg-slate-900 text-slate-100 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Record Official Registry Query</h3>
              <p className="text-xs text-slate-400">Log Deficiency & Trigger Automatic Client Action Required</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Query Type</label>
              <select
                value={queryType}
                onChange={(e) => setQueryType(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-rose-500 focus:outline-none"
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
              <label className="block text-xs font-semibold text-slate-300 mb-1">Severity Level</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-rose-500 focus:outline-none"
              >
                <option value="LOW font-semibold">Low (Minor info)</option>
                <option value="MEDIUM">Medium (Standard query)</option>
                <option value="HIGH">High (Urgent replacement)</option>
                <option value="CRITICAL">Critical (Risk of rejection)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Official Registry Reference # / Notice ID</label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g. BRS-DEF-88124, KRA-NOTICE-001"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white font-mono focus:border-rose-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Query Description & Registry Instructions *</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail exact statutory query instructions issued by government officer..."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-rose-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Response Deadline (Days)</label>
              <input
                type="number"
                min={1}
                max={60}
                value={responseDeadlineDays}
                onChange={(e) => setResponseDeadlineDays(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-rose-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Client Action Required Type</label>
              <select
                value={clientActionType}
                onChange={(e) => setClientActionType(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-rose-500 focus:outline-none"
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

          <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
            <input
              type="checkbox"
              id="createClientAction"
              checked={createClientAction}
              onChange={(e) => setCreateClientAction(e.target.checked)}
              className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-rose-500"
            />
            <label htmlFor="createClientAction" className="text-xs text-rose-300 font-semibold cursor-pointer">
              Auto-create Client Portal Action Directive & Notify Client
            </label>
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
              className="flex items-center gap-2 rounded-lg bg-rose-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-rose-400 disabled:opacity-50"
            >
              <Send className="h-4 w-4" /> {submitting ? "Logging Query..." : "Log Official Query"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
