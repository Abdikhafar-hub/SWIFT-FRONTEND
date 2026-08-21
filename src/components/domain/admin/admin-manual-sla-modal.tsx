"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Clock,
  Plus,
  AlertTriangle,
  ShieldAlert,
  Search,
  CheckCircle2,
  Calendar,
  AlertCircle,
  FileText,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { FormField, Textarea } from "@/components/ui/form-primitives";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { adminApi } from "@/lib/api/admin";

interface AdminManualSlaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const SLA_TYPES = [
  { value: "STANDARD", label: "Standard SLA (48 Hours)", defaultHours: 48 },
  { value: "PRIORITY", label: "Priority Expedited (24 Hours)", defaultHours: 24 },
  { value: "URGENT", label: "Urgent Same-Day (12 Hours)", defaultHours: 12 },
  { value: "CUSTOM", label: "Custom Duration", defaultHours: 72 },
];

const DURATION_UNITS = [
  { value: "HOURS", label: "Hours" },
  { value: "DAYS", label: "Days" },
  { value: "MINUTES", label: "Minutes" },
];

const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Low Priority" },
  { value: "NORMAL", label: "Normal Priority" },
  { value: "HIGH", label: "High Priority" },
  { value: "URGENT", label: "Urgent Priority" },
];

const INITIAL_STATES = [
  { value: "ON_TRACK", label: "On Track (Compliant)" },
  { value: "AT_RISK", label: "At Risk (Nearing Deadline)" },
  { value: "PAUSED", label: "Paused (Statutory Hold)" },
  { value: "BREACHED", label: "Breached (Overdue)" },
];

