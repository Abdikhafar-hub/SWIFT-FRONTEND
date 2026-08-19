"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Clock,
  DollarSign,
  FileCheck2,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Landmark,
  ShieldCheck,
  Activity,
  Users,
  UserPlus,
  CheckCircle2,
  Layers,
  Inbox,
  AlertOctagon,
} from "lucide-react";
import { PageShell } from "@/components/ui/layout-primitives";
import { StatCard, Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heading } from "@/components/ui/heading";
import { Skeleton, ErrorState } from "@/components/ui/feedback-primitives";
import { adminApi } from "@/lib/api/admin";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { StatusBadge, SlaBadge, PriorityBadge } from "@/components/domain/status-badges";

export default function AdminDashboardPage() {
  const {
    data: overview,
    isLoading: isOverviewLoading,
    error: overviewError,
    refetch,
  } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => adminApi.getDashboardOverview(),
  });

  const { data: workQueueData, isLoading: isQueueLoading } = useQuery({
    queryKey: ["admin-live-work-queue"],
    queryFn: () => adminApi.getWorkQueue({ limit: 6 }),
  });

  const applications = workQueueData?.items || [];

  return (
    <PageShell
      eyebrow="COMMAND CENTER"
      title="Operational Command & Governance"
      description="Real-time statutory registry filings, document QC audits, SLA turnaround velocity, and financial collections."
      actions={
        <div className="flex items-center gap-2">
          <Link href="/admin/reconciliation">
            <Button variant="outline" size="sm" leftIcon={<ShieldCheck className="size-4 text-emerald-600" />}>
              Reconciliation
            </Button>
          </Link>
          <Link href="/admin/applications">
            <Button variant="gold" size="sm" rightIcon={<ArrowRight className="size-4" />}>
              Master Work Queue
            </Button>
          </Link>
        </div>
      }
    >
      {/* 1. PRIMARY EXECUTIVE KPIS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Intake Dossiers"
          value={isOverviewLoading ? "—" : overview?.summary.activeApplications ?? 0}
          subtitle={`${overview?.summary.totalApplications ?? 0} total lifetime filings`}
          icon={<FileCheck2 className="size-5 text-navy dark:text-gold" />}
        />

        <StatCard
          title="SLA Breaches & At Risk"
          value={
            isOverviewLoading
              ? "—"
              : `${overview?.sla.overdueCount ?? 0} / ${overview?.sla.atRiskCount ?? 0}`
          }
          subtitle={`Avg Turnaround: ${overview?.sla.averageCompletionHours ?? 24}h (${overview?.sla.onTrackCount ?? 0} on track)`}
          variant={(overview?.sla.overdueCount ?? 0) > 0 ? "gold" : "default"}
          icon={<Clock className="size-5 text-amber-600" />}
        />

        <StatCard
          title="Gross Collections (KES)"
          value={
            isOverviewLoading
              ? "—"
              : formatCurrency(Number(overview?.financials.totalCollected || 0))
          }
          subtitle={`Outstanding: ${formatCurrency(Number(overview?.financials.totalOutstanding || 0))}`}
          icon={<DollarSign className="size-5 text-emerald-600" />}
        />

        <StatCard
          title="Statutory Agency Velocity"
          value={
            isOverviewLoading
              ? "—"
              : overview?.governmentAgencyStats?.reduce((acc, a) => acc + a.count, 0) ?? 0
          }
          subtitle={`${overview?.governmentAgencyStats?.length ?? 0} statutory portals integrated`}
          icon={<Landmark className="size-5 text-gold-dark dark:text-gold" />}
        />
      </div>

      {/* 2. OPERATIONAL QUEUE BUCKETS */}
      <div className="mt-6">
        <Heading level="h4" className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
          Immediate Operational Queues
        </Heading>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Link
            href="/admin/registrations"
            className="rounded-xs border border-border bg-card p-3.5 hover:border-gold hover:bg-gold/5 transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground">
                New Clients
              </span>
              <UserPlus className="size-4 text-muted-foreground group-hover:text-gold" />
            </div>
            <p className="mt-2 text-xl font-bold text-foreground group-hover:text-gold-dark dark:group-hover:text-gold">
              {isOverviewLoading ? "—" : overview?.queues.newRegistrations ?? 0}
            </p>
            <span className="text-[10px] text-muted-foreground">Pending intake review</span>
          </Link>

          <Link
            href="/admin/applications?tab=unassigned"
            className="rounded-xs border border-border bg-card p-3.5 hover:border-gold hover:bg-gold/5 transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground">
                Unassigned
              </span>
              <Inbox className="size-4 text-muted-foreground group-hover:text-gold" />
            </div>
            <p className="mt-2 text-xl font-bold text-foreground group-hover:text-gold-dark dark:group-hover:text-gold">
              {isOverviewLoading ? "—" : overview?.queues.unassigned ?? 0}
            </p>
            <span className="text-[10px] text-muted-foreground">Requires officer assignment</span>
          </Link>

          <Link
            href="/admin/applications?tab=qc"
            className="rounded-xs border border-border bg-card p-3.5 hover:border-gold hover:bg-gold/5 transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground">
                Quality Check (QC)
              </span>
              <ShieldCheck className="size-4 text-muted-foreground group-hover:text-gold" />
            </div>
            <p className="mt-2 text-xl font-bold text-foreground group-hover:text-gold-dark dark:group-hover:text-gold">
              {isOverviewLoading ? "—" : overview?.queues.qualityCheck ?? 0}
            </p>
            <span className="text-[10px] text-muted-foreground">Ready for compliance audit</span>
          </Link>

          <Link
            href="/admin/applications?tab=government"
            className="rounded-xs border border-border bg-card p-3.5 hover:border-gold hover:bg-gold/5 transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground">
                Gov Registry
              </span>
              <Landmark className="size-4 text-muted-foreground group-hover:text-gold" />
            </div>
            <p className="mt-2 text-xl font-bold text-foreground group-hover:text-gold-dark dark:group-hover:text-gold">
              {isOverviewLoading ? "—" : overview?.queues.awaitingGovernment ?? 0}
            </p>
            <span className="text-[10px] text-muted-foreground">Active on eCitizen / BRS</span>
          </Link>

          <Link
            href="/admin/applications?tab=dueSoon"
            className="rounded-xs border border-border bg-card p-3.5 hover:border-gold hover:bg-gold/5 transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground">
                Due Soon (24h)
              </span>
              <Clock className="size-4 text-amber-500 group-hover:text-gold" />
            </div>
            <p className="mt-2 text-xl font-bold text-amber-600 dark:text-amber-400">
              {isOverviewLoading ? "—" : overview?.queues.dueSoon ?? 0}
            </p>
            <span className="text-[10px] text-muted-foreground">Approaching SLA target</span>
          </Link>

          <Link
            href="/admin/applications?tab=overdue"
            className="rounded-xs border border-border bg-card p-3.5 hover:border-destructive hover:bg-destructive/5 transition-all group col-span-2 sm:col-span-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-destructive">
                Overdue / Breached
              </span>
              <AlertOctagon className="size-4 text-destructive" />
            </div>
            <p className="mt-2 text-xl font-bold text-destructive">
              {isOverviewLoading ? "—" : overview?.queues.overdue ?? 0}
            </p>
            <span className="text-[10px] text-destructive/80">Immediate escalation</span>
          </Link>
        </div>
      </div>

      {/* 3. MAIN COMMAND SPLIT */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Live Work Queue Stream */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <Heading level="h4" className="text-base font-bold text-foreground">
              Live Priority Intake Stream
            </Heading>
            <Link
              href="/admin/applications"
              className="inline-flex items-center gap-1 text-xs font-semibold text-gold-dark dark:text-gold hover:underline"
            >
              <span>View Full Work Queue</span>
              <ArrowRight className="size-3" />
            </Link>
          </div>

          {isQueueLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : applications.length === 0 ? (
            <div className="rounded-xs border border-border bg-card p-8 text-center text-xs text-muted-foreground">
              No pending applications in work queue.
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => (
                <Link
                  key={app.id}
                  href={`/admin/applications/${app.id}`}
                  className="block rounded-xs border border-border bg-card p-4 transition-all hover:border-gold hover:shadow-xs group"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-foreground group-hover:text-gold-dark dark:group-hover:text-gold">
                          #{app.applicationNumber}
                        </span>
                        <PriorityBadge priority={app.priority} size="sm" />
                        <StatusBadge status={app.status} size="sm" />
                      </div>
                      <h5 className="text-sm font-semibold text-foreground mt-1">
                        {app.service?.name || "Statutory Service"}
                      </h5>
                      <p className="text-xs text-muted-foreground">
                        Client: <strong className="text-foreground">{app.client?.fullName || app.client?.businessName || "Client"}</strong>
                        {app.assignedAdmin && (
                          <span className="ml-2">| Officer: {app.assignedAdmin.fullName || app.assignedAdmin.email}</span>
                        )}
                      </p>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 text-right">
                      <SlaBadge status={app.slaStatus} size="sm" />
                      <span className="text-[11px] text-muted-foreground">
                        {formatDate(app.createdAt)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right Sidebar: Agency Distribution & Live Audit Stream */}
        <div className="space-y-6">
          {/* Statutory Agency Distribution */}
          <div className="space-y-3">
            <Heading level="h4" className="text-base font-bold text-foreground">
              Statutory Agency Distribution
            </Heading>
            <Card padding="md" className="space-y-3 text-xs">
              {overview?.governmentAgencyStats && overview.governmentAgencyStats.length > 0 ? (
                overview.governmentAgencyStats.map((stat, idx) => (
                  <div key={idx} className="flex items-center justify-between border-b border-border/60 pb-2 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      <Landmark className="size-3.5 text-gold shrink-0" />
                      <span className="font-semibold text-foreground">{stat.agency}</span>
                    </div>
                    <Badge tone="gold" size="sm">
                      {stat.count} Filings
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">eCitizen Directorate</span>
                    <Badge tone="gold" size="sm">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">BRS Companies Registry</span>
                    <Badge tone="gold" size="sm">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">KRA iTax Services</span>
                    <Badge tone="gold" size="sm">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">NTSA TIMS Registry</span>
                    <Badge tone="gold" size="sm">Active</Badge>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Live Recent Activity Stream */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Heading level="h4" className="text-base font-bold text-foreground">
                Recent Operations Stream
              </Heading>
              <Link href="/admin/audit" className="text-xs font-semibold text-gold-dark dark:text-gold hover:underline">
                Audit Trail
              </Link>
            </div>

            <Card padding="md" className="space-y-3 text-xs">
              {overview?.recentActivities && overview.recentActivities.length > 0 ? (
                overview.recentActivities.slice(0, 5).map((act) => (
                  <div key={act.id} className="border-b border-border/60 pb-2.5 last:border-0 last:pb-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-bold text-gold-dark dark:text-gold">
                        #{act.applicationNumber}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{formatDate(act.createdAt)}</span>
                    </div>
                    <p className="text-foreground font-medium">{act.action}</p>
                    <p className="text-[11px] text-muted-foreground">Client: {act.clientName}</p>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-2">
                  No recent activities recorded yet.
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
