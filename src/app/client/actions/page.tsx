"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ListTodo,
  UploadCloud,
  FileText,
  CreditCard,
  Info,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Clock,
  Send,
  Filter,
  X,
} from "lucide-react";
import { PageShell } from "@/components/ui/layout-primitives";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import {
  ApplicationStatusBadge,
  PriorityBadge,
} from "@/components/domain/status-badges";
import { EmptyState, Skeleton, ErrorState } from "@/components/ui/feedback-primitives";
import { applicationsApi } from "@/lib/api/applications";
import { formatRelativeTime, formatDate } from "@/lib/utils/format";
import type { ClientAction, ClientActionType } from "@/types";

export default function ClientActionCenterPage() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const [typeFilter, setTypeFilter] = useState<string>("");
  const [completingAction, setCompletingAction] = useState<ClientAction | null>(null);
  const [completionNotes, setCompletionNotes] = useState("");
  const [completionError, setCompletionError] = useState<string | null>(null);

  const {
    data: actions = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["client-actions"],
    queryFn: () => applicationsApi.getClientActions(),
  });

  const completeMutation = useMutation({
    mutationFn: (actionId: string) =>
      applicationsApi.completeClientAction(actionId, {
        completionNotes: completionNotes.trim() || undefined,
      }),
    onSuccess: () => {
      setCompletingAction(null);
      setCompletionNotes("");
      setCompletionError(null);
      queryClient.invalidateQueries({ queryKey: ["client-actions"] });
      queryClient.invalidateQueries({ queryKey: ["client-applications"] });
      queryClient.invalidateQueries({ queryKey: ["client-dashboard-overview"] });
    },
    onError: (err: any) => {
      setCompletionError(err.message || "Failed to complete action.");
    },
  });

  const filteredActions = actions.filter((a) => {
    if (!typeFilter) return true;
    return a.type === typeFilter;
  });

  const openActions = filteredActions.filter((a) => a.status === "OPEN");
  const resolvedActions = filteredActions.filter((a) => a.status !== "OPEN");

  const getActionIcon = (type: ClientActionType) => {
    switch (type) {
      case "UPLOAD_DOCUMENT":
      case "REPLACE_DOCUMENT":
        return <UploadCloud className="size-5" />;
      case "MAKE_PAYMENT":
        return <CreditCard className="size-5" />;
      case "PROVIDE_INFORMATION":
      case "CONFIRM_INFORMATION":
        return <Info className="size-5" />;
      case "APPROVE_DECLARATION":
      case "SIGN_DECLARATION":
        return <FileText className="size-5" />;
      default:
        return <AlertCircle className="size-5" />;
    }
  };

  const getActionLabel = (type: ClientActionType) => {
    switch (type) {
      case "UPLOAD_DOCUMENT":
        return "Upload Document";
      case "REPLACE_DOCUMENT":
        return "Replace Document";
      case "MAKE_PAYMENT":
        return "Make Payment";
      case "PROVIDE_INFORMATION":
        return "Provide Information";
      case "CONFIRM_INFORMATION":
        return "Confirm Information";
      case "APPROVE_DECLARATION":
        return "Approve Declaration";
      case "SIGN_DECLARATION":
        return "Sign Declaration";
      default:
        return "Complete Action";
    }
  };

  const handleActionNavigate = (action: ClientAction) => {
    // Route to the Application 360 dossier at the relevant tab
    if (
      action.type === "UPLOAD_DOCUMENT" ||
      action.type === "REPLACE_DOCUMENT"
    ) {
      router.push(`/client/applications/${action.applicationId}?tab=requirements`);
    } else if (action.type === "MAKE_PAYMENT") {
      router.push(`/client/applications/${action.applicationId}?tab=financials`);
    } else {
      router.push(`/client/applications/${action.applicationId}?tab=requirements`);
    }
  };

  return (
    <PageShell
      eyebrow="URGENT OPERATIONS"
      title="Action Center"
      description="Outstanding items requiring your immediate attention. Fulfill document requests, provide information, and resolve compliance blockers."
      actions={
        openActions.length > 0 ? (
          <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
            {openActions.length} Open Action{openActions.length !== 1 ? "s" : ""}
          </span>
        ) : undefined
      }
    >
      {/* Filters */}
      <div className="mb-6 flex items-center gap-3">
        <Select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-56 text-xs font-medium"
        >
          <option value="">All Action Types</option>
          <option value="UPLOAD_DOCUMENT">Upload Document</option>
          <option value="REPLACE_DOCUMENT">Replace Document</option>
          <option value="PROVIDE_INFORMATION">Provide Information</option>
          <option value="CONFIRM_INFORMATION">Confirm Information</option>
          <option value="MAKE_PAYMENT">Make Payment</option>
          <option value="APPROVE_DECLARATION">Approve Declaration</option>
          <option value="SIGN_DECLARATION">Sign Declaration</option>
        </Select>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : error ? (
        <ErrorState onRetry={() => refetch()} />
      ) : openActions.length === 0 && resolvedActions.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="size-8" />}
          title="No outstanding actions"
          description="You have no pending action items. When a compliance officer requires a document replacement or additional information, items will appear here."
          action={
            <Link href="/client/applications">
              <Button variant="gold" size="sm">
                View My Applications
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-8">
          {/* Open Actions */}
          {openActions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-amber-500 animate-pulse" />
                <h3 className="text-sm font-bold text-foreground">
                  Pending Actions ({openActions.length})
                </h3>
              </div>

              <div className="space-y-3">
                {openActions.map((action) => (
                  <div
                    key={action.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-sm border border-gold/40 bg-gold/5 p-5 transition-all hover:border-gold hover:shadow-xs"
                  >
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xs bg-gold/20 text-gold">
                        {getActionIcon(action.type)}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gold-dark dark:text-gold">
                            {getActionLabel(action.type)}
                          </span>
                          <PriorityBadge priority={action.priority} size="sm" />
                          {action.dueAt && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Clock className="size-3" />
                              Due {formatRelativeTime(action.dueAt)}
                            </span>
                          )}
                        </div>
                        <h4 className="mt-0.5 font-display text-sm font-bold text-foreground">
                          {action.title}
                        </h4>
                        <p className="mt-1 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                          {action.description}
                        </p>
                        {action.application && (
                          <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span className="font-mono font-bold">
                              #{action.application.applicationNumber || "—"}
                            </span>
                            <span>•</span>
                            <span>{action.application.service?.name || "Statutory Filing"}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleActionNavigate(action)}
                        className="text-xs gap-1"
                      >
                        <span>View Dossier</span>
                        <ArrowRight className="size-3" />
                      </Button>
                      <Button
                        variant="gold"
                        size="sm"
                        onClick={() => {
                          setCompletingAction(action);
                          setCompletionNotes("");
                          setCompletionError(null);
                        }}
                        className="text-xs gap-1"
                      >
                        <CheckCircle2 className="size-3.5" />
                        <span>Mark Complete</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resolved Actions */}
          {resolvedActions.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-muted-foreground">
                Recently Resolved ({resolvedActions.length})
              </h3>
              <div className="space-y-2">
                {resolvedActions.slice(0, 10).map((action) => (
                  <div
                    key={action.id}
                    className="flex items-center justify-between gap-3 rounded-xs border border-border bg-card p-4 opacity-70"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-xs bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-foreground truncate">
                          {action.title}
                        </h4>
                        <span className="text-[10px] text-muted-foreground">
                          Completed {action.completedAt ? formatDate(action.completedAt) : ""}
                        </span>
                      </div>
                    </div>
                    <span className="rounded-xs bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                      {action.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Completion Confirmation Modal */}
      <Modal
        isOpen={Boolean(completingAction)}
        onClose={() => setCompletingAction(null)}
        title="Complete Action"
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCompletingAction(null)}
              disabled={completeMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="gold"
              size="sm"
              onClick={() => {
                if (completingAction) {
                  completeMutation.mutate(completingAction.id);
                }
              }}
              isLoading={completeMutation.isPending}
              className="gap-1.5"
            >
              <CheckCircle2 className="size-3.5" />
              <span>Confirm Completion</span>
            </Button>
          </div>
        }
      >
        {completingAction && (
          <div className="space-y-4">
            <div className="rounded-xs border border-border p-4 bg-muted/20 space-y-2">
              <h4 className="text-sm font-bold text-foreground">
                {completingAction.title}
              </h4>
              <p className="text-xs text-muted-foreground">
                {completingAction.description}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-foreground">
                Completion Notes (Optional)
              </label>
              <textarea
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                placeholder="Any notes about how you fulfilled this action..."
                rows={3}
                className="w-full rounded-xs border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/50 resize-none"
              />
            </div>

            {completionError && (
              <div className="flex items-start gap-2 rounded-xs border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>{completionError}</span>
              </div>
            )}
          </div>
        )}
      </Modal>
    </PageShell>
  );
}
