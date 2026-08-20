"use client";

export const dynamic = "force-dynamic";

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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-4 sm:p-5 lg:p-6 space-y-4 max-w-[1550px] mx-auto font-sans">
      {/* ------------------------------------------------------------------ */}
      {/* 1. HEADER SECTION */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/80">
              Directive #{matchedAction.id.slice(0, 8)}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Dossier #{matchedApp?.applicationNumber || matchedAction.applicationId}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            {matchedAction.title}
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <Link href="/admin/actions">
            <button className="bg-white border border-slate-200 text-slate-700 font-bold text-xs px-3 py-2 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-1.5 shadow-xs">
              <ArrowLeft className="size-3.5 text-slate-500" />
              <span>Action Center</span>
            </button>
          </Link>
          {matchedApp && (
            <Link href={`/admin/applications/${matchedApp.id}`}>
              <button className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5">
                <span>View Dossier</span>
                <ExternalLink className="size-3.5" />
              </button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left 2 Cols: Directive Specification */}
        <div className="space-y-4 lg:col-span-2">
          <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Statutory Directive Specification
                </span>
                <h3 className="text-base font-bold text-slate-900">{matchedAction.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                <PriorityBadge priority={matchedAction.priority} size="sm" />
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border ${
                    matchedAction.status === "COMPLETED"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200/80"
                      : matchedAction.status === "CANCELLED"
                      ? "bg-slate-100 text-slate-600 border-slate-200"
                      : "bg-amber-50 text-amber-800 border-amber-200/80"
                  }`}
                >
                  {matchedAction.status}
                </span>
              </div>
            </div>

            <div className="text-xs leading-relaxed text-slate-700 whitespace-pre-wrap rounded-xl border border-slate-200/80 bg-slate-50 p-3.5 font-medium">
              {matchedAction.description}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3">
                <span className="text-slate-400 block text-[10px] font-extrabold uppercase tracking-wider">Directive Type</span>
                <strong className="text-slate-900 font-bold block mt-0.5">{matchedAction.actionType}</strong>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3">
                <span className="text-slate-400 block text-[10px] font-extrabold uppercase tracking-wider">Due Date</span>
                <strong className="text-slate-900 font-mono font-bold block mt-0.5">
                  {matchedAction.dueAt ? formatDate(matchedAction.dueAt) : "No Fixed Deadline"}
                </strong>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3">
                <span className="text-slate-400 block text-[10px] font-extrabold uppercase tracking-wider">Created Date</span>
                <span className="text-slate-700 font-mono font-semibold block mt-0.5">{formatDate(matchedAction.createdAt)}</span>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3">
                <span className="text-slate-400 block text-[10px] font-extrabold uppercase tracking-wider">Resolved Date</span>
                <span className="text-slate-700 font-mono font-semibold block mt-0.5">
                  {matchedAction.completedAt ? formatDate(matchedAction.completedAt) : "Pending"}
                </span>
              </div>
            </div>
          </div>

          {/* Action Control Panel */}
          {matchedAction.status === "OPEN" && (
            <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-3">
              <h4 className="text-sm font-bold text-slate-900">Operational Action Controls</h4>
              <p className="text-xs text-slate-500 font-medium">
                Administrative intervention options for this directive.
              </p>
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setIsCancelModalOpen(true)}
                  className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200/80 rounded-lg text-xs font-bold hover:bg-rose-100 transition-colors"
                >
                  Cancel Directive
                </button>
                {matchedApp && (
                  <Link href={`/admin/applications/${matchedApp.id}`}>
                    <button className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition-colors">
                      Inspect in Application 360
                    </button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Host Application & Client Profile */}
        <div className="space-y-4">
          {matchedApp && (
            <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-3 text-xs">
              <h4 className="text-sm font-bold text-slate-900">Host Application</h4>
              <div className="space-y-2">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-medium">Dossier #</span>
                  <Link
                    href={`/admin/applications/${matchedApp.id}`}
                    className="font-mono font-bold text-amber-700 hover:underline"
                  >
                    #{matchedApp.applicationNumber}
                  </Link>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-medium">Service</span>
                  <span className="font-bold text-slate-900">{matchedApp.service?.name}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-medium">Status</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                    {matchedApp.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Priority</span>
                  <PriorityBadge priority={matchedApp.priority} size="sm" />
                </div>
              </div>
            </div>
          )}

          {matchedApp?.client && (
            <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-3 text-xs">
              <h4 className="text-sm font-bold text-slate-900">Client Entity</h4>
              <div className="space-y-2">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-medium">Client Name</span>
                  <span className="font-bold text-slate-900">
                    {matchedApp.client.fullName || matchedApp.client.businessName}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-medium">Email</span>
                  <span className="text-slate-700 font-medium">{matchedApp.client.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Phone</span>
                  <span className="font-mono text-slate-700 font-medium">{matchedApp.client.phone || "N/A"}</span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <Link
                  href={`/admin/clients/${matchedApp.client.id}`}
                  className="text-xs font-bold text-amber-700 hover:underline block text-center"
                >
                  View Full Client 360 Dossier
                </Link>
              </div>
            </div>
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

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
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
    </div>
  );
}
