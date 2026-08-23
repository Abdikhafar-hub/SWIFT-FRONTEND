"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Play,
  Pause,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  UserCheck,
  UserX,
  XCircle,
  Flag,
  RotateCcw,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { FormField, Textarea } from "@/components/ui/form-primitives";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { StatusBadge, SlaBadge, PriorityBadge } from "@/components/domain/status-badges";
import { adminApi } from "@/lib/api/admin";
import { parseApiError } from "@/lib/utils/error";
import { notify } from "@/lib/notify";
import type { Application, ApplicationStatus, ApplicationPriority } from "@/types";

interface AdminStatusControlProps {
  application: Application;
  onUpdated?: () => void;
}

const ALL_STATUSES: Array<{ value: ApplicationStatus; label: string }> = [
  { value: "NEW", label: "New Application" },
  { value: "QUALIFICATION", label: "Qualification" },
  { value: "REQUIREMENTS_PENDING", label: "Requirements Pending" },
  { value: "DOCUMENT_REVIEW", label: "Document Review" },
  { value: "READY_FOR_SUBMISSION", label: "Ready for Submission" },
  { value: "SUBMITTED", label: "Submitted to Registry" },
  { value: "GOVERNMENT_PROCESSING", label: "Government Processing" },
  { value: "ADDITIONAL_INFORMATION_REQUIRED", label: "Additional Info Required" },
  { value: "APPROVED", label: "Statutory Approval" },
  { value: "DOCUMENT_RECEIVED", label: "Certificate Received" },
  { value: "QUALITY_CHECK", label: "Quality Control (QC)" },
  { value: "READY_FOR_DELIVERY", label: "Ready for Delivery" },
  { value: "DELIVERED", label: "Delivered to Client" },
  { value: "CLOSED", label: "Closed / Completed" },
  { value: "ON_HOLD", label: "On Hold" },
  { value: "CANCELLED", label: "Cancelled" },
];

