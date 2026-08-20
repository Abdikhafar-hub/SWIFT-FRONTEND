"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ListTodo,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Search,
  ArrowRight,
  User,
  FileText,
  Filter,
  Eye,
} from "lucide-react";
import { PageShell } from "@/components/ui/layout-primitives";
import { Card, StatCard } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Pagination,
} from "@/components/ui/table-primitives";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { FormField, Textarea } from "@/components/ui/form-primitives";
import { PriorityBadge } from "@/components/domain/status-badges";
import { AdminClientActionModal } from "@/components/domain";
import { EmptyState, Skeleton, ErrorState } from "@/components/ui/feedback-primitives";
import { adminApi } from "@/lib/api/admin";
import { formatDate } from "@/lib/utils/format";
import type { ClientAction, Application, ClientActionType, ApplicationPriority } from "@/types";

export default function AdminActionsPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("OPEN");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [page, setPage] = useState(1);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedAppForCreate, setSelectedAppForCreate] = useState<string>("");
  const [selectedActionForCancel, setSelectedActionForCancel] = useState<ClientAction | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  // Query applications with actionRequired or fetch list to aggregate actions
  const { data: appsData, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-applications-actions-queue"],
    queryFn: () =>
      adminApi.getApplications({
        page: 1,
        limit: 100,
      }),
  });

  const applications: Application[] = appsData?.items || [];

  // Extract all client actions from applications
  const allActions: Array<ClientAction & { application?: Application }> = [];
  applications.forEach((app) => {
    if (app.clientActions && app.clientActions.length > 0) {
      app.clientActions.forEach((act) => {
        allActions.push({
          ...act,
          application: app,
        });
      });
    }
  });

  // Filter actions
  const filteredActions = allActions.filter((act) => {
    if (search) {
      const q = search.toLowerCase();
      const matchTitle = act.title?.toLowerCase().includes(q);
      const matchDesc = act.description?.toLowerCase().includes(q);
      const matchApp = act.application?.applicationNumber?.toLowerCase().includes(q);
      const matchClient =
        act.application?.client?.fullName?.toLowerCase().includes(q) ||
        act.application?.client?.businessName?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchApp && !matchClient) return false;
    }
    if (priorityFilter && act.priority !== priorityFilter) return false;
    if (statusFilter && statusFilter !== "ALL" && act.status !== statusFilter) return false;
    if (typeFilter && act.actionType !== typeFilter) return false;
    return true;
  });

  // Metrics
  const openCount = allActions.filter((a) => a.status === "OPEN").length;
  const urgentCount = allActions.filter((a) => a.status === "OPEN" && (a.priority === "URGENT" || a.priority === "HIGH")).length;
  const docCount = allActions.filter(
    (a) => a.status === "OPEN" && (a.actionType === "UPLOAD_DOCUMENT" || a.actionType === "REPLACE_DOCUMENT")
  ).length;
  const completedCount = allActions.filter((a) => a.status === "COMPLETED").length;

  // Pagination on filtered
  const pageSize = 10;
  const totalPages = Math.ceil(filteredActions.length / pageSize) || 1;
  const paginatedActions = filteredActions.slice((page - 1) * pageSize, page * pageSize);

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: () => {
      if (!selectedActionForCancel) throw new Error("No action selected");
      return adminApi.cancelClientAction(selectedActionForCancel.id, {
        reason: cancelReason || "Cancelled by statutory operations officer.",
      });
    },
    onSuccess: () => {
      setSelectedActionForCancel(null);
      setCancelReason("");
      queryClient.invalidateQueries({ queryKey: ["admin-applications-actions-queue"] });
      queryClient.invalidateQueries({ queryKey: ["admin-work-queue"] });
    },
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-4 sm:p-5 lg:p-6 space-y-4 max-w-[1550px] mx-auto font-sans">
      {/* ------------------------------------------------------------------ */}
      {/* 1. HEADER SECTION */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Client Action Center
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Work queue of mandatory client actions, pending information disclosures, document replacements, and blocking requirements.
          </p>
        </div>

        <button
          onClick={() => {
            if (applications.length > 0) {
              setSelectedAppForCreate(applications[0].id);
            }
            setIsCreateModalOpen(true);
          }}
          className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
        >
          <Plus className="size-3.5" />
          <span>Dispatch Action Item</span>
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. EXECUTIVE ACTION METRICS */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Open Action Directives</span>
            <span className="text-xl font-extrabold text-slate-900 font-mono mt-0.5 block">{openCount}</span>
            <span className="text-[10px] text-slate-500 font-medium">Awaiting client response</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
            <ListTodo className="size-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Urgent Blockers</span>
            <span className="text-xl font-extrabold text-rose-600 font-mono mt-0.5 block">{urgentCount}</span>
            <span className="text-[10px] text-slate-500 font-medium">Blocks filing submission</span>
          </div>
          <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200/60">
            <AlertTriangle className="size-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Document Actions</span>
            <span className="text-xl font-extrabold text-amber-600 font-mono mt-0.5 block">{docCount}</span>
            <span className="text-[10px] text-slate-500 font-medium">Uploads &amp; replacements</span>
          </div>
          <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60">
            <FileText className="size-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Resolved Directives</span>
            <span className="text-xl font-extrabold text-emerald-600 font-mono mt-0.5 block">{completedCount}</span>
            <span className="text-[10px] text-slate-500 font-medium">Client fulfilled &amp; verified</span>
          </div>
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60">
            <CheckCircle2 className="size-4" />
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. FILTERS & SEARCH */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by directive, client, or dossier #..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium text-slate-800 placeholder-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-semibold text-slate-700"
          >
            <option value="OPEN">Open Directives</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="ALL">All Statuses</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-semibold text-slate-700"
          >
            <option value="">All Priorities</option>
            <option value="URGENT">Urgent Only</option>
            <option value="HIGH">High Priority</option>
            <option value="NORMAL">Normal</option>
            <option value="LOW">Low</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-semibold text-slate-700"
          >
            <option value="">All Directive Types</option>
            <option value="UPLOAD_DOCUMENT">Upload Document</option>
            <option value="REPLACE_DOCUMENT">Replace Document</option>
            <option value="PROVIDE_INFORMATION">Provide Information</option>
            <option value="CONFIRM_INFORMATION">Confirm Information</option>
            <option value="MAKE_PAYMENT">Make Payment</option>
            <option value="APPROVE_DECLARATION">Declaration</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 4. WORK QUEUE TABLE */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-slate-100 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <p className="text-xs font-bold text-rose-600">Failed to load client action items.</p>
            <button
              onClick={() => refetch()}
              className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
            >
              Retry Loading
            </button>
          </div>
        ) : filteredActions.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <ListTodo className="size-8 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No client action items found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No active directives match the specified filters.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition-colors inline-flex items-center gap-1.5"
            >
              <Plus className="size-3.5" />
              <span>Dispatch First Action Item</span>
            </button>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Directive / Requirement</th>
                    <th className="py-3 px-4">Dossier #</th>
                    <th className="py-3 px-4">Client Entity</th>
                    <th className="py-3 px-4">Urgency</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Deadline</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {paginatedActions.map((action) => (
                    <tr key={action.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <Link
                            href={`/admin/actions/${action.id}`}
                            className="font-bold text-xs text-slate-900 hover:text-amber-700 hover:underline block"
                          >
                            {action.title}
                          </Link>
                          <p className="text-[11px] text-slate-500 line-clamp-1 max-w-xs font-medium">
                            {action.description}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {action.application ? (
                          <Link
                            href={`/admin/applications/${action.application.id}`}
                            className="font-mono text-xs font-bold text-amber-700 hover:text-amber-800 hover:underline"
                          >
                            #{action.application.applicationNumber}
                          </Link>
                        ) : (
                          <span className="text-xs text-slate-500 font-mono">
                            {action.applicationId?.slice(0, 8)}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs font-bold text-slate-800">
                        {action.application?.client?.fullName ||
                          action.application?.client?.businessName ||
                          "Verified Client"}
                      </td>
                      <td className="py-3 px-4">
                        <PriorityBadge priority={action.priority} size="sm" />
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                            action.status === "COMPLETED"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200/80"
                              : action.status === "CANCELLED"
                              ? "bg-slate-100 text-slate-600 border-slate-200"
                              : "bg-amber-50 text-amber-800 border-amber-200/80"
                          }`}
                        >
                          {action.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500 font-medium">
                        {action.dueAt ? (
                          <span className="flex items-center gap-1 font-mono">
                            <Clock className="size-3 text-amber-600" />
                            {formatDate(action.dueAt)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/admin/actions/${action.id}`}>
                            <button className="bg-white border border-slate-200 text-slate-700 font-bold text-xs px-2.5 py-1 rounded-lg hover:bg-slate-50 transition-all inline-flex items-center gap-1">
                              <Eye className="size-3 text-slate-500" />
                              <span>Details</span>
                            </button>
                          </Link>
                          {action.status === "OPEN" && (
                            <button
                              onClick={() => setSelectedActionForCancel(action)}
                              className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-lg border border-rose-200 transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="px-4 py-3 bg-slate-50/60 border-t border-slate-200/80 flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>
                  Page {page} of {totalPages} ({filteredActions.length} total items)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL: CREATE ACTION */}
      {isCreateModalOpen && (
        <AdminClientActionModal
          applicationId={selectedAppForCreate || applications[0]?.id || ""}
          applicationNumber={
            applications.find((a) => a.id === selectedAppForCreate)?.applicationNumber
          }
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["admin-applications-actions-queue"] });
          }}
        />
      )}

      {/* MODAL: CANCEL ACTION */}
      {selectedActionForCancel && (
        <Modal
          isOpen={Boolean(selectedActionForCancel)}
          onClose={() => setSelectedActionForCancel(null)}
          title={`Cancel Client Directive • ${selectedActionForCancel.title}`}
          description="Cancel this pending directive. A mandatory audit reason is required."
          size="sm"
        >
          <div className="space-y-4 text-xs">
            <FormField label="Cancellation Reason / Justification" required>
              <Textarea
                placeholder="Explain why this action is no longer required from the client..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
              />
            </FormField>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedActionForCancel(null)}
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
