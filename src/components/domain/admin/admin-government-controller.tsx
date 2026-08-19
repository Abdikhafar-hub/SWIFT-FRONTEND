"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Landmark,
  ExternalLink,
  Plus,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  RotateCw,
  Clock,
  Trash2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { FormField, Textarea } from "@/components/ui/form-primitives";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { adminApi } from "@/lib/api/admin";
import { formatDate } from "@/lib/utils/format";
import type { GovernmentApplication, GovernmentStatus } from "@/types";

interface AdminGovernmentControllerProps {
  applicationId: string;
  governmentApps?: GovernmentApplication[];
  onUpdated?: () => void;
}

const GOV_PLATFORMS = [
  { value: "eCitizen", label: "eCitizen Portal (Directorate of Immigration / BRS / NTSA)" },
  { value: "BRS", label: "Business Registration Service (BRS Portal)" },
  { value: "iTax", label: "KRA iTax (Kenya Revenue Authority)" },
  { value: "TIMS", label: "NTSA TIMS (Transport & Licensing)" },
  { value: "DCI", label: "DCI Kenya (Directorate of Criminal Investigations - PCC)" },
  { value: "Immigration", label: "Department of Immigration (eFNS / Work Permits)" },
  { value: "MFA", label: "Ministry of Foreign Affairs (Statutory Attestation)" },
  { value: "Ardhisasa", label: "Ardhisasa (National Land Information System)" },
  { value: "NEMA", label: "NEMA Licensing System" },
  { value: "Other", label: "Other Statutory Authority" },
];

const GOV_STATUSES: Array<{ value: GovernmentStatus; label: string }> = [
  { value: "NOT_STARTED", label: "Not Started" },
  { value: "PREPARING", label: "Preparing Dossier" },
  { value: "READY_TO_SUBMIT", label: "Ready to Submit" },
  { value: "SUBMITTED", label: "Submitted to Registry" },
  { value: "UNDER_PROCESSING", label: "Under Agency Processing" },
  { value: "ADDITIONAL_INFORMATION_REQUIRED", label: "Additional Info Required (Query Raised)" },
  { value: "APPROVED", label: "Approved by Agency" },
  { value: "COMPLETED", label: "Completed & Certificate Issued" },
  { value: "REJECTED", label: "Rejected by Registry" },
];

