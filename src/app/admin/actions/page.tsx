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
    <PageShell
      eyebrow="CASE OPERATIONS"
      title="Client Action Center"
      description="Work queue of mandatory client actions, pending information disclosures, document replacements, and blocking requirements."
      actions={
        <Button
          variant="gold"
          size="sm"
          leftIcon={<Plus className="size-3.5" />}
          onClick={() => {
            if (applications.length > 0) {
              setSelectedAppForCreate(applications[0].id);
            }
            setIsCreateModalOpen(true);
          }}
        >
          Dispatch Action Item
        </Button>
      }
    >
      {/* 1. EXECUTIVE ACTION METRICS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Open Action Directives"
          value={openCount}
          subtitle="Awaiting client response"
          icon={<ListTodo className="size-5 text-navy dark:text-gold" />}
        />

        <StatCard
          title="Urgent Blockers"
          value={urgentCount}
          subtitle="Blocks filing submission"
          variant={urgentCount > 0 ? "gold" : "default"}
          icon={<AlertTriangle className="size-5 text-destructive" />}
        />

        <StatCard
          title="Document Actions"
          value={docCount}
          subtitle="Uploads & replacements"
          icon={<FileText className="size-5 text-amber-600" />}
        />

        <StatCard
          title="Resolved Directives"
          value={completedCount}
          subtitle="Client fulfilled & verified"
          icon={<CheckCircle2 className="size-5 text-emerald-600" />}
        />
      </div>

      {/* 2. FILTERS & SEARCH */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3 max-w-md">
          <Input
            placeholder="Search by directive, client, or dossier #..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            leftAddon={<Search className="size-4" />}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-36 text-xs"
            options={[
              { value: "OPEN", label: "Open Directives" },
              { value: "COMPLETED", label: "Completed" },
              { value: "CANCELLED", label: "Cancelled" },
              { value: "ALL", label: "All Statuses" },
            ]}
          />

          <Select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setPage(1);
            }}
            className="w-36 text-xs"
            options={[
              { value: "", label: "All Priorities" },
              { value: "URGENT", label: "Urgent Only" },
              { value: "HIGH", label: "High Priority" },
              { value: "NORMAL", label: "Normal" },
              { value: "LOW", label: "Low" },
            ]}
          />

          <Select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="w-44 text-xs"
            options={[
              { value: "", label: "All Directive Types" },
              { value: "UPLOAD_DOCUMENT", label: "Upload Document" },
              { value: "REPLACE_DOCUMENT", label: "Replace Document" },
              { value: "PROVIDE_INFORMATION", label: "Provide Information" },
              { value: "CONFIRM_INFORMATION", label: "Confirm Information" },
              { value: "MAKE_PAYMENT", label: "Make Payment" },
              { value: "APPROVE_DECLARATION", label: "Declaration" },
              { value: "OTHER", label: "Other" },
            ]}
          />
        </div>
      </div>

      {/* 3. WORK QUEUE TABLE */}
      <div className="mt-6">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : error ? (
          <ErrorState onRetry={() => refetch()} />
        ) : filteredActions.length === 0 ? (
          <EmptyState
            icon={<ListTodo className="size-7" />}
            title="No client action items found"
            description="No active directives match the specified filters."
            action={
              <Button
                variant="gold"
                size="xs"
                leftIcon={<Plus className="size-3.5" />}
                onClick={() => setIsCreateModalOpen(true)}
              >
                Dispatch First Action Item
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Directive / Requirement</TableHead>
                  <TableHead>Dossier #</TableHead>
                  <TableHead>Client Entity</TableHead>
                  <TableHead>Urgency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedActions.map((action) => (
                  <TableRow key={action.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="space-y-0.5">
                        <Link
                          href={`/admin/actions/${action.id}`}
                          className="font-bold text-xs text-foreground hover:text-gold-dark dark:hover:text-gold hover:underline block"
                        >
                          {action.title}
                        </Link>
                        <p className="text-[11px] text-muted-foreground line-clamp-1 max-w-sm">
                          {action.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {action.application ? (
                        <Link
                          href={`/admin/applications/${action.application.id}`}
                          className="font-mono text-xs font-bold text-navy dark:text-gold hover:underline"
                        >
                          #{action.application.applicationNumber}
                        </Link>
                      ) : (
                        <span className="text-xs text-muted-foreground font-mono">
                          {action.applicationId?.slice(0, 8)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-foreground">
                      {action.application?.client?.fullName ||
                        action.application?.client?.businessName ||
                        "Verified Client"}
                    </TableCell>
                    <TableCell>
                      <PriorityBadge priority={action.priority} size="sm" />
                    </TableCell>
                    <TableCell>
                      <Badge
                        tone={
                          action.status === "COMPLETED"
                            ? "success"
                            : action.status === "CANCELLED"
                            ? "neutral"
                            : "warning"
                        }
                        size="sm"
                      >
                        {action.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {action.dueAt ? (
                        <span className="flex items-center gap-1">
                          <Clock className="size-3 text-amber-600" />
                          {formatDate(action.dueAt)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/admin/actions/${action.id}`}>
                          <Button variant="ghost" size="xs" leftIcon={<Eye className="size-3.5" />}>
                            Details
                          </Button>
                        </Link>
                        {action.status === "OPEN" && (
                          <Button
                            variant="ghost"
                            size="xs"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => setSelectedActionForCancel(action)}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={filteredActions.length}
              pageSize={pageSize}
              onChange={(p) => setPage(p)}
            />
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

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
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
    </PageShell>
  );
}
