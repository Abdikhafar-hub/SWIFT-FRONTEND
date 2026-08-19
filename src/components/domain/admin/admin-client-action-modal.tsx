"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ListTodo, Send, AlertTriangle, Clock } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { FormField, Textarea } from "@/components/ui/form-primitives";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { adminApi } from "@/lib/api/admin";
import type { ClientActionType, ApplicationPriority } from "@/types";

interface AdminClientActionModalProps {
  applicationId: string;
  applicationNumber?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  requirements?: Array<{ id: string; name: string }>;
}

const ACTION_TYPES: Array<{ value: ClientActionType; label: string }> = [
  { value: "UPLOAD_DOCUMENT", label: "Upload Mandatory Document" },
  { value: "REPLACE_DOCUMENT", label: "Replace Rejected / Illegible Document" },
  { value: "PROVIDE_INFORMATION", label: "Provide Additional Statutory Information" },
  { value: "CONFIRM_INFORMATION", label: "Confirm Information / Identity Details" },
  { value: "MAKE_PAYMENT", label: "Settle Outstanding Fee / Balance" },
  { value: "APPROVE_DECLARATION", label: "Approve Official Declaration" },
  { value: "SIGN_DECLARATION", label: "Sign Statutory Affidavits" },
  { value: "OTHER", label: "Other Directive" },
];

const PRIORITIES: Array<{ value: ApplicationPriority; label: string }> = [
  { value: "URGENT", label: "URGENT (Blocks Filing Submission)" },
  { value: "HIGH", label: "HIGH Priority" },
  { value: "NORMAL", label: "NORMAL Priority" },
  { value: "LOW", label: "LOW Priority" },
];

export function AdminClientActionModal({
  applicationId,
  applicationNumber,
  isOpen,
  onClose,
  onSuccess,
  requirements = [],
}: AdminClientActionModalProps) {
  const queryClient = useQueryClient();

  const [actionType, setActionType] = useState<ClientActionType>("UPLOAD_DOCUMENT");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [priority, setPriority] = useState<ApplicationPriority>("HIGH");
  const [deadline, setDeadline] = useState("");
  const [requirementId, setRequirementId] = useState("");

  const createActionMutation = useMutation({
    mutationFn: () =>
      adminApi.createClientAction(applicationId, {
        actionType,
        title,
        description: description + (instructions ? `\n\nInstructions: ${instructions}` : ""),
        priority,
        deadline: deadline || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-application", applicationId] });
      queryClient.invalidateQueries({ queryKey: ["admin-actions-list"] });
      queryClient.invalidateQueries({ queryKey: ["admin-work-queue"] });
      if (onSuccess) onSuccess();
      onClose();
      // Reset form
      setTitle("");
      setDescription("");
      setInstructions("");
      setDeadline("");
    },
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Dispatch Urgent Client Directive • Dossier #${applicationNumber || applicationId.slice(0, 8)}`}
      description="Create a mandatory action item on the client's portal with real-time notifications."
      size="lg"
    >
      <div className="space-y-4 text-xs">
        {createActionMutation.isError && (
          <div className="rounded-xs border border-destructive/30 bg-destructive/10 p-3 text-destructive font-semibold flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0" />
            <span>{(createActionMutation.error as Error).message || "Failed to create client action"}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Directive Type" required>
            <Select
              value={actionType}
              onChange={(e) => setActionType(e.target.value as ClientActionType)}
              options={ACTION_TYPES}
            />
          </FormField>

          <FormField label="Operational Urgency" required>
            <Select
              value={priority}
              onChange={(e) => setPriority(e.target.value as ApplicationPriority)}
              options={PRIORITIES}
            />
          </FormField>
        </div>

        {requirements.length > 0 && (
          <FormField label="Link to Specific Statutory Requirement (Optional)">
            <Select
              value={requirementId}
              onChange={(e) => setRequirementId(e.target.value)}
              options={[
                { value: "", label: "General Application Action (No specific requirement)" },
                ...requirements.map((r) => ({ value: r.id, label: r.name })),
              ]}
            />
          </FormField>
        )}

        <FormField label="Directive Headline" required>
          <Input
            placeholder="e.g. Upload Certified KRA PIN Certificate with QR Code"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </FormField>

        <FormField label="Directive Explanation & Context" required>
          <Textarea
            placeholder="Clearly explain what the client must do and why it is required for registry submission..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </FormField>

        <FormField label="Specific Client Instructions / Guidelines (Optional)">
          <Textarea
            placeholder="e.g. Ensure the scan is clear, in PDF or JPEG format, and not cropped."
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={2}
          />
        </FormField>

        <FormField label="Fulfillment Deadline">
          <Input
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </FormField>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
          <Button variant="outline" size="sm" onClick={onClose} disabled={createActionMutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="gold"
            size="sm"
            leftIcon={<Send className="size-3.5" />}
            isLoading={createActionMutation.isPending}
            disabled={!title.trim() || !description.trim()}
            onClick={() => createActionMutation.mutate()}
          >
            Dispatch Directive to Client
          </Button>
        </div>
      </div>
    </Modal>
  );
}
