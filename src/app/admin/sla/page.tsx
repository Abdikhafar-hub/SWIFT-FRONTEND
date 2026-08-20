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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-4 sm:p-5 lg:p-6 space-y-4 max-w-[1550px] mx-auto font-sans">
      {/* ------------------------------------------------------------------ */}
      {/* 1. HEADER SECTION */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            SLA Operations &amp; Health Command
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Real-time statutory deadline countdowns, breach mitigation, automated health sweeps, and official SLA pause controls.
          </p>
        </div>

        <button
          onClick={() => sweepMutation.mutate()}
          disabled={sweepMutation.isPending}
          className="bg-white border border-slate-200 text-slate-700 font-bold text-xs px-3 py-2 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-50 shrink-0 self-start sm:self-auto"
        >
          <RotateCw className={`size-3.5 text-slate-500 ${sweepMutation.isPending ? "animate-spin" : ""}`} />
          <span>Run SLA Evaluation Sweep</span>
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. SLA HEALTH METRICS */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Tracked Filings</span>
            <span className="text-xl font-extrabold text-slate-900 font-mono mt-0.5 block">
              {metrics?.totalTracked ?? metrics?.totalActive ?? applications.length}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Active SLA timers</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="size-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Compliant (On Track)</span>
            <span className="text-xl font-extrabold text-emerald-600 font-mono mt-0.5 block">{metrics?.onTrack ?? 0}</span>
            <span className="text-[10px] text-slate-500 font-medium">Within statutory limits</span>
          </div>
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60">
            <CheckCircle2 className="size-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">At Risk (&lt; 25% Time)</span>
            <span className="text-xl font-extrabold text-amber-600 font-mono mt-0.5 block">
              {metrics?.atRisk ?? metrics?.dueSoon ?? 0}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Urgent processing</span>
          </div>
          <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60">
            <TrendingDown className="size-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">SLA Breached</span>
            <span className="text-xl font-extrabold text-rose-600 font-mono mt-0.5 block">
              {metrics?.breached ?? metrics?.overdue ?? 0}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Deadline exceeded</span>
          </div>
          <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200/60">
            <AlertTriangle className="size-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Clock Paused</span>
            <span className="text-xl font-extrabold text-slate-700 font-mono mt-0.5 block">{metrics?.paused ?? 0}</span>
            <span className="text-[10px] text-slate-500 font-medium">Awaiting client/registry</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-100 text-slate-600 border border-slate-200">
            <Pause className="size-4" />
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. FILTERS & SEARCH */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by dossier #, client, or service..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium text-slate-800 placeholder-slate-400"
          />
        </div>

        <select
          value={slaFilter}
          onChange={(e) => {
            setSlaFilter(e.target.value);
            setPage(1);
          }}
          className="w-full sm:w-56 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-semibold text-slate-700"
        >
          <option value="">All SLA States</option>
          <option value="AT_RISK">At Risk (&lt; 25% Time Left)</option>
          <option value="BREACHED">Breached (Overdue)</option>
          <option value="PAUSED">Paused (On Hold)</option>
          <option value="ON_TRACK">On Track (Compliant)</option>
        </select>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 4. SLA APPLICATIONS TABLE */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
        {isAppsLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-slate-100 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : appsError ? (
          <div className="p-8 text-center space-y-3">
            <p className="text-xs font-bold text-rose-600">Failed to load SLA tracked applications.</p>
            <button
              onClick={() => refetchApps()}
              className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
            >
              Retry Loading
            </button>
          </div>
        ) : applications.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <h3 className="text-sm font-bold text-slate-800">No applications in this SLA category</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              All monitored filings are performing within acceptable parameters.
            </p>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Dossier #</th>
                    <th className="py-3 px-4">Statutory Service</th>
                    <th className="py-3 px-4">Client Entity</th>
                    <th className="py-3 px-4">Filing Status</th>
                    <th className="py-3 px-4">SLA Health</th>
                    <th className="py-3 px-4">Deadline / Due</th>
                    <th className="py-3 px-4">Assigned Officer</th>
                    <th className="py-3 px-4 text-right">SLA Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-3 px-4">
                        <Link
                          href={`/admin/applications/${app.id}`}
                          className="font-mono text-xs font-bold text-amber-700 hover:text-amber-800 hover:underline"
                        >
                          #{app.applicationNumber}
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-bold text-xs text-slate-900">
                        {app.service?.name || "Statutory Service"}
                      </td>
                      <td className="py-3 px-4 text-xs font-medium text-slate-600">
                        {app.client?.fullName || app.client?.businessName || "Verified Entity"}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={app.status} size="sm" />
                      </td>
                      <td className="py-3 px-4">
                        <SlaBadge status={app.slaStatus} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500 font-mono">
                        {app.slaDueAt ? formatDate(app.slaDueAt) : "—"}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">
                        {app.assignedAdmin?.fullName || (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/80">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {app.slaStatus === "PAUSED" ? (
                            <button
                              onClick={() => {
                                setSelectedAppForSla(app);
                                setSlaModalMode("RESUME");
                              }}
                              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 transition-colors inline-flex items-center gap-1"
                            >
                              <Play className="size-3" />
                              <span>Resume</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedAppForSla(app);
                                setSlaModalMode("PAUSE");
                              }}
                              className="text-xs font-bold text-amber-700 hover:text-amber-800 hover:bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 transition-colors inline-flex items-center gap-1"
                            >
                              <Pause className="size-3" />
                              <span>Pause</span>
                            </button>
                          )}
                          <Link href={`/admin/applications/${app.id}`}>
                            <button className="bg-white border border-slate-200 text-slate-700 font-bold text-xs px-2.5 py-1 rounded-lg hover:bg-slate-50 transition-all inline-flex items-center gap-1">
                              <Eye className="size-3 text-slate-500" />
                              <span>Dossier</span>
                            </button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="px-4 py-3 bg-slate-50/60 border-t border-slate-200/80 flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>
                  Page {pagination.page} of {pagination.totalPages} ({pagination.total} total items)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    disabled={pagination.page >= pagination.totalPages}
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
    </div>
  );
}