export function AdminGovernmentController({
  applicationId,
  governmentApps = [],
  onUpdated,
}: AdminGovernmentControllerProps) {
  const queryClient = useQueryClient();

  // Create submission modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [platform, setPlatform] = useState("eCitizen");
  const [governmentAgency, setGovernmentAgency] = useState("eCitizen Directorate");
  const [externalReference, setExternalReference] = useState("");
  const [portalUrl, setPortalUrl] = useState("");
  const [notes, setNotes] = useState("");

  // Update status modal state
  const [selectedGovApp, setSelectedGovApp] = useState<GovernmentApplication | null>(null);
  const [targetStatus, setTargetStatus] = useState<GovernmentStatus>("UNDER_PROCESSING");
  const [updateTracking, setUpdateTracking] = useState("");
  const [updateNotes, setUpdateNotes] = useState("");
  const [nextFollowUpDate, setNextFollowUpDate] = useState("");
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  // Approval modal state
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [approvalNumber, setApprovalNumber] = useState("");
  const [approvalDate, setApprovalDate] = useState(new Date().toISOString().split("T")[0]);
  const [evidenceDocumentUrl, setEvidenceDocumentUrl] = useState("");
  const [approvalNotes, setApprovalNotes] = useState("");

  // Add reference modal state
  const [isAddRefModalOpen, setIsAddRefModalOpen] = useState(false);
  const [refType, setRefType] = useState("ACKNOWLEDGEMENT_NO");
  const [refValue, setRefValue] = useState("");

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-application", applicationId] });
    if (onUpdated) onUpdated();
  };

  // Mutations
  const createGovMutation = useMutation({
    mutationFn: (payload: any) => adminApi.createGovernmentRecord(applicationId, payload),
    onSuccess: () => {
      setIsCreateModalOpen(false);
      setExternalReference("");
      setPortalUrl("");
      setNotes("");
      invalidate();
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (payload: any) => adminApi.updateGovernmentStatus(selectedGovApp!.id, payload),
    onSuccess: () => {
      setIsUpdateModalOpen(false);
      setSelectedGovApp(null);
      invalidate();
    },
  });

  const recordApprovalMutation = useMutation({
    mutationFn: (payload: any) => adminApi.recordGovernmentApproval(selectedGovApp!.id, payload),
    onSuccess: () => {
      setIsApprovalModalOpen(false);
      setSelectedGovApp(null);
      setApprovalNumber("");
      setEvidenceDocumentUrl("");
      invalidate();
    },
  });

  const addRefMutation = useMutation({
    mutationFn: (payload: any) => adminApi.addGovernmentReference(selectedGovApp!.id, payload),
    onSuccess: () => {
      setIsAddRefModalOpen(false);
      setRefValue("");
      invalidate();
    },
  });

  const removeRefMutation = useMutation({
    mutationFn: (payload: { govId: string; refId: string }) =>
      adminApi.removeGovernmentReference(payload.govId, payload.refId),
    onSuccess: () => invalidate(),
  });

  const getStatusTone = (status: GovernmentStatus) => {
    switch (status) {
      case "APPROVED":
      case "COMPLETED":
        return "success";
      case "SUBMITTED":
      case "UNDER_PROCESSING":
        return "gold";
      case "ADDITIONAL_INFORMATION_REQUIRED":
        return "warning";
      case "REJECTED":
        return "destructive";
      default:
        return "neutral";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">Official Government Filings & Tracking</h3>
          <p className="text-xs text-muted-foreground">
            Monitor submissions to eCitizen, BRS, iTax, and official government registries.
          </p>
        </div>
        <Button
          variant="gold"
          size="sm"
          leftIcon={<Plus className="size-4" />}
          onClick={() => setIsCreateModalOpen(true)}
        >
          Register Filing
        </Button>
      </div>

      {governmentApps.length === 0 ? (
        <Card padding="lg" className="text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-gold/10 text-gold mb-3">
            <Landmark className="size-6" />
          </div>
          <h4 className="text-sm font-semibold text-foreground">No government submissions recorded</h4>
          <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
            Once client documents are satisfied, register the filing on the relevant statutory portal (eCitizen / BRS / iTax) and record the tracking reference here.
          </p>
          <div className="mt-4">
            <Button variant="gold" size="sm" onClick={() => setIsCreateModalOpen(true)}>
              Register First Submission
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {governmentApps.map((gov) => (
            <Card key={gov.id} padding="md" className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-xs bg-navy/10 dark:bg-navy-light text-navy dark:text-gold font-bold">
                    <Landmark className="size-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">
                      {gov.platform} — {gov.governmentAgency}
                    </h4>
                    <span className="font-mono text-xs text-muted-foreground">
                      Tracking / Ref: <strong>{gov.externalReference || gov.trackingNumber || "N/A"}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge tone={getStatusTone(gov.status)} size="md">
                    {gov.status.replace(/_/g, " ")}
                  </Badge>
                </div>
              </div>

              {/* Grid Metadata */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-xs">
                <div className="rounded-xs border border-border bg-muted/20 p-2.5">
                  <span className="text-muted-foreground block text-[11px]">Submitted Date</span>
                  <span className="font-semibold text-foreground">
                    {gov.submittedAt ? formatDate(gov.submittedAt) : "Pending submission"}
                  </span>
                </div>

                <div className="rounded-xs border border-border bg-muted/20 p-2.5">
                  <span className="text-muted-foreground block text-[11px]">Next Agency Follow-up</span>
                  <span className="font-semibold text-gold-dark dark:text-gold flex items-center gap-1">
                    <Calendar className="size-3.5" />
                    {gov.nextFollowUpDate ? formatDate(gov.nextFollowUpDate) : "Not scheduled"}
                  </span>
                </div>

                <div className="rounded-xs border border-border bg-muted/20 p-2.5">
                  <span className="text-muted-foreground block text-[11px]">Approval Certificate</span>
                  {gov.evidenceDocumentUrl ? (
                    <a
                      href={gov.evidenceDocumentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-emerald-600 hover:underline flex items-center gap-1 truncate"
                    >
                      <FileCheck className="size-3.5" />
                      <span>View Official Certificate</span>
                    </a>
                  ) : (
                    <span className="text-muted-foreground">Pending issuance</span>
                  )}
                </div>
              </div>

              {/* Official References */}
              {gov.references && gov.references.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Statutory Registry References
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {gov.references.map((ref) => (
                      <div
                        key={ref.id}
                        className="flex items-center gap-2 rounded-xs border border-border bg-muted/40 px-2.5 py-1 text-xs"
                      >
                        <span className="text-muted-foreground font-mono text-[10px]">{ref.referenceType}:</span>
                        <strong className="text-foreground font-mono">{ref.referenceValue}</strong>
                        <button
                          type="button"
                          onClick={() => removeRefMutation.mutate({ govId: gov.id, refId: ref.id })}
                          className="text-muted-foreground hover:text-destructive ml-1"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions Footer */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border">
                <div className="flex items-center gap-2">
                  {gov.portalUrl && (
                    <a href={gov.portalUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="xs" leftIcon={<ExternalLink className="size-3.5" />}>
                        Open Registry Portal
                      </Button>
                    </a>
                  )}
                  <Button
                    variant="ghost"
                    size="xs"
                    leftIcon={<Plus className="size-3.5" />}
                    onClick={() => {
                      setSelectedGovApp(gov);
                      setIsAddRefModalOpen(true);
                    }}
                  >
                    Add Reference
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="xs"
                    leftIcon={<RotateCw className="size-3.5" />}
                    onClick={() => {
                      setSelectedGovApp(gov);
                      setTargetStatus(gov.status);
                      setUpdateTracking(gov.externalReference || gov.trackingNumber || "");
                      setIsUpdateModalOpen(true);
                    }}
                  >
                    Update Status
                  </Button>

                  {gov.status !== "APPROVED" && gov.status !== "COMPLETED" && (
                    <Button
                      variant="gold"
                      size="xs"
                      leftIcon={<CheckCircle2 className="size-3.5" />}
                      onClick={() => {
                        setSelectedGovApp(gov);
                        setIsApprovalModalOpen(true);
                      }}
                    >
                      Record Approval
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* MODAL 1: Register New Filing */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Register Government Submission"
        description="Link an official statutory portal submission to this application dossier."
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="gold"
              size="sm"
              isLoading={createGovMutation.isPending}
              onClick={() =>
                createGovMutation.mutate({
                  platform,
                  governmentAgency,
                  externalReference: externalReference || `KE-GOV-${Date.now().toString().slice(-6)}`,
                  portalUrl: portalUrl || undefined,
                  notes: notes || undefined,
                })
              }
            >
              Register Submission
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormField label="Statutory Registry / Portal" required>
            <Select
              value={platform}
              onChange={(e) => {
                setPlatform(e.target.value);
                setGovernmentAgency(e.target.value);
              }}
              options={GOV_PLATFORMS}
            />
          </FormField>

          <FormField label="Agency / Department Name" required>
            <Input
              placeholder="e.g. Business Registration Service (BRS) - Companies Registry"
              value={governmentAgency}
              onChange={(e) => setGovernmentAgency(e.target.value)}
            />
          </FormField>

          <FormField label="External Tracking / Application Number" required>
            <Input
              placeholder="e.g. BRS-BN-2026-98124 or eCitizen Reference #"
              value={externalReference}
              onChange={(e) => setExternalReference(e.target.value)}
            />
          </FormField>

          <FormField label="Government Portal URL (Optional)">
            <Input
              placeholder="https://ecitizen.go.ke/..."
              value={portalUrl}
              onChange={(e) => setPortalUrl(e.target.value)}
            />
          </FormField>

          <FormField label="Initial Submission Remarks">
            <Textarea
              placeholder="Record any notes regarding the government submission..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </FormField>
        </div>
      </Modal>

      {/* MODAL 2: Update Status */}
      <Modal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        title="Update Government Processing Status"
        description="Record progress, queries, or status updates from the official registry."
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsUpdateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="gold"
              size="sm"
              isLoading={updateStatusMutation.isPending}
              onClick={() =>
                updateStatusMutation.mutate({
                  status: targetStatus,
                  externalReference: updateTracking || undefined,
                  notes: updateNotes || undefined,
                  nextFollowUpDate: nextFollowUpDate || undefined,
                })
              }
            >
              Save Update
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormField label="Agency Processing State" required>
            <Select
              value={targetStatus}
              onChange={(e) => setTargetStatus(e.target.value as GovernmentStatus)}
              options={GOV_STATUSES}
            />
          </FormField>

          <FormField label="Tracking Reference #">
            <Input
              placeholder="Updated reference number if modified by registry..."
              value={updateTracking}
              onChange={(e) => setUpdateTracking(e.target.value)}
            />
          </FormField>

          <FormField label="Next Official Follow-up Date">
            <Input
              type="date"
              value={nextFollowUpDate}
              onChange={(e) => setNextFollowUpDate(e.target.value)}
            />
          </FormField>

          <FormField label="Registry Response / Officer Notes">
            <Textarea
              placeholder="Details received from government registrar or query raised..."
              value={updateNotes}
              onChange={(e) => setUpdateNotes(e.target.value)}
              rows={3}
            />
          </FormField>
        </div>
      </Modal>

      {/* MODAL 3: Record Official Approval */}
      <Modal
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        title="Record Official Statutory Approval"
        description="Enter the issued registration number and attach the official certificate URL."
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsApprovalModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="gold"
              size="sm"
              isLoading={recordApprovalMutation.isPending}
              onClick={() =>
                recordApprovalMutation.mutate({
                  approvalNumber: approvalNumber || undefined,
                  approvalDate: approvalDate || undefined,
                  evidenceDocumentUrl: evidenceDocumentUrl || undefined,
                  notes: approvalNotes || undefined,
                })
              }
            >
              Record Statutory Approval
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormField label="Official Certificate / Approval Number" required>
            <Input
              placeholder="e.g. CPR/2026/89201 or PIN Certificate #"
              value={approvalNumber}
              onChange={(e) => setApprovalNumber(e.target.value)}
            />
          </FormField>

          <FormField label="Date of Gazettement / Approval" required>
            <Input
              type="date"
              value={approvalDate}
              onChange={(e) => setApprovalDate(e.target.value)}
            />
          </FormField>

          <FormField label="Secure Certificate URL / Cloudinary Asset">
            <Input
              placeholder="https://res.cloudinary.com/... or uploaded document link"
              value={evidenceDocumentUrl}
              onChange={(e) => setEvidenceDocumentUrl(e.target.value)}
            />
          </FormField>

          <FormField label="Approval Summary Remarks">
            <Textarea
              placeholder="Official seal remarks, registry ledger book reference, etc..."
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              rows={2}
            />
          </FormField>
        </div>
      </Modal>

      {/* MODAL 4: Add Reference */}
      <Modal
        isOpen={isAddRefModalOpen}
        onClose={() => setIsAddRefModalOpen(false)}
        title="Add Statutory Reference Code"
        description="Attach supplementary registry numbers (KRA Acknowledgement, BRS Reservation, Receipt Reference)."
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsAddRefModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="gold"
              size="sm"
              isLoading={addRefMutation.isPending}
              onClick={() =>
                addRefMutation.mutate({
                  referenceType: refType,
                  referenceValue: refValue,
                })
              }
            >
              Save Reference
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormField label="Reference Type" required>
            <Select
              value={refType}
              onChange={(e) => setRefType(e.target.value)}
              options={[
                { value: "ACKNOWLEDGEMENT_NO", label: "Acknowledgement Slip Number" },
                { value: "NAME_RESERVATION_NO", label: "BRS Name Reservation Code" },
                { value: "INVOICE_NO", label: "eCitizen Statutory Invoice #" },
                { value: "RECEIPT_NO", label: "Government Treasury Receipt #" },
                { value: "FILE_NO", label: "Registry Physical File Number" },
                { value: "OTHER", label: "Other External Code" },
              ]}
            />
          </FormField>

          <FormField label="Reference Value / Code" required>
            <Input
              placeholder="e.g. BRS-RES-2026-00492"
              value={refValue}
              onChange={(e) => setRefValue(e.target.value)}
            />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
