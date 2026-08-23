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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Assign Government Desk Officers</h3>
              <p className="text-xs text-slate-400">Set Operational Ownership & Registry Follow-up Team</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Operational Unit / Team</label>
            <input
              type="text"
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              placeholder="e.g. BRS Statutory Operations"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Primary Desk Officer ID</label>
            <input
              type="text"
              value={primaryOfficerId}
              onChange={(e) => setPrimaryOfficerId(e.target.value)}
              placeholder="Enter Admin User ID or Leave Empty"
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
              <UserCheck className="h-4 w-4" /> {submitting ? "Assigning..." : "Save Assignment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
