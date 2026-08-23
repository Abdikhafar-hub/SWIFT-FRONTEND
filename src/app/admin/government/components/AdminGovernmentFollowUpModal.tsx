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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-800 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200/80 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Log Registry Chasing / Follow-up Attempt</h3>
              <p className="text-xs text-slate-500 font-medium">Record Government Desk Inquiry &amp; Next Follow-up Schedule</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Follow-up Channel</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 font-semibold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
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
              <label className="block text-xs font-bold text-slate-700 mb-1">Contact Officer Name</label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="e.g. Officer Jane Doe"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Office / Counter Contacted</label>
            <input
              type="text"
              value={officeContacted}
              onChange={(e) => setOfficeContacted(e.target.value)}
              placeholder="e.g. BRS Counter 12 / Nyayo House Room 302"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Follow-up Outcome Summary *</label>
            <input
              type="text"
              required
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              placeholder="e.g. File on desk awaiting registrar signature."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Inquiry Notes</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record details of conversation, commitments made by government officer..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Schedule Next Chasing Attempt (Days)</label>
            <input
              type="number"
              min={1}
              max={30}
              value={nextFollowUpDays}
              onChange={(e) => setNextFollowUpDays(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 font-semibold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
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
              className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 py-2 text-xs font-bold text-white transition-colors shadow-xs disabled:opacity-50"
            >
              <Check className="h-4 w-4" /> {submitting ? "Logging..." : "Log Follow-up Attempt"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
