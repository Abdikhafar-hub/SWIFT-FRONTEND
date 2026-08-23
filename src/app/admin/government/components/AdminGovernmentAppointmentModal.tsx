"use client";

import React, { useState } from "react";
import { X, Calendar, MapPin, Send } from "lucide-react";
import { governmentApi } from "@/lib/api/government";
import { notify } from "@/lib/notify";

interface AdminGovernmentAppointmentModalProps {
  isOpen: boolean;
  governmentApplicationId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminGovernmentAppointmentModal: React.FC<AdminGovernmentAppointmentModalProps> = ({
  isOpen,
  governmentApplicationId,
  onClose,
  onSuccess,
}) => {
  const [appointmentType, setAppointmentType] = useState("BIOMETRICS");
  const [authorityName, setAuthorityName] = useState("Department of Immigration Services (Nyayo House)");
  const [scheduledAtDate, setScheduledAtDate] = useState("");
  const [scheduledAtTime, setScheduledAtTime] = useState("09:00");
  const [location, setLocation] = useState("Nyayo House, 2nd Floor, Nairobi");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [officerContact, setOfficerContact] = useState("");
  const [clientInstructions, setClientInstructions] = useState("");
  const [requiredDocumentsText, setRequiredDocumentsText] = useState("Original National ID / Passport, Payment Slip");
  const [isClientVisible, setIsClientVisible] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduledAtDate) {
      notify.error("Please select an appointment date");
      return;
    }

    setSubmitting(true);
    try {
      const dateTime = new Date(`${scheduledAtDate}T${scheduledAtTime}:00`).toISOString();
      const requiredDocs = requiredDocumentsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      await governmentApi.scheduleAppointment(governmentApplicationId, {
        appointmentType,
        authorityName,
        scheduledAt: dateTime,
        location,
        referenceNumber: referenceNumber || undefined,
        officerContact: officerContact || undefined,
        clientInstructions,
        requiredDocuments: requiredDocs,
        isClientVisible,
      });

      notify.success("Government appointment scheduled and client notified!");
      onSuccess();
      onClose();
    } catch (err: any) {
      notify.error(err.message || "Failed to schedule appointment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-sky-500/20 bg-slate-900 text-slate-100 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Schedule Registry Appointment / Biometrics</h3>
              <p className="text-xs text-slate-400">Set Official Visit Details & Dispatch Client Portal Guide</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Appointment Type *</label>
              <select
                value={appointmentType}
                onChange={(e) => setAppointmentType(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-sky-500 focus:outline-none"
              >
                <option value="BIOMETRICS">Biometrics Capture</option>
                <option value="PASSPORT_COLLECTION">Passport / Document Collection</option>
                <option value="VISA_INTERVIEW">Visa Interview</option>
                <option value="GOVERNMENT_OFFICE_VISIT">Government Office Counter Visit</option>
                <option value="IDENTITY_VERIFICATION">Physical Identity Verification</option>
                <option value="OTHER">Other Registry Appointment</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Authority / Registry Name *</label>
              <input
                type="text"
                required
                value={authorityName}
                onChange={(e) => setAuthorityName(e.target.value)}
                placeholder="e.g. Department of Immigration Services"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Date *</label>
              <input
                type="date"
                required
                value={scheduledAtDate}
                onChange={(e) => setScheduledAtDate(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Time *</label>
              <input
                type="time"
                required
                value={scheduledAtTime}
                onChange={(e) => setScheduledAtTime(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Physical Location / Address *</label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Nyayo House, 2nd Floor Counter 4, Nairobi"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Appointment Slot Ref #</label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g. APT-89124-2026"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white font-mono focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Registry Contact Officer</label>
              <input
                type="text"
                value={officerContact}
                onChange={(e) => setOfficerContact(e.target.value)}
                placeholder="Officer Name / Phone"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Required Documents to Carry (Comma-separated)</label>
            <input
              type="text"
              value={requiredDocumentsText}
              onChange={(e) => setRequiredDocumentsText(e.target.value)}
              placeholder="Original ID, Passport, Bio Appointment Slip..."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Client Instructions & Guidelines</label>
            <textarea
              rows={2}
              value={clientInstructions}
              onChange={(e) => setClientInstructions(e.target.value)}
              placeholder="Arrive 15 minutes early. Dress code formal/smart casual..."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
            <input
              type="checkbox"
              id="isClientVisible"
              checked={isClientVisible}
              onChange={(e) => setIsClientVisible(e.target.checked)}
              className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-sky-500"
            />
            <label htmlFor="isClientVisible" className="text-xs text-sky-300 font-semibold cursor-pointer">
              Publish to Client Portal Dashboard & Dispatch SMS/Email Guide
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
              className="flex items-center gap-2 rounded-lg bg-sky-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-sky-400 disabled:opacity-50"
            >
              <Send className="h-4 w-4" /> {submitting ? "Scheduling..." : "Schedule Appointment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