export function AdminManualSlaModal({ isOpen, onClose, onSuccess }: AdminManualSlaModalProps) {
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAppId, setSelectedAppId] = useState("");
  const [slaType, setSlaType] = useState("STANDARD");
  const [durationValue, setDurationValue] = useState(48);
  const [durationUnit, setDurationUnit] = useState<"DAYS" | "HOURS" | "MINUTES">("HOURS");
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString().slice(0, 16));
  const [dueAt, setDueAt] = useState(() => new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().slice(0, 16));

  const [isManualOverride, setIsManualOverride] = useState(false);
  const [priority, setPriority] = useState<"LOW" | "NORMAL" | "HIGH" | "URGENT">("NORMAL");
  const [initialSlaState, setInitialSlaState] = useState<"ON_TRACK" | "AT_RISK" | "PAUSED" | "BREACHED">("ON_TRACK");
  const [reason, setReason] = useState("");

  // Fetch applications for searchable dropdown
  const { data: appsData, isLoading: isLoadingApps } = useQuery({
    queryKey: ["admin-applications-search", searchQuery],
    queryFn: () => adminApi.getApplications({ search: searchQuery, limit: 15 }),
    enabled: isOpen,
  });

  const rawFetchedItems = (appsData as any)?.items || (Array.isArray(appsData) ? appsData : []);
  const applications = rawFetchedItems;
  const selectedApp = applications.find((a: any) => a.id === selectedAppId);

  // Auto calculate due date when start date, duration, or unit changes
  useEffect(() => {
    if (isManualOverride || !startedAt) return;
    try {
      const startMs = new Date(startedAt).getTime();
      let addedMs = durationValue * 60 * 60 * 1000;
      if (durationUnit === "DAYS") addedMs = durationValue * 24 * 60 * 60 * 1000;
      if (durationUnit === "MINUTES") addedMs = durationValue * 60 * 1000;

      const calcDueDate = new Date(startMs + addedMs);
      setDueAt(calcDueDate.toISOString().slice(0, 16));
    } catch {
      // Invalid date input ignore
    }
  }, [startedAt, durationValue, durationUnit, isManualOverride]);

  // Handle preset change
  const handleSlaTypeChange = (typeVal: string) => {
    setSlaType(typeVal);
    const preset = SLA_TYPES.find((t) => t.value === typeVal);
    if (preset && typeVal !== "CUSTOM") {
      setDurationValue(preset.defaultHours);
      setDurationUnit("HOURS");
      setIsManualOverride(false);
    }
  };

  const createMutation = useMutation({
    mutationFn: () => {
      const startIso = new Date(startedAt).toISOString();
      const dueIso = new Date(dueAt).toISOString();

      return adminApi.createManualSlaEntry({
        applicationId: selectedAppId,
        slaType,
        durationValue: Number(durationValue),
        durationUnit,
        startedAt: startIso,
        dueAt: dueIso,
        isManualDueDateOverride: isManualOverride,
        priority,
        initialSlaState,
        reason,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-sla-records"] });
      queryClient.invalidateQueries({ queryKey: ["admin-sla-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["admin-applications"] });
      if (onSuccess) onSuccess();
      onClose();
    },
  });

  const hasDuplicateActiveTimer = selectedApp && selectedApp.dueAt && selectedApp.status !== "DELIVERED" && selectedApp.status !== "CLOSED";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Manual SLA Operational Entry"
      description="Initialize or override an SLA tracking record for legacy, exceptional, or manual operational filings."
      size="lg"
    >
      <div className="space-y-4 text-xs">
        {createMutation.error && (
          <div className="rounded-xs border border-destructive/30 bg-destructive/10 p-3 text-destructive font-semibold flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0" />
            <span>{(createMutation.error as Error).message || "Failed to create manual SLA entry"}</span>
          </div>
        )}

        {/* Section 1: Application Selector */}
        <div className="rounded-xs border border-border bg-muted/20 p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="size-3.5 text-gold" /> Application / Filing Selection
            </h4>
            {selectedApp && (
              <span className="text-[11px] font-mono text-gold bg-gold/10 px-2 py-0.5 rounded-xs border border-gold/30">
                #{selectedApp.applicationNumber}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Search application by number, client name, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-xs h-9"
              />
            </div>

            <FormField label="Select Target Application" required>
              <Select
                value={selectedAppId}
                onChange={(e) => setSelectedAppId(e.target.value)}
                options={[
                  { value: "", label: isLoadingApps ? "Loading applications..." : "-- Select Application --" },
                  ...applications.map((app: any) => ({
                    value: app.id,
                    label: `#${app.applicationNumber} • ${app.client?.fullName || "Client"} (${app.service?.name || "Service"})`,
                  })),
                ]}
              />
            </FormField>
          </div>

          {/* Active Timer Warning */}
          {hasDuplicateActiveTimer && (
            <div className="rounded-xs border border-amber-500/40 bg-amber-500/10 p-2.5 flex items-start gap-2 text-amber-600 dark:text-amber-400">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <div className="leading-relaxed text-[11px]">
                <strong>Active Timer Warning:</strong> Application <code>#{selectedApp.applicationNumber}</code> already has an active SLA due date (Due: {new Date(selectedApp.dueAt || Date.now()).toLocaleString()}). Submitting this form will override the existing active SLA timer and append an event log.

              </div>
            </div>
          )}
        </div>

        {/* Section 2: SLA Duration & Preset */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <FormField label="SLA Preset Standard" required>
            <Select
              value={slaType}
              onChange={(e) => handleSlaTypeChange(e.target.value)}
              options={SLA_TYPES}
            />
          </FormField>

          <FormField label="Priority Tier" required>
            <Select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              options={PRIORITY_OPTIONS}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-2">
            <FormField label="Duration Value" required>
              <Input
                type="number"
                min={1}
                value={durationValue}
                onChange={(e) => {
                  setDurationValue(Math.max(1, Number(e.target.value)));
                  setIsManualOverride(false);
                }}
              />
            </FormField>

            <FormField label="Unit" required>
              <Select
                value={durationUnit}
                onChange={(e) => {
                  setDurationUnit(e.target.value as any);
                  setIsManualOverride(false);
                }}
                options={DURATION_UNITS}
              />
            </FormField>
          </div>

          <FormField label="Initial SLA State" required>
            <Select
              value={initialSlaState}
              onChange={(e) => setInitialSlaState(e.target.value as any)}
              options={INITIAL_STATES}
            />
          </FormField>
        </div>

        {/* Section 3: Datetime Controls */}
        <div className="rounded-xs border border-border bg-muted/10 p-3 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FormField label="SLA Start Date & Time" required>
              <Input
                type="datetime-local"
                value={startedAt}
                onChange={(e) => setStartedAt(e.target.value)}
              />
            </FormField>

            <FormField label="SLA Target Due Date & Time" required>
              <Input
                type="datetime-local"
                value={dueAt}
                onChange={(e) => {
                  setDueAt(e.target.value);
                  setIsManualOverride(true);
                }}
              />
            </FormField>
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
            <span className="flex items-center gap-1.5">
              <Calendar className="size-3 text-gold" />
              {isManualOverride ? (
                <strong className="text-amber-500">Manual Due Date Override Active</strong>
              ) : (
                <span>Auto-calculated based on duration ({durationValue} {durationUnit.toLowerCase()})</span>
              )}
            </span>
            {isManualOverride && (
              <button
                type="button"
                className="text-gold underline hover:text-gold-hover cursor-pointer"
                onClick={() => setIsManualOverride(false)}
              >
                Reset Auto-Calculation
              </button>
            )}
          </div>
        </div>

        {/* Section 4: Operational Justification */}
        <FormField label="Operational Reason / Audit Justification" required>
          <Textarea
            placeholder="Provide explicit operational context (e.g. Migration from legacy queue, manual agreement with client)..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </FormField>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
          <Button variant="outline" size="sm" onClick={onClose} disabled={createMutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="gold"
            size="sm"
            leftIcon={<Plus className="size-3.5" />}
            isLoading={createMutation.isPending}
            disabled={!selectedAppId || !reason.trim() || !startedAt || !dueAt}
            onClick={() => createMutation.mutate()}
          >
            Initialize SLA Entry
          </Button>
        </div>
      </div>
    </Modal>
  );
}
