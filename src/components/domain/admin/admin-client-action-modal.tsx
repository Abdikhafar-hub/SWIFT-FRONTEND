"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ListTodo, Send, AlertTriangle, Clock, User } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { FormField, Textarea } from "@/components/ui/form-primitives";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { adminApi } from "@/lib/api/admin";
import type { ClientActionType, ApplicationPriority, Application } from "@/types";

interface AdminClientActionModalProps {
  applicationId?: string;
  applicationNumber?: string;
  applications?: Application[];
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
  applications: passedApplications = [],
  isOpen,
  onClose,
  onSuccess,
  requirements = [],
}: AdminClientActionModalProps) {
  const queryClient = useQueryClient();

  const [selectedAppId, setSelectedAppId] = useState<string>(applicationId || "");
  const [actionType, setActionType] = useState<ClientActionType>("UPLOAD_DOCUMENT");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [priority, setPriority] = useState<ApplicationPriority>("HIGH");
  const [deadline, setDeadline] = useState("");
  const [requirementId, setRequirementId] = useState("");

  // Fetch list of active client applications if not provided by parent
  const { data: appsData, isLoading: isLoadingApps } = useQuery({
    queryKey: ["admin-applications-dropdown-list"],
    queryFn: () => adminApi.getApplications({ page: 1, limit: 100 }),
    enabled: isOpen && passedApplications.length === 0,
  });

  const rawFetchedItems = (appsData as any)?.items || (Array.isArray(appsData) ? appsData : []);
  const applications: Application[] = passedApplications.length > 0 ? passedApplications : rawFetchedItems;

  useEffect(() => {
    if (applicationId) {
      setSelectedAppId(applicationId);
    } else if (applications.length > 0 && !selectedAppId) {
      setSelectedAppId(applications[0].id);
    }
  }, [applicationId, applications, selectedAppId]);

  const activeApp = applications.find((a) => a.id === selectedAppId);
  const activeAppNumber = activeApp?.applicationNumber || applicationNumber || (selectedAppId ? selectedAppId.slice(0, 8) : "");
  const isDropdownLoading = isLoadingApps && passedApplications.length === 0;

  const createActionMutation = useMutation({
    mutationFn: () => {
      if (!selectedAppId) {
        throw new Error("Please select a target client and application dossier.");
      }
      return adminApi.createClientAction(selectedAppId, {
        actionType,
        title,
        description: description + (instructions ? `\n\nInstructions: ${instructions}` : ""),
        priority,
        deadline: deadline || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-application", selectedAppId] });
      queryClient.invalidateQueries({ queryKey: ["admin-applications-actions-queue"] });
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

  const modalTitle = activeAppNumber
    ? `Dispatch Urgent Client Directive • Dossier #${activeAppNumber}`
    : "Dispatch Urgent Client Directive";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
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

        {/* TARGET CLIENT & DOSSIER SELECTION */}
        <FormField label="Target Client & Application Dossier" required>
          <Select
            value={selectedAppId}
            onChange={(e) => setSelectedAppId(e.target.value)}
            options={
              applications.length > 0
                ? applications.map((app) => {
                  const clientName = app.client?.fullName || app.client?.businessName || "Verified Client";
                  const serviceName = app.service?.name || "Statutory Filing";
                  return {
                    value: app.id,
                    label: `${clientName} — Dossier #${app.applicationNumber} (${serviceName})`,
                  };
                })
                : [
                  {
                    value: selectedAppId || "",
                    label: isDropdownLoading
                      ? "Loading active client dossiers..."
                      : activeAppNumber
                        ? `Dossier #${activeAppNumber}`
                        : "No active client dossiers found",
                  },
                ]
            }
            disabled={isDropdownLoading}
          />
        </FormField>

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
            disabled={!selectedAppId || !title.trim() || !description.trim()}
            onClick={() => createActionMutation.mutate()}
          >
            Dispatch Directive to Client
          </Button>
        </div>
      </div>
    </Modal>
  );
}
