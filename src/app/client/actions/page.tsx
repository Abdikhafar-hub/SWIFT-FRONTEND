"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  UploadCloud,
  FileText,
  CreditCard,
  Info,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Clock,
  Filter,
  Check,
} from "lucide-react";
import { PriorityBadge } from "@/components/domain/status-badges";
import { Modal } from "@/components/ui/modal";
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
    isError,
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
        return <UploadCloud className="size-4" />;
      case "MAKE_PAYMENT":
        return <CreditCard className="size-4" />;
      case "PROVIDE_INFORMATION":
      case "CONFIRM_INFORMATION":
        return <Info className="size-4" />;
      case "APPROVE_DECLARATION":
      case "SIGN_DECLARATION":
        return <FileText className="size-4" />;
      default:
        return <AlertCircle className="size-4" />;
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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-4 sm:p-5 lg:p-6 space-y-4 max-w-[1550px] mx-auto font-sans">
      {/* ------------------------------------------------------------------ */}
      {/* 1. HEADER SECTION */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Action Center
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Outstanding items requiring your immediate attention • Fulfill document requests and resolve compliance blockers.
          </p>
        </div>

        {openActions.length > 0 && (
          <span className="rounded-full bg-amber-500/10 border border-amber-300/80 px-3 py-1 text-xs font-bold text-amber-700 shrink-0 self-start sm:self-auto">
            {openActions.length} Pending Action{openActions.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. FILTER BAR */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center gap-2">
        <Filter className="size-3.5 text-slate-400 shrink-0" />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-full sm:w-60 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-semibold text-slate-700"
        >
          <option value="">All Action Types</option>
          <option value="UPLOAD_DOCUMENT">Upload Document</option>
          <option value="REPLACE_DOCUMENT">Replace Document</option>
          <option value="PROVIDE_INFORMATION">Provide Information</option>
          <option value="CONFIRM_INFORMATION">Confirm Information</option>
          <option value="MAKE_PAYMENT">Make Payment</option>
          <option value="APPROVE_DECLARATION">Approve Declaration</option>
          <option value="SIGN_DECLARATION">Sign Declaration</option>
        </select>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. CONTENT AREA */}
      {/* ------------------------------------------------------------------ */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-slate-100 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center space-y-3">
          <p className="text-xs font-bold text-rose-800">Unable to load pending action items.</p>
          <button
            onClick={() => refetch()}
            className="px-3 py-1.5 bg-white border border-rose-300 text-rose-700 text-xs font-bold rounded-lg hover:bg-rose-100 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : openActions.length === 0 && resolvedActions.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center space-y-3 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="size-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="size-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">No outstanding actions</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              You have no pending action items. When a compliance officer requests a document or additional details, items will appear here.
            </p>
          </div>
          <Link href="/client/applications" className="inline-block mt-2">
            <button className="bg-gradient-to-r from-[#C5A059] to-[#D4AF37] text-white font-bold text-xs px-4 py-2 rounded-xl">
              View My Applications
            </button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* OPEN ACTIONS */}
          {openActions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Pending Actions ({openActions.length})
                </h3>
              </div>

              <div className="space-y-3">
                {openActions.map((action) => (
                  <div
                    key={action.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-amber-300/80 bg-white p-4 sm:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all hover:border-amber-400 hover:shadow-md"
                  >
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      <div className="size-10 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-700 shrink-0 mt-0.5">
                        {getActionIcon(action.type)}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800">
                            {getActionLabel(action.type)}
                          </span>
                          <PriorityBadge priority={action.priority} size="sm" />
                          {action.dueAt && (
                            <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                              <Clock className="size-3" />
                              Due {formatRelativeTime(action.dueAt)}
                            </span>
                          )}
                        </div>
                        <h4 className="mt-1 text-sm font-bold text-slate-900 leading-snug">
                          {action.title}
                        </h4>
                        <p className="mt-0.5 text-xs text-slate-500 leading-relaxed line-clamp-2">
                          {action.description}
                        </p>
                        {action.application && (
                          <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                            <span className="font-mono font-bold text-slate-700">
                              #{action.application.applicationNumber || "—"}
                            </span>
                            <span>•</span>
                            <span>{action.application.service?.name || "Statutory Filing"}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => handleActionNavigate(action)}
                        className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1"
                      >
                        <span>View Dossier</span>
                        <ArrowRight className="size-3" />
                      </button>
                      <button
                        onClick={() => {
                          setCompletingAction(action);
                          setCompletionNotes("");
                          setCompletionError(null);
                        }}
                        className="px-3.5 py-1.5 bg-gradient-to-r from-[#C5A059] to-[#D4AF37] text-white text-xs font-bold rounded-lg shadow-xs hover:from-[#b49049] hover:to-[#c39e26] transition-colors flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="size-3.5" />
                        <span>Mark Complete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* RESOLVED ACTIONS */}
          {resolvedActions.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Recently Resolved ({resolvedActions.length})
              </h3>
              <div className="space-y-2">
                {resolvedActions.slice(0, 10).map((action) => (
                  <div
                    key={action.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white p-3.5 opacity-75"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <Check className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-800 truncate">
                          {action.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-medium">
                          Completed {action.completedAt ? formatDate(action.completedAt) : ""}
                        </span>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 shrink-0">
                      {action.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* COMPLETION MODAL */}
      <Modal
        isOpen={Boolean(completingAction)}
        onClose={() => setCompletingAction(null)}
        title="Complete Action"
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setCompletingAction(null)}
              disabled={completeMutation.isPending}
              className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (completingAction) {
                  completeMutation.mutate(completingAction.id);
                }
              }}
              disabled={completeMutation.isPending}
              className="px-3.5 py-1.5 bg-gradient-to-r from-[#C5A059] to-[#D4AF37] text-white text-xs font-bold rounded-lg shadow-xs hover:from-[#b49049] hover:to-[#c39e26] transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle2 className="size-3.5" />
              <span>{completeMutation.isPending ? "Completing..." : "Confirm Completion"}</span>
            </button>
          </div>
        }
      >
        {completingAction && (
          <div className="space-y-4 font-sans text-slate-800">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1">
              <h4 className="text-xs font-bold text-slate-900">
                {completingAction.title}
              </h4>
              <p className="text-xs text-slate-500">
                {completingAction.description}
              </p>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Completion Notes (Optional)
              </label>
              <textarea
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                placeholder="Any notes about how you fulfilled this action..."
                rows={3}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-none font-medium"
              />
            </div>

            {completionError && (
              <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 font-semibold">
                <AlertCircle className="size-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{completionError}</span>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
