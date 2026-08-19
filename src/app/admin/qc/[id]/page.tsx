"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
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
} from "lucide-react";
import { PageShell } from "@/components/ui/layout-primitives";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
  const queryClient = useQueryClient();

  const [isQcModalOpen, setIsQcModalOpen] = useState(false);

  const {
    data: application,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-application", id],
    queryFn: () => adminApi.getApplicationById(id),
  });

  const { data: readiness } = useQuery({
    queryKey: ["admin-readiness", id],
    queryFn: () => adminApi.getApplicationReadiness(id),
    enabled: Boolean(id),
  });

  if (isLoading) {
    return (
      <PageShell title="Loading QC Inspection Dossier...">
        <div className="space-y-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </PageShell>
    );
  }

  if (error || !application) {
    return (
      <PageShell title="QC Inspection Dossier">
        <ErrorState onRetry={() => refetch()} />
      </PageShell>
    );
  }

  const requirements = application.requirements || [];
  const documents = application.documents || [];

  return (
    <PageShell
      eyebrow={`STATUTORY QC INSPECTION • #${application.applicationNumber}`}
      title={application.service?.name || "Statutory Dossier"}
      description={`Client: ${application.client?.fullName || application.client?.businessName || "Verified Entity"} • Status: ${application.status}`}
      actions={
        <div className="flex items-center gap-2">
          <Link href="/admin/qc">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="size-3.5" />}>
              QC Queue
            </Button>
          </Link>
          <Button
            variant="gold"
            size="sm"
            leftIcon={<ShieldCheck className="size-4" />}
            onClick={() => setIsQcModalOpen(true)}
          >
            Conduct QC Inspection
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Requirements & Document Reviewer */}
        <div className="space-y-6 lg:col-span-2">
          {/* Readiness Banner */}
          {readiness && (
            <Card padding="md" className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <ShieldCheck className="size-4 text-gold" />
                  <span>Statutory Submission Readiness Audit</span>
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

          {/* Interactive Requirements Reviewer */}
          <AdminRequirementReviewer
            applicationId={application.id}
            requirements={requirements}
            documents={documents}
            onReviewed={() => {
              refetch();
              queryClient.invalidateQueries({ queryKey: ["admin-readiness", id] });
            }}
          />
        </div>

        {/* Right Col: Host Application Summary & Controls */}
        <div className="space-y-6">
          <Card padding="md" className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-foreground">Application Profile</h4>
              <Link
                href={`/admin/applications/${application.id}`}
                className="text-xs font-semibold text-gold-dark dark:text-gold hover:underline flex items-center gap-1"
              >
                <span>Full Dossier</span>
                <ExternalLink className="size-3" />
              </Link>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Dossier #</span>
                <span className="font-mono font-bold text-foreground">#{application.applicationNumber}</span>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Status</span>
                <StatusBadge status={application.status} size="sm" />
              </div>
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground">SLA Health</span>
                <SlaBadge status={application.slaStatus} size="sm" />
              </div>
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Priority</span>
                <PriorityBadge priority={application.priority} size="sm" />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date Created</span>
                <span className="text-foreground">{formatDate(application.createdAt)}</span>
              </div>
            </div>
          </Card>

          {application.client && (
            <Card padding="md" className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-foreground">Client Entity</h4>
                <Link
                  href={`/admin/clients/${application.client.id}`}
                  className="text-xs font-semibold text-gold-dark dark:text-gold hover:underline"
                >
                  Client 360
                </Link>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-bold text-foreground">
                    {application.client.fullName || application.client.businessName}
                  </span>
                </div>
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">KRA PIN</span>
                  <span className="font-mono text-foreground">{application.client.kraPin || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="text-foreground">{application.client.email}</span>
                </div>
              </div>
            </Card>
          )}

          {/* QC Inspection Trigger Card */}
          <Card padding="md" className="space-y-3 text-xs border-gold/40 bg-gold/5">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-gold" />
              <span>Statutory Compliance Sign-Off</span>
            </h4>
            <p className="text-muted-foreground">
              Pass or reject all statutory requirements and certify that this dossier satisfies all legal standards.
            </p>
            <Button
              variant="gold"
              size="sm"
              className="w-full"
              leftIcon={<ShieldCheck className="size-3.5" />}
              onClick={() => setIsQcModalOpen(true)}
            >
              Open QC Inspection Panel
            </Button>
          </Card>
        </div>
      </div>

      {/* QC MODAL */}
      {isQcModalOpen && (
        <AdminQcModal
          applicationId={application.id}
          applicationNumber={application.applicationNumber}
          isOpen={isQcModalOpen}
          onClose={() => setIsQcModalOpen(false)}
          onSuccess={() => {
            refetch();
            queryClient.invalidateQueries({ queryKey: ["admin-readiness", id] });
          }}
        />
      )}
    </PageShell>
  );
}
