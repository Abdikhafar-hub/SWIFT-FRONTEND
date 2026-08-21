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
  Plus,
  TrendingDown,
  MoreVertical,
  Check,
  Calendar,
  Layers,
  Edit,
  Shield,
  History,
} from "lucide-react";
import {
  SlaBadge,
  StatusBadge,
  PriorityBadge,
  AdminSlaModal,
  AdminManualSlaModal,
  AdminSlaDetailDrawer,
  AdminEditSlaModal,
} from "@/components/domain";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { adminApi } from "@/lib/api/admin";
import { formatDate } from "@/lib/utils/format";

export default function AdminSlaPage() {
  const queryClient = useQueryClient();

  // Filters & Pagination State
  const [search, setSearch] = useState("");
  const [slaFilter, setSlaFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [dateRangeFilter, setDateRangeFilter] = useState<string>("");
  const [viewMode, setViewMode] = useState<"ACTIVE" | "HISTORICAL" | "ALL">("ACTIVE");
  const [page, setPage] = useState(1);

  // Modals & Drawers State
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [selectedAppForPause, setSelectedAppForPause] = useState<{ id: string; appNum?: string } | null>(null);
  const [pauseModalMode, setPauseModalMode] = useState<"PAUSE" | "RESUME">("PAUSE");
  
  const [detailDrawerAppId, setDetailDrawerAppId] = useState<string | null>(null);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  
  const [sweepResultModal, setSweepResultModal] = useState<any | null>(null);

  // SLA Metrics Query (Authoritative Dataset)
  const {
    data: metrics,
    isLoading: isMetricsLoading,
    refetch: refetchMetrics,
  } = useQuery({
    queryKey: ["admin-sla-metrics"],
    queryFn: () => adminApi.getSlaMetrics(),
  });

  // SLA Paginated Records Query
  const {
    data: slaData,
    isLoading: isSlaLoading,
    error: slaError,
    refetch: refetchSlaRecords,
  } = useQuery({
    queryKey: ["admin-sla-records", page, search, slaFilter, priorityFilter, dateRangeFilter, viewMode],
    queryFn: () =>
      adminApi.getSlaRecords({
        page,
        limit: 15,
        search: search || undefined,
        slaStatus: slaFilter || undefined,
        priority: priorityFilter || undefined,
        dateRange: dateRangeFilter || undefined,
        viewMode,
      }),
  });

  // Trigger automated sweep
  const sweepMutation = useMutation({
    mutationFn: () => adminApi.triggerSlaSweep(),
    onSuccess: (data) => {
      setSweepResultModal(data);
      refetchMetrics();
      refetchSlaRecords();
      queryClient.invalidateQueries({ queryKey: ["admin-work-queue"] });
    },
  });

  // Quick Action Mutations
  const recalculateMutation = useMutation({
    mutationFn: (id: string) => adminApi.recalculateSla(id, { reason: "Manual recalculation from SLA console table" }),
    onSuccess: () => {
      refetchMetrics();
      refetchSlaRecords();
    },
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => adminApi.completeSla(id, { reason: "Marked completed from SLA console table" }),
    onSuccess: () => {
      refetchMetrics();
      refetchSlaRecords();
    },
  });

  const records = slaData?.items || [];
  const pagination = slaData?.pagination;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-3 sm:p-5 lg:p-6 space-y-4 max-w-[1550px] mx-auto font-sans">
      {/* ------------------------------------------------------------------ */}
      {/* 1. HEADER SECTION & PRIMARY ACTIONS */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            SLA Operations Management Console
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Real-time statutory deadline countdowns, breach mitigation, manual SLA entries, pause audit controls, and automated health sweeps.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            className="bg-white border-slate-200 text-slate-700 font-bold text-xs"
            leftIcon={<RotateCw className={`size-3.5 text-slate-500 ${sweepMutation.isPending ? "animate-spin" : ""}`} />}
            isLoading={sweepMutation.isPending}
            onClick={() => sweepMutation.mutate()}
          >
            Run Evaluation Sweep
          </Button>

          <Button
            variant="gold"
            size="sm"
            leftIcon={<Plus className="size-3.5" />}
            onClick={() => setIsManualModalOpen(true)}
          >
            Add SLA Entry
          </Button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. AUTHORITATIVE SLA HEALTH METRICS (KPI CARDS) */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Tracked Filings</span>
            <span className="text-xl font-extrabold text-slate-900 font-mono mt-0.5 block">
              {metrics?.totalTracked ?? metrics?.totalActive ?? records.length}
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
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">At Risk (&lt; 24 Hours)</span>
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
            <span className="text-[10px] text-slate-500 font-medium">Statutory/client hold</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-100 text-slate-600 border border-slate-200">
            <Pause className="size-4" />
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. MULTI-CRITERIA FILTER BAR */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col lg:flex-row items-center justify-between gap-3">
        {/* View Mode Toggle & Search */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full lg:w-auto flex-1">
          <div className="inline-flex rounded-lg bg-slate-100 p-1 border border-slate-200/60 shrink-0 self-start sm:self-auto">
            {(["ACTIVE", "HISTORICAL", "ALL"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  setViewMode(mode);
                  setPage(1);
                }}
                className={`px-3 py-1 text-xs font-extrabold rounded-md transition-all ${
                  viewMode === mode
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {mode === "ACTIVE" ? "Active SLAs" : mode === "HISTORICAL" ? "Historical" : "All Dossiers"}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-80">
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
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full lg:w-auto">
          <select
            value={slaFilter}
            onChange={(e) => {
              setSlaFilter(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-semibold text-slate-700"
          >
            <option value="">All SLA States</option>
            <option value="ON_TRACK">Compliant (On Track)</option>
            <option value="AT_RISK">At Risk (&lt; 24h)</option>
            <option value="BREACHED">Breached (Overdue)</option>
            <option value="PAUSED">Paused (On Hold)</option>
            <option value="COMPLETED">Completed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-semibold text-slate-700"
          >
            <option value="">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="NORMAL">Normal</option>
            <option value="LOW">Low</option>
          </select>

          <select
            value={dateRangeFilter}
            onChange={(e) => {
              setDateRangeFilter(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-semibold text-slate-700 col-span-2 sm:col-span-1"
          >
            <option value="">All Time</option>
            <option value="TODAY">Today</option>
            <option value="LAST_7_DAYS">Last 7 Days</option>
            <option value="LAST_30_DAYS">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 4. SLA RECORDS (DESKTOP TABLE & MOBILE CARD VIEW) */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
        {isSlaLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-slate-100 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : slaError ? (
          <div className="p-8 text-center space-y-3">
            <p className="text-xs font-bold text-rose-600">Failed to load SLA records.</p>
            <button
              onClick={() => refetchSlaRecords()}
              className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
            >
              Retry Loading
            </button>
          </div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <h3 className="text-sm font-bold text-slate-800">No SLA records match current criteria</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search terms or status filters to view records.
            </p>
          </div>
        ) : (
          <div>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Dossier #</th>
                    <th className="py-3 px-4">Statutory Service</th>
                    <th className="py-3 px-4">Client Entity</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">SLA Health State</th>
                    <th className="py-3 px-4">Target Due Date</th>
                    <th className="py-3 px-4">Assigned Officer</th>
                    <th className="py-3 px-4 text-right">Actions &amp; Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {records.map((app: any) => (
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
                        <PriorityBadge priority={app.priority} size="sm" />
                      </td>
                      <td className="py-3 px-4">
                        <SlaBadge status={app.effectiveSlaState || app.slaStatus} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500 font-mono">
                        {app.slaDueAt || app.dueAt ? formatDate(app.slaDueAt || app.dueAt) : "—"}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">
                        {app.assignedAdmin?.fullName || (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/80">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Pause / Resume button */}
                          {app.isPaused || app.slaStatus === "PAUSED" ? (
                            <button
                              onClick={() => {
                                setSelectedAppForPause({ id: app.id, appNum: app.applicationNumber });
                                setPauseModalMode("RESUME");
                              }}
                              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Play className="size-3" />
                              <span>Resume</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedAppForPause({ id: app.id, appNum: app.applicationNumber });
                                setPauseModalMode("PAUSE");
                              }}
                              className="text-xs font-bold text-amber-700 hover:text-amber-800 hover:bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Pause className="size-3" />
                              <span>Pause</span>
                            </button>
                          )}

                          {/* View Details Drawer */}
                          <button
                            onClick={() => setDetailDrawerAppId(app.id)}
                            className="bg-white border border-slate-200 text-slate-700 font-bold text-xs px-2 py-1 rounded-lg hover:bg-slate-50 transition-all inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="size-3 text-slate-500" />
                            <span>Details</span>
                          </button>

                          {/* Edit Parameters */}
                          <button
                            onClick={() => setEditingRecord(app)}
                            className="bg-white border border-slate-200 text-slate-700 font-bold text-xs p-1 rounded-lg hover:bg-slate-50 transition-all cursor-pointer"
                            title="Edit SLA Parameters"
                          >
                            <Edit className="size-3 text-slate-500" />
                          </button>

                          {/* Force Recalculate */}
                          <button
                            onClick={() => recalculateMutation.mutate(app.id)}
                            className="bg-white border border-slate-200 text-slate-700 font-bold text-xs p-1 rounded-lg hover:bg-slate-50 transition-all cursor-pointer"
                            title="Force Recalculate SLA"
                          >
                            <RotateCw className={`size-3 text-slate-500 ${recalculateMutation.isPending ? "animate-spin" : ""}`} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View (<644px / 320px-412px) */}
            <div className="block md:hidden divide-y divide-slate-100">
              {records.map((app: any) => (
                <div key={app.id} className="p-3.5 space-y-2.5 hover:bg-slate-50/80 transition-colors">
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/admin/applications/${app.id}`}
                      className="font-mono text-xs font-bold text-amber-700 hover:underline"
                    >
                      #{app.applicationNumber}
                    </Link>
                    <SlaBadge status={app.effectiveSlaState || app.slaStatus} size="sm" />
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="font-bold text-slate-900">{app.service?.name || "Statutory Service"}</div>
                    <div className="text-slate-500 font-medium">{app.client?.fullName || "Verified Entity"}</div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <PriorityBadge priority={app.priority} size="sm" />
                    </div>
                    <div className="font-mono text-slate-600">
                      Due: {app.slaDueAt || app.dueAt ? formatDate(app.slaDueAt || app.dueAt) : "—"}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100">
                    {app.isPaused || app.slaStatus === "PAUSED" ? (
                      <button
                        onClick={() => {
                          setSelectedAppForPause({ id: app.id, appNum: app.applicationNumber });
                          setPauseModalMode("RESUME");
                        }}
                        className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 inline-flex items-center gap-1"
                      >
                        <Play className="size-3" /> Resume
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedAppForPause({ id: app.id, appNum: app.applicationNumber });
                          setPauseModalMode("PAUSE");
                        }}
                        className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 inline-flex items-center gap-1"
                      >
                        <Pause className="size-3" /> Pause
                      </button>
                    )}

                    <button
                      onClick={() => setDetailDrawerAppId(app.id)}
                      className="bg-white border border-slate-200 text-slate-700 font-bold text-xs px-2.5 py-1 rounded-lg inline-flex items-center gap-1"
                    >
                      <Eye className="size-3 text-slate-500" /> Details
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
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

      {/* ------------------------------------------------------------------ */}
      {/* 5. MODALS & SLIDE-OVER DRAWERS */}
      {/* ------------------------------------------------------------------ */}

      {/* MANUAL SLA CREATION MODAL */}
      <AdminManualSlaModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onSuccess={() => {
          refetchMetrics();
          refetchSlaRecords();
        }}
      />

      {/* PAUSE / RESUME MODAL */}
      {selectedAppForPause && (
        <AdminSlaModal
          applicationId={selectedAppForPause.id}
          applicationNumber={selectedAppForPause.appNum}
          isOpen={Boolean(selectedAppForPause)}
          mode={pauseModalMode}
          onClose={() => setSelectedAppForPause(null)}
          onSuccess={() => {
            refetchMetrics();
            refetchSlaRecords();
          }}
        />
      )}

      {/* DETAIL DRAWER */}
      <AdminSlaDetailDrawer
        applicationId={detailDrawerAppId}
        isOpen={Boolean(detailDrawerAppId)}
        onClose={() => setDetailDrawerAppId(null)}
        onOpenPauseModal={(appId, appNum, mode) => {
          setSelectedAppForPause({ id: appId, appNum });
          setPauseModalMode(mode || "PAUSE");
        }}
        onOpenEditModal={(rec) => setEditingRecord(rec)}
      />

      {/* EDIT PARAMETERS MODAL */}
      {editingRecord && (
        <AdminEditSlaModal
          record={editingRecord}
          isOpen={Boolean(editingRecord)}
          onClose={() => setEditingRecord(null)}
          onSuccess={() => {
            refetchMetrics();
            refetchSlaRecords();
          }}
        />
      )}

      {/* SWEEP EVALUATION RESULT MODAL */}
      {sweepResultModal && (
        <Modal
          isOpen={Boolean(sweepResultModal)}
          onClose={() => setSweepResultModal(null)}
          title="SLA Evaluation Sweep Execution Summary"
          description="Automated evaluation completed across all active statutory applications."
          size="md"
        >
          <div className="space-y-4 text-xs">
            <div className="rounded-xs border border-emerald-500/30 bg-emerald-500/10 p-3 flex items-start gap-2 text-emerald-600">
              <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
              <div>
                <strong>Evaluation Complete:</strong> All active application countdown timers were recalculated against statutory parameters.
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-2.5 rounded-xs border border-border bg-muted/20">
                <span className="text-[10px] text-muted-foreground uppercase font-medium">Evaluated</span>
                <p className="text-base font-bold text-foreground mt-0.5">{sweepResultModal.evaluatedCount || 0}</p>
              </div>
              <div className="p-2.5 rounded-xs border border-border bg-muted/20">
                <span className="text-[10px] text-muted-foreground uppercase font-medium">Updated States</span>
                <p className="text-base font-bold text-gold mt-0.5">{sweepResultModal.updatedCount || 0}</p>
              </div>
              <div className="p-2.5 rounded-xs border border-border bg-muted/20">
                <span className="text-[10px] text-muted-foreground uppercase font-medium">Compliant</span>
                <p className="text-base font-bold text-emerald-600 mt-0.5">{sweepResultModal.onTrackCount || 0}</p>
              </div>
              <div className="p-2.5 rounded-xs border border-border bg-muted/20">
                <span className="text-[10px] text-muted-foreground uppercase font-medium">Alerts Sent</span>
                <p className="text-base font-bold text-amber-500 mt-0.5">{sweepResultModal.alertsSent || 0}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-border">
              <Button variant="gold" size="sm" onClick={() => setSweepResultModal(null)}>
                Close Report
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

