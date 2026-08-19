"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckSquare, ShieldCheck, AlertOctagon, CheckCircle2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { FormField, Textarea } from "@/components/ui/form-primitives";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { adminApi } from "@/lib/api/admin";
import type { QCResult, QualityCheckChecklist } from "@/types";

interface AdminQcModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  applicationNumber: string;
  onPassed?: () => void;
  onSuccess?: () => void;
}

export function AdminQcModal({
  isOpen,
  onClose,
  applicationId,
  applicationNumber,
  onPassed,
  onSuccess,
}: AdminQcModalProps) {
  const queryClient = useQueryClient();

  const [result, setResult] = useState<QCResult>("PASSED");
  const [checklist, setChecklist] = useState<QualityCheckChecklist>({
    clientMatch: true,
    documentsLegible: true,
    correctService: true,
    requiredPagesPresent: true,
    govDocVerified: true,
  });
  const [failedReason, setFailedReason] = useState("");
  const [notes, setNotes] = useState("");

  const handleChecklistToggle = (key: keyof QualityCheckChecklist) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const allChecked = Object.values(checklist).every(Boolean);

  const qcMutation = useMutation({
    mutationFn: () =>
      adminApi.performQualityCheck(applicationId, {
        result,
        checklist,
        notes: notes || undefined,
        failedReason: result === "FAILED" ? failedReason : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-application", applicationId] });
      queryClient.invalidateQueries({ queryKey: ["admin-applications"] });
      onClose();
      if (onPassed) onPassed();
      if (onSuccess) onSuccess();
    },
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Statutory Quality Control (QC) Audit"
      description={`Perform executive compliance verification for dossier #${applicationNumber}.`}
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={result === "PASSED" ? "gold" : "destructive"}
            size="sm"
            isLoading={qcMutation.isPending}
            onClick={() => qcMutation.mutate()}
          >
            {result === "PASSED" ? "Certify Quality Check (PASS)" : "Record QC Failure (REJECT)"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Decision Toggle */}
        <div className="flex rounded-xs border border-border bg-muted/30 p-1">
          <button
            type="button"
            onClick={() => setResult("PASSED")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xs py-2 text-xs font-bold transition-all ${
              result === "PASSED"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <CheckCircle2 className="size-4" />
            <span>Pass Quality Check</span>
          </button>

          <button
            type="button"
            onClick={() => setResult("FAILED")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xs py-2 text-xs font-bold transition-all ${
              result === "FAILED"
                ? "bg-destructive text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <AlertOctagon className="size-4" />
            <span>Fail / Rejection</span>
          </button>
        </div>

        {/* Formal Checklist */}
        <div className="rounded-xs border border-border bg-card p-4 space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
            Statutory Verification Checklist
          </span>

          <label className="flex items-start gap-3 text-xs cursor-pointer select-none">
            <Checkbox
              checked={checklist.clientMatch}
              onChange={() => handleChecklistToggle("clientMatch")}
              className="mt-0.5"
            />
            <div>
              <strong className="text-foreground block">Identity & Registry Name Match</strong>
              <span className="text-muted-foreground">
                Client profile names, KRA PIN, and identity documents strictly match statutory records.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3 text-xs cursor-pointer select-none">
            <Checkbox
              checked={checklist.documentsLegible}
              onChange={() => handleChecklistToggle("documentsLegible")}
              className="mt-0.5"
            />
            <div>
              <strong className="text-foreground block">Document Clarity & High-Resolution</strong>
              <span className="text-muted-foreground">
                All submitted PDF/PNG scans are legible, uncropped, and pass forensic inspection.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3 text-xs cursor-pointer select-none">
            <Checkbox
              checked={checklist.correctService}
              onChange={() => handleChecklistToggle("correctService")}
              className="mt-0.5"
            />
            <div>
              <strong className="text-foreground block">Correct Statutory Classification</strong>
              <span className="text-muted-foreground">
                Service parameters and statutory fees correspond to official Kenyan government gazette schedules.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3 text-xs cursor-pointer select-none">
            <Checkbox
              checked={checklist.requiredPagesPresent}
              onChange={() => handleChecklistToggle("requiredPagesPresent")}
              className="mt-0.5"
            />
            <div>
              <strong className="text-foreground block">Completeness of Multi-Page Filings</strong>
              <span className="text-muted-foreground">
                All annexures, schedules, signature pages, and statutory declarations are attached.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3 text-xs cursor-pointer select-none">
            <Checkbox
              checked={checklist.govDocVerified}
              onChange={() => handleChecklistToggle("govDocVerified")}
              className="mt-0.5"
            />
            <div>
              <strong className="text-foreground block">Registry Seal & Tracking Verified</strong>
              <span className="text-muted-foreground">
                Official government application reference and tracking status confirmed authentic.
              </span>
            </div>
          </label>
        </div>

        {result === "FAILED" && (
          <FormField label="Quality Check Failure Reason" required>
            <Input
              placeholder="e.g. Signature page omitted on CR1 form; please request resubmission"
              value={failedReason}
              onChange={(e) => setFailedReason(e.target.value)}
            />
          </FormField>
        )}

        <FormField label="Internal Audit Notes">
          <Textarea
            placeholder="Record any internal observations for compliance ledger..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </FormField>
      </div>
    </Modal>
  );
}
