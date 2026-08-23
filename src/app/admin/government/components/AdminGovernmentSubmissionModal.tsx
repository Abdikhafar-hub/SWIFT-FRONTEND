"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Building2,
  ShieldCheck,
  Globe,
  DollarSign,
  UserCheck,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Lock,
  ExternalLink,
} from "lucide-react";
import { governmentApi } from "@/lib/api/government";
import { notify } from "@/lib/notify";
import type { ReadyApplicationItem } from "@/types/government";

interface AdminGovernmentSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminGovernmentSubmissionModal: React.FC<AdminGovernmentSubmissionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loadingApps, setLoadingApps] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [readyApps, setReadyApps] = useState<ReadyApplicationItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Form State
  const [selectedAppId, setSelectedAppId] = useState<string>("");
  const [overridePrerequisites, setOverridePrerequisites] = useState(false);

  // Step 2 State
  const [platform, setPlatform] = useState("eCitizen");
  const [governmentAgency, setGovernmentAgency] = useState("Business Registration Service (BRS)");
  const [governmentService, setGovernmentService] = useState("");
  const [department, setDepartment] = useState("");
  const [submissionChannel, setSubmissionChannel] = useState("ONLINE_PORTAL");
  const [externalReference, setExternalReference] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [officerContact, setOfficerContact] = useState("");
  const [portalUrl, setPortalUrl] = useState("");
  const [expectedTurnaroundDays, setExpectedTurnaroundDays] = useState(14);
  const [nextFollowUpDays, setNextFollowUpDays] = useState(7);
  const [statutoryPaymentStatus, setStatutoryPaymentStatus] = useState("PAID");
  const [statutoryFeeAmount, setStatutoryFeeAmount] = useState(0);

  // Step 3 State
  const [primaryOfficerId, setPrimaryOfficerId] = useState("");
  const [secondaryOfficerId, setSecondaryOfficerId] = useState("");
  const [supervisorId, setSupervisorId] = useState("");
  const [team, setTeam] = useState("Kenyan Statutory Operations");
  const [evidenceDocumentUrl, setEvidenceDocumentUrl] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchReadyApps();
    }
  }, [isOpen]);

  const fetchReadyApps = async () => {
    setLoadingApps(true);
    try {
      const apps = await governmentApi.getReadyApplications(searchQuery);
      setReadyApps(apps);
    } catch (err: any) {
      notify.error(err.message || "Failed to load ready applications");
    } finally {
      setLoadingApps(false);
    }
  };

  if (!isOpen) return null;

  const selectedApp = readyApps.find((a) => a.id === selectedAppId);
  const isReady = selectedApp?.readiness?.ready ?? false;
  const canProceedStep1 = selectedAppId && (isReady || overridePrerequisites);

  const canProceedStep2 =
    externalReference.trim().length >= 2 && platform.trim().length >= 2 && governmentAgency.trim().length >= 2;

  const handleSubmit = async () => {
    if (!selectedAppId) return;
    setSubmitting(true);
    try {
      await governmentApi.createSubmission({
        applicationId: selectedAppId,
        platform,
        governmentAgency,
        governmentService: governmentService || selectedApp?.service.name,
        department,
        submissionChannel,
        externalReference,
        trackingNumber: trackingNumber || externalReference,
        receiptNumber,
        officerContact,
        portalUrl: portalUrl || undefined,
        expectedTurnaroundDays: Number(expectedTurnaroundDays),
        followUpFrequencyDays: Number(nextFollowUpDays),
        statutoryPaymentStatus,
        statutoryFeeAmount: Number(statutoryFeeAmount),
        primaryOfficerId: primaryOfficerId || undefined,
        secondaryOfficerId: secondaryOfficerId || undefined,
        supervisorId: supervisorId || undefined,
        team,
        evidenceDocumentUrl: evidenceDocumentUrl || undefined,
        notes,
        overridePrerequisites,
      });

      notify.success("Government agency submission registered successfully!");
      onSuccess();
      onClose();
    } catch (err: any) {
      notify.error(err.message || "Failed to register government submission");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-800 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200/80 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200/80">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight text-slate-900">Register Government Submission</h2>
              <p className="text-xs text-slate-500 font-medium">Statutory Agency Lodgement &amp; Operations Dossier Initiation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="grid grid-cols-3 border-b border-slate-200/80 bg-slate-50/60 text-xs">
          <div
            className={`flex items-center gap-2 border-r border-slate-200/80 px-6 py-3 font-bold ${
              step === 1 ? "bg-amber-50 text-amber-800 border-b-2 border-b-amber-600" : "text-slate-500"
            }`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-slate-700 text-xs font-bold">1</span>
            Application &amp; Readiness Audit
          </div>
          <div
            className={`flex items-center gap-2 border-r border-slate-200/80 px-6 py-3 font-bold ${
              step === 2 ? "bg-amber-50 text-amber-800 border-b-2 border-b-amber-600" : "text-slate-500"
            }`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-slate-700 text-xs font-bold">2</span>
            Registry &amp; Statutory Details
          </div>
          <div
            className={`flex items-center gap-2 px-6 py-3 font-bold ${
              step === 3 ? "bg-amber-50 text-amber-800 border-b-2 border-b-amber-600" : "text-slate-500"
            }`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-slate-700 text-xs font-bold">3</span>
            Officer Assignment &amp; Evidence
          </div>
        </div>

        {/* Modal Body */}
        <div className="max-h-[70vh] overflow-y-auto p-6 space-y-6">
          {/* STEP 1: Application Selection & Readiness Audit */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                  Select Application for Government Submission
                </label>
                <select
                  value={selectedAppId}
                  onChange={(e) => {
                    setSelectedAppId(e.target.value);
                    const app = readyApps.find((a) => a.id === e.target.value);
                    if (app) {
                      setGovernmentService(app.service.name);
                    }
                  }}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
                >
                  <option value="">-- Choose Host Application --</option>
                  {readyApps.map((app) => (
                    <option key={app.id} value={app.id}>
                      {app.applicationNumber} - {app.client.fullName} ({app.service.name}) - [Score: {app.readiness.score}%]
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Application Audit Card */}
              {selectedApp && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                      <span className="text-xs text-amber-700 font-mono font-bold">{selectedApp.applicationNumber}</span>
                      <h3 className="text-base font-bold text-slate-900">{selectedApp.service.name}</h3>
                      <p className="text-xs text-slate-500 font-medium">Client: {selectedApp.client.fullName} ({selectedApp.client.email})</p>
                    </div>
                    <div className="text-right">
                      <div
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                          selectedApp.readiness?.ready
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-rose-50 text-rose-800 border border-rose-200"
                        }`}
                      >
                        {selectedApp.readiness?.ready ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <AlertTriangle className="h-4 w-4" />
                        )}
                        Readiness Score: {selectedApp.readiness?.score ?? 0}%
                      </div>
                    </div>
                  </div>

                  {/* Checklist & Blockers */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Prerequisite Checklist Verification</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {selectedApp.readiness?.checklist?.map((item) => (
                        <div
                          key={item.key}
                          className={`flex items-center justify-between rounded-lg p-2.5 border ${
                            item.status === "PASSED"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                              : item.status === "WARNING"
                              ? "border-amber-200 bg-amber-50 text-amber-900"
                              : "border-rose-200 bg-rose-50 text-rose-900"
                          }`}
                        >
                          <span className="font-medium">{item.label}</span>
                          <span className="font-bold">{item.status}</span>
                        </div>
                      ))}
                    </div>

                    {!selectedApp.readiness?.ready && selectedApp.readiness?.blockers && selectedApp.readiness.blockers.length > 0 && (
                      <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900 space-y-1">
                        <div className="font-bold flex items-center gap-1.5">
                          <AlertTriangle className="h-4 w-4 text-rose-600" /> Blockers Identified:
                        </div>
                        <ul className="list-disc pl-5 space-y-0.5 font-medium">
                          {selectedApp.readiness.blockers.map((b, idx) => (
                            <li key={idx}>{b}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Override Option */}
                  {!selectedApp.readiness.ready && (
                    <div className="flex items-center gap-3 pt-2 border-t border-slate-200">
                      <input
                        type="checkbox"
                        id="override"
                        checked={overridePrerequisites}
                        onChange={(e) => setOverridePrerequisites(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 bg-white text-amber-600 focus:ring-amber-500"
                      />
                      <label htmlFor="override" className="text-xs text-amber-800 font-bold cursor-pointer">
                        Authorized Senior Officer Override (Bypass unfulfilled statutory prerequisites)
                      </label>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Registry & Statutory Details */}
          {step === 2 && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Government Platform *</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 font-semibold focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
                >
                  <option value="eCitizen">eCitizen Portal (Kenya)</option>
                  <option value="BRS">Business Registration Service (BRS)</option>
                  <option value="KRA iTax">KRA iTax Portal</option>
                  <option value="TIMS">TIMS / NTSA</option>
                  <option value="eFiling">Judiciary eFiling</option>
                  <option value="Immigration">Department of Immigration Services</option>
                  <option value="UK Visas">GOV.UK Visa &amp; Immigration</option>
                  <option value="US traveldocs">US TravelDocs Portal</option>
                  <option value="Other">Other Statutory Registry</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Statutory Agency Name *</label>
                <input
                  type="text"
                  value={governmentAgency}
                  onChange={(e) => setGovernmentAgency(e.target.value)}
                  placeholder="e.g. Business Registration Service, KRA, Immigration"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 font-medium focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Submission Channel</label>
                <select
                  value={submissionChannel}
                  onChange={(e) => setSubmissionChannel(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 font-semibold focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
                >
                  <option value="ONLINE_PORTAL">Online Portal Submission</option>
                  <option value="PHYSICAL_OFFICE">Physical Office Lodgement</option>
                  <option value="EMAIL">Official Registry Email</option>
                  <option value="COURIER">Formal Courier / Dispatch</option>
                  <option value="MANUAL_COUNTER">Manual Counter Lodgement</option>
                  <option value="THIRD_PARTY">Third Party Service Provider</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">External Reference / Application # *</label>
                <input
                  type="text"
                  value={externalReference}
                  onChange={(e) => setExternalReference(e.target.value)}
                  placeholder="e.g. BRS-APP-2026-98124, EC-98124"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 font-mono font-bold focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tracking / Acknowledgment Number</label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Optional secondary tracking code"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 font-mono focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Statutory Fee Receipt #</label>
                <input
                  type="text"
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  placeholder="e.g. REC-889124-2026"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 font-mono focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Statutory Payment Status</label>
                <select
                  value={statutoryPaymentStatus}
                  onChange={(e) => setStatutoryPaymentStatus(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 font-semibold focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
                >
                  <option value="PAID">PAID (Statutory Fee Settled)</option>
                  <option value="REQUIRED">REQUIRED (Awaiting Payment)</option>
                  <option value="AWAITING_PAYMENT">AWAITING_PAYMENT</option>
                  <option value="NOT_REQUIRED">NOT_REQUIRED (No Government Fee)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Statutory Fee Amount (KES)</label>
                <input
                  type="number"
                  value={statutoryFeeAmount}
                  onChange={(e) => setStatutoryFeeAmount(Number(e.target.value))}
                  placeholder="0"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 font-semibold focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Expected Turnaround (Days)</label>
                <input
                  type="number"
                  value={expectedTurnaroundDays}
                  onChange={(e) => setExpectedTurnaroundDays(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 font-semibold focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Registry Portal URL</label>
                <input
                  type="url"
                  value={portalUrl}
                  onChange={(e) => setPortalUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 font-medium focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* STEP 3: Officer Assignment & Initial Evidence */}
          {step === 3 && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Operations Team / Unit</label>
                  <input
                    type="text"
                    value={team}
                    onChange={(e) => setTeam(e.target.value)}
                    placeholder="e.g. Kenyan Business Registration Unit"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 font-medium focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Acknowledgement Receipt Document URL</label>
                  <input
                    type="url"
                    value={evidenceDocumentUrl}
                    onChange={(e) => setEvidenceDocumentUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 font-medium focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Internal Operations Notes &amp; Submission Checklist</label>
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Record registry counter details, submitting officer notes, portal login info, or statutory follow-up instructions..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 font-medium focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
                />
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 shrink-0 text-amber-700 mt-0.5" />
                <div>
                  <h5 className="font-bold">Automatic SLA &amp; Notification Dispatch</h5>
                  <p className="text-amber-800/90 font-medium mt-0.5">
                    Submitting this record will set the Host Application status to <strong>SUBMITTED</strong>, initialize real-time SLA countdown tracking, log an immutable audit entry, and send an automated in-app and email update to the client.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between border-t border-slate-200/80 bg-slate-50 px-6 py-4">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => (s - 1) as any)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}
              onClick={() => setStep((s) => (s + 1) as any)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#C5A059] to-[#D4AF37] hover:from-[#b49049] hover:to-[#c39e26] px-5 py-2 text-xs font-bold text-white transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next Step <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              disabled={submitting}
              onClick={handleSubmit}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-6 py-2 text-xs font-bold text-white transition-colors shadow-xs disabled:opacity-50"
            >
              {submitting ? "Registering Submission..." : "Finalize & Submit Record"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
