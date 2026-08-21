"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, Search, AlertTriangle, CheckCircle2, UserCheck, ArrowRight } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { FormField, Textarea } from "@/components/ui/form-primitives";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { adminApi } from "@/lib/api/admin";

interface AdminStartQcModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AdminStartQcModal({ isOpen, onClose, onSuccess }: AdminStartQcModalProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAppId, setSelectedAppId] = useState("");
  const [priority, setPriority] = useState<"LOW" | "NORMAL" | "HIGH" | "URGENT">("NORMAL");
  const [notes, setNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch eligible candidates
  const { data: candidates = [], isLoading } = useQuery({
    queryKey: ["qc-eligible-applications", searchTerm],
    queryFn: () => adminApi.getQcEligibleApplications(searchTerm),
    enabled: isOpen,
  });

  const selectedCandidate = candidates.find((c) => c.id === selectedAppId);

  const startMutation = useMutation({
    mutationFn: () =>
      adminApi.startQcInspection({
        applicationId: selectedAppId,
        priority,
        notes: notes || undefined,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-qc-queue"] });
      queryClient.invalidateQueries({ queryKey: ["admin-qc-metrics"] });
      onClose();
      if (onSuccess) onSuccess();
      router.push(`/admin/qc/${data.applicationId}`);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || "Failed to start QC inspection.");
    },
  });

  const handleConfirm = () => {
    setErrorMsg(null);
    if (!selectedAppId) {
      setErrorMsg("Please select an application candidate for QC inspection.");
      return;
    }
    if (selectedCandidate && !selectedCandidate.eligible) {
      setErrorMsg(`Selected application cannot proceed: ${selectedCandidate.ineligibilityReason}`);
      return;
    }
    startMutation.mutate();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Start Quality Control Inspection"
      description="Initialize statutory inspection workspace, assign reviewer, and lock compliance scope."
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="gold"
            size="sm"
            isLoading={startMutation.isPending}
            disabled={!selectedAppId || (selectedCandidate && !selectedCandidate.eligible)}
            onClick={handleConfirm}
            leftIcon={<ShieldCheck className="size-4" />}
          >
            Launch QC Workspace
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {errorMsg && (
          <div className="rounded-xs border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Candidate Search */}
        <FormField label="Select Application Candidate for Inspection" required>
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
              <Input
                placeholder="Search candidate by dossier #, client name, or service..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {isLoading ? (
              <div className="p-3 text-center text-xs text-slate-400">Loading candidates...</div>
            ) : candidates.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-500 rounded-md border border-dashed border-slate-200">
                No matching applications found.
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-md divide-y divide-slate-100 bg-white">
                {candidates.map((cand) => (
                  <div
                    key={cand.id}
                    onClick={() => {
                      setSelectedAppId(cand.id);
                      setErrorMsg(null);
                    }}
                    className={`p-2.5 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                      selectedAppId === cand.id ? "bg-amber-50/80 border-l-4 border-amber-500" : "hover:bg-slate-50"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-700">#{cand.applicationNumber}</span>
                        <span className="font-semibold text-slate-800">{cand.service?.name || "Statutory Service"}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Client: {cand.client?.fullName || cand.client?.businessName || cand.client?.email || "Verified Entity"}
                      </div>
                    </div>

                    <div className="text-right flex items-center gap-2">
                      {cand.eligible ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Eligible
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                          <AlertTriangle className="size-3" />
                          Ineligible
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </FormField>

        {/* Selected Candidate Ineligibility Warning */}
        {selectedCandidate && !selectedCandidate.eligible && (
          <div className="rounded-xs border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 space-y-1">
            <strong className="block font-bold">Inspection Warning:</strong>
            <p>{selectedCandidate.ineligibilityReason}</p>
          </div>
        )}

        {/* Selected Candidate Summary */}
        {selectedCandidate && selectedCandidate.eligible && (
          <div className="rounded-xs border border-amber-200/80 bg-amber-50/50 p-3 text-xs space-y-1 text-slate-700">
            <div className="flex justify-between font-bold text-slate-900">
              <span>Ready for Inspection</span>
              <span className="text-amber-700 font-mono">#{selectedCandidate.applicationNumber}</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Launching inspection will transition dossier status to QUALITY_CHECK and open the reviewer workspace.
            </p>
          </div>
        )}

        {/* Priority & Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Inspection Priority">
            <Select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              options={[
                { value: "NORMAL", label: "Normal Priority" },
                { value: "HIGH", label: "High Priority" },
                { value: "URGENT", label: "Urgent Priority" },
                { value: "LOW", label: "Low Priority" },
              ]}
            />
          </FormField>

          <FormField label="Assignee">
            <Input value="Current Admin Officer (Self)" disabled />
          </FormField>
        </div>

        <FormField label="Initial Audit Notes">
          <Textarea
            placeholder="Specify any focused inspection instructions or client observations..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </FormField>
      </div>
    </Modal>
  );
}
