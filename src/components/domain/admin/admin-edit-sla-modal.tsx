"use client";

import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit, AlertTriangle, ShieldAlert, Calendar } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { FormField, Textarea } from "@/components/ui/form-primitives";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { adminApi } from "@/lib/api/admin";

interface AdminEditSlaModalProps {
  record: any | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Low Priority" },
  { value: "NORMAL", label: "Normal Priority" },
  { value: "HIGH", label: "High Priority" },
  { value: "URGENT", label: "Urgent Priority" },
];

export function AdminEditSlaModal({ record, isOpen, onClose, onSuccess }: AdminEditSlaModalProps) {
  const queryClient = useQueryClient();

  const [priority, setPriority] = useState<"LOW" | "NORMAL" | "HIGH" | "URGENT">("NORMAL");
  const [dueAt, setDueAt] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (record) {
      setPriority(record.priority || "NORMAL");
      if (record.dueAt || record.slaDueAt) {
        const d = new Date(record.dueAt || record.slaDueAt);
        setDueAt(d.toISOString().slice(0, 16));
      } else {
        setDueAt("");
      }
      setReason("");
    }
  }, [record]);

  const updateMutation = useMutation({
    mutationFn: () => {
      const payload: any = {
        priority,
        reason,
      };
      if (dueAt) {
        payload.dueAt = new Date(dueAt).toISOString();
      }

      return adminApi.updateSlaRecord(record.id || record.applicationId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-sla-records"] });
      queryClient.invalidateQueries({ queryKey: ["admin-sla-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["admin-sla-detail", record?.id || record?.applicationId] });
      queryClient.invalidateQueries({ queryKey: ["admin-applications"] });
      if (onSuccess) onSuccess();
      onClose();
    },
  });

  if (!record) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Modify SLA Parameters • Dossier #${record.applicationNumber || record.id?.slice(0, 8)}`}
      description="Update priority tier, target due date, or extension parameters with audit trail logging."
      size="md"
    >
      <div className="space-y-4 text-xs">
        {updateMutation.error && (
          <div className="rounded-xs border border-destructive/30 bg-destructive/10 p-3 text-destructive font-semibold flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0" />
            <span>{(updateMutation.error as Error).message || "Failed to update SLA parameters"}</span>
          </div>
        )}

        <div className="rounded-xs border border-gold/40 bg-gold/5 p-3 flex items-start gap-2.5">
          <ShieldAlert className="size-4 text-gold shrink-0 mt-0.5" />
          <div className="text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Audit Requirement:</strong> SLA deadline or priority modifications require an official justification that is logged in the compliance audit trail.
          </div>
        </div>

        <FormField label="Priority Tier" required>
          <Select
            value={priority}
            onChange={(e) => setPriority(e.target.value as any)}
            options={PRIORITY_OPTIONS}
          />
        </FormField>

        <FormField label="Target Due Date & Time" required>
          <Input
            type="datetime-local"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
          />
        </FormField>

        <FormField label="Modification Audit Justification / Context" required>
          <Textarea
            placeholder="Explain why the SLA parameters or due date were altered..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </FormField>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
          <Button variant="outline" size="sm" onClick={onClose} disabled={updateMutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="gold"
            size="sm"
            leftIcon={<Edit className="size-3.5" />}
            isLoading={updateMutation.isPending}
            disabled={!reason.trim()}
            onClick={() => updateMutation.mutate()}
          >
            Save SLA Parameters
          </Button>
        </div>
      </div>
    </Modal>
  );
}
