"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  ExternalLink,
  ShieldCheck,
  Clock,
  History,
  FileCheck,
} from "lucide-react";
import { PageShell } from "@/components/ui/layout-primitives";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { FormField, Textarea } from "@/components/ui/form-primitives";
import { Skeleton, ErrorState } from "@/components/ui/feedback-primitives";
import { adminApi } from "@/lib/api/admin";
import { formatDate } from "@/lib/utils/format";
import type { Application, ApplicationRequirement } from "@/types";

export default function AdminDocumentDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const queryClient = useQueryClient();

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [reviewNotes, setReviewNotes] = useState("");

  // Query applications to locate the requirement
  const { data: appsData, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-documents-vault-applications"],
    queryFn: () => adminApi.getApplications({ page: 1, limit: 100 }),
  });

  const applications: Application[] = appsData?.items || [];

  let matchedReq: ApplicationRequirement | null = null;
  let matchedApp: Application | null = null;

  for (const app of applications) {
    if (app.requirements) {
      const found = app.requirements.find((r) => r.id === id);
      if (found) {
        matchedReq = found;
        matchedApp = app;
        break;
      }
    }
  }

  // Requirement history query
  const { data: historyData } = useQuery({
    queryKey: ["admin-requirement-history", matchedApp?.id, matchedReq?.id],
    queryFn: () =>
      matchedApp && matchedReq
        ? adminApi.getRequirementHistory(matchedApp.id, matchedReq.id)
        : Promise.resolve([]),
    enabled: Boolean(matchedApp?.id && matchedReq?.id),
  });

  // Review mutation
  const reviewMutation = useMutation({
    mutationFn: () =>
      adminApi.reviewRequirement(matchedApp!.id, matchedReq!.id, {
        status: reviewStatus,
        notes: reviewNotes || undefined,
      }),
    onSuccess: () => {
      setIsReviewModalOpen(false);
      setReviewNotes("");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["admin-requirement-history"] });
    },
  });

  if (isLoading) {
    return (
      <PageShell title="Loading Document Dossier...">
        <div className="space-y-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </PageShell>
    );
  }

  if (error || !matchedReq || !matchedApp) {
    return (
      <PageShell title="Document Compliance Inspector">
        <ErrorState
          title="Document Not Found"
          message="Could not locate the specified statutory requirement document."
          onRetry={() => refetch()}
        />
      </PageShell>
    );
  }

  const history = Array.isArray(historyData) ? historyData : [];

  return (
    <PageShell
      eyebrow={`STATUTORY VAULT • ${matchedReq.requirementKey || matchedReq.code || "DOC"}`}
      title={matchedReq.documentName || (matchedReq.requirementKey || matchedReq.code || "Requirement").replace(/_/g, " ")}
      description={`Case: #${matchedApp.applicationNumber} • Client: ${matchedApp.client?.fullName || "Client"} • Status: ${matchedReq.status}`}
      actions={
        <div className="flex items-center gap-2">
          <Link href="/admin/documents">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="size-3.5" />}>
              Document Vault
            </Button>
          </Link>
          {matchedReq.status !== "APPROVED" && (
            <Button
              variant="gold"
              size="sm"
              leftIcon={<CheckCircle2 className="size-3.5" />}
              onClick={() => {
                setReviewStatus("APPROVED");
                setIsReviewModalOpen(true);
              }}
            >
              Verify & Approve Document
            </Button>
          )}
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Document Metadata & Inspection */}
        <div className="space-y-6 lg:col-span-2">
          <Card padding="md" className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Statutory Document Verification
                </span>
                <h3 className="text-base font-bold text-foreground">
                  {matchedReq.documentName || matchedReq.requirementKey}
                </h3>
              </div>
              <Badge
                tone={
                  matchedReq.status === "APPROVED"
                    ? "success"
                    : matchedReq.status === "REJECTED"
                    ? "destructive"
                    : matchedReq.status === "SUBMITTED"
                    ? "gold"
                    : "neutral"
                }
                size="md"
              >
                {matchedReq.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="rounded-xs border border-border bg-muted/20 p-2.5">
                <span className="text-muted-foreground block text-[11px]">Requirement Key</span>
                <strong className="text-foreground font-mono text-[11px]">{matchedReq.requirementKey}</strong>
              </div>

              <div className="rounded-xs border border-border bg-muted/20 p-2.5">
                <span className="text-muted-foreground block text-[11px]">File Size</span>
                <strong className="text-foreground font-mono">
                  {matchedReq.fileSize ? `${Math.round(matchedReq.fileSize / 1024)} KB` : "—"}
                </strong>
              </div>

              <div className="rounded-xs border border-border bg-muted/20 p-2.5">
                <span className="text-muted-foreground block text-[11px]">Upload Date</span>
                <span className="text-foreground font-mono">
                  {formatDate(matchedReq.uploadedAt || matchedReq.updatedAt || matchedReq.createdAt)}
                </span>
              </div>

              <div className="rounded-xs border border-border bg-muted/20 p-2.5">
                <span className="text-muted-foreground block text-[11px]">Verification</span>
                <strong className="text-foreground">{matchedReq.status}</strong>
              </div>
            </div>

            {/* Document Preview & File Access */}
            <div className="rounded-xs border border-border bg-muted/20 p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px]">
                  Vault File Binary Asset
                </h4>
                {matchedReq.fileUrl && (
                  <a
                    href={matchedReq.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-gold-dark dark:text-gold hover:underline font-semibold"
                  >
                    <span>Download / Open File</span>
                    <ExternalLink className="size-3" />
                  </a>
                )}
              </div>

              {matchedReq.fileUrl ? (
                <div className="p-3 bg-card rounded-xs border border-border flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <FileText className="size-5 text-gold-dark dark:text-gold" />
                    <div>
                      <p className="font-semibold text-foreground text-xs">{matchedReq.documentName || "Uploaded Statutory File"}</p>
                      <span className="text-[11px] text-muted-foreground font-mono">{matchedReq.fileUrl}</span>
                    </div>
                  </div>
                  <a
                    href={matchedReq.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button variant="outline" size="xs" leftIcon={<Download className="size-3" />}>
                      View
                    </Button>
                  </a>
                </div>
              ) : (
                <p className="text-muted-foreground italic">No document file binary has been uploaded by the client yet.</p>
              )}
            </div>

            {matchedReq.rejectionReason && (
              <div className="rounded-xs border border-destructive/30 bg-destructive/5 p-3.5 space-y-1 text-xs text-destructive">
                <h4 className="font-bold uppercase tracking-wider text-[11px]">Compliance Rejection Reason</h4>
                <p>{matchedReq.rejectionReason}</p>
              </div>
            )}
          </Card>

          {/* Audit History Timeline */}
          <Card padding="md" className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <History className="size-4 text-gold-dark dark:text-gold" />
                <span>Verification & Review Audit Log</span>
              </h4>
              <span className="text-xs text-muted-foreground font-mono">{history.length} event(s)</span>
            </div>

            {history.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">No historical audit modifications recorded for this document.</p>
            ) : (
              <div className="space-y-2 text-xs">
                {history.map((evt: any) => (
                  <div
                    key={evt.id}
                    className="flex items-center justify-between rounded-xs border border-border bg-muted/20 p-2.5"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">{evt.action || "Status Change"}</span>
                        <Badge tone={evt.status === "APPROVED" ? "success" : "neutral"} size="sm">
                          {evt.status}
                        </Badge>
                      </div>
                      {evt.notes && <p className="text-muted-foreground text-[11px]">{evt.notes}</p>}
                    </div>
                    <span className="text-muted-foreground font-mono text-[11px]">{formatDate(evt.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Col: Host Application Profile & Action */}
        <div className="space-y-6">
          <Card padding="md" className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-foreground">Host Application</h4>
              <Link
                href={`/admin/applications/${matchedApp.id}`}
                className="text-xs font-semibold text-gold-dark dark:text-gold hover:underline flex items-center gap-1"
              >
                <span>Case 360</span>
                <ExternalLink className="size-3" />
              </Link>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Dossier #</span>
                <Link
                  href={`/admin/applications/${matchedApp.id}`}
                  className="font-mono font-bold text-navy dark:text-gold hover:underline"
                >
                  #{matchedApp.applicationNumber}
                </Link>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Service Name</span>
                <span className="font-semibold text-foreground">{matchedApp.service?.name}</span>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Client Name</span>
                <span className="font-bold text-foreground">
                  {matchedApp.client?.fullName || matchedApp.client?.businessName || "Client"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Application Status</span>
                <Badge tone="neutral" size="sm">{matchedApp.status}</Badge>
              </div>
            </div>
          </Card>

          {/* Quick Review Actions */}
          <Card padding="md" className="space-y-3 text-xs border-gold/40 bg-gold/5">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-gold" />
              <span>Officer Compliance Decision</span>
            </h4>
            <p className="text-muted-foreground">
              Review document clarity, authenticity, and statutory eligibility.
            </p>
            <div className="flex flex-col gap-2 pt-1">
              <Button
                variant="gold"
                size="sm"
                leftIcon={<CheckCircle2 className="size-3.5" />}
                onClick={() => {
                  setReviewStatus("APPROVED");
                  setIsReviewModalOpen(true);
                }}
              >
                Approve Document
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:bg-destructive/10"
                leftIcon={<XCircle className="size-3.5" />}
                onClick={() => {
                  setReviewStatus("REJECTED");
                  setIsReviewModalOpen(true);
                }}
              >
                Reject / Require Re-upload
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* REVIEW MODAL */}
      {isReviewModalOpen && (
        <Modal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          title={reviewStatus === "APPROVED" ? "Approve Statutory Document" : "Reject Statutory Document"}
          description={`Record compliance officer determination for ${matchedReq.requirementKey}.`}
          size="sm"
        >
          <div className="space-y-4 text-xs">
            <FormField label="Officer Audit Justification" required={reviewStatus === "REJECTED"}>
              <Textarea
                placeholder={reviewStatus === "APPROVED" ? "Optional verification notes..." : "Specify reason for rejection..."}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={3}
              />
            </FormField>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsReviewModalOpen(false)}
                disabled={reviewMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant={reviewStatus === "APPROVED" ? "gold" : "destructive"}
                size="sm"
                isLoading={reviewMutation.isPending}
                disabled={reviewStatus === "REJECTED" && !reviewNotes.trim()}
                onClick={() => reviewMutation.mutate()}
              >
                Confirm {reviewStatus === "APPROVED" ? "Approval" : "Rejection"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </PageShell>
  );
}
