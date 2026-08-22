"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Clock,
  DollarSign,
  FileCheck2,
  ArrowRight,
  ShieldCheck,
  Landmark,
  UserPlus,
  Inbox,
  AlertOctagon,
  Phone,
  Bell,
  ChevronDown,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Send,
  CreditCard,
  FileText,
  UserCheck,
} from "lucide-react";
import { Skeleton, ErrorState } from "@/components/ui/feedback-primitives";
import { adminApi } from "@/lib/api/admin";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { PriorityBadge, StatusBadge, SlaBadge } from "@/components/domain/status-badges";
import { ApplicationPriority, ApplicationStatus } from "@/types";

// ============================================================================
// HELPER SVG CHARTS & VISUAL COMPONENTS (Pixel-Perfect Reference Match)
// ============================================================================

/**
 * Miniature Trend Sparkline for KPI Cards
 */
function Sparkline({
  data,
  color,
  dashed = false,
}: {
  data?: number[];
  color: string;
  dashed?: boolean;
}) {
  const points = useMemo(() => {
    const values = data && data.length > 0 ? data : [0, 0, 0, 0, 0, 0, 0];
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = max - min || 1;
    const width = 180;
    const height = 12;
    const step = width / (values.length - 1 || 1);

    return values
      .map((val, idx) => {
        const x = idx * step;
        const y = height - ((val - min) / range) * (height - 3) - 1.5;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" L ");
  }, [data]);

  return (
    <svg className="w-full h-3 overflow-visible" viewBox="0 0 180 12">
      <path
        d={`M ${points}`}
        fill="none"
        stroke={color}
        strokeWidth="1.75"
        strokeDasharray={dashed ? "3 2" : undefined}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Statutory Agency Distribution Donut Chart
 */
const AGENCY_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#64748b"];

/**
 * Statutory Agency Distribution Donut Chart (Compact)
 */
function AgencyDonutChart({
  stats,
}: {
  stats?: Array<{ agency: string; count: number }>;
}) {
  const { items, total } = useMemo(() => {
    const list = stats || [];
    const sum = list.reduce((acc, curr) => acc + curr.count, 0);
    return { items: list, total: sum };
  }, [stats]);

  // Calculate SVG stroke-dasharray segments for donut
  const segments = useMemo(() => {
    if (total === 0) return [];
    let accumulatedAngle = 0;
    const radius = 28;
    const circumference = 2 * Math.PI * radius;

    return items.map((item, idx) => {
      const strokePercent = item.count / total;
      const strokeDasharray = `${strokePercent * circumference} ${circumference}`;
      const strokeDashoffset = -accumulatedAngle * circumference;
      accumulatedAngle += strokePercent;

      return {
        ...item,
        color: AGENCY_COLORS[idx % AGENCY_COLORS.length],
        strokeDasharray,
        strokeDashoffset,
      };
    });
  }, [items, total]);

  return (
    <div className="flex items-center justify-between gap-4">
      {/* Compact Donut graphic */}
      <div className="relative size-24 shrink-0 flex items-center justify-center">
        <svg className="size-full -rotate-90" viewBox="0 0 80 80">
          <circle
            cx="40"
            cy="40"
            r="28"
            className="stroke-muted/30 fill-none"
            strokeWidth="10"
          />
          {segments.map((seg, i) => (
            <circle
              key={i}
              cx="40"
              cy="40"
              r="28"
              fill="none"
              stroke={seg.color}
              strokeWidth="10"
              strokeDasharray={seg.strokeDasharray}
              strokeDashoffset={seg.strokeDashoffset}
              className="transition-all duration-500"
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-lg font-bold text-foreground leading-none">{total}</span>
          <span className="text-[9px] font-semibold text-muted-foreground mt-0.5">
            Agencies
          </span>
        </div>
      </div>

      {/* Compact Legend list */}
      <div className="flex-1 space-y-1.5 w-full">
        {items.length > 0 ? (
          items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className="size-2 rounded-full shrink-0"
                  style={{ backgroundColor: AGENCY_COLORS[idx % AGENCY_COLORS.length] }}
                />
                <span className="font-medium text-foreground truncate">{item.agency}</span>
              </div>
              <span className="font-semibold text-muted-foreground text-right shrink-0 ml-2">
                {item.count} {item.count === 1 ? "filing" : "filings"}
              </span>
            </div>
          ))
        ) : (
          <p className="text-[11px] text-muted-foreground text-center py-2">
            No statutory agency filings recorded yet.
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * SLA Compliance Arc Gauge Chart (Compact)
 */
function SlaGaugeChart({
  complianceRate = 100,
}: {
  complianceRate?: number;
}) {
  const clamped = Math.min(100, Math.max(0, complianceRate));
  const radius = 50;
  const circumference = Math.PI * radius;
  const dashOffset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-[170px] mx-auto">
      <svg className="w-full h-24 overflow-visible" viewBox="0 0 130 70">
        {/* Background Arc */}
        <path
          d="M 15 65 A 50 50 0 0 1 115 65"
          fill="none"
          stroke="hsl(var(--muted)/0.3)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Filled Gauge Arc */}
        <path
          d="M 15 65 A 50 50 0 0 1 115 65"
          fill="none"
          stroke={clamped >= 90 ? "#10b981" : clamped >= 75 ? "#f59e0b" : "#ef4444"}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-all duration-700"
        />
      </svg>
      {/* Center Label */}
      <div className="absolute top-6 flex flex-col items-center justify-center text-center">
        <span className="text-xl font-extrabold text-foreground tracking-tight">
          {clamped}%
        </span>
        <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">
          SLA Compliance
        </span>
      </div>
      <div className="w-full flex items-center justify-between text-[10px] font-semibold text-muted-foreground mt-0.5 px-2">
        <span>0%</span>
        <span>100%</span>
      </div>
    </div>
  );
}

/**
 * Stage Turnaround Time Average Bar Chart (Compact)
 */
function TurnaroundBarChart({
  turnaround,
}: {
  turnaround?: {
    intakeHours: number;
    qcHours: number;
    registryHours: number;
    deliveryHours: number;
    completionHours: number;
  };
}) {
  const stages = [
    { label: "Intake", value: turnaround?.intakeHours ?? 6 },
    { label: "QC Check", value: turnaround?.qcHours ?? 12 },
    { label: "Registry", value: turnaround?.registryHours ?? 18 },
    { label: "Delivery", value: turnaround?.deliveryHours ?? 24 },
    { label: "Completion", value: turnaround?.completionHours ?? 36 },
  ];

  const maxVal = Math.max(...stages.map((s) => s.value), 48);

  return (
    <div className="w-full space-y-1">
      <div className="flex items-end justify-between h-28 pt-4 pb-1 gap-2 border-b border-border/80 px-1">
        {stages.map((stg, i) => {
          const heightPercent = Math.min(100, Math.max(12, (stg.value / maxVal) * 100));
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group h-full justify-end">
              <span className="text-[10px] font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                {stg.value}h
              </span>
              <div className="w-full bg-muted/40 rounded-t-xs h-full flex items-end overflow-hidden p-0.5">
                <div
                  className="w-full bg-indigo-500/80 dark:bg-gold/80 group-hover:bg-indigo-600 dark:group-hover:bg-gold rounded-t-xs transition-all duration-500"
                  style={{ height: `${heightPercent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      {/* Stage Labels */}
      <div className="flex items-center justify-between px-1 text-[10px] font-semibold text-muted-foreground">
        {stages.map((stg, i) => (
          <span key={i} className="flex-1 text-center truncate">
            {stg.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================

export default function AdminDashboardPage() {
  const {
    data: overview,
    isLoading: isOverviewLoading,
    error: overviewError,
    refetch: refetchOverview,
  } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => adminApi.getDashboardOverview(),
    refetchInterval: 30000,
  });

  const {
    data: workQueueData,
    isLoading: isQueueLoading,
  } = useQuery({
    queryKey: ["admin-live-work-queue"],
    queryFn: () => adminApi.getWorkQueue({ limit: 5 }),
    refetchInterval: 15000,
  });

  const applications = workQueueData?.items || [];

  // Formatter helper for SLA remaining countdown
  const formatSlaRemaining = (dueAt?: string | null) => {
    if (!dueAt) return "No target";
    const due = new Date(dueAt).getTime();
    const now = new Date().getTime();
    const diffMs = due - now;

    if (diffMs <= 0) {
      return <span className="text-destructive font-bold">Breached</span>;
    }
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    const colorClass = hours < 4 ? "text-destructive" : hours < 12 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400";
    return <span className={`font-mono font-bold ${colorClass}`}>{hours}h {mins}m</span>;
  };

  // Activity Icon Resolver
  const getActivityIcon = (action: string) => {
    if (action.includes("DELIVERED")) {
      return <Send className="size-3.5 text-blue-600 dark:text-blue-400" />;
    }
    if (action.includes("QC") || action.includes("APPROVED")) {
      return <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />;
    }
    if (action.includes("RISK") || action.includes("OVERDUE") || action.includes("BREACH")) {
      return <AlertTriangle className="size-3.5 text-amber-600 dark:text-amber-400" />;
    }
    if (action.includes("PAYMENT") || action.includes("COLLECTED")) {
      return <CreditCard className="size-3.5 text-emerald-600 dark:text-emerald-400" />;
    }
    return <FileText className="size-3.5 text-indigo-600 dark:text-gold" />;
  };

  if (overviewError) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <ErrorState
          title="Unable to load operational metrics"
          message="Failed to connect to backend governance APIs."
          onRetry={() => refetchOverview()}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-4 sm:p-5 lg:p-6 space-y-4 max-w-[1550px] mx-auto font-sans">
      {/* ==================================================================== */}
      {/* 1. HEADER SECTION */}
      {/* ==================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Operational Command & Governance
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Real-time statutory registry filings, document QC audits, SLA turnaround velocity, and financial collections.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
          <Link href="/admin/reconciliation">
            <button className="bg-white border border-slate-200 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-xl hover:bg-slate-50 shadow-xs transition-all flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-emerald-600" />
              <span>Reconciliation</span>
            </button>
          </Link>

          <Link href="/admin/applications">
            <button className="bg-gradient-to-r from-[#C5A059] to-[#D4AF37] hover:from-[#b49049] hover:to-[#c39e26] text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1.5 transform hover:-translate-y-0.5">
              <span>Master Work Queue</span>
              <ArrowRight className="size-3.5" />
            </button>
          </Link>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* ==================================================================== */}
      {/* 2. EXECUTIVE KPI ROW (Half-Height Compact Density / 2 Cols Mobile) */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {/* Card 1: ACTIVE INTAKE DOSSIERS */}
        <div className="bg-white rounded-xl py-2 px-3 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-0.5 hover:border-purple-300/60 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-extrabold tracking-wider text-slate-400 uppercase">
              ACTIVE INTAKE DOSSIERS
            </span>
            <div className="size-5 rounded-full bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
              <FileCheck2 className="size-3" />
            </div>
          </div>

          <div className="flex items-baseline justify-between gap-1.5">
            <span className="text-lg font-extrabold text-slate-900 tracking-tight leading-none">
              {isOverviewLoading ? <Skeleton className="h-5 w-10" /> : overview?.summary.activeApplications ?? 0}
            </span>
            <span className="text-[10px] text-slate-500 font-medium truncate">
              {overview?.summary.totalApplications ?? 0} total filings
            </span>
          </div>

          <div className="pt-0.5">
            <Sparkline data={overview?.trends?.intake} color="#a855f7" />
          </div>
        </div>

        {/* Card 2: SLA BREACHES & AT RISK */}
        <div className="bg-white rounded-xl py-2 px-3 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-0.5 hover:border-amber-300/60 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-extrabold tracking-wider text-slate-400 uppercase">
              SLA BREACHES &amp; AT RISK
            </span>
            <div className="size-5 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
              <Clock className="size-3" />
            </div>
          </div>

          <div className="flex items-baseline justify-between gap-1.5">
            <span className="text-lg font-extrabold text-slate-900 tracking-tight leading-none">
              {isOverviewLoading ? (
                <Skeleton className="h-5 w-14" />
              ) : (
                `${overview?.queues.overdue ?? 0} / ${overview?.queues.atRisk ?? 0}`
              )}
            </span>
            <span className="text-[10px] text-slate-500 font-medium truncate">
              Avg: {overview?.sla.averageCompletionHours ?? 24}h ({overview?.sla.onTrackCount ?? 0} on track)
            </span>
          </div>

          <div className="pt-0.5">
            <Sparkline data={overview?.trends?.sla} color="#f97316" dashed />
          </div>
        </div>

        {/* Card 3: GROSS COLLECTIONS (KES) */}
        <div className="bg-white rounded-xl py-2 px-3 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-0.5 hover:border-emerald-300/60 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-extrabold tracking-wider text-slate-400 uppercase">
              GROSS COLLECTIONS (KES)
            </span>
            <div className="size-5 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <DollarSign className="size-3" />
            </div>
          </div>

          <div className="flex items-baseline justify-between gap-1.5">
            <span className="text-lg font-extrabold text-slate-900 tracking-tight leading-none truncate">
              {isOverviewLoading ? (
                <Skeleton className="h-5 w-16" />
              ) : (
                formatCurrency(Number(overview?.financials.totalCollected || 0))
              )}
            </span>
            <span className="text-[10px] text-slate-500 font-medium truncate">
              Due: {formatCurrency(Number(overview?.financials.totalOutstanding || 0))}
            </span>
          </div>

          <div className="pt-0.5">
            <Sparkline data={overview?.trends?.collections} color="#10b981" />
          </div>
        </div>

        {/* Card 4: STATUTORY AGENCY VELOCITY */}
        <div className="bg-white rounded-xl py-2 px-3 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-0.5 hover:border-blue-300/60 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-extrabold tracking-wider text-slate-400 uppercase">
              STATUTORY AGENCY VELOCITY
            </span>
            <div className="size-5 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <Landmark className="size-3" />
            </div>
          </div>

          <div className="flex items-baseline justify-between gap-1.5">
            <span className="text-lg font-extrabold text-slate-900 tracking-tight leading-none">
              {isOverviewLoading ? (
                <Skeleton className="h-5 w-10" />
              ) : (
                overview?.governmentAgencyStats?.reduce((acc, a) => acc + a.count, 0) ?? 0
              )}
            </span>
            <span className="text-[10px] text-slate-500 font-medium truncate">
              {overview?.governmentAgencyStats?.length ?? 0} portals
            </span>
          </div>

          <div className="pt-0.5">
            <Sparkline data={overview?.trends?.velocity} color="#3b82f6" />
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. IMMEDIATE OPERATIONAL QUEUES (6 Compact Client-Style Buckets) */}
      {/* ==================================================================== */}
      <div className="space-y-2">
        <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
          IMMEDIATE OPERATIONAL QUEUES
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
          {/* Queue 1: New Clients */}
          <Link
            href="/admin/registrations"
            className="bg-white rounded-xl border border-slate-200/80 p-3 flex flex-col justify-between hover:border-purple-300 transition-all group relative overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                  New Clients
                </span>
                <UserPlus className="size-3.5 text-purple-600" />
              </div>
              <p className="mt-1 text-xl font-extrabold text-slate-900">
                {isOverviewLoading ? "—" : overview?.queues.newRegistrations ?? 0}
              </p>
            </div>
            <span className="text-[9px] font-medium text-slate-500 mt-1">Pending intake review</span>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />
          </Link>

          {/* Queue 2: Unassigned */}
          <Link
            href="/admin/applications?tab=unassigned"
            className="bg-white rounded-xl border border-slate-200/80 p-3 flex flex-col justify-between hover:border-orange-300 transition-all group relative overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                  Unassigned
                </span>
                <Inbox className="size-3.5 text-orange-600" />
              </div>
              <p className="mt-1 text-xl font-extrabold text-slate-900">
                {isOverviewLoading ? "—" : overview?.queues.unassigned ?? 0}
              </p>
            </div>
            <span className="text-[9px] font-medium text-slate-500 mt-1">Requires assignment</span>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
          </Link>

          {/* Queue 3: Quality Check */}
          <Link
            href="/admin/applications?tab=qc"
            className="bg-white rounded-xl border border-slate-200/80 p-3 flex flex-col justify-between hover:border-emerald-300 transition-all group relative overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                  Quality Check (QC)
                </span>
                <ShieldCheck className="size-3.5 text-emerald-600" />
              </div>
              <p className="mt-1 text-xl font-extrabold text-slate-900">
                {isOverviewLoading ? "—" : overview?.queues.qualityCheck ?? 0}
              </p>
            </div>
            <span className="text-[9px] font-medium text-slate-500 mt-1">Ready for audit</span>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
          </Link>

          {/* Queue 4: Gov Registry */}
          <Link
            href="/admin/applications?tab=government"
            className="bg-white rounded-xl border border-slate-200/80 p-3 flex flex-col justify-between hover:border-blue-300 transition-all group relative overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  Gov Registry
                </span>
                <Landmark className="size-3.5 text-blue-600" />
              </div>
              <p className="mt-1 text-xl font-extrabold text-slate-900">
                {isOverviewLoading ? "—" : overview?.queues.awaitingGovernment ?? 0}
              </p>
            </div>
            <span className="text-[9px] font-medium text-slate-500 mt-1">Active on eCitizen / BRS</span>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
          </Link>

          {/* Queue 5: Due Soon (24h) */}
          <Link
            href="/admin/applications?tab=dueSoon"
            className="bg-white rounded-xl border border-slate-200/80 p-3 flex flex-col justify-between hover:border-amber-300 transition-all group relative overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                  Due Soon (24h)
                </span>
                <Clock className="size-3.5 text-amber-500" />
              </div>
              <p className="mt-1 text-xl font-extrabold text-slate-900">
                {isOverviewLoading ? "—" : overview?.queues.dueSoon ?? 0}
              </p>
            </div>
            <span className="text-[9px] font-medium text-slate-500 mt-1">Approaching SLA target</span>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
          </Link>

          {/* Queue 6: Overdue / Breached */}
          <Link
            href="/admin/applications?tab=overdue"
            className="bg-white rounded-xl border border-rose-200 p-3 flex flex-col justify-between hover:bg-rose-50/50 transition-all group relative overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.02)] col-span-2 sm:col-span-1"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-rose-700">
                  Overdue / Breached
                </span>
                <AlertOctagon className="size-3.5 text-rose-600" />
              </div>
              <p className="mt-1 text-xl font-extrabold text-rose-700">
                {isOverviewLoading ? "—" : overview?.queues.overdue ?? 0}
              </p>
            </div>
            <span className="text-[9px] font-semibold text-rose-600 mt-1">
              Immediate escalation
            </span>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-500" />
          </Link>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 4. MAIN COMMAND SPLIT (2/3 Work Queue Table, 1/3 Agency & Audit Feed) */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
        {/* Left Column (2/3): Live Priority Intake Stream Table */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                Live Priority Intake Stream
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>

            <Link
              href="/admin/applications"
              className="text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors flex items-center gap-1"
            >
              <span>View Full Queue</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
            {isQueueLoading ? (
              <div className="p-4 space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : applications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 space-y-1">
                <p className="font-bold text-slate-800 text-xs">No priority intake items</p>
                <p className="text-[11px]">All client dossiers are currently processed or on schedule.</p>
              </div>
            ) : (
              <div>
                {/* Mobile Card List View (< md) */}
                <div className="block md:hidden divide-y divide-slate-100">
                  {applications.map((app) => (
                    <Link
                      key={app.id}
                      href={`/admin/applications/${app.id}`}
                      className="block p-3.5 hover:bg-slate-50 transition-colors space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <PriorityBadge priority={app.priority} size="sm" />
                          <span className="font-mono font-bold text-xs text-slate-900">
                            #{app.applicationNumber}
                          </span>
                        </div>
                        <StatusBadge status={app.status} size="sm" />
                      </div>

                      <div className="flex items-center justify-between text-xs pt-0.5">
                        <span className="font-semibold text-slate-800 truncate max-w-[170px]">
                          {app.client?.businessName || app.client?.fullName || "Client"}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium truncate max-w-[130px]">
                          {app.service?.name || "Statutory Service"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400">Assignee:</span>
                          {app.assignedAdmin ? (
                            <span className="font-semibold text-slate-700">
                              {app.assignedAdmin.fullName || app.assignedAdmin.email?.split("@")[0]}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Unassigned</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400">SLA:</span>
                          {formatSlaRemaining(app.dueAt)}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Desktop Table View (>= md) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3">PRIORITY</th>
                        <th className="py-2.5 px-3">APPLICATION ID</th>
                        <th className="py-2.5 px-3">CLIENT</th>
                        <th className="py-2.5 px-3">SERVICE</th>
                        <th className="py-2.5 px-3">ASSIGNED TO</th>
                        <th className="py-2.5 px-3">STATUS</th>
                        <th className="py-2.5 px-3 text-right">SLA REMAINING</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {applications.map((app) => (
                        <tr
                          key={app.id}
                          className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                          onClick={() => window.location.href = `/admin/applications/${app.id}`}
                        >
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <PriorityBadge priority={app.priority} size="sm" />
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900 group-hover:text-amber-700 whitespace-nowrap text-[11px]">
                            #{app.applicationNumber}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800 whitespace-nowrap text-[11px]">
                            {app.client?.businessName || app.client?.fullName || "Client"}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 font-medium whitespace-nowrap text-[11px]">
                            {app.service?.name || "Statutory Service"}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {app.assignedAdmin ? (
                              <div className="flex items-center gap-1.5">
                                <div className="size-5 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[9px] text-slate-700 border border-slate-200">
                                  {(app.assignedAdmin.fullName || app.assignedAdmin.email || "A").charAt(0)}
                                </div>
                                <span className="text-[11px] font-medium text-slate-800">
                                  {app.assignedAdmin.fullName || app.assignedAdmin.email?.split("@")[0]}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">Unassigned</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <StatusBadge status={app.status} size="sm" />
                          </td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap text-[11px]">
                            {formatSlaRemaining(app.dueAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1/3): Statutory Agency Distribution & Recent Operations */}
        <div className="space-y-4">
          {/* Statutory Agency Distribution Card */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                Statutory Agency Distribution
              </h2>
              <Link
                href="/admin/government"
                className="text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <AgencyDonutChart stats={overview?.governmentAgencyStats} />
            </div>
          </div>

          {/* Recent Operations Stream Feed */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                Recent Operations Stream
              </h2>
              <Link
                href="/admin/audit-trail"
                className="text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors"
              >
                Audit Trail
              </Link>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/80 p-4 space-y-3 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              {overview?.recentActivities && overview.recentActivities.length > 0 ? (
                overview.recentActivities.slice(0, 5).map((act) => (
                  <div key={act.id} className="flex items-start gap-2.5 text-[11px] pb-2.5 border-b border-slate-100 last:border-0 last:pb-0">
                    <div className="p-1 rounded-full bg-slate-100 shrink-0 mt-0.5">
                      {getActivityIcon(act.action)}
                    </div>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono font-bold text-[10px] text-indigo-600">
                          {act.action}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium shrink-0">
                          {formatDate(act.timestamp)}
                        </span>
                      </div>
                      <p className="font-bold text-slate-900 truncate">
                        #{act.applicationNumber} • {act.serviceName || "Statutory Service"}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium truncate">
                        Client: <strong className="text-slate-800 font-bold">{act.clientName}</strong>
                        {act.officerName && <span> • Officer: {act.officerName}</span>}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[11px] text-slate-400 font-medium text-center py-2">
                  No recent operational activities recorded.
                </p>
              )}

              <div className="pt-2 border-t border-slate-100 text-center">
                <Link
                  href="/admin/audit-trail"
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors flex items-center justify-center gap-1"
                >
                  <span>View Full Audit Trail</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 5. SLA PERFORMANCE OVERVIEW (Bottom Gauge & Stage Bar Chart) */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 space-y-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900">
            SLA Performance Overview
          </h2>

          <div className="flex items-center gap-2">
            <select className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500">
              <option>This Month</option>
              <option>Last Month</option>
              <option>This Quarter</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
          {/* Left: SLA Compliance Gauge Chart */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 border-r-0 lg:border-r border-slate-100 pr-0 lg:pr-6">
            <SlaGaugeChart complianceRate={overview?.sla.complianceRate ?? 100} />

            <div className="space-y-2.5 w-full sm:w-auto">
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    <span className="font-semibold text-slate-700">On Track</span>
                  </div>
                  <span className="font-bold text-slate-900">{overview?.sla.onTrackCount ?? 0}</span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-amber-500" />
                    <span className="font-semibold text-slate-700">At Risk</span>
                  </div>
                  <span className="font-bold text-slate-900">{overview?.sla.atRiskCount ?? 0}</span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-rose-500" />
                    <span className="font-semibold text-slate-700">Breached</span>
                  </div>
                  <span className="font-bold text-slate-900">{overview?.sla.overdueCount ?? 0}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500 font-medium flex items-center gap-1">
                <span>vs last month</span>
                <span className="text-emerald-600 font-bold flex items-center">
                  <TrendingUp className="size-3 mr-0.5" /> +{overview?.sla.momChangePercent ?? 6}%
                </span>
              </div>
            </div>
          </div>

          {/* Right: Turnaround Time Average Bar Chart */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                Turnaround Time (Average)
              </h3>
              <span className="text-[10px] font-mono font-semibold text-slate-400">Hours</span>
            </div>

            <TurnaroundBarChart turnaround={overview?.turnaroundByStage} />
          </div>
        </div>
      </div>
    </div>
  );
}
