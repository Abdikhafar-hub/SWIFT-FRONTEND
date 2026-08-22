"use client";

import React, { useState, useMemo } from "react";
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
  Plus,
  Folder,
  ClipboardList,
  Calendar,
  Zap,
  RefreshCw,
  XCircle,
  FileCheck,
  Layers,
  ArrowUpRight,
  ShieldAlert,
} from "lucide-react";
import { Skeleton, ErrorState } from "@/components/ui/feedback-primitives";
import { applicationsApi } from "@/lib/api/applications";
import { useAuth } from "@/lib/auth/auth-context";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { PriorityBadge, StatusBadge, SlaBadge } from "@/components/domain/status-badges";
import type { ApplicationPriority, ApplicationStatus } from "@/types";

// ============================================================================
// HELPER SVG CHARTS & VISUAL COMPONENTS (Matches Admin Dashboard Parity)
// ============================================================================

/**
 * Miniature Trend Sparkline for Executive KPI Cards
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
    const values = data && data.length > 0 ? data : [2, 4, 3, 6, 5, 8, 7];
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = max - min || 1;
    const width = 180;
    const height = 14;
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
    <svg className="w-full h-3.5 overflow-visible" viewBox="0 0 180 14">
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
 * Statutory Agency Distribution Donut Chart (Compact)
 */
const AGENCY_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#64748b"];

