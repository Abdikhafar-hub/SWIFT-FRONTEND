"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Landmark,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Calendar,
  ExternalLink,
  ShieldCheck,
  Send,
  Sliders,
} from "lucide-react";
import { PageShell } from "@/components/ui/layout-primitives";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { FormField, Textarea } from "@/components/ui/form-primitives";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton, ErrorState } from "@/components/ui/feedback-primitives";
import { adminApi } from "@/lib/api/admin";
import { formatDate } from "@/lib/utils/format";
import type { GovernmentApplication, GovernmentStatus } from "@/types";

export default function AdminGovernmentDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const queryClient = useQueryClient();

  // Status update modal
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<GovernmentStatus>("IN_REVIEW");
  const [updatedReference, setUpdatedReference] = useState("");
  const [queryDetails, setQueryDetails] = useState("");
  const [queryResponse, setQueryResponse] = useState("");
  const [remarks, setRemarks] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");

  // Queries
  const { data: queueData, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-government-queue"],
    queryFn: () => adminApi.getGovernmentQueue({ page: 1, limit: 100 }),
  });

  const { data: historyData } = useQuery({
    queryKey: ["admin-government-history", id],
    queryFn: () => adminApi.getGovernmentStatusHistory(id),
    enabled: Boolean(id),
  });

  const filing = queueData?.items?.find((f) => f.id === id);

  // Status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: () =>
      adminApi.updateGovernmentStatus(id, {
        status: newStatus,
        externalReference: updatedReference || undefined,
        queryDetails: queryDetails || undefined,
        queryResponse: queryResponse || undefined,
        remarks: remarks || undefined,
        followUpDate: followUpDate || undefined,
      }),
    onSuccess: () => {
      setIsUpdateModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin-government-queue"] });
      queryClient.invalidateQueries({ queryKey: ["admin-government-history", id] });
    },
  });

  // Approval mutation
  const approvalMutation = useMutation({
    mutationFn: () =>
      adminApi.recordGovernmentApproval(id, {
        registrationNumber: registrationNumber || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-government-queue"] });
      queryClient.invalidateQueries({ queryKey: ["admin-government-history", id] });
    },
  });

  if (isLoading) {
    return (
      <PageShell title="Loading Agency Filing...">
        <div className="space-y-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </PageShell>
    );
  }

  if (error || !filing) {
    return (
      <PageShell title="Government Filing Dossier">
        <ErrorState
          title="Filing Record Not Found"
          message="Could not locate the requested statutory agency filing."
          onRetry={() => refetch()}
        />
      </PageShell>
    );
  }

  const history = historyData || filing.statusHistory || [];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-4 sm:p-5 lg:p-6 space-y-4 max-w-[1550px] mx-auto font-sans">
      {/* ------------------------------------------------------------------ */}
      {/* 1. HEADER SECTION */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/80">
              Agency: {filing.platform}
            </span>
            <span className="text-xs text-slate-500 font-mono font-medium">
              Ref: {filing.externalReference || "Pending Agency Ref"}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            {filing.governmentAgency || "Statutory Agency Filing"}
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <Link href="/admin/government">
            <button className="bg-white border border-slate-200 text-slate-700 font-bold text-xs px-3 py-2 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-1.5 shadow-xs">
              <ArrowLeft className="size-3.5 text-slate-500" />
              <span>Registry Queue</span>
            </button>
          </Link>
          <button
            onClick={() => {
              setNewStatus(filing.status);
              setUpdatedReference(filing.externalReference || "");
              setIsUpdateModalOpen(true);
            }}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
          >
            <Sliders className="size-3.5" />
            <span>Update Agency Status</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left 2 Cols: Filing Details & History */}
        <div className="space-y-4 lg:col-span-2">
          {/* Main Overview Card */}
          <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Statutory Submission Profile
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {filing.governmentService || filing.platform}
                </h3>
              </div>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border ${
                  filing.status === "APPROVED"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200/80"
                    : filing.status === "QUERY_RAISED" || filing.status === "REJECTED"
                    ? "bg-rose-50 text-rose-800 border-rose-200/80"
                    : "bg-amber-50 text-amber-800 border-amber-200/80"
                }`}
              >
                {filing.status}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3">
                <span className="text-slate-400 block text-[10px] font-extrabold uppercase tracking-wider">Platform</span>
                <strong className="text-slate-900 font-bold block mt-0.5">{filing.platform}</strong>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3">
                <span className="text-slate-400 block text-[10px] font-extrabold uppercase tracking-wider">Agency Tracking #</span>
                <strong className="text-slate-900 font-mono font-bold block mt-0.5">{filing.externalReference || "—"}</strong>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3">
                <span className="text-slate-400 block text-[10px] font-extrabold uppercase tracking-wider">Submitted Date</span>
                <span className="text-slate-700 font-mono font-semibold block mt-0.5">{formatDate(filing.submittedAt || filing.createdAt)}</span>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3">
                <span className="text-slate-400 block text-[10px] font-extrabold uppercase tracking-wider">Follow-Up Due</span>
                <span className="text-amber-700 font-mono font-bold block mt-0.5">
                  {filing.followUpDate ? formatDate(filing.followUpDate) : "—"}
                </span>
              </div>
            </div>

            {filing.notes && (
              <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3 text-xs space-y-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Officer Remarks &amp; Notes:</span>
                <p className="text-slate-700 font-medium">{filing.notes}</p>
              </div>
            )}

            {filing.portalUrl && (
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Official Government Portal Link:</span>
                <a
                  href={filing.portalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-700 hover:underline flex items-center gap-1 font-bold"
                >
                  <span>Launch Agency Portal</span>
                  <ExternalLink className="size-3" />
                </a>
              </div>
            )}
          </div>

          {/* Status Timeline History */}
          <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-3">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Government Status Audit History</h3>
            {history.length === 0 ? (
              <p className="text-xs text-slate-500">No intermediate state transitions recorded.</p>
            ) : (
              <div className="space-y-2">
                {history.map((h: any, idx: number) => (
                  <div
                    key={h.id || idx}
                    className="flex items-start justify-between rounded-xl border border-slate-200/80 bg-slate-50 p-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                          {h.toStatus || h.status}
                        </span>
                        {h.fromStatus && (
                          <span className="text-[11px] text-slate-400 font-medium">
                            from {h.fromStatus}
                          </span>
                        )}
                      </div>
                      {h.remarks && <p className="text-slate-700 font-medium">{h.remarks}</p>}
                      {h.queryDetails && (
                        <p className="text-rose-600 font-bold">Query: {h.queryDetails}</p>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono font-medium">
                      {formatDate(h.createdAt || h.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Host Dossier Profile */}
        <div className="space-y-4">
          {filing.application && (
            <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-sm font-bold text-slate-900">Host Application</h4>
                <Link
                  href={`/admin/applications/${filing.application.id}`}
                  className="text-xs font-bold text-amber-700 hover:underline"
                >
                  Open 360
                </Link>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-medium">Dossier #</span>
                  <Link
                    href={`/admin/applications/${filing.application.id}`}
                    className="font-mono font-bold text-amber-700 hover:underline"
                  >
                    #{filing.application.applicationNumber}
                  </Link>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-medium">Service Name</span>
                  <span className="font-bold text-slate-900">{filing.application.service?.name}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-medium">Client Entity</span>
                  <span className="font-bold text-slate-900">
                    {filing.application.client?.fullName ||
                      filing.application.client?.businessName ||
                      "Client"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Filing Status</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                    {filing.application.status}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Direct Approval Action Card */}
          {filing.status !== "APPROVED" && (
            <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-3 text-xs">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-emerald-600" />
                <span>Record Official Agency Approval</span>
              </h4>
              <p className="text-slate-500 font-medium">
                Once the registry issues the final registration number or certificate, certify approval here.
              </p>
              <FormField label="Official Registry Registration # (Optional)">
                <Input
                  placeholder="e.g. CPR/2026/123456"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                />
              </FormField>
              <button
                onClick={() => approvalMutation.mutate()}
                disabled={approvalMutation.isPending}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                <span>Certify Statutory Approval</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* STATUS UPDATE MODAL */}
      {isUpdateModalOpen && (
        <Modal
          isOpen={isUpdateModalOpen}
          onClose={() => setIsUpdateModalOpen(false)}
          title="Update Agency Registry Status"
          description="Record status changes and agency queries received from the government portal."
          size="md"
        >
          <div className="space-y-4 text-xs">
            <FormField label="Statutory Agency Status" required>
              <Select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as GovernmentStatus)}
                options={[
                  { value: "SUBMITTED", label: "Submitted to Agency" },
                  { value: "IN_REVIEW", label: "In Review / Processing" },
                  { value: "QUERY_RAISED", label: "Query Raised by Registry" },
                  { value: "APPROVED", label: "Approved & Certified" },
                  { value: "REJECTED", label: "Rejected by Agency" },
                ]}
              />
            </FormField>

            <FormField label="Agency Tracking / Reference Code">
              <Input
                value={updatedReference}
                onChange={(e) => setUpdatedReference(e.target.value)}
                placeholder="e.g. BRS-BN-2026-987654"
              />
            </FormField>

            {newStatus === "QUERY_RAISED" && (
              <FormField label="Agency Query Details / Blocker" required>
                <Textarea
                  placeholder="Specify the query raised by the registry examiner..."
                  value={queryDetails}
                  onChange={(e) => setQueryDetails(e.target.value)}
                  rows={3}
                />
              </FormField>
            )}

            <FormField label="Scheduled Follow-up Date">
              <Input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
              />
            </FormField>

            <FormField label="Officer Audit Remarks">
              <Textarea
                placeholder="Document any additional operational remarks..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={2}
              />
            </FormField>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsUpdateModalOpen(false)}
                disabled={updateStatusMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="gold"
                size="sm"
                isLoading={updateStatusMutation.isPending}
                onClick={() => updateStatusMutation.mutate()}
              >
                Save Status Update
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
