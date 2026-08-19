"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Landmark, Send, AlertTriangle } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { FormField, Textarea } from "@/components/ui/form-primitives";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { adminApi } from "@/lib/api/admin";

interface AdminGovernmentSubmissionModalProps {
  applicationId: string;
  applicationNumber?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const REGISTRY_PLATFORMS = [
  { value: "BRS", label: "Business Registration Service (BRS / BRS Portal)" },
  { value: "eCitizen", label: "eCitizen Statutory Services Gateway" },
  { value: "Ardhi", label: "ArdhiSasa National Land Information System" },
  { value: "iTax", label: "KRA iTax Revenue Authority Portal" },
  { value: "TIMS", label: "NTSA TIMS Transport Information System" },
  { value: "Immigration", label: "Department of Immigration Services" },
  { value: "DCI", label: "Directorate of Criminal Investigations (DCI / Police Clearance)" },
  { value: "MFA", label: "Ministry of Foreign Affairs (Apostille / Authentication)" },
  { value: "OTHER", label: "Other Official Government Portal" },
];

export function AdminGovernmentSubmissionModal({
  applicationId,
  applicationNumber,
  isOpen,
  onClose,
  onSuccess,
}: AdminGovernmentSubmissionModalProps) {
  const queryClient = useQueryClient();

  const [platform, setPlatform] = useState("BRS");
  const [governmentAgency, setGovernmentAgency] = useState("Business Registration Service");
  const [governmentService, setGovernmentService] = useState("");
  const [externalReference, setExternalReference] = useState("");
  const [portalUrl, setPortalUrl] = useState("");
  const [notes, setNotes] = useState("");

  const createSubmissionMutation = useMutation({
    mutationFn: () =>
      adminApi.createGovernmentRecord(applicationId, {
        platform,
        governmentAgency,
        governmentService: governmentService || undefined,
        externalReference: externalReference || undefined,
        portalUrl: portalUrl || undefined,
        notes: notes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-application", applicationId] });
      queryClient.invalidateQueries({ queryKey: ["admin-government-queue"] });
      queryClient.invalidateQueries({ queryKey: ["admin-readiness", applicationId] });
      if (onSuccess) onSuccess();
      onClose();
      // Reset form
      setGovernmentService("");
      setExternalReference("");
      setPortalUrl("");
      setNotes("");
    },
  });

  const handlePlatformChange = (val: string) => {
    setPlatform(val);
    if (val === "BRS") setGovernmentAgency("Business Registration Service");
    else if (val === "eCitizen") setGovernmentAgency("eCitizen Digital Services");
    else if (val === "Ardhi") setGovernmentAgency("Ministry of Lands & Physical Planning");
    else if (val === "iTax") setGovernmentAgency("Kenya Revenue Authority (KRA)");
    else if (val === "TIMS") setGovernmentAgency("National Transport and Safety Authority (NTSA)");
    else if (val === "Immigration") setGovernmentAgency("Department of Immigration Services");
    else if (val === "DCI") setGovernmentAgency("Directorate of Criminal Investigations");
    else if (val === "MFA") setGovernmentAgency("Ministry of Foreign Affairs");
    else setGovernmentAgency("");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Register Statutory Agency Submission • Dossier #${applicationNumber || applicationId.slice(0, 8)}`}
      description="Record official agency filing reference to initiate live government tracking."
      size="lg"
    >
      <div className="space-y-4 text-xs">
        {createSubmissionMutation.isError && (
          <div className="rounded-xs border border-destructive/30 bg-destructive/10 p-3 text-destructive font-semibold flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0" />
            <span>{(createSubmissionMutation.error as Error).message || "Failed to record submission"}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Statutory Registry Gateway" required>
            <Select
              value={platform}
              onChange={(e) => handlePlatformChange(e.target.value)}
              options={REGISTRY_PLATFORMS}
            />
          </FormField>

          <FormField label="Government Department / Authority" required>
            <Input
              value={governmentAgency}
              onChange={(e) => setGovernmentAgency(e.target.value)}
              placeholder="e.g. Registrar of Companies"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Government Service Designation">
            <Input
              value={governmentService}
              onChange={(e) => setGovernmentService(e.target.value)}
              placeholder="e.g. Business Name Registration (BN-2)"
            />
          </FormField>

          <FormField label="External Tracking / Application Reference">
            <Input
              value={externalReference}
              onChange={(e) => setExternalReference(e.target.value)}
              placeholder="e.g. BRS-BN-2026-987654"
            />
          </FormField>
        </div>

        <FormField label="Official Registry Portal URL (Optional)">
          <Input
            value={portalUrl}
            onChange={(e) => setPortalUrl(e.target.value)}
            placeholder="https://brs.ecitizen.go.ke/applications/..."
          />
        </FormField>

        <FormField label="Submission Notes & Agency Receipt Remarks">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Document any filing notes, specific officer, or payment confirmation details..."
            rows={3}
          />
        </FormField>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
          <Button variant="outline" size="sm" onClick={onClose} disabled={createSubmissionMutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="gold"
            size="sm"
            leftIcon={<Landmark className="size-3.5" />}
            isLoading={createSubmissionMutation.isPending}
            disabled={!governmentAgency.trim()}
            onClick={() => createSubmissionMutation.mutate()}
          >
            Record Agency Submission
          </Button>
        </div>
      </div>
    </Modal>
  );
}
