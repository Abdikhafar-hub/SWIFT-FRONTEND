"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckSquare,
  ShieldCheck,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  UserCheck,
  Clock,
  RefreshCw,
} from "lucide-react";
import { PageShell } from "@/components/ui/layout-primitives";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge, SlaBadge, PriorityBadge } from "@/components/domain/status-badges";
import { AdminRequirementReviewer, AdminQcModal } from "@/components/domain";
import { Skeleton, ErrorState } from "@/components/ui/feedback-primitives";
import { adminApi } from "@/lib/api/admin";
import { formatDate } from "@/lib/utils/format";

export default function AdminQcDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [isQcModalOpen, setIsQcModalOpen] = useState(false);

  // Query QC Workspace Dataset
  const {
    data: workspaceData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-qc-workspace", id],
    queryFn: () => adminApi.getQcWorkspace(id),
  });

  const {
    data: application,
    isLoading: isAppLoading,
    error: appError,
  } = useQuery({
    queryKey: ["admin-application", id],
    queryFn: () => adminApi.getApplicationById(id),
    enabled: !workspaceData?.application,
  });

  const app = workspaceData?.application || application;
  const readiness = workspaceData?.readiness;
  const slaTimeline = workspaceData?.slaTimeline;

  if (isLoading && isAppLoading) {
    return (
      <PageShell title="Loading QC Inspection Workspace...">
        <div className="space-y-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </PageShell>
    );
  }

  if ((error && appError) || !app) {
    return (
      <PageShell title="QC Inspection Workspace">
        <ErrorState onRetry={() => refetch()} />
      </PageShell>
    );
  }

  const requirements = app.requirements || [];
  const documents = app.documents || [];
  const qualityChecks = app.qualityChecks || [];
  const clientActions = app.clientActions || [];

  const satisfiedCount = requirements.filter((r: any) => r.status === "APPROVED" || r.isSatisfied).length;
  const totalCount = requirements.length;
  const allSatisfied = totalCount > 0 && satisfiedCount === totalCount;

  return (
    <PageShell
      eyebrow={`STATUTORY QC WORKSPACE • #${app.applicationNumber}`}
      title={app.service?.name || "Statutory Dossier"}
      description={`Client: ${app.client?.fullName || app.client?.businessName || "Verified Entity"} • Status: ${app.status}`}
      actions={
        <div className="flex items-center gap-2">
          <Link href="/admin/qc">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="size-3.5" />}>
              QC Queue
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            leftIcon={<RefreshCw className="size-3.5" />}
          >
            Refresh
          </Button>
          <Button
            variant="gold"
            size="sm"
            leftIcon={<ShieldCheck className="size-4" />}
            onClick={() => setIsQcModalOpen(true)}
          >
            Execute QC Sign-Off
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Readiness Audit & Requirements Inspection */}
        <div className="space-y-6 lg:col-span-2">
          {/* Readiness Banner */}
          {readiness && (
            <Card padding="md" className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <ShieldCheck className="size-4 text-gold" />
                  <span>Statutory Readiness & Forensic Inspection</span>
                </h4>
                <Badge tone={readiness.ready ? "success" : "warning"} size="md">
                  {readiness.ready ? "READY FOR REGISTRY SUBMISSION" : "INCOMPLETE"}
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="rounded-xs border border-border bg-muted/20 p-2.5">
                  <span className="text-muted-foreground block text-[11px]">Requirements</span>
                  <strong className="text-foreground">
                    {readiness.satisfiedRequiredRequirements} / {readiness.requiredRequirements} Verified
                  </strong>
                </div>

                <div className="rounded-xs border border-border bg-muted/20 p-2.5">
                  <span className="text-muted-foreground block text-[11px]">Payment</span>
                  <strong className={readiness.isPaymentComplete ? "text-emerald-600" : "text-amber-600"}>
                    {readiness.isPaymentComplete ? "Settled in Full" : `Due: KES ${readiness.outstandingAmount}`}
                  </strong>
                </div>

                <div className="rounded-xs border border-border bg-muted/20 p-2.5">
                  <span className="text-muted-foreground block text-[11px]">QC Inspection</span>
                  <strong className={readiness.qualityCheckPassed ? "text-emerald-600" : "text-amber-600"}>
                    {readiness.qualityCheckPassed ? "Passed & Certified" : "Pending Sign-off"}
                  </strong>
                </div>

                <div className="rounded-xs border border-border bg-muted/20 p-2.5">
                  <span className="text-muted-foreground block text-[11px]">Gov Status</span>
                  <strong className="text-foreground">
                    {readiness.governmentProcessingStatus || "Not Submitted"}
                  </strong>
                </div>
              </div>
            </Card>
          )}

          {/* Interactive Requirements & Document Reviewer */}
          <AdminRequirementReviewer
            applicationId={app.id}
            requirements={requirements}
            documents={documents}
            onReviewed={() => {
              refetch();
              queryClient.invalidateQueries({ queryKey: ["admin-qc-metrics"] });
            }}
          />

          {/* Open Client Actions (if any returned items exist) */}
          {clientActions.length > 0 && (
            <Card padding="md" className="space-y-3">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                <AlertTriangle className="size-4 text-amber-500" />
                <span>Active Client Action Directives ({clientActions.length})</span>
              </h4>

              <div className="space-y-2 text-xs">
                {clientActions.map((ca: any) => (
                  <div key={ca.id} className="p-3 rounded border border-amber-200 bg-amber-50/40 flex items-start justify-between">
                    <div>
                      <strong className="text-amber-900 font-bold block">{ca.title}</strong>
                      <p className="text-slate-600 text-[11px] mt-0.5">{ca.description}</p>
                    </div>
                    <Badge tone={ca.status === "OPEN" ? "warning" : "neutral"} size="sm">
                      {ca.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right Col: Host Profile & QC Decision Controls */}
        <div className="space-y-6">
          <Card padding="md" className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-foreground">Application Profile</h4>
              <Link
                href={`/admin/applications/${app.id}`}
                className="text-xs font-semibold text-gold-dark dark:text-gold hover:underline flex items-center gap-1"
              >
                <span>Full Dossier</span>
                <ExternalLink className="size-3" />
              </Link>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Dossier #</span>
                <span className="font-mono font-bold text-foreground">#{app.applicationNumber}</span>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Status</span>
                <StatusBadge status={app.status} size="sm" />
              </div>
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground">SLA Health</span>
                <SlaBadge status={app.slaStatus} size="sm" />
              </div>
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Priority</span>
                <PriorityBadge priority={app.priority} size="sm" />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date Created</span>
                <span className="text-foreground">{formatDate(app.createdAt)}</span>
              </div>
            </div>
          </Card>

          {app.client && (
            <Card padding="md" className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-foreground">Client Entity</h4>
                <Link
                  href={`/admin/clients/${app.client.id}`}
                  className="text-xs font-semibold text-gold-dark dark:text-gold hover:underline"
                >
                  Client 360
                </Link>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-bold text-foreground">
                    {app.client.fullName || app.client.businessName}
                  </span>
                </div>
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">KRA PIN</span>
                  <span className="font-mono text-foreground">{app.client.kraPin || "N/A"}</span>
                </div>
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Email</span>
                  <span className="text-foreground">{app.client.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="text-foreground">{app.client.phone || "N/A"}</span>
                </div>
              </div>
            </Card>
          )}

          {/* Previous Quality Check History */}
          {qualityChecks.length > 0 && (
            <Card padding="md" className="space-y-3 text-xs">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <Clock className="size-4 text-gold" />
                <span>Inspection History ({qualityChecks.length})</span>
              </h4>

              <div className="space-y-2">
                {qualityChecks.map((qc: any) => (
                  <div key={qc.id} className="p-2.5 rounded border border-border bg-card space-y-1">
                    <div className="flex items-center justify-between">
                      <Badge tone={qc.result === "PASSED" ? "success" : "danger"} size="sm">
                        {qc.result}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">{formatDate(qc.createdAt)}</span>
                    </div>
                    {qc.reviewer && (
                      <p className="text-[11px] text-muted-foreground">Reviewer: {qc.reviewer.fullName || qc.reviewer.email}</p>
                    )}
                    {qc.notes && <p className="text-foreground text-[11px]">Note: {qc.notes}</p>}
                    {qc.failedReason && <p className="text-rose-600 text-[11px]">Reason: {qc.failedReason}</p>}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* QC Inspection Trigger Card */}
          <Card padding="md" className="space-y-3 text-xs border-gold/40 bg-gold/5">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-gold" />
              <span>Statutory Compliance Certification</span>
            </h4>
            <p className="text-muted-foreground">
              {allSatisfied
                ? "All statutory requirements verified. Application is eligible for formal QC Pass certification."
                : `${satisfiedCount} of ${totalCount} requirements satisfied. Outstanding items require verification before passing.`}
            </p>
            <Button
              variant="gold"
              size="sm"
              className="w-full"
              leftIcon={<ShieldCheck className="size-3.5" />}
              onClick={() => setIsQcModalOpen(true)}
            >
              Open Formal QC Decision Panel
            </Button>
          </Card>
        </div>
      </div>

      {/* QC MODAL */}
      {isQcModalOpen && (
        <AdminQcModal
          applicationId={app.id}
          applicationNumber={app.applicationNumber}
          isOpen={isQcModalOpen}
          onClose={() => setIsQcModalOpen(false)}
          onSuccess={() => {
            refetch();
            queryClient.invalidateQueries({ queryKey: ["admin-qc-metrics"] });
            queryClient.invalidateQueries({ queryKey: ["admin-qc-queue"] });
          }}
        />
      )}
    </PageShell>
  );
}
