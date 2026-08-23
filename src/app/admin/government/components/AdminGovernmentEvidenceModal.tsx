"use client";

import React, { useState } from "react";
import { X, FileText, Upload } from "lucide-react";
import { governmentApi } from "@/lib/api/government";
import { notify } from "@/lib/notify";

interface AdminGovernmentEvidenceModalProps {
  isOpen: boolean;
  governmentApplicationId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminGovernmentEvidenceModal: React.FC<AdminGovernmentEvidenceModalProps> = ({
  isOpen,
  governmentApplicationId,
  onClose,
  onSuccess,
}) => {
  const [documentName, setDocumentName] = useState("");
  const [documentType, setDocumentType] = useState("ACKNOWLEDGEMENT");
  const [fileUrl, setFileUrl] = useState("");
  const [visibility, setVisibility] = useState("CLIENT_VISIBLE");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentName.trim() || !fileUrl.trim()) {
      notify.error("Document name and File URL are required");
      return;
    }

    setSubmitting(true);
    try {
      await governmentApi.uploadEvidence(governmentApplicationId, {
        documentName,
        documentType,
        fileUrl,
        visibility,
      });

      notify.success("Evidence document uploaded to government dossier!");
      onSuccess();
      onClose();
    } catch (err: any) {
      notify.error(err.message || "Failed to upload evidence");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Upload Dossier Evidence / Proof</h3>
              <p className="text-xs text-slate-400">Attach Official Government Documents, Receipts, or Certificates</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Document Title *</label>
            <input
              type="text"
              required
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              placeholder="e.g. Official Certificate of Incorporation - C.198204"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Document Category</label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="ACKNOWLEDGEMENT">Submission Acknowledgement</option>
                <option value="PAYMENT_RECEIPT">Statutory Payment Receipt</option>
                <option value="APPROVAL_LETTER">Official Approval Certificate / Permit</option>
                <option value="QUERY_NOTICE">Official Rejection / Query Notice</option>
                <option value="STATUS_PROOF">Registry Counter Inspection Proof</option>
                <option value="EXTERNAL_UPDATE">Registry Correspondence / Email</option>
                <option value="OTHER">Other Dossier Document</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Visibility Permission</label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="CLIENT_VISIBLE">Client Visible (Show on Client Portal)</option>
                <option value="INTERNAL_ONLY">Internal Only (Admin Operations Vault)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Secure Document URL *</label>
            <input
              type="url"
              required
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="https://storage.swiftdoc.co.ke/docs/..."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white font-mono focus:border-amber-500 focus:outline-none"
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
              className="flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50"
            >
              <Upload className="h-4 w-4" /> {submitting ? "Uploading..." : "Attach Document"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
