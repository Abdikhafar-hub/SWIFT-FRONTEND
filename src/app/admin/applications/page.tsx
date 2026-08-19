"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  ChevronRight,
  Plus,
  Filter,
  UserCheck,
  Clock,
  ShieldCheck,
  Landmark,
  AlertTriangle,
  Inbox,
  CheckCircle2,
} from "lucide-react";
import { PageShell } from "@/components/ui/layout-primitives";
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
import { StatusBadge, SlaBadge, PriorityBadge } from "@/components/domain/status-badges";
import { EmptyState, Skeleton, ErrorState } from "@/components/ui/feedback-primitives";
import { adminApi } from "@/lib/api/admin";
import { formatDate } from "@/lib/utils/format";
import type { ApplicationStatus, ApplicationPriority } from "@/types";

type QueueTab = "all" | "unassigned" | "qc" | "government" | "dueSoon" | "overdue";

export default function AdminApplicationsPage() {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<QueueTab>("all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [page, setPage] = useState(1);

  // New Application Modal State
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newClientId, setNewClientId] = useState("");
  const [newServiceId, setNewServiceId] = useState("");
  const [newPriority, setNewPriority] = useState<ApplicationPriority>("NORMAL");
  const [newNotes, setNewNotes] = useState("");

  // Fetch Clients & Services for creation dropdowns
  const { data: clientsData } = useQuery({
    queryKey: ["admin-clients-select"],
    queryFn: () => adminApi.getClients({ limit: 100 }),
    enabled: isNewModalOpen,
  });

  const { data: servicesData } = useQuery({
    queryKey: ["admin-services-select"],
    queryFn: () => adminApi.getServices(),
    enabled: isNewModalOpen,
  });

  const clients = clientsData?.items || [];
  const services = servicesData || [];

  // Work Queue Query
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-work-queue", activeTab, page, search, statusFilter, priorityFilter],
    queryFn: () => {
      let queueParams: any = {
        page,
        limit: 10,
        search: search || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
      };

      if (activeTab === "unassigned") {
        queueParams.needsAttention = "unassigned";
      } else if (activeTab === "qc") {
        queueParams.status = "DOCUMENT_REVIEW";
      } else if (activeTab === "government") {
        queueParams.status = "GOVERNMENT_PROCESSING";
      } else if (activeTab === "dueSoon") {
        queueParams.slaStatus = "AT_RISK";
      } else if (activeTab === "overdue") {
        queueParams.overdue = "true";
      }

      return adminApi.getWorkQueue(queueParams);
    },
  });

  const createApplicationMutation = useMutation({
    mutationFn: () =>
      adminApi.createAdminApplication({
        clientId: newClientId,
        serviceId: newServiceId,
        priority: newPriority,
        notesSummary: newNotes || undefined,
      }),
    onSuccess: () => {
      setIsNewModalOpen(false);
      setNewClientId("");
      setNewServiceId("");
      setNewNotes("");
      queryClient.invalidateQueries({ queryKey: ["admin-work-queue"] });
      queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
    },
  });

  const applications = data?.items || [];
  const pagination = data?.pagination;

  return (
    <PageShell
      eyebrow="OPERATIONAL DISPATCH"
      title="Master Statutory Work Queue"
      description="Process client registrations, enforce statutory QA standards, track registry filings, and maintain strict SLAs."
      actions={
        <Button
          variant="gold"
          size="sm"
          leftIcon={<Plus className="size-4" />}
          onClick={() => setIsNewModalOpen(true)}
        >
          New Client Filing
        </Button>
      }
    >
      {/* 1. QUEUE FILTER TABS */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        <button
          type="button"
          onClick={() => {
            setActiveTab("all");
            setPage(1);
          }}
          className={`flex items-center gap-1.5 rounded-xs px-3 py-1.5 text-xs font-semibold transition-all ${
            activeTab === "all"
              ? "bg-navy text-white dark:bg-gold dark:text-navy-dark shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <span>All Filings</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("unassigned");
            setPage(1);
          }}
          className={`flex items-center gap-1.5 rounded-xs px-3 py-1.5 text-xs font-semibold transition-all ${
            activeTab === "unassigned"
              ? "bg-navy text-white dark:bg-gold dark:text-navy-dark shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <Inbox className="size-3.5" />
          <span>Unassigned Queue</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("qc");
            setPage(1);
          }}
          className={`flex items-center gap-1.5 rounded-xs px-3 py-1.5 text-xs font-semibold transition-all ${
            activeTab === "qc"
              ? "bg-navy text-white dark:bg-gold dark:text-navy-dark shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <ShieldCheck className="size-3.5" />
          <span>Quality Check (QC)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("government");
            setPage(1);
          }}
          className={`flex items-center gap-1.5 rounded-xs px-3 py-1.5 text-xs font-semibold transition-all ${
            activeTab === "government"
              ? "bg-navy text-white dark:bg-gold dark:text-navy-dark shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <Landmark className="size-3.5" />
          <span>Gov Registry Processing</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("dueSoon");
            setPage(1);
          }}
          className={`flex items-center gap-1.5 rounded-xs px-3 py-1.5 text-xs font-semibold transition-all ${
            activeTab === "dueSoon"
              ? "bg-amber-600 text-white shadow-xs"
              : "text-amber-600 hover:bg-amber-500/10"
          }`}
        >
          <Clock className="size-3.5" />
          <span>Due Soon (&lt;24h)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("overdue");
            setPage(1);
          }}
          className={`flex items-center gap-1.5 rounded-xs px-3 py-1.5 text-xs font-semibold transition-all ${
            activeTab === "overdue"
              ? "bg-destructive text-white shadow-xs"
              : "text-destructive hover:bg-destructive/10"
          }`}
        >
          <AlertTriangle className="size-3.5" />
          <span>SLA Breached / Overdue</span>
        </button>
      </div>

      {/* 2. SEARCH & FILTER CONTROLS */}
      <div className="mt-4 mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3 max-w-md">
          <Input
            placeholder="Search by app #, client name, PIN, or service..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            leftAddon={<Search className="size-4" />}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setPage(1);
            }}
            className="w-36 text-xs"
            options={[
              { value: "", label: "All Priorities" },
              { value: "URGENT", label: "Urgent Priority" },
              { value: "HIGH", label: "High Priority" },
              { value: "NORMAL", label: "Normal Priority" },
              { value: "LOW", label: "Low Priority" },
            ]}
          />

          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-48 text-xs"
            options={[
              { value: "", label: "All Lifecycle States" },
              { value: "NEW", label: "New Application" },
              { value: "QUALIFICATION", label: "Qualification" },
              { value: "REQUIREMENTS_PENDING", label: "Requirements Pending" },
              { value: "DOCUMENT_REVIEW", label: "Document Review" },
              { value: "READY_FOR_SUBMISSION", label: "Ready for Submission" },
              { value: "SUBMITTED", label: "Submitted" },
              { value: "GOVERNMENT_PROCESSING", label: "Government Processing" },
              { value: "APPROVED", label: "Approved" },
              { value: "QUALITY_CHECK", label: "Quality Check" },
              { value: "READY_FOR_DELIVERY", label: "Ready for Delivery" },
              { value: "CLOSED", label: "Closed / Completed" },
            ]}
          />
        </div>
      </div>

      {/* 3. TABLE / QUEUE LIST */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : error ? (
        <ErrorState onRetry={() => refetch()} />
      ) : applications.length === 0 ? (
        <EmptyState
          title="No applications in selected queue"
          description="No statutory applications matched the current filters or workload bucket."
        />
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dossier #</TableHead>
                <TableHead>Client Entity</TableHead>
                <TableHead>Statutory Service</TableHead>
                <TableHead>Lifecycle State</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Officer</TableHead>
                <TableHead>SLA Progress</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((app) => (
                <TableRow key={app.id}>
                  <TableCell className="font-mono text-xs font-bold text-foreground">
                    #{app.applicationNumber}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <span className="font-semibold text-xs text-foreground block">
                        {app.client?.fullName || app.client?.businessName || "Client"}
                      </span>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {app.client?.phone || app.client?.email || ""}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-xs text-foreground block">
                      {app.service?.name || "Statutory Service"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {app.service?.category?.name || "Government Filing"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={app.status} size="sm" />
                  </TableCell>
                  <TableCell>
                    <PriorityBadge priority={app.priority} size="sm" />
                  </TableCell>
                  <TableCell className="text-xs">
                    {app.assignedAdmin ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                        <UserCheck className="size-3 text-emerald-600" />
                        {app.assignedAdmin.fullName || app.assignedAdmin.email}
                      </span>
                    ) : (
                      <Badge tone="neutral" size="sm">
                        Unassigned
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <SlaBadge status={app.slaStatus} size="sm" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/applications/${app.id}`}>
                      <Button variant="gold" size="xs" rightIcon={<ChevronRight className="size-3.5" />}>
                        Process
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {pagination && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              pageSize={pagination.limit}
              onChange={(p) => setPage(p)}
            />
          )}
        </div>
      )}

      {/* NEW APPLICATION INTAKE MODAL */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Initiate Statutory Client Filing"
        description="Create a new government application dossier on behalf of an authenticated client entity."
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsNewModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="gold"
              size="sm"
              isLoading={createApplicationMutation.isPending}
              disabled={!newClientId || !newServiceId}
              onClick={() => createApplicationMutation.mutate()}
            >
              Create Statutory Dossier
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormField label="Target Client" required>
            <Select
              value={newClientId}
              onChange={(e) => setNewClientId(e.target.value)}
              options={[
                { value: "", label: "Select client entity..." },
                ...clients.map((c) => ({
                  value: c.id,
                  label: `${c.fullName || c.businessName || "Client"} (${c.phone || c.email})`,
                })),
              ]}
            />
          </FormField>

          <FormField label="Statutory Service" required>
            <Select
              value={newServiceId}
              onChange={(e) => setNewServiceId(e.target.value)}
              options={[
                { value: "", label: "Select statutory service catalog..." },
                ...services.map((s) => ({
                  value: s.id,
                  label: `${s.name} — KES ${(Number(s.serviceFee) + Number(s.governmentFee || 0)).toLocaleString()}`,
                })),
              ]}
            />
          </FormField>

          <FormField label="Priority Tier" required>
            <Select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value as ApplicationPriority)}
              options={[
                { value: "LOW", label: "Low Priority" },
                { value: "NORMAL", label: "Normal Priority (Standard SLA)" },
                { value: "HIGH", label: "High Priority (Expedited)" },
                { value: "URGENT", label: "Urgent Priority (Direct Officer Focus)" },
              ]}
            />
          </FormField>

          <FormField label="Intake Notes / Instructions">
            <Textarea
              placeholder="Record initial client instructions or special statutory filing context..."
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              rows={3}
            />
          </FormField>
        </div>
      </Modal>
    </PageShell>
  );
}
