"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ListTodo,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  FileText,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { PageShell } from "@/components/ui/layout-primitives";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { FormField, Textarea } from "@/components/ui/form-primitives";
import { PriorityBadge } from "@/components/domain/status-badges";
import { Skeleton, ErrorState } from "@/components/ui/feedback-primitives";
import { adminApi } from "@/lib/api/admin";
import { formatDate } from "@/lib/utils/format";
import type { ClientAction, Application } from "@/types";

export default function AdminActionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);
  const queryClient = useQueryClient();

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  // Query applications to locate this action and its host application
  const { data: appsData, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-applications-actions-queue"],
    queryFn: () => adminApi.getApplications({ page: 1, limit: 100 }),
  });

  const applications: Application[] = appsData?.items || [];

  let matchedAction: ClientAction | null = null;
  let matchedApp: Application | null = null;

  for (const app of applications) {
    if (app.clientActions) {
      const found = app.clientActions.find((a) => a.id === id);
      if (found) {
        matchedAction = found;
        matchedApp = app;
        break;
      }
    }
  }

  const cancelMutation = useMutation({
    mutationFn: () =>
      adminApi.cancelClientAction(id, {
        reason: cancelReason || "Cancelled by compliance officer.",
      }),
    onSuccess: () => {
      setIsCancelModalOpen(false);
      setCancelReason("");
      queryClient.invalidateQueries({ queryKey: ["admin-applications-actions-queue"] });
    },
  });

  if (isLoading) {
    return (
      <PageShell title="Loading Directive Dossier...">
        <div className="space-y-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </PageShell>
    );
  }

  if (error || !matchedAction) {
    return (
      <PageShell title="Client Directive">
        <ErrorState
          title="Directive Not Found"
          message="Could not locate the requested client directive in the active queue."
          onRetry={() => refetch()}
        />
      </PageShell>
    );
  }

  return (
    <PageShell
      eyebrow={`CLIENT DIRECTIVE • #${matchedAction.id.slice(0, 8)}`}
      title={matchedAction.title}
      description={`Application: #${matchedApp?.applicationNumber || matchedAction.applicationId} • Priority: ${matchedAction.priority}`}
      actions={
        <div className="flex items-center gap-2">
          <Link href="/admin/actions">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="size-3.5" />}>
              Action Center
            </Button>
          </Link>
          {matchedApp && (
            <Link href={`/admin/applications/${matchedApp.id}`}>
              <Button variant="gold" size="sm" rightIcon={<ExternalLink className="size-3.5" />}>
                View Application Dossier
              </Button>
            </Link>
          )}
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Directive Specification */}
        <div className="space-y-6 lg:col-span-2">
          <Card padding="md" className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Statutory Directive Description
                </span>
                <h3 className="text-base font-bold text-foreground">{matchedAction.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                <PriorityBadge priority={matchedAction.priority} size="sm" />
                <Badge
                  tone={
                    matchedAction.status === "COMPLETED"
                      ? "success"
                      : matchedAction.status === "CANCELLED"
                      ? "neutral"
                      : "warning"
                  }
                  size="md"
                >
                  {matchedAction.status}
                </Badge>
              </div>
            </div>

            <div className="text-xs leading-relaxed text-foreground whitespace-pre-wrap rounded-xs border border-border bg-muted/20 p-3.5">
              {matchedAction.description}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="rounded-xs border border-border bg-muted/20 p-2.5">
                <span className="text-muted-foreground block text-[11px]">Directive Type</span>
                <strong className="text-foreground">{matchedAction.actionType}</strong>
              </div>

              <div className="rounded-xs border border-border bg-muted/20 p-2.5">
                <span className="text-muted-foreground block text-[11px]">Due Date</span>
                <strong className="text-foreground">
                  {matchedAction.dueAt ? formatDate(matchedAction.dueAt) : "No Fixed Deadline"}
                </strong>
              </div>

              <div className="rounded-xs border border-border bg-muted/20 p-2.5">
                <span className="text-muted-foreground block text-[11px]">Created Date</span>
                <span className="text-foreground">{formatDate(matchedAction.createdAt)}</span>
              </div>

              <div className="rounded-xs border border-border bg-muted/20 p-2.5">
                <span className="text-muted-foreground block text-[11px]">Resolved Date</span>
                <span className="text-foreground">
                  {matchedAction.completedAt ? formatDate(matchedAction.completedAt) : "Pending"}
                </span>
              </div>
            </div>
          </Card>

          {/* Action Control Panel */}
          {matchedAction.status === "OPEN" && (
            <Card padding="md" className="space-y-3">
              <h4 className="text-sm font-bold text-foreground">Operational Action Controls</h4>
              <p className="text-xs text-muted-foreground">
                Administrative intervention options for this directive.
              </p>
              <div className="flex items-center gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => setIsCancelModalOpen(true)}
                >
                  Cancel Directive
                </Button>
                {matchedApp && (
                  <Link href={`/admin/applications/${matchedApp.id}`}>
                    <Button variant="gold" size="sm">
                      Inspect in Application 360
                    </Button>
                  </Link>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Right Col: Host Application & Client Profile */}
        <div className="space-y-6">
          {matchedApp && (
            <Card padding="md" className="space-y-3 text-xs">
              <h4 className="text-sm font-bold text-foreground">Host Application</h4>
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
                  <span className="text-muted-foreground">Service</span>
                  <span className="font-semibold text-foreground">{matchedApp.service?.name}</span>
                </div>
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Status</span>
                  <Badge tone="neutral" size="sm">{matchedApp.status}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Priority</span>
                  <PriorityBadge priority={matchedApp.priority} size="sm" />
                </div>
              </div>
            </Card>
          )}

          {matchedApp?.client && (
            <Card padding="md" className="space-y-3 text-xs">
              <h4 className="text-sm font-bold text-foreground">Client Entity</h4>
              <div className="space-y-2">
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Client Name</span>
                  <span className="font-bold text-foreground">
                    {matchedApp.client.fullName || matchedApp.client.businessName}
                  </span>
                </div>
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Email</span>
                  <span className="text-foreground">{matchedApp.client.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="font-mono text-foreground">{matchedApp.client.phone || "N/A"}</span>
                </div>
              </div>
              <div className="pt-2 border-t border-border">
                <Link
                  href={`/admin/clients/${matchedApp.client.id}`}
                  className="text-xs font-semibold text-gold-dark dark:text-gold hover:underline block text-center"
                >
                  View Full Client 360 Dossier
                </Link>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* CANCEL MODAL */}
      {isCancelModalOpen && (
        <Modal
          isOpen={isCancelModalOpen}
          onClose={() => setIsCancelModalOpen(false)}
          title="Cancel Client Directive"
          description="Cancel this pending directive. A mandatory audit reason is required."
          size="sm"
        >
          <div className="space-y-4 text-xs">
            <FormField label="Cancellation Justification" required>
              <Textarea
                placeholder="Reason why this directive is cancelled..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
              />
            </FormField>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCancelModalOpen(false)}
                disabled={cancelMutation.isPending}
              >
                Close
              </Button>
              <Button
                variant="destructive"
                size="sm"
                isLoading={cancelMutation.isPending}
                disabled={!cancelReason.trim()}
                onClick={() => cancelMutation.mutate()}
              >
                Confirm Cancellation
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </PageShell>
  );
}
