"use client";

import React, { useState } from "react";
import { X, Clock, Check } from "lucide-react";
import { governmentApi } from "@/lib/api/government";
import { notify } from "@/lib/notify";

interface AdminGovernmentFollowUpModalProps {
  isOpen: boolean;
  governmentApplicationId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminGovernmentFollowUpModal: React.FC<AdminGovernmentFollowUpModalProps> = ({
  isOpen,
  governmentApplicationId,
  onClose,
  onSuccess,
}) => {
  const [method, setMethod] = useState("PHONE_CALL");
  const [contactPerson, setContactPerson] = useState("");
  const [officeContacted, setOfficeContacted] = useState("");
  const [outcome, setOutcome] = useState("Record under processing by registry officer.");
  const [notes, setNotes] = useState("");
  const [nextFollowUpDays, setNextFollowUpDays] = useState(7);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const nextDate = new Date(Date.now() + nextFollowUpDays * 86400000).toISOString();
      await governmentApi.recordFollowUp(governmentApplicationId, {
        method,
        contactPerson: contactPerson || undefined,
        officeContacted: officeContacted || undefined,
        outcome,
        notes,
        nextFollowUpDate: nextDate,
      });

      notify.success("Registry follow-up logged & next chasing date scheduled!");
      onSuccess();
      onClose();
    } catch (err: any) {
      notify.error(err.message || "Failed to log follow-up");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-indigo-500/20 bg-slate-900 text-slate-100 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Log Registry Chasing / Follow-up Attempt</h3>
              <p className="text-xs text-slate-400">Record Government Desk Inquiry & Next Follow-up Schedule</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Follow-up Channel</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="PHONE_CALL">Phone Call to Desk Officer</option>
                <option value="PHYSICAL_VISIT">Physical Counter Visit</option>
                <option value="PORTAL">Online Portal Status Inquiry</option>
                <option value="EMAIL">Official Registry Email Chaser</option>
                <option value="SMS">Officer SMS / WhatsApp Direct</option>
                <option value="OFFICIAL_LETTER">Formal Reminder Letter</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Officer Name</label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="e.g. Officer Jane Doe"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Office / Counter Contacted</label>
            <input
              type="text"
              value={officeContacted}
              onChange={(e) => setOfficeContacted(e.target.value)}
              placeholder="e.g. BRS Counter 12 / Nyayo House Room 302"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Follow-up Outcome Summary *</label>
            <input
              type="text"
              required
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              placeholder="e.g. File on desk awaiting registrar signature."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Detailed Inquiry Notes</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record details of conversation, commitments made by government officer..."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Schedule Next Chasing Attempt (Days)</label>
            <input
              type="number"
              min={1}
              max={30}
              value={nextFollowUpDays}
              onChange={(e) => setNextFollowUpDays(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
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
              className="flex items-center gap-2 rounded-lg bg-indigo-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-indigo-400 disabled:opacity-50"
            >
              <Check className="h-4 w-4" /> {submitting ? "Logging..." : "Log Follow-up Attempt"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