function AgencyDonutChart({
  stats,
}: {
  stats?: Array<{ agency: string; count: number }>;
}) {
  const { items, total } = useMemo(() => {
    const defaultStats = [
      { agency: "BRS eCitizen Registry", count: 12 },
      { agency: "KRA Tax Compliance", count: 8 },
      { agency: "Immigration & Visas", count: 3 },
      { agency: "Ministry of Lands", count: 2 },
    ];
    const list = stats && stats.length > 0 ? stats : defaultStats;
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
            className="stroke-slate-100 fill-none"
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
          <span className="text-lg font-bold text-slate-900 leading-none">{total}</span>
          <span className="text-[9px] font-semibold text-slate-500 mt-0.5">
            Agencies
          </span>
        </div>
      </div>

      {/* Compact Legend list */}
      <div className="flex-1 space-y-1.5 w-full">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className="size-2 rounded-full shrink-0"
                style={{ backgroundColor: AGENCY_COLORS[idx % AGENCY_COLORS.length] }}
              />
              <span className="font-medium text-slate-800 truncate">{item.agency}</span>
            </div>
            <span className="font-semibold text-slate-500 text-right shrink-0 ml-2">
              {item.count} {item.count === 1 ? "filing" : "filings"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Relative time helper for timeline items
 */
function formatRelativeTime(dateString?: string) {
  if (!dateString) return "Recently";
  const date = new Date(dateString);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ============================================================================
// MAIN CLIENT DASHBOARD COMPONENT
// ============================================================================

export default function ClientDashboardPage() {
  const { user, client } = useAuth();
  const displayName =
    client?.fullName?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "Client";

  // Authoritative Backend Dashboard Overview API Query
  const {
    data: overview,
    isLoading: isOverviewLoading,
    isError: isOverviewError,
    refetch: refetchOverview,
  } = useQuery({
    queryKey: ["client-dashboard-overview"],
    queryFn: () => applicationsApi.getClientDashboardOverview(),
    refetchInterval: 30000,
  });

  // Recent Filings Query for High-Density Live Stream Table
  const {
    data: applicationsData,
    isLoading: isAppsLoading,
  } = useQuery({
    queryKey: ["client-my-applications-stream"],
    queryFn: () => applicationsApi.getApplications({ limit: 5 }),
    refetchInterval: 15000,
  });

  const recentApplications = applicationsData?.items || [];

  const summary = overview?.summary;
  const recentActivity = overview?.recentActivity || [];
  const upcomingDeadlines = overview?.upcomingDeadlines || [];
  const complianceHealth = overview?.complianceHealth;

  // Dynamic KPI Values
  const activeFilingsCount = summary?.activeFilingsCount ?? 0;
  const actionItemsCount = summary?.actionItemsCount ?? 0;
  const totalAppsCount = summary?.totalApplications ?? 0;
  const unreadNotifs = summary?.unreadNotificationsCount ?? 0;
  const activeProgress = summary?.activeFilingsProgressPercent ?? 0;

  // Dynamic Compliance Donut Calculations
  const complianceScore = complianceHealth?.scorePercent ?? 100;
  const compliantCount = complianceHealth?.compliantCount ?? 0;
  const pendingCount = complianceHealth?.pendingCount ?? 0;
  const overdueCount = complianceHealth?.overdueCount ?? 0;
  const attentionCount = complianceHealth?.attentionCount ?? 0;
  const circumference = 188.5;
  const strokeOffset = circumference - (complianceScore / 100) * circumference;

  // Helper for SLA Countdown Display
  const formatSlaRemaining = (dueAt?: string | null) => {
    if (!dueAt) return <span className="text-slate-400 font-medium">On Track</span>;
    const due = new Date(dueAt).getTime();
    const now = new Date().getTime();
    const diffMs = due - now;

    if (diffMs <= 0) {
      return <span className="text-rose-600 font-bold">Action Needed</span>;
    }
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    const colorClass =
      hours < 6 ? "text-rose-600 font-bold" : hours < 24 ? "text-amber-600 font-bold" : "text-emerald-600 font-bold";
    return <span className={`font-mono ${colorClass}`}>{hours}h {mins}m</span>;
  };

  // Activity Icon Resolver
  const getActivityIcon = (type?: string) => {
    if (type === "APPROVED") {
      return <CheckCircle2 className="size-3.5 text-emerald-600" />;
    }
    if (type === "REJECTED") {
      return <XCircle className="size-3.5 text-rose-600" />;
    }
    if (type === "PAYMENT") {
      return <CreditCard className="size-3.5 text-amber-600" />;
    }
    return <FileText className="size-3.5 text-blue-600" />;
  };

  if (isOverviewError) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <ErrorState
          title="Unable to load client executive metrics"
          message="Failed to connect to backend statutory APIs."
          onRetry={() => refetchOverview()}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-4 sm:p-5 lg:p-6 space-y-4 max-w-[1550px] mx-auto font-sans">
      {/* ==================================================================== */}
      {/* 1. HEADER SECTION & OPERATIONAL COMMAND BAR */}
      {/* ==================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Welcome back, {displayName} 👋
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Executive Command & Statutory Hub • Real-time eCitizen registry filings, SLA velocity, and compliance status.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
          <Link href="/client/documents">
            <button className="bg-white border border-slate-200 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-xl hover:bg-slate-50 shadow-xs transition-all flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-emerald-600" />
              <span>Document Vault</span>
            </button>
          </Link>

          <Link href="/client/services">
            <button className="bg-gradient-to-r from-[#C5A059] to-[#D4AF37] hover:from-[#b49049] hover:to-[#c39e26] text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1.5 transform hover:-translate-y-0.5">
              <Plus className="size-3.5 stroke-[3]" />
              <span>New Statutory Filing</span>
            </button>
          </Link>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. EXECUTIVE KPI ROW (High-Density Sparkline Cards / 2 Cols Mobile) */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {/* Card 1: ACTIVE INTAKE DOSSIERS */}
        <div className="bg-white rounded-xl py-2.5 px-3.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-1 hover:border-amber-300/60 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-extrabold tracking-wider text-slate-400 uppercase">
              ACTIVE INTAKE DOSSIERS
            </span>
            <div className="size-5 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
              <Folder className="size-3 text-amber-600" />
            </div>
          </div>

          <div className="flex items-baseline justify-between gap-1.5">
            <span className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight leading-none">
              {isOverviewLoading ? <Skeleton className="h-5 w-10" /> : activeFilingsCount}
            </span>
            <span className="text-[10px] text-slate-500 font-medium truncate">
              {activeProgress}% in registry
            </span>
          </div>

          <div className="pt-0.5">
            <Sparkline data={[2, 5, 4, 7, 6, activeFilingsCount, activeFilingsCount + 2]} color="#d97706" />
          </div>
        </div>

        {/* Card 2: URGENT ACTION ITEMS */}
        <div className="bg-white rounded-xl py-2.5 px-3.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-1 hover:border-indigo-300/60 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-extrabold tracking-wider text-slate-400 uppercase">
              ACTION ITEMS &amp; CLAIMS
            </span>
            <div className="size-5 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <ClipboardList className="size-3 text-indigo-600" />
            </div>
          </div>

          <div className="flex items-baseline justify-between gap-1.5">
            <span className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight leading-none">
              {isOverviewLoading ? <Skeleton className="h-5 w-10" /> : actionItemsCount}
            </span>
            <span className="text-[10px] text-slate-500 font-medium truncate">
              {actionItemsCount > 0 ? "Requires submission" : "All up to date"}
            </span>
          </div>

          <div className="pt-0.5">
            <Sparkline data={[1, 3, 2, actionItemsCount, 1, 0, actionItemsCount]} color="#6366f1" dashed />
          </div>
        </div>

        {/* Card 3: TOTAL STATUTORY RECORDS */}
        <div className="bg-white rounded-xl py-2.5 px-3.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-1 hover:border-emerald-300/60 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-extrabold tracking-wider text-slate-400 uppercase">
              LIFETIME STATUTORY RECORDS
            </span>
            <div className="size-5 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <TrendingUp className="size-3 text-emerald-600" />
            </div>
          </div>

          <div className="flex items-baseline justify-between gap-1.5">
            <span className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight leading-none">
              {isOverviewLoading ? <Skeleton className="h-5 w-10" /> : totalAppsCount}
            </span>
            <span className="text-[10px] text-slate-500 font-medium truncate">
              Total lifetime client records
            </span>
          </div>

          <div className="pt-0.5">
            <Sparkline data={[5, 10, 12, 18, 20, 24, totalAppsCount]} color="#10b981" />
          </div>
        </div>

        {/* Card 4: UNREAD REGISTRY ALERTS */}
        <div className="bg-white rounded-xl py-2.5 px-3.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-1 hover:border-rose-300/60 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-extrabold tracking-wider text-slate-400 uppercase">
              UNREAD REGISTRY ALERTS
            </span>
            <div className="size-5 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shrink-0">
              <Bell className="size-3 text-rose-500" />
            </div>
          </div>

          <div className="flex items-baseline justify-between gap-1.5">
            <span className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight leading-none">
              {isOverviewLoading ? <Skeleton className="h-5 w-10" /> : unreadNotifs}
            </span>
            <span className="text-[10px] text-slate-500 font-medium truncate">
              In-app &amp; status notices
            </span>
          </div>

          <div className="pt-0.5">
            <Sparkline data={[0, 2, 1, 0, unreadNotifs, 1, unreadNotifs]} color="#f43f5e" />
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. IMMEDIATE CLIENT WORKFLOW QUEUES (6 Compact Micro-Cards Row) */}
      {/* ==================================================================== */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
            IMMEDIATE WORKFLOW QUEUES
          </span>
          <Link href="/client/actions" className="text-[11px] font-bold text-amber-600 hover:text-amber-700 transition-colors flex items-center gap-1">
            <span>Action Center</span>
            <ArrowRight className="size-3" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5">
          {/* Micro Card 1: Action Required */}
          <Link
            href="/client/actions"
            className="bg-white rounded-xl p-2.5 border-l-4 border-l-indigo-500 border border-slate-200/70 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500">Action Required</span>
              <ClipboardList className="size-3.5 text-indigo-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-base font-extrabold text-slate-900">{actionItemsCount}</span>
              <span className="text-[9px] font-semibold text-indigo-600">Pending</span>
            </div>
          </Link>

          {/* Micro Card 2: In Registry Filing */}
          <Link
            href="/client/applications"
            className="bg-white rounded-xl p-2.5 border-l-4 border-l-amber-500 border border-slate-200/70 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500">eCitizen Registry</span>
              <Folder className="size-3.5 text-amber-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-base font-extrabold text-slate-900">{activeFilingsCount}</span>
              <span className="text-[9px] font-semibold text-amber-600">Active</span>
            </div>
          </Link>

          {/* Micro Card 3: Vault Documents */}
          <Link
            href="/client/documents"
            className="bg-white rounded-xl p-2.5 border-l-4 border-l-emerald-500 border border-slate-200/70 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500">Document Vault</span>
              <FileCheck className="size-3.5 text-emerald-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-base font-extrabold text-slate-900">{compliantCount}</span>
              <span className="text-[9px] font-semibold text-emerald-600">Verified</span>
            </div>
          </Link>

          {/* Micro Card 4: Unpaid Invoices */}
          <Link
            href="/client/invoices"
            className="bg-white rounded-xl p-2.5 border-l-4 border-l-rose-500 border border-slate-200/70 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500">Unpaid Invoices</span>
              <CreditCard className="size-3.5 text-rose-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-base font-extrabold text-slate-900">{overdueCount}</span>
              <span className="text-[9px] font-semibold text-rose-600">Due Now</span>
            </div>
          </Link>

          {/* Micro Card 5: Officer Messages */}
          <Link
            href="/client/messages"
            className="bg-white rounded-xl p-2.5 border-l-4 border-l-blue-500 border border-slate-200/70 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500">Officer Desk</span>
              <Bell className="size-3.5 text-blue-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-base font-extrabold text-slate-900">{unreadNotifs}</span>
              <span className="text-[9px] font-semibold text-blue-600">Unread</span>
            </div>
          </Link>

          {/* Micro Card 6: Compliant Filings */}
          <Link
            href="/client/applications"
            className="bg-white rounded-xl p-2.5 border-l-4 border-l-purple-500 border border-slate-200/70 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500">Compliant Filings</span>
              <CheckCircle2 className="size-3.5 text-purple-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-base font-extrabold text-slate-900">{totalAppsCount}</span>
              <span className="text-[9px] font-semibold text-purple-600">Issued</span>
            </div>
          </Link>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 4. MAIN DENSITY GRID: LIVE STATUTORY STREAM (LEFT) & AGENCY DONUT (RIGHT) */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
        {/* LEFT 8 COLS: LIVE PRIORITY STATUTORY FILINGS STREAM */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] p-4 sm:p-5 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Live Priority Statutory Stream
              </h2>
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Sync
              </span>
            </div>
            <Link
              href="/client/applications"
              className="text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors flex items-center gap-1"
            >
              <span>View Full Queue</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          {/* HIGH DENSITY INTERACTIVE DATA TABLE */}
          <div className="overflow-x-auto rounded-xl border border-slate-200/70">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Application ID</th>
                  <th className="py-2.5 px-3">Statutory Service</th>
                  <th className="py-2.5 px-3">Agency</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">SLA Countdown</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isAppsLoading ? (
                  [1, 2, 3, 4, 5].map((i) => (
                    <tr key={i}>
                      <td colSpan={7} className="py-2.5 px-3">
                        <Skeleton className="h-6 w-full" />
                      </td>
                    </tr>
                  ))
                ) : recentApplications.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                      No active statutory filings found. Click &quot;New Statutory Filing&quot; to begin.
                    </td>
                  </tr>
                ) : (
                  recentApplications.map((app: any) => (
                    <tr key={app.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <PriorityBadge priority={app.priority || ("STANDARD" as ApplicationPriority)} />
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {app.applicationNumber || app.id.substring(0, 12)}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800 max-w-[180px] truncate">
                        {app.service?.title || "Statutory Compliance Service"}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          <Landmark className="size-3 text-amber-600" />
                          <span>{app.service?.category?.replace("_", " ") || "BRS Registry"}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <StatusBadge status={app.status} />
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-[11px]">
                        {formatSlaRemaining(app.targetCompletionDate)}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <Link href={`/client/applications/${app.id}`}>
                          <button className="text-[11px] font-bold text-amber-600 hover:text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg group-hover:bg-amber-600 group-hover:text-white transition-colors">
                            Manage
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT 4 COLS: STATUTORY AGENCY DISTRIBUTION DONUT & RECENT OPERATIONS FEED */}
        <div className="lg:col-span-4 space-y-4">
          {/* CARD A: STATUTORY AGENCY DISTRIBUTION */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Statutory Agency Distribution
              </h3>
              <Link href="/client/applications" className="text-[10px] font-bold text-amber-600 hover:underline">
                View All
              </Link>
            </div>
            <AgencyDonutChart />
          </div>

          {/* CARD B: RECENT OPERATIONS STREAM */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Zap className="size-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Recent Operations Stream
                </h3>
              </div>
              <span className="text-[10px] font-bold text-slate-400">Real-time</span>
            </div>

            <div className="space-y-2.5">
              {recentActivity.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">No recent activity recorded.</p>
              ) : (
                recentActivity.slice(0, 3).map((act: any, idx: number) => (
                  <div key={act.id || idx} className="flex items-start gap-2.5 text-xs">
                    <div className="size-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                      {getActivityIcon(act.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-900 text-[11px] truncate">{act.title}</div>
                      <div className="text-[10px] text-slate-500 truncate">{act.subtitle}</div>
                    </div>
                    <span className="text-[9px] font-semibold text-slate-400 shrink-0">
                      {formatRelativeTime(act.timestamp)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 5. BOTTOM ROW: UPCOMING DEADLINES, COMPLIANCE ARC, & DARK 3D CTA BANNER */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
        {/* CARD 1: UPCOMING DEADLINES */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="size-8 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
                <Calendar className="size-4 text-amber-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-none">Upcoming Deadlines</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Statutory dates &amp; renewal targets</p>
              </div>
            </div>

            {upcomingDeadlines.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs">
                <p className="font-semibold">No upcoming statutory deadlines</p>
                <p className="text-[10px] mt-0.5">All company annual returns and tax filings up to date</p>
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingDeadlines.slice(0, 3).map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between gap-2.5 p-2 rounded-lg bg-slate-50/70 border border-slate-100">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-center shrink-0 min-w-[40px]">
                        <div className="text-xs font-extrabold text-slate-900 leading-none">{item.day}</div>
                        <div className="text-[8px] font-bold text-amber-600 uppercase mt-0.5">{item.month}</div>
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold text-slate-900 truncate">{item.title}</div>
                        <div className="text-[10px] text-slate-500 font-medium truncate">{item.companyName}</div>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        item.badgeColor === "ROSE"
                          ? "bg-rose-100 text-rose-800"
                          : item.badgeColor === "AMBER"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {item.daysLeft}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Link
            href="/client/applications"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 hover:text-amber-700 transition-colors pt-2 border-t border-slate-100"
          >
            <span>View all statutory deadlines</span>
            <ArrowRight className="size-3" />
          </Link>
        </div>

        {/* CARD 2: COMPLIANCE HEALTH DONUT & BREAKDOWN */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="size-8 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="size-4 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-none">Compliance Health</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">SLA velocity &amp; audit health</p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 py-1">
              {/* Donut graphic */}
              <div className="relative size-28 shrink-0 flex items-center justify-center">
                <svg viewBox="0 0 80 80" className="w-full h-full transform -rotate-90">
                  <circle cx="40" cy="40" r="30" fill="transparent" stroke="#F1F5F9" strokeWidth="8" />
                  <circle
                    cx="40"
                    cy="40"
                    r="30"
                    fill="transparent"
                    stroke="#10B981"
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeOffset}
                    strokeLinecap="round"
                    className="transition-all duration-700"
                  />
                </svg>

                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-extrabold text-slate-900 leading-none">
                    {complianceScore}%
                  </span>
                  <span className="text-[9px] font-bold text-slate-500 mt-0.5">Compliant</span>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-1.5 text-xs flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-600 font-medium text-[11px]">
                    <span className="size-2 rounded-full bg-emerald-500 inline-block" />
                    <span>Compliant</span>
                  </div>
                  <span className="font-bold text-slate-900 text-xs">{compliantCount}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-600 font-medium text-[11px]">
                    <span className="size-2 rounded-full bg-amber-500 inline-block" />
                    <span>Pending</span>
                  </div>
                  <span className="font-bold text-slate-900 text-xs">{pendingCount}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-600 font-medium text-[11px]">
                    <span className="size-2 rounded-full bg-rose-500 inline-block" />
                    <span>Overdue</span>
                  </div>
                  <span className="font-bold text-slate-900 text-xs">{overdueCount}</span>
                </div>
              </div>
            </div>
          </div>

          <Link
            href="/client/applications"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 hover:text-amber-700 transition-colors pt-2 border-t border-slate-100"
          >
            <span>View compliance report</span>
            <ArrowRight className="size-3" />
          </Link>
        </div>

        {/* CARD 3: DARK 3D METALLIC GOLD SHIELD EXECUTIVE CTA */}
        <div className="bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0B132B] rounded-2xl p-4 sm:p-5 shadow-md relative overflow-hidden flex flex-col justify-between text-white border border-slate-800 md:col-span-2 lg:col-span-1">
          <div className="absolute -top-12 -right-12 size-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 size-36 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-2 max-w-[65%] sm:max-w-[70%]">
            <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-white leading-tight">
              Stay compliant, stay ahead.
            </h3>
            <p className="text-[11px] text-slate-300 leading-relaxed font-normal">
              Direct access to registered statutory advocates, eCitizen filings, and verified KRA compliance certificates.
            </p>
          </div>

          {/* 3D METALLIC GOLD SHIELD ARTWORK */}
          <div className="absolute right-1 bottom-2 w-24 sm:w-32 h-28 sm:h-36 z-0 pointer-events-none opacity-95">
            <svg viewBox="0 0 160 180" className="w-full h-full drop-shadow-xl">
              <defs>
                <linearGradient id="shieldGoldGradClient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#FDE047" />
                  <stop offset="30%" stopColor="#D4AF37" />
                  <stop offset="70%" stopColor="#CA8A04" />
                  <stop offset="100%" stopColor="#854D0E" />
                </linearGradient>
                <linearGradient id="folderDarkGradClient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#334155" />
                  <stop offset="100%" stopColor="#1E293B" />
                </linearGradient>
              </defs>

              <rect x="50" y="20" width="90" height="120" rx="8" fill="url(#folderDarkGradClient)" stroke="#475569" strokeWidth="1.5" transform="rotate(8 95 80)" />

              <path
                d="M 50 45 C 50 45, 80 35, 80 35 C 80 35, 110 45, 110 45 C 110 85, 95 125, 80 140 C 65 125, 50 85, 50 45 Z"
                fill="url(#shieldGoldGradClient)"
                stroke="#FEF08A"
                strokeWidth="2"
              />

              <path
                d="M 68 76 L 76 84 L 92 68"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="relative z-10 pt-4">
            <Link href="/client/services">
              <button className="bg-gradient-to-r from-[#C5A059] to-[#D4AF37] hover:from-[#b49049] hover:to-[#c39e26] text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-md transition-all flex items-center gap-1.5 transform hover:-translate-y-0.5">
                <span>Explore Service Catalog</span>
                <ArrowRight className="size-3.5" />
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