export function AdminStatusControl({ application, onUpdated }: AdminStatusControlProps) {
  const queryClient = useQueryClient();

  // Modals state
  const [isTransitionModalOpen, setIsTransitionModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<ApplicationStatus>(application.status);
  const [transitionReason, setTransitionReason] = useState("");
  const [transitionNotes, setTransitionNotes] = useState("");

  const [isPauseSlaModalOpen, setIsPauseSlaModalOpen] = useState(false);
  const [pauseReason, setPauseReason] = useState<"WAITING_ON_CLIENT" | "WAITING_ON_GOVERNMENT" | "SYSTEM_DELAY" | "FORCE_MAJEURE" | "OTHER">("WAITING_ON_CLIENT");
  const [pauseNotes, setPauseNotes] = useState("");

  const [isPriorityModalOpen, setIsPriorityModalOpen] = useState(false);
  const [targetPriority, setTargetPriority] = useState<ApplicationPriority>(application.priority);
  const [priorityReason, setPriorityReason] = useState("");

  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [closeReason, setCloseReason] = useState("Fulfillment completed successfully");
  const [closeNotes, setCloseNotes] = useState("");

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-application", application.id] });
    queryClient.invalidateQueries({ queryKey: ["admin-applications"] });
    queryClient.invalidateQueries({ queryKey: ["admin-work-queue"] });
    if (onUpdated) onUpdated();
  };

  // Status transition mutation
  const transitionMutation = useMutation({
    mutationFn: (payload: { toStatus: ApplicationStatus; reason?: string; notes?: string }) => {
      notify.loading(`Transitioning state to ${payload.toStatus}...`, { id: "status-trans" });
      return adminApi.transitionStatus(application.id, payload);
    },
    onSuccess: (_, variables) => {
      setIsTransitionModalOpen(false);
      setTransitionReason("");
      setTransitionNotes("");
      notify.success(`Application transition to ${variables.toStatus} complete!`, { id: "status-trans" });
      invalidate();
    },
    onError: (err: any) => {
      notify.error(err, { id: "status-trans", title: "Status Transition Failed" });
    },
  });

  // Priority mutation
  const priorityMutation = useMutation({
    mutationFn: (payload: { priority: ApplicationPriority; reason?: string }) => {
      notify.loading("Updating priority tier...", { id: "priority-upd" });
      return adminApi.updatePriority(application.id, payload);
    },
    onSuccess: (_, variables) => {
      setIsPriorityModalOpen(false);
      setPriorityReason("");
      notify.success(`Priority tier updated to ${variables.priority}!`, { id: "priority-upd" });
      invalidate();
    },
    onError: (err: any) => {
      notify.error(err, { id: "priority-upd", title: "Priority Update Failed" });
    },
  });

  // SLA Pause mutation
  const pauseSlaMutation = useMutation({
    mutationFn: (payload: { reason: "WAITING_ON_CLIENT" | "WAITING_ON_GOVERNMENT" | "SYSTEM_DELAY" | "FORCE_MAJEURE" | "OTHER"; notes?: string }) => {
      notify.loading("Pausing SLA clock...", { id: "sla-pause" });
      return adminApi.pauseSla(application.id, payload);
    },
    onSuccess: () => {
      setIsPauseSlaModalOpen(false);
      setPauseNotes("");
      notify.success("SLA turnaround clock paused.", { id: "sla-pause" });
      invalidate();
    },
    onError: (err: any) => {
      notify.error(err, { id: "sla-pause", title: "SLA Pause Failed" });
    },
  });

  // SLA Resume mutation
  const resumeSlaMutation = useMutation({
    mutationFn: () => {
      notify.loading("Resuming SLA clock...", { id: "sla-resume" });
      return adminApi.resumeSla(application.id);
    },
    onSuccess: () => {
      notify.success("SLA turnaround clock resumed.", { id: "sla-resume" });
      invalidate();
    },
    onError: (err: any) => {
      notify.error(err, { id: "sla-resume", title: "SLA Resume Failed" });
    },
  });

  // Close mutation
  const closeMutation = useMutation({
    mutationFn: (payload: { reason: string; completionNotes?: string }) => {
      notify.loading("Closing dossier...", { id: "close-app" });
      return adminApi.closeApplication(application.id, payload);
    },
    onSuccess: () => {
      setIsCloseModalOpen(false);
      setCloseReason("");
      setCloseNotes("");
      notify.success("Statutory application dossier closed and archived.", { id: "close-app" });
      invalidate();
    },
    onError: (err: any) => {
      notify.error(err, { id: "close-app", title: "Dossier Closure Failed" });
    },
  });

  const isSlaPaused = Boolean(application.pausedAt);

  return (
    <div className="space-y-4">
      <Card padding="md">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Current State Badges */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Lifecycle State
              </span>
              <div>
                <StatusBadge status={application.status} size="md" />
              </div>
            </div>

            <div className="h-8 w-px bg-border hidden sm:block" />

            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                SLA Compliance
              </span>
              <div>
                <SlaBadge status={application.slaStatus} size="md" />
              </div>
            </div>

            <div className="h-8 w-px bg-border hidden sm:block" />

            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Priority Tier
              </span>
              <div>
                <PriorityBadge priority={application.priority} size="md" />
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="gold"
              size="sm"
              leftIcon={<ArrowRight className="size-4" />}
              onClick={() => {
                setTargetStatus(application.status);
                setIsTransitionModalOpen(true);
              }}
            >
              Transition State
            </Button>

            {isSlaPaused ? (
              <Button
                variant="outline"
                size="sm"
                className="text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                leftIcon={<Play className="size-4" />}
                isLoading={resumeSlaMutation.isPending}
                onClick={() => resumeSlaMutation.mutate()}
              >
                Resume SLA
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="text-amber-600 border-amber-500/30 hover:bg-amber-500/10"
                leftIcon={<Pause className="size-4" />}
                onClick={() => setIsPauseSlaModalOpen(true)}
              >
                Pause SLA
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              leftIcon={<Flag className="size-4" />}
              onClick={() => {
                setTargetPriority(application.priority);
                setIsPriorityModalOpen(true);
              }}
            >
              Priority
            </Button>

            {application.status !== "CLOSED" && application.status !== "CANCELLED" && (
              <Button
                variant="outline"
                size="sm"
                className="text-destructive border-destructive/30 hover:bg-destructive/10"
                leftIcon={<CheckCircle2 className="size-4" />}
                onClick={() => setIsCloseModalOpen(true)}
              >
                Close Dossier
              </Button>
            )}
          </div>
        </div>

        {isSlaPaused && (
          <div className="mt-4 flex items-center gap-2 rounded-xs border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-200">
            <Pause className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              <strong>SLA Clock Paused</strong> since {new Date(application.pausedAt!).toLocaleString("en-KE")}. Elapsed pause duration: {application.totalPausedDuration} minutes.
            </span>
          </div>
        )}
      </Card>

      {/* MODAL 1: Status Transition */}
      <Modal
        isOpen={isTransitionModalOpen}
        onClose={() => setIsTransitionModalOpen(false)}
        title="Application State Transition"
        description="Advance or rollback the statutory application in the strict lifecycle state machine."
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsTransitionModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="gold"
              size="sm"
              isLoading={transitionMutation.isPending}
              onClick={() =>
                transitionMutation.mutate({
                  toStatus: targetStatus,
                  reason: transitionReason || undefined,
                  notes: transitionNotes || undefined,
                })
              }
            >
              Confirm Transition
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormField label="Target State" required>
            <Select
              value={targetStatus}
              onChange={(e) => setTargetStatus(e.target.value as ApplicationStatus)}
              options={ALL_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
            />
          </FormField>

          <FormField label="Statutory Reason / Transition Justification">
            <Input
              placeholder="e.g. Requirement verification approved; ready for eCitizen filing"
              value={transitionReason}
              onChange={(e) => setTransitionReason(e.target.value)}
            />
          </FormField>

          <FormField label="Internal Operational Notes">
            <Textarea
              placeholder="Optional notes recorded to internal activity ledger..."
              value={transitionNotes}
              onChange={(e) => setTransitionNotes(e.target.value)}
              rows={3}
            />
          </FormField>

          {transitionMutation.isError && (
            <div className="flex items-center gap-2 rounded-xs bg-destructive/10 p-3 text-xs text-destructive">
              <AlertTriangle className="size-4 shrink-0" />
              <span>{(transitionMutation.error as Error)?.message || "Failed to update status"}</span>
            </div>
          )}
        </div>
      </Modal>

      {/* MODAL 2: Pause SLA */}
      <Modal
        isOpen={isPauseSlaModalOpen}
        onClose={() => setIsPauseSlaModalOpen(false)}
        title="Pause Application SLA Clock"
        description="Pause the operational turnaround clock when awaiting client submissions, official government systems, or registry delays."
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsPauseSlaModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="gold"
              size="sm"
              isLoading={pauseSlaMutation.isPending}
              onClick={() =>
                pauseSlaMutation.mutate({
                  reason: pauseReason,
                  notes: pauseNotes || undefined,
                })
              }
            >
              Pause Turnaround SLA
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormField label="Pause Justification Reason" required>
            <Select
              value={pauseReason}
              onChange={(e) => setPauseReason(e.target.value as any)}
              options={[
                { value: "WAITING_ON_CLIENT", label: "Waiting on Client (Documents / Actions)" },
                { value: "WAITING_ON_GOVERNMENT", label: "Waiting on Government Registry (eCitizen / BRS)" },
                { value: "SYSTEM_DELAY", label: "Official Government Portal Outage / Maintenance" },
                { value: "FORCE_MAJEURE", label: "Gazetted Public Holiday / Force Majeure" },
                { value: "OTHER", label: "Other Operational Exception" },
              ]}
            />
          </FormField>

          <FormField label="Operational Context / Notes">
            <Textarea
              placeholder="Provide specific justification notes for SLA pause audit log..."
              value={pauseNotes}
              onChange={(e) => setPauseNotes(e.target.value)}
              rows={3}
            />
          </FormField>

          {pauseSlaMutation.isError && (
            <div className="flex items-center gap-2 rounded-xs bg-destructive/10 p-3 text-xs text-destructive">
              <AlertTriangle className="size-4 shrink-0" />
              <span>{(pauseSlaMutation.error as Error)?.message || "Failed to pause SLA"}</span>
            </div>
          )}
        </div>
      </Modal>

      {/* MODAL 3: Update Priority */}
      <Modal
        isOpen={isPriorityModalOpen}
        onClose={() => setIsPriorityModalOpen(false)}
        title="Update Operational Priority"
        description="Set executive priority for urgent client requests or expedite statutory handling."
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsPriorityModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="gold"
              size="sm"
              isLoading={priorityMutation.isPending}
              onClick={() =>
                priorityMutation.mutate({
                  priority: targetPriority,
                  reason: priorityReason || undefined,
                })
              }
            >
              Save Priority
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormField label="Priority Tier" required>
            <Select
              value={targetPriority}
              onChange={(e) => setTargetPriority(e.target.value as ApplicationPriority)}
              options={[
                { value: "LOW", label: "Low Priority" },
                { value: "NORMAL", label: "Normal Priority (Standard SLA)" },
                { value: "HIGH", label: "High Priority (Expedited)" },
                { value: "URGENT", label: "Urgent Priority (Direct Officer Focus)" },
              ]}
            />
          </FormField>

          <FormField label="Reason for Priority Change">
            <Input
              placeholder="e.g. Client requested emergency 24h company incorporation"
              value={priorityReason}
              onChange={(e) => setPriorityReason(e.target.value)}
            />
          </FormField>

          {priorityMutation.isError && (
            <div className="flex items-center gap-2 rounded-xs bg-destructive/10 p-3 text-xs text-destructive">
              <AlertTriangle className="size-4 shrink-0" />
              <span>{(priorityMutation.error as Error)?.message || "Failed to update priority"}</span>
            </div>
          )}
        </div>
      </Modal>

      {/* MODAL 4: Close Application */}
      <Modal
        isOpen={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        title="Close Statutory Dossier"
        description="Permanently complete and archive this statutory application record."
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsCloseModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="gold"
              size="sm"
              isLoading={closeMutation.isPending}
              onClick={() =>
                closeMutation.mutate({
                  reason: closeReason,
                  completionNotes: closeNotes || undefined,
                })
              }
            >
              Confirm Closure
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormField label="Closure Reason" required>
            <Input
              placeholder="e.g. Certificate issued and confirmed delivered to client"
              value={closeReason}
              onChange={(e) => setCloseReason(e.target.value)}
            />
          </FormField>

          <FormField label="Final Completion Notes">
            <Textarea
              placeholder="Archival notes, registry confirmation reference, or closing remarks..."
              value={closeNotes}
              onChange={(e) => setCloseNotes(e.target.value)}
              rows={3}
            />
          </FormField>

          {closeMutation.isError && (
            <div className="flex items-center gap-2 rounded-xs bg-destructive/10 p-3 text-xs text-destructive">
              <AlertTriangle className="size-4 shrink-0" />
              <span>{(closeMutation.error as Error)?.message || "Failed to close dossier"}</span>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
