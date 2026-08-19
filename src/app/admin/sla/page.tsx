"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  Pause,
  Play,
  RotateCw,
  Search,
  Filter,
  Eye,
  ShieldAlert,
  ChevronRight,
  TrendingDown,
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
import { SlaBadge, StatusBadge, PriorityBadge } from "@/components/domain/status-badges";
import { AdminSlaModal } from "@/components/domain";
import { EmptyState, Skeleton, ErrorState } from "@/components/ui/feedback-primitives";
import { adminApi } from "@/lib/api/admin";
import { formatDate } from "@/lib/utils/format";
import type { Application, SlaStatus } from "@/types";

export default function AdminSlaPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [slaFilter, setSlaFilter] = useState<string>("");
  const [page, setPage] = useState(1);

  // Modal state
  const [selectedAppForSla, setSelectedAppForSla] = useState<Application | null>(null);
  const [slaModalMode, setSlaModalMode] = useState<"PAUSE" | "RESUME">("PAUSE");

  // SLA Metrics Query
  const {
    data: metrics,
    isLoading: isMetricsLoading,
    refetch: refetchMetrics,
  } = useQuery({
    queryKey: ["admin-sla-metrics"],
    queryFn: () => adminApi.getSlaMetrics(),
  });

  // Applications Query filtered by SLA
  const {
    data: appsData,
    isLoading: isAppsLoading,
    error: appsError,
    refetch: refetchApps,
  } = useQuery({
    queryKey: ["admin-applications-sla", page, search, slaFilter],
    queryFn: () =>
      adminApi.getApplications({
        page,
        limit: 15,
        search: search || undefined,
        slaStatus: slaFilter || undefined,
      }),
  });

  // Trigger automated sweep
  const sweepMutation = useMutation({
    mutationFn: () => adminApi.triggerSlaSweep(),
    onSuccess: () => {
      refetchMetrics();
      refetchApps();
      queryClient.invalidateQueries({ queryKey: ["admin-work-queue"] });
    },
  });

  const applications: Application[] = appsData?.items || [];
  const pagination = appsData?.pagination;

  return (
    <PageShell
      eyebrow="CASE OPERATIONS"
      title="SLA Operations & Health Command"
      description="Real-time statutory deadline countdowns, breach mitigation, automated health sweeps, and official SLA pause controls."
      actions={
        <Button
          variant="outline"
          size="sm"
          leftIcon={<RotateCw className={`size-3.5 ${sweepMutation.isPending ? "animate-spin" : ""}`} />}
          isLoading={sweepMutation.isPending}
          onClick={() => sweepMutation.mutate()}
        >
          Run SLA Evaluation Sweep
        </Button>
      }
    >
      {/* 1. SLA HEALTH METRICS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Tracked Filings"
          value={metrics?.totalTracked ?? metrics?.totalActive ?? applications.length}
          subtitle="Active SLA timers"
          icon={<Clock className="size-5 text-navy dark:text-gold" />}
        />

        <StatCard
          title="Compliant (On Track)"
          value={metrics?.onTrack ?? 0}
          subtitle="Within statutory limits"
          icon={<CheckCircle2 className="size-5 text-emerald-600" />}
        />

        <StatCard
          title="At Risk (< 25% Time)"
          value={metrics?.atRisk ?? metrics?.dueSoon ?? 0}
          subtitle="Urgent processing required"
          variant={Number(metrics?.atRisk || metrics?.dueSoon || 0) > 0 ? "gold" : "default"}
          icon={<TrendingDown className="size-5 text-gold-dark dark:text-gold" />}
        />

        <StatCard
          title="SLA Breached"
          value={metrics?.breached ?? metrics?.overdue ?? 0}
          subtitle="Statutory deadline exceeded"
          variant={Number(metrics?.breached || metrics?.overdue || 0) > 0 ? "elevated" : "default"}
          icon={<AlertTriangle className="size-5 text-destructive" />}
        />

        <StatCard
          title="Clock Paused"
          value={metrics?.paused ?? 0}
          subtitle="Awaiting client / registry"
          icon={<Pause className="size-5 text-muted-foreground" />}
        />
      </div>

      {/* 2. FILTERS & SEARCH */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3 max-w-md">
          <Input
            placeholder="Search by dossier #, client, or service..."
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
            value={slaFilter}
            onChange={(e) => {
              setSlaFilter(e.target.value);
              setPage(1);
            }}
            className="w-48 text-xs"
            options={[
              { value: "", label: "All SLA States" },
              { value: "AT_RISK", label: "At Risk (< 25% Time Left)" },
              { value: "BREACHED", label: "Breached (Overdue)" },
              { value: "PAUSED", label: "Paused (On Hold)" },
              { value: "ON_TRACK", label: "On Track (Compliant)" },
            ]}
          />
        </div>
      </div>

      {/* 3. SLA APPLICATIONS TABLE */}
      <div className="mt-6">
        {isAppsLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : appsError ? (
          <ErrorState onRetry={() => refetchApps()} />
        ) : applications.length === 0 ? (
          <EmptyState
            icon={<Clock className="size-7" />}
            title="No applications in this SLA category"
            description="All monitored filings are performing within acceptable parameters."
          />
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dossier #</TableHead>
                  <TableHead>Statutory Service</TableHead>
                  <TableHead>Client Entity</TableHead>
                  <TableHead>Filing Status</TableHead>
                  <TableHead>SLA Health</TableHead>
                  <TableHead>Deadline / Due</TableHead>
                  <TableHead>Assigned Officer</TableHead>
                  <TableHead className="text-right">SLA Controls</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => (
                  <TableRow key={app.id} className="hover:bg-muted/30">
                    <TableCell>
                      <Link
                        href={`/admin/applications/${app.id}`}
                        className="font-mono text-xs font-bold text-navy dark:text-gold hover:underline"
                      >
                        #{app.applicationNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="font-semibold text-xs text-foreground">
                      {app.service?.name || "Statutory Service"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {app.client?.fullName || app.client?.businessName || "Verified Entity"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={app.status} size="sm" />
                    </TableCell>
                    <TableCell>
                      <SlaBadge status={app.slaStatus} size="sm" />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {app.slaDueAt ? formatDate(app.slaDueAt) : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {app.assignedAdmin?.fullName || (
                        <Badge tone="warning" size="sm">Unassigned</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {app.slaStatus === "PAUSED" ? (
                          <Button
                            variant="ghost"
                            size="xs"
                            className="text-emerald-600 hover:bg-emerald-500/10"
                            leftIcon={<Play className="size-3" />}
                            onClick={() => {
                              setSelectedAppForSla(app);
                              setSlaModalMode("RESUME");
                            }}
                          >
                            Resume
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="xs"
                            className="text-amber-600 hover:bg-amber-500/10"
                            leftIcon={<Pause className="size-3" />}
                            onClick={() => {
                              setSelectedAppForSla(app);
                              setSlaModalMode("PAUSE");
                            }}
                          >
                            Pause
                          </Button>
                        )}
                        <Link href={`/admin/applications/${app.id}`}>
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

      {/* SLA PAUSE / RESUME MODAL */}
      {selectedAppForSla && (
        <AdminSlaModal
          applicationId={selectedAppForSla.id}
          applicationNumber={selectedAppForSla.applicationNumber}
          isOpen={Boolean(selectedAppForSla)}
          mode={slaModalMode}
          onClose={() => setSelectedAppForSla(null)}
          onSuccess={() => {
            refetchMetrics();
            refetchApps();
          }}
        />
      )}
    </PageShell>
  );
}
