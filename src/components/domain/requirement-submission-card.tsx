"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
  Upload,
  Send,
  History,
  FileCheck,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { applicationsApi } from "@/lib/api/applications";
import { documentsApi } from "@/lib/api/documents";
import { RequirementStatusBadge } from "./status-badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileUpload } from "@/components/ui/file-upload";
import type {
  ApplicationRequirement,
  SubmitRequirementPayload,
  RequirementReviewHistory,
} from "@/types";

interface RequirementSubmissionCardProps {
  applicationId: string;
  requirement: ApplicationRequirement;
  onSuccess?: () => void;
  disabled?: boolean;
}

export function RequirementSubmissionCard({
  applicationId,
  requirement,
  onSuccess,
  disabled = false,
}: RequirementSubmissionCardProps) {
  const queryClient = useQueryClient();

  // Form input states for different requirement types
  const [textValue, setTextValue] = useState(requirement.valueText || "");
  const [numberValue, setNumberValue] = useState(
    requirement.valueNumber !== null && requirement.valueNumber !== undefined
      ? String(requirement.valueNumber)
      : ""
  );
  const [dateValue, setDateValue] = useState(
    requirement.valueDate ? requirement.valueDate.split("T")[0] : ""
  );
  const [booleanValue, setBooleanValue] = useState(
    requirement.valueBoolean !== null && requirement.valueBoolean !== undefined
      ? Boolean(requirement.valueBoolean)
      : false
  );

  // File upload state for DOCUMENT requirement
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Expandable review history state
  const [showHistory, setShowHistory] = useState(false);
  const [historyItems, setHistoryItems] = useState<RequirementReviewHistory[] | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const isSatisfied =
    requirement.isSatisfied &&
    requirement.status !== "REJECTED" &&
    requirement.status !== "CORRECTION_REQUIRED";

  const isCorrectionRequired =
    requirement.status === "CORRECTION_REQUIRED" || requirement.status === "REJECTED";

  // Document upload & requirement submission mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      setErrorMessage(null);

      if (requirement.type === "DOCUMENT") {
        if (!selectedFile && !requirement.documents?.length) {
          throw new Error("Please select a document file to upload");
        }

        if (selectedFile) {
          // 1. Upload document file to backend storage
          await documentsApi.uploadDocument(
            {
              applicationId,
              applicationRequirementId: requirement.id,
              documentType: requirement.code || "LEGAL_REQUIREMENT",
              title: `${requirement.name} - ${selectedFile.name}`,
              file: selectedFile,
            },
            (progress) => setUploadProgress(progress)
          );
        }

        // 2. Mark requirement as submitted in state machine
        return await applicationsApi.submitRequirement(applicationId, requirement.id, {});
      } else {
        // Value-based requirement submission (TEXT, NUMBER, DATE, BOOLEAN)
        const payload: SubmitRequirementPayload = {};

        if (requirement.type === "TEXT") {
          if (requirement.required && !textValue.trim()) {
            throw new Error(`Please provide a valid value for ${requirement.name}`);
          }
          payload.valueText = textValue.trim();
        } else if (requirement.type === "NUMBER") {
          if (requirement.required && (!numberValue || isNaN(Number(numberValue)))) {
            throw new Error(`Please enter a valid numeric value for ${requirement.name}`);
          }
          payload.valueNumber = Number(numberValue);
        } else if (requirement.type === "DATE") {
          if (requirement.required && !dateValue) {
            throw new Error(`Please select a valid date for ${requirement.name}`);
          }
          payload.valueDate = dateValue ? new Date(dateValue).toISOString() : undefined;
        } else if (requirement.type === "BOOLEAN") {
          payload.valueBoolean = booleanValue;
        }

        return await applicationsApi.submitRequirement(applicationId, requirement.id, payload);
      }
    },
    onSuccess: () => {
      setUploadProgress(null);
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ["client-application", applicationId] });
      queryClient.invalidateQueries({ queryKey: ["client-applications"] });
      queryClient.invalidateQueries({ queryKey: ["client-dashboard-overview"] });
      onSuccess?.();
    },
    onError: (err: any) => {
      setUploadProgress(null);
      setErrorMessage(err.message || "Failed to submit requirement. Please check input values.");
    },
  });

  const toggleHistory = async () => {
    if (!showHistory && !historyItems) {
      setLoadingHistory(true);
      try {
        const history = await applicationsApi.getRequirementHistory(applicationId, requirement.id);
        setHistoryItems(history);
      } catch (err) {
        console.error("Failed to load requirement history:", err);
      } finally {
        setLoadingHistory(false);
      }
    }
    setShowHistory(!showHistory);
  };

  // Download / View uploaded document URL
  const handleViewUploadedDoc = async (docId: string) => {
    try {
      const res = await documentsApi.getDownloadUrl(docId);
      if (res.downloadUrl) {
        window.open(res.downloadUrl, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      console.error("Failed to fetch download url:", err);
    }
  };

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-sm border p-4 sm:p-5 transition-all duration-200 bg-card",
        isSatisfied
          ? "border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/10"
          : isCorrectionRequired
          ? "border-destructive/40 bg-destructive/5"
          : "border-border hover:border-gold/50 shadow-xs"
      )}
    >
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-border/60">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-xs text-xs font-bold mt-0.5",
              isSatisfied
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                : isCorrectionRequired
                ? "bg-destructive/15 text-destructive"
                : "bg-gold/15 text-gold-dark dark:text-gold"
            )}
          >
            {requirement.displayOrder || 1}
          </div>

          <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-bold text-foreground">{requirement.name}</h4>
              {requirement.required ? (
                <span className="rounded-xs bg-destructive/10 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-destructive">
                  Mandatory
                </span>
              ) : (
                <span className="rounded-xs bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                  Optional
                </span>
              )}
            </div>

            {requirement.description && (
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                {requirement.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <RequirementStatusBadge status={requirement.status} size="sm" />
          <button
            type="button"
            onClick={toggleHistory}
            className="p-1 rounded-xs text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
            title="View Submission Audit Log"
            aria-label="View history"
          >
            <History className="size-4" />
          </button>
        </div>
      </div>

      {/* Review Feedback Alert Banner (if correction required or rejected) */}
      {isCorrectionRequired && requirement.rejectionReason && (
        <div className="mt-3 flex items-start gap-2.5 rounded-xs border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5">
            <span className="font-bold">Compliance Officer Action Note:</span>
            <span>{requirement.rejectionReason}</span>
          </div>
        </div>
      )}

      {/* Existing Uploaded Documents for DOCUMENT requirement */}
      {requirement.type === "DOCUMENT" && requirement.documents && requirement.documents.length > 0 && (
        <div className="mt-3 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Current Document Record
          </span>
          {requirement.documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between gap-3 rounded-xs border border-border bg-muted/30 p-2.5 text-xs"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <FileCheck className="size-4 text-emerald-500 shrink-0" />
                <div className="flex flex-col overflow-hidden text-left">
                  <span className="truncate font-semibold text-foreground">{doc.title}</span>
                  <span className="text-[10px] text-muted-foreground">
                    Status: {doc.status} &bull; Uploaded: {new Date(doc.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[11px] shrink-0 gap-1.5"
                onClick={() => handleViewUploadedDoc(doc.id)}
              >
                <ExternalLink className="size-3" />
                <span>View</span>
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Dynamic Input Control Form (Active if not disabled and not approved or in correction mode) */}
      {(!isSatisfied || isCorrectionRequired) && !disabled && (
        <div className="mt-4 space-y-3">
          {requirement.type === "DOCUMENT" && (
            <div>
              <FileUpload
                onFileSelect={(file) => setSelectedFile(file)}
                uploadProgress={uploadProgress}
                label={isCorrectionRequired ? "Upload Corrected Document" : "Upload Document"}
                hint="Supported formats: PDF, JPEG, PNG up to 15MB"
                disabled={submitMutation.isPending}
              />
            </div>
          )}

          {requirement.type === "TEXT" && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Enter Details
              </label>
              <Input
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                placeholder={`Provide ${requirement.name.toLowerCase()}...`}
                disabled={submitMutation.isPending}
                className="text-xs"
              />
            </div>
          )}

          {requirement.type === "NUMBER" && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Enter Numeric Value
              </label>
              <Input
                type="number"
                value={numberValue}
                onChange={(e) => setNumberValue(e.target.value)}
                placeholder="0"
                disabled={submitMutation.isPending}
                className="text-xs"
              />
            </div>
          )}

          {requirement.type === "DATE" && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Select Date
              </label>
              <Input
                type="date"
                value={dateValue}
                onChange={(e) => setDateValue(e.target.value)}
                disabled={submitMutation.isPending}
                className="text-xs"
              />
            </div>
          )}

          {requirement.type === "BOOLEAN" && (
            <label className="flex items-center gap-3 cursor-pointer py-1 select-none">
              <input
                type="checkbox"
                checked={booleanValue}
                onChange={(e) => setBooleanValue(e.target.checked)}
                disabled={submitMutation.isPending}
                className="size-4 rounded-xs border-border text-gold focus:ring-gold"
              />
              <span className="text-xs font-medium text-foreground">
                I hereby declare and affirm this statutory requirement is accurate and true.
              </span>
            </label>
          )}

          {errorMessage && (
            <div className="flex items-center gap-2 text-xs font-semibold text-destructive">
              <AlertCircle className="size-3.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <Button
              size="sm"
              onClick={() => submitMutation.mutate()}
              isLoading={submitMutation.isPending}
              disabled={submitMutation.isPending || (requirement.type === "DOCUMENT" && !selectedFile)}
              className="gap-2 text-xs font-bold"
            >
              {requirement.type === "DOCUMENT" ? (
                <>
                  <Upload className="size-3.5" />
                  <span>{isCorrectionRequired ? "Submit Replacement" : "Upload & Submit"}</span>
                </>
              ) : (
                <>
                  <Send className="size-3.5" />
                  <span>{isCorrectionRequired ? "Submit Update" : "Save & Verify"}</span>
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Approved / Satisfied Success Badge */}
      {isSatisfied && !isCorrectionRequired && (
        <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>Requirement satisfied & approved for official submission</span>
          {requirement.satisfiedAt && (
            <span className="text-[10px] text-muted-foreground ml-auto">
              {new Date(requirement.satisfiedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      )}

      {/* Expandable Review Audit History Drawer */}
      {showHistory && (
        <div className="mt-4 border-t border-border/70 pt-3 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className="size-3.5 text-gold" />
              Submission & Review Log
            </span>
            <button
              onClick={() => setShowHistory(false)}
              className="text-[10px] text-muted-foreground hover:text-foreground"
            >
              Close
            </button>
          </div>

          {loadingHistory ? (
            <div className="py-2 text-center text-xs text-muted-foreground">
              Loading audit trail...
            </div>
          ) : historyItems && historyItems.length > 0 ? (
            <div className="space-y-2 divide-y divide-border/40 max-h-48 overflow-y-auto pr-1">
              {historyItems.map((item) => (
                <div key={item.id} className="pt-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">
                      {item.action || "Status Update"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(item.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <RequirementStatusBadge status={item.status} size="sm" />
                    {item.reason && (
                      <span className="text-[11px] text-muted-foreground italic">
                        &ldquo;{item.reason}&rdquo;
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-2 text-center text-xs text-muted-foreground">
              No historical review events logged yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
