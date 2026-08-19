"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  History,
  FileText,
  Download,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { FormField, Textarea } from "@/components/ui/form-primitives";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/feedback-primitives";
import { adminApi } from "@/lib/api/admin";
import { formatDate } from "@/lib/utils/format";
import type { ApplicationRequirement, Document } from "@/types";

interface AdminRequirementReviewerProps {
  applicationId: string;
  requirements: ApplicationRequirement[];
  documents?: Document[];
  onReviewed?: () => void;
}

export function AdminRequirementReviewer({
  applicationId,
  requirements = [],
  documents = [],
  onReviewed,
}: AdminRequirementReviewerProps) {
  const queryClient = useQueryClient();

  // Review modal state
  const [selectedReq, setSelectedReq] = useState<ApplicationRequirement | null>(null);
  const [reviewAction, setReviewAction] = useState<"APPROVE" | "REJECT" | "REQUEST_CORRECTION">("APPROVE");
  const [reviewReason, setReviewReason] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // History modal state
  const [historyReqId, setHistoryReqId] = useState<string | null>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-application", applicationId] });
    if (onReviewed) onReviewed();
  };

  const reviewMutation = useMutation({
    mutationFn: (payload: { requirementId: string; action: "APPROVE" | "REJECT" | "REQUEST_CORRECTION"; reason?: string; reviewNotes?: string }) =>
      adminApi.reviewRequirement(applicationId, payload.requirementId, {
        action: payload.action,
        reason: payload.reason,
        reviewNotes: payload.reviewNotes,
      }),
    onSuccess: () => {
      setIsReviewModalOpen(false);
      setSelectedReq(null);
      setReviewReason("");
      setReviewNotes("");
      invalidate();
    },
  });

  const { data: historyItems = [], isLoading: isHistoryLoading } = useQuery({
    queryKey: ["requirement-history", applicationId, historyReqId],
    queryFn: () => (historyReqId ? adminApi.getRequirementHistory(applicationId, historyReqId) : Promise.resolve([])),
    enabled: Boolean(historyReqId),
  });

  // Helper to find document attached to requirement
  const getAttachedDocument = (req: ApplicationRequirement) => {
    if (req.documents && req.documents.length > 0) {
      return req.documents[0];
    }
    return documents.find((d) => d.applicationRequirementId === req.id);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SATISFIED":
      case "APPROVED":
        return <Badge tone="success" size="sm">SATISFIED / APPROVED</Badge>;
      case "SUBMITTED":
        return <Badge tone="warning" size="sm">SUBMITTED (NEEDS REVIEW)</Badge>;
      case "CORRECTION_REQUIRED":
        return <Badge tone="warning" size="sm">CORRECTION REQUIRED</Badge>;
      case "REJECTED":
        return <Badge tone="danger" size="sm">REJECTED</Badge>;
      default:
        return <Badge tone="neutral" size="sm">PENDING CLIENT</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">Statutory Requirements & QC Audit</h3>
          <p className="text-xs text-muted-foreground">
            Review individual client uploads, verify statutory accuracy, or request corrections.
          </p>
        </div>
        <div className="text-xs text-muted-foreground font-mono">
          {requirements.filter((r) => r.status === "APPROVED" || r.isSatisfied).length} / {requirements.length} Satisfied
        </div>
      </div>

      {requirements.length === 0 ? (
        <div className="rounded-xs border border-border bg-card p-6 text-center text-xs text-muted-foreground">
          No statutory requirements configured for this service.
        </div>
      ) : (
        <div className="space-y-3">
          {requirements.map((req) => {
            const attachedDoc = getAttachedDocument(req);
            const isSatisfied = req.status === "APPROVED" || req.isSatisfied;

            return (
              <Card key={req.id} padding="md" className="transition-all hover:border-gold/30">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  {/* Requirement Details */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        {req.name || "Statutory Requirement"}
                      </span>
                      {req.required && (
                        <span className="text-[10px] font-bold text-destructive uppercase tracking-wider">
                          *Required
                        </span>
                      )}
                      {getStatusBadge(req.status)}
                    </div>

                    {req.description && (
                      <p className="text-xs text-muted-foreground">
                        {req.description}
                      </p>
                    )}

                    {/* Value or Attached Document Section */}
                    {attachedDoc ? (
                      <div className="flex items-center gap-3 rounded-xs border border-border bg-muted/40 px-3 py-2 text-xs">
                        <FileText className="size-4 text-gold shrink-0" />
                        <div className="flex-1 truncate">
                          <span className="font-semibold text-foreground">{attachedDoc.title || attachedDoc.currentVersion?.fileName || "Document"}</span>
                          {attachedDoc.documentNumber && (
                            <span className="ml-2 font-mono text-[11px] text-muted-foreground">
                              Doc #: {attachedDoc.documentNumber}
                            </span>
                          )}
                        </div>
                        {attachedDoc.currentVersion?.secureUrl && (
                          <a
                            href={attachedDoc.currentVersion.secureUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gold-dark hover:underline dark:text-gold flex items-center gap-1 font-semibold"
                          >
                            <Download className="size-3.5" />
                            <span>Preview / Download</span>
                          </a>
                        )}
                      </div>
                    ) : req.valueText || req.valueNumber !== undefined ? (
                      <div className="rounded-xs border border-border bg-muted/30 px-3 py-2 text-xs">
                        <span className="text-muted-foreground">Submitted Value: </span>
                        <strong className="text-foreground">
                          {req.valueText || String(req.valueNumber)}
                        </strong>
                      </div>
                    ) : null}

                    {/* Rejection / Correction Reason if any */}
                    {req.rejectionReason && (
                      <div className="rounded-xs border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive flex items-start gap-2">
                        <AlertCircle className="size-4 shrink-0 mt-0.5" />
                        <div>
                          <strong>Review Note:</strong> {req.rejectionReason}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Operational Review Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="xs"
                      leftIcon={<History className="size-3.5" />}
                      onClick={() => setHistoryReqId(req.id)}
                    >
                      History
                    </Button>

                    {!isSatisfied && (
                      <Button
                        variant="outline"
                        size="xs"
                        className="text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                        leftIcon={<CheckCircle2 className="size-3.5" />}
                        onClick={() => {
                          setSelectedReq(req);
                          setReviewAction("APPROVE");
                          setReviewReason("Document verified against official registry criteria.");
                          setIsReviewModalOpen(true);
                        }}
                      >
                        Approve
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="xs"
                      className="text-amber-600 border-amber-500/30 hover:bg-amber-500/10"
                      leftIcon={<AlertCircle className="size-3.5" />}
                      onClick={() => {
                        setSelectedReq(req);
                        setReviewAction("REQUEST_CORRECTION");
                        setReviewReason("");
                        setIsReviewModalOpen(true);
                      }}
                    >
                      Correction
                    </Button>

                    <Button
                      variant="outline"
                      size="xs"
                      className="text-destructive border-destructive/30 hover:bg-destructive/10"
                      leftIcon={<XCircle className="size-3.5" />}
                      onClick={() => {
                        setSelectedReq(req);
                        setReviewAction("REJECT");
                        setReviewReason("");
                        setIsReviewModalOpen(true);
                      }}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title={
          reviewAction === "APPROVE"
            ? "Approve Statutory Requirement"
            : reviewAction === "REQUEST_CORRECTION"
            ? "Request Requirement Correction"
            : "Reject Statutory Requirement"
        }
        description={`Record operational review decision for: ${selectedReq?.name || "Requirement"}`}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsReviewModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={reviewAction === "APPROVE" ? "gold" : reviewAction === "REJECT" ? "destructive" : "secondary"}
              size="sm"
              isLoading={reviewMutation.isPending}
              onClick={() => {
                if (selectedReq) {
                  reviewMutation.mutate({
                    requirementId: selectedReq.id,
                    action: reviewAction,
                    reason: reviewReason || undefined,
                    reviewNotes: reviewNotes || undefined,
                  });
                }
              }}
            >
              Confirm {reviewAction === "APPROVE" ? "Approval" : reviewAction === "REJECT" ? "Rejection" : "Correction Request"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormField
            label={reviewAction === "APPROVE" ? "Approval Notes" : "Reason / Feedback to Client"}
            required={reviewAction !== "APPROVE"}
          >
            <Input
              placeholder={
                reviewAction === "APPROVE"
                  ? "e.g. Verified KRA PIN certificate validity"
                  : "e.g. Uploaded National ID is blurry and cropped; please provide high-resolution copy"
              }
              value={reviewReason}
              onChange={(e) => setReviewReason(e.target.value)}
            />
          </FormField>

          <FormField label="Internal Officer Notes (Private to Admin)">
            <Textarea
              placeholder="Optional audit notes..."
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              rows={2}
            />
          </FormField>
        </div>
      </Modal>

      {/* History Modal */}
      <Modal
        isOpen={Boolean(historyReqId)}
        onClose={() => setHistoryReqId(null)}
        title="Requirement Review Audit Trail"
        description="Chronological log of client submissions, officer audits, and state changes."
        footer={
          <Button variant="secondary" size="sm" onClick={() => setHistoryReqId(null)}>
            Close
          </Button>
        }
      >
        {isHistoryLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : historyItems.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground">
            No previous review history recorded for this requirement.
          </div>
        ) : (
          <div className="space-y-3">
            {historyItems.map((item: any, idx: number) => (
              <div key={idx} className="rounded-xs border border-border bg-card p-3 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <Badge tone={item.status === "APPROVED" || item.status === "SATISFIED" ? "success" : "warning"} size="sm">
                    {item.status || item.action}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">{formatDate(item.createdAt)}</span>
                </div>
                {item.reason && <p className="text-foreground"><strong>Reason:</strong> {item.reason}</p>}
                {item.reviewNotes && <p className="text-muted-foreground"><strong>Notes:</strong> {item.reviewNotes}</p>}
                {item.reviewer && <p className="text-[11px] text-muted-foreground">Officer: {item.reviewer.fullName || item.reviewer.email}</p>}
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
