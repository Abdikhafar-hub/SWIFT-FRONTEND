"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock, Pause, Play, AlertTriangle, ShieldAlert } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { FormField, Textarea } from "@/components/ui/form-primitives";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { adminApi } from "@/lib/api/admin";

interface AdminSlaModalProps {
  applicationId: string;
  applicationNumber?: string;
  isOpen: boolean;
  mode: "PAUSE" | "RESUME";
  onClose: () => void;
  onSuccess?: () => void;
}

const STATUTORY_PAUSE_REASONS = [
  { value: "AWAITING_CLIENT_DOCUMENT", label: "Awaiting Client Document / KYC Submission" },
  { value: "GOVERNMENT_REGISTRY_QUERY", label: "Government Registry Query / Agency Verification Pending" },
  { value: "OFFICIAL_REGISTRY_DOWNTIME", label: "Official Registry Portal Maintenance / Outage (eCitizen / BRS)" },
  { value: "CLIENT_CONFIRMATION_REQUIRED", label: "Statutory Approval Declaration Confirmation Required" },
  { value: "FEE_DISCREPANCY_CLEARANCE", label: "Statutory Registry Fee Discrepancy Clearance" },
  { value: "COURT_OR_LEGAL_INTERVENTION", label: "Legal Notice / Court Order / Statutory Injunction" },
  { value: "CUSTOM", label: "Other Official Compliance Justification" },
];

export function AdminSlaModal({
  applicationId,
  applicationNumber,
  isOpen,
  mode,
  onClose,
  onSuccess,
}: AdminSlaModalProps) {
  const queryClient = useQueryClient();
  const isPause = mode === "PAUSE";

  const [selectedReasonType, setSelectedReasonType] = useState(STATUTORY_PAUSE_REASONS[0].value);
  const [customReason, setCustomReason] = useState("");
  const [pausedUntil, setPausedUntil] = useState("");
  const [resumeReason, setResumeReason] = useState("");

  const pauseMutation = useMutation({
    mutationFn: () => {
      const finalReason =
        selectedReasonType === "CUSTOM"
          ? customReason
          : `${STATUTORY_PAUSE_REASONS.find((r) => r.value === selectedReasonType)?.label || selectedReasonType}${customReason ? ` - ${customReason}` : ""
          }`;

      return adminApi.pauseSla(applicationId, {
        reason: finalReason,
        pausedUntil: pausedUntil || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-application", applicationId] });
      queryClient.invalidateQueries({ queryKey: ["admin-sla-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["admin-work-queue"] });
      queryClient.invalidateQueries({ queryKey: ["admin-applications"] });
      if (onSuccess) onSuccess();
      onClose();
    },
  });

  const resumeMutation = useMutation({
    mutationFn: () =>
      adminApi.resumeSla(applicationId, {
        reason: resumeReason || "Statutory hold resolved, resuming active SLA clock.",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-application", applicationId] });
      queryClient.invalidateQueries({ queryKey: ["admin-sla-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["admin-work-queue"] });
      queryClient.invalidateQueries({ queryKey: ["admin-applications"] });
      if (onSuccess) onSuccess();
      onClose();
    },
  });

  const isPending = pauseMutation.isPending || resumeMutation.isPending;
  const error = pauseMutation.error || resumeMutation.error;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isPause
          ? `Pause Statutory SLA Clock • Dossier #${applicationNumber || applicationId.slice(0, 8)}`
          : `Resume Statutory SLA Clock • Dossier #${applicationNumber || applicationId.slice(0, 8)}`
      }
      description={
        isPause
          ? "Halts statutory SLA countdown timer. All SLA pauses require an immutable compliance reason."
          : "Reactivates statutory countdown timer for this application."
      }
      size="md"
    >
      <div className="space-y-4 text-xs">
        {error && (
          <div className="rounded-xs border border-destructive/30 bg-destructive/10 p-3 text-destructive font-semibold flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0" />
            <span>{(error as Error).message || "Failed to execute SLA mutation"}</span>
          </div>
        )}

        {isPause ? (
          <>
            <div className="rounded-xs border border-gold/40 bg-gold/5 p-3 flex items-start gap-2.5">
              <ShieldAlert className="size-4 text-gold shrink-0 mt-0.5" />
              <div className="text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Compliance Notice:</strong> SLA clock pauses are audited
                in the statutory timeline and visible to executive compliance officers.
              </div>
            </div>

            <FormField label="Statutory Pause Justification Category" required>
              <Select
                value={selectedReasonType}
                onChange={(e) => setSelectedReasonType(e.target.value)}
                options={STATUTORY_PAUSE_REASONS}
              />
            </FormField>

            <FormField label="Detailed Audit Justification / Remarks" required={selectedReasonType === "CUSTOM"}>
              <Textarea
                placeholder="Provide official context or query reference details..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                rows={3}
              />
            </FormField>

            <FormField label="Expected Resumption Date (Optional)">
              <Input
                type="datetime-local"
                value={pausedUntil}
                onChange={(e) => setPausedUntil(e.target.value)}
              />
            </FormField>
          </>
        ) : (
          <>
            <div className="rounded-xs border border-emerald-500/30 bg-emerald-500/10 p-3 flex items-start gap-2.5">
              <Play className="size-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Reactivating Timer:</strong> The SLA elapsed duration
                will resume calculations from the current timestamp without penalizing the paused duration.
              </div>
            </div>

            <FormField label="Resumption Audit Notes">
              <Textarea
                placeholder="Document resolution details (e.g. client provided required PIN certificate)..."
                value={resumeReason}
                onChange={(e) => setResumeReason(e.target.value)}
                rows={3}
              />
            </FormField>
          </>
        )}

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          {isPause ? (
            <Button
              variant="gold"
              size="sm"
              leftIcon={<Pause className="size-3.5" />}
              isLoading={pauseMutation.isPending}
              disabled={selectedReasonType === "CUSTOM" && !customReason.trim()}
              onClick={() => pauseMutation.mutate()}
            >
              Confirm SLA Pause
            </Button>
          ) : (
            <Button
              variant="gold"
              size="sm"
              leftIcon={<Play className="size-3.5" />}
              isLoading={resumeMutation.isPending}
              onClick={() => resumeMutation.mutate()}
            >
              Resume SLA Clock
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
