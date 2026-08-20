"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Plus,
  ArrowRight,
  Sparkles,
  Clock,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { PageShell } from "@/components/ui/layout-primitives";
import { StatCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { ClientActionCard } from "@/components/domain/client-action-card";
import { ApplicationStatusBadge, SlaIndicator } from "@/components/domain/status-badges";
import { Skeleton } from "@/components/ui/feedback-primitives";
import { applicationsApi } from "@/lib/api/applications";
import { paymentsApi } from "@/lib/api/payments";
import { useAuth } from "@/lib/auth/auth-context";
import { formatKES } from "@/lib/utils/format";

export default function ClientDashboardPage() {
  const { user, client } = useAuth();

  // 1. Authoritative backend dashboard overview
  const { data: overview, isLoading: isOverviewLoading } = useQuery({
    queryKey: ["client-dashboard-overview"],
    queryFn: () => applicationsApi.getClientDashboardOverview(),
  });

  // 2. Open action items requiring client input
  const { data: actionsData, isLoading: isActionsLoading } = useQuery({
    queryKey: ["client-actions"],
    queryFn: () => applicationsApi.getClientActions(),
  });

  // 3. Applications list
  const { data: applicationsData, isLoading: isAppsLoading } = useQuery({
    queryKey: ["client-applications"],
    queryFn: () => applicationsApi.getApplications({ page: 1, limit: 6 }),
  });

  const applications = applicationsData?.items || [];
  const pendingActions = actionsData || [];

  const activeApps = overview?.activeApplications || [];
  const recentInvoices = overview?.recentInvoices || [];
  const totalAppsCount = overview?.totalApplications ?? applicationsData?.meta?.total ?? 0;
  const unreadNotifs = overview?.unreadNotificationsCount ?? 0;

  const displayName = client?.fullName?.split(" ")[0] || user?.email?.split("@")[0] || "Client";

  return (
    <PageShell
      eyebrow="CLIENT PORTAL"
      title={`Welcome back, ${displayName}`}
      description="Executive statutory dashboard: track government adjudications, fulfill pending requirements, and view settlement ledgers."
      actions={
        <Link href="/client/services">
          <Button variant="gold" size="sm" leftIcon={<Plus className="size-4" />}>
            New Statutory Filing
          </Button>
        </Link>
      }
    >
      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Filings"
          value={isOverviewLoading ? "—" : activeApps.length || applications.filter(a => a.status !== "CLOSED" && a.status !== "CANCELLED").length}
          subtitle="Progressing in registry"
          icon={<FileText className="size-5" />}
        />
        <StatCard
          title="Action Items"
          value={isActionsLoading ? "—" : pendingActions.length}
          subtitle="Requires your submission"
          variant={pendingActions.length > 0 ? "gold" : "default"}
          icon={<AlertCircle className="size-5" />}
        />
        <StatCard
          title="Total Applications"
          value={isOverviewLoading ? "—" : totalAppsCount}
          subtitle="All-time statutory records"
          icon={<CheckCircle2 className="size-5" />}
        />
        <StatCard
          title="Unread Alerts"
          value={isOverviewLoading ? "—" : unreadNotifs}
          subtitle="Registry updates"
          variant={unreadNotifs > 0 ? "gold" : "default"}
          icon={<CreditCard className="size-5" />}
        />
      </div>

      {/* Urgent Client Actions Section */}
      {pendingActions.length > 0 && (
        <div className="mt-8 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-amber-500 animate-ping" />
              <Heading level="h4" className="text-base font-bold">
                Action Items Requiring Your Attention
              </Heading>
            </div>
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-400">
              {pendingActions.length} Pending
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingActions.map((action) => (
              <ClientActionCard key={action.id} action={action} />
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Active Applications Dossiers & Quick Services */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Active Applications Dossier Cards */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-4 text-gold" />
              <Heading level="h4" className="text-base font-bold">
                Active Statutory Filings
              </Heading>
            </div>
            <Link
              href="/client/applications"
              className="inline-flex items-center gap-1 text-xs font-bold text-gold-dark dark:text-gold hover:underline"
            >
              <span>View All Applications ({totalAppsCount})</span>
              <ArrowRight className="size-3" />
            </Link>
          </div>

          {isAppsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : applications.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-sm border border-dashed border-border p-8 text-center bg-card">
              <FileText className="size-10 text-muted-foreground/40 mb-3" />
              <h5 className="font-bold text-sm text-foreground">No active filings</h5>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                You currently do not have any open statutory applications. Initiate a new company registration, tax compliance, or permit filing.
              </p>
              <Link href="/client/services" className="mt-4">
                <Button variant="gold" size="sm">
                  Browse Service Catalog
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => {
                const totalReqs = app.requirements?.length || 1;
                const satisfiedReqs =
                  app.requirements?.filter((r) => r.isSatisfied && r.status !== "REJECTED")
                    .length || 0;
                const progress = Math.min(100, Math.round((satisfiedReqs / totalReqs) * 100));

                return (
                  <Link
                    key={app.id}
                    href={`/client/applications/${app.id}`}
                    className="group block rounded-sm border border-border bg-card p-4 sm:p-5 transition-all duration-200 hover:border-gold hover:shadow-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-foreground">
                            {app.applicationNumber}
                          </span>
                          <ApplicationStatusBadge status={app.status} size="sm" />
                          {app.slaStatus && <SlaIndicator status={app.slaStatus} size="sm" />}
                        </div>
                        <h4 className="font-display text-sm font-bold text-foreground group-hover:text-gold transition-colors">
                          {app.service?.name || "Statutory Service"}
                        </h4>
                        <span className="text-xs text-muted-foreground">
                          Authority: {app.service?.authority || "Government Agency"} &bull; Initiated:{" "}
                          {new Date(app.createdAt).toLocaleDateString("en-KE")}
                        </span>
                      </div>

                      <div className="flex sm:flex-col items-end justify-between sm:justify-center shrink-0">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                          <span>{progress}%</span>
                          <span className="text-[10px] text-muted-foreground font-normal">Requirements</span>
                        </div>
                        <div className="w-24 sm:w-28 h-1.5 rounded-full bg-muted overflow-hidden mt-1.5">
                          <div
                            className="h-full bg-gold transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Recent Invoices & Quick Statutory Links */}
        <div className="space-y-6">
          {/* Quick Statutory Catalog Shortcuts */}
          <div className="rounded-sm border border-border bg-card p-5 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gold">
              <Sparkles className="size-4" />
              <span>Popular Filings</span>
            </div>

            <div className="space-y-2 text-xs">
              <Link
                href="/client/services"
                className="flex items-center justify-between p-2.5 rounded-xs border border-border/70 hover:border-gold hover:bg-gold/5 transition-all group"
              >
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground group-hover:text-gold transition-colors">
                    UK Visitor & Student Visas
                  </span>
                  <span className="text-[10px] text-muted-foreground">UKVI & TLScontact Document Dossiers</span>
                </div>
                <ArrowRight className="size-3.5 text-muted-foreground group-hover:text-foreground" />
              </Link>

              <Link
                href="/client/services"
                className="flex items-center justify-between p-2.5 rounded-xs border border-border/70 hover:border-gold hover:bg-gold/5 transition-all group"
              >
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground group-hover:text-gold transition-colors">
                    US B1/B2 & F1 Visas
                  </span>
                  <span className="text-[10px] text-muted-foreground">DS-160 Prep & Embassy Interview Slot</span>
                </div>
                <ArrowRight className="size-3.5 text-muted-foreground group-hover:text-foreground" />
              </Link>

              <Link
                href="/client/services"
                className="flex items-center justify-between p-2.5 rounded-xs border border-border/70 hover:border-gold hover:bg-gold/5 transition-all group"
              >
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground group-hover:text-gold transition-colors">
                    Schengen (France, Germany, Czech)
                  </span>
                  <span className="text-[10px] text-muted-foreground">VFS Global & Embassy Processing</span>
                </div>
                <ArrowRight className="size-3.5 text-muted-foreground group-hover:text-foreground" />
              </Link>

              <Link
                href="/client/services"
                className="flex items-center justify-between p-2.5 rounded-xs border border-border/70 hover:border-gold hover:bg-gold/5 transition-all group"
              >
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground group-hover:text-gold transition-colors">
                    BRS Company Incorporation
                  </span>
                  <span className="text-[10px] text-muted-foreground">CR1, CR2, CR8 Packages</span>
                </div>
                <ArrowRight className="size-3.5 text-muted-foreground group-hover:text-foreground" />
              </Link>
            </div>
          </div>

          {/* Institutional Trust & Support Badge */}
          <div className="rounded-sm border border-gold/30 bg-gold/5 p-4 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-gold-dark dark:text-gold">
              <ShieldCheck className="size-4" />
              <span>Official Institutional Assurance</span>
            </div>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              All statutory submissions are verified by certified Kenyan compliance officers prior to official transmission to government portals.
            </p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
