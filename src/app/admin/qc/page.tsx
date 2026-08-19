"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckSquare,
  ShieldCheck,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  FileCheck,
  UserCheck,
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
import { AdminQcModal } from "@/components/domain";
import { EmptyState, Skeleton, ErrorState } from "@/components/ui/feedback-primitives";
import { adminApi } from "@/lib/api/admin";
import { formatDate } from "@/lib/utils/format";
import type { Application } from "@/types";

export default function AdminQcPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [filterState, setFilterState] = useState("ALL");
  const [page, setPage] = useState(1);

  // Selected for QC modal
  const [selectedAppForQc, setSelectedAppForQc] = useState<Application | null>(null);

  // Query QC applications (applications in QUALITY_CHECK state or general queue)
  const { data: appsData, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-qc-queue", page, search],
    queryFn: () =>
      adminApi.getApplications({
        page,
        limit: 20,
        search: search || undefined,
      }),
  });

  const applications: Application[] = appsData?.items || [];
  const pagination = appsData?.pagination;

  // QC Filter
  const qcPendingApps = applications.filter((app) => app.status === "QUALITY_CHECK");
  const filteredApps =
    filterState === "PENDING"
      ? qcPendingApps
      : filterState === "PASSED"
      ? applications.filter((app) => app.status !== "QUALITY_CHECK" && (app.status as string) !== "CANCELLED")
      : applications;

  return (
    <PageShell
      eyebrow="CASE OPERATIONS"
      title="Quality Control Command Center"
      description="Rigorous statutory compliance inspection, document legibility audits, identity verification, and formal sign-offs."
    >
      {/* 1. QC METRICS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Pending QC Inspection"
          value={qcPendingApps.length}
          subtitle="Awaiting compliance sign-off"
          variant={qcPendingApps.length > 0 ? "gold" : "default"}
          icon={<CheckSquare className="size-5 text-navy dark:text-gold" />}
        />

        <StatCard
          title="Certified QC Passes"
          value={applications.filter((a) => a.status === "READY_FOR_SUBMISSION" || a.status === "SUBMITTED" || a.status === "DELIVERED" || a.status === "CLOSED").length}
          subtitle="Passed statutory inspection"
          icon={<CheckCircle2 className="size-5 text-emerald-600" />}
        />

        <StatCard
          title="Returned / Flagged"
          value={applications.filter((a) => a.status === "ADDITIONAL_INFORMATION_REQUIRED" || a.status === "ON_HOLD" || a.status === "CANCELLED").length}
          subtitle="Deficiencies identified"
          icon={<AlertTriangle className="size-5 text-destructive" />}
        />

        <StatCard
          title="Total Monitored"
          value={applications.length}
          subtitle="Applications in workstream"
          icon={<FileCheck className="size-5 text-muted-foreground" />}
        />
      </div>

      {/* 2. FILTERS & SEARCH */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3 max-w-md">
          <Input
            placeholder="Search by dossier #, client name, or service..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            leftAddon={<Search className="size-4" />}
          />
        </div>

        <div className="flex items-center gap-3">
          <Select
            value={filterState}
            onChange={(e) => {
              setFilterState(e.target.value);
              setPage(1);
            }}
            className="w-48 text-xs"
            options={[
              { value: "ALL", label: "All Workstream Dossiers" },
              { value: "PENDING", label: "QC Inspection Pending" },
              { value: "PASSED", label: "Certified / Approved" },
            ]}
          />
        </div>
      </div>

      {/* 3. QC QUEUE TABLE */}
      <div className="mt-6">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : error ? (
          <ErrorState onRetry={() => refetch()} />
        ) : filteredApps.length === 0 ? (
          <EmptyState
            icon={<ShieldCheck className="size-7" />}
            title="No applications pending inspection"
            description="All candidate dossiers have undergone quality checks."
          />
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dossier #</TableHead>
                  <TableHead>Statutory Service</TableHead>
                  <TableHead>Client Entity</TableHead>
                  <TableHead>Current Status</TableHead>
                  <TableHead>Requirements</TableHead>
                  <TableHead>Date Filed</TableHead>
                  <TableHead className="text-right">Inspection Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApps.map((app) => (
                  <TableRow key={app.id} className="hover:bg-muted/30">
                    <TableCell>
                      <Link
                        href={`/admin/qc/${app.id}`}
                        className="font-mono text-xs font-bold text-navy dark:text-gold hover:underline"
                      >
                        #{app.applicationNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="font-semibold text-xs text-foreground">
                      {app.service?.name || "Statutory Service"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {app.client?.fullName || app.client?.businessName || "Verified Client"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        tone={
                          app.status === "QUALITY_CHECK"
                            ? "warning"
                            : app.status === "DELIVERED" || app.status === "CLOSED" || app.status === "READY_FOR_SUBMISSION"
                            ? "success"
                            : "neutral"
                        }
                        size="sm"
                      >
                        {app.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {app.requirements?.length || 0} items
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(app.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="gold"
                          size="xs"
                          leftIcon={<ShieldCheck className="size-3.5" />}
                          onClick={() => setSelectedAppForQc(app)}
                        >
                          QC Inspect
                        </Button>
                        <Link href={`/admin/qc/${app.id}`}>
                          <Button variant="ghost" size="xs" leftIcon={<Eye className="size-3.5" />}>
                            Dossier
                          </Button>
                        </Link>
                      </div>
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
      </div>

      {/* QC INSPECTION MODAL */}
      {selectedAppForQc && (
        <AdminQcModal
          applicationId={selectedAppForQc.id}
          applicationNumber={selectedAppForQc.applicationNumber}
          isOpen={Boolean(selectedAppForQc)}
          onClose={() => setSelectedAppForQc(null)}
          onSuccess={() => {
            refetch();
            queryClient.invalidateQueries({ queryKey: ["admin-work-queue"] });
          }}
        />
      )}
    </PageShell>
  );
}
