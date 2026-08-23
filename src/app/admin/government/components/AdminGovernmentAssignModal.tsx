"use client";

import React, { useState } from "react";
import { X, UserCheck, Shield } from "lucide-react";
import { governmentApi } from "@/lib/api/government";
import { notify } from "@/lib/notify";

interface AdminGovernmentAssignModalProps {
  isOpen: boolean;
  governmentApplicationId: string;
  currentPrimaryOfficerId?: string | null;
  currentTeam?: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminGovernmentAssignModal: React.FC<AdminGovernmentAssignModalProps> = ({
  isOpen,
  governmentApplicationId,
  currentPrimaryOfficerId,
  currentTeam,
  onClose,
  onSuccess,
}) => {
  const [team, setTeam] = useState(currentTeam || "Kenyan Statutory Registry Team");
  const [primaryOfficerId, setPrimaryOfficerId] = useState(currentPrimaryOfficerId || "");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await governmentApi.assignCase(governmentApplicationId, {
        primaryOfficerId: primaryOfficerId || null,
        team: team || null,
      });

      notify.success("Government case officer & operational team assigned!");
      onSuccess();
      onClose();
    } catch (err: any) {
      notify.error(err.message || "Failed to assign case officer");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-800 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200/80 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200/80">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Assign Government Desk Officers</h3>
              <p className="text-xs text-slate-500 font-medium">Set Operational Ownership &amp; Registry Follow-up Team</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Operational Unit / Team</label>
            <input
              type="text"
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              placeholder="e.g. BRS Statutory Operations"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 font-medium focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Primary Desk Officer ID</label>
            <input
              type="text"
              value={primaryOfficerId}
              onChange={(e) => setPrimaryOfficerId(e.target.value)}
              placeholder="Enter Admin User ID or Leave Empty"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 font-mono font-bold focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
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
              <UserCheck className="h-4 w-4" /> {submitting ? "Assigning..." : "Save Assignment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
