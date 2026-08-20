"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  AlertCircle,
  CheckCircle2,
  Bell,
  Plus,
  ArrowRight,
  Clock,
  ShieldCheck,
  TrendingUp,
  Folder,
  ClipboardList,
  Calendar,
  ChevronDown,
  FileCheck,
  Zap,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { applicationsApi } from "@/lib/api/applications";
import { useAuth } from "@/lib/auth/auth-context";

// Helper to construct smooth SVG Bezier paths from dynamic data points
function createSmoothPath(points: { x: number; y: number }[]) {
  if (!points || points.length === 0) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    const cp1x = curr.x + (next.x - curr.x) / 2;
    const cp1y = curr.y;
    const cp2x = curr.x + (next.x - curr.x) / 2;
    const cp2y = next.y;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
  }
  return d;
}

// Relative time formatter for activity timestamps
function formatRelativeTime(dateString: string) {
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

export default function ClientDashboardPage() {
  const { user, client } = useAuth();
  const [timeRange, setTimeRange] = useState("Last 6 Months");

  // Authoritative Backend Dashboard API Query
  const {
    data: overview,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["client-dashboard-overview"],
    queryFn: () => applicationsApi.getClientDashboardOverview(),
    refetchOnWindowFocus: true,
  });

  const clientData = overview?.client;
  const summary = overview?.summary;
  const chartTimeline = overview?.chartTimeline || [];
  const recentActivity = overview?.recentActivity || [];
  const upcomingDeadlines = overview?.upcomingDeadlines || [];
  const complianceHealth = overview?.complianceHealth;

  const displayName = clientData?.fullName?.split(" ")[0] || client?.fullName?.split(" ")[0] || user?.email?.split("@")[0] || "Client";

  // Dynamic KPI Values
  const activeFilingsCount = summary?.activeFilingsCount ?? 0;
  const actionItemsCount = summary?.actionItemsCount ?? 0;
  const totalAppsCount = summary?.totalApplications ?? 0;
  const unreadNotifs = summary?.unreadNotificationsCount ?? 0;
  const activeFilingsProgress = summary?.activeFilingsProgressPercent ?? 0;

  // Dynamic Compliance Values
  const complianceScore = complianceHealth?.scorePercent ?? 100;
  const compliantCount = complianceHealth?.compliantCount ?? 0;
  const pendingCount = complianceHealth?.pendingCount ?? 0;
  const overdueCount = complianceHealth?.overdueCount ?? 0;
  const attentionCount = complianceHealth?.attentionCount ?? 0;

  // Donut SVG circumference calculation (r = 30 => circumference = 188.5)
  const circumference = 188.5;
  const strokeOffset = circumference - (complianceScore / 100) * circumference;

  // Chart coordinate calculations (viewBox 0 0 600 150)
  const chartMaxVal = Math.max(
    10,
    ...chartTimeline.flatMap((item: any) => [
      item.activeFilings || 0,
      item.completed || 0,
      item.actionItems || 0,
      item.rejected || 0,
    ])
  );

  const activePoints = chartTimeline.map((item: any, idx: number) => ({
    x: 60 + idx * 100,
    y: 135 - ((item.activeFilings || 0) / chartMaxVal) * 115,
  }));

  const completedPoints = chartTimeline.map((item: any, idx: number) => ({
    x: 60 + idx * 100,
    y: 135 - ((item.completed || 0) / chartMaxVal) * 115,
  }));

  const actionPoints = chartTimeline.map((item: any, idx: number) => ({
    x: 60 + idx * 100,
    y: 135 - ((item.actionItems || 0) / chartMaxVal) * 115,
  }));

  const rejectedPoints = chartTimeline.map((item: any, idx: number) => ({
    x: 60 + idx * 100,
    y: 135 - ((item.rejected || 0) / chartMaxVal) * 115,
  }));

  const activePathD = createSmoothPath(activePoints);
  const completedPathD = createSmoothPath(completedPoints);
  const actionPathD = createSmoothPath(actionPoints);
  const rejectedPathD = createSmoothPath(rejectedPoints);

  const activeAreaD = activePoints.length > 0
    ? `${activePathD} L ${activePoints[activePoints.length - 1].x} 135 L ${activePoints[0].x} 135 Z`
    : "";

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-4 sm:p-5 lg:p-6 space-y-4 max-w-[1550px] mx-auto font-sans">
      {/* ------------------------------------------------------------------ */}
      {/* 1. COMPACT HEADER SECTION */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-center justify-between gap-4 pb-1 border-b border-slate-200/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Welcome back, {displayName} 👋
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Executive dashboard • Track statutory filings, requirements, and compliance in real-time.
          </p>
        </div>

        {/* Compact CTA Action Button */}
        <Link href="/client/services">
          <button className="bg-gradient-to-r from-[#C5A059] to-[#D4AF37] hover:from-[#b49049] hover:to-[#c39e26] text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-1.5 shrink-0">
            <Plus className="size-3.5 stroke-[3]" />
            <span>New Statutory Filing</span>
          </button>
        </Link>
      </div>

      {/* ERROR FEEDBACK BANNER */}
      {isError && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center justify-between text-rose-800 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 text-rose-600 shrink-0" />
            <span>Unable to load latest dashboard metrics from backend.</span>
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1 bg-white border border-rose-300 text-rose-700 px-2.5 py-1 rounded-lg hover:bg-rose-100 transition-colors"
          >
            <RefreshCw className="size-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 2. FOUR KPI CARDS (HIGH DENSITY / COMPACT) */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* CARD 1: ACTIVE FILINGS */}
        <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between space-y-2 hover:border-amber-300/60 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                ACTIVE FILINGS
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-0.5">
                {isLoading ? <div className="h-7 w-12 bg-slate-100 animate-pulse rounded-md mt-0.5" /> : activeFilingsCount}
              </div>
            </div>
            <div className="size-9 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
              <Folder className="size-4 text-amber-600 fill-amber-500/20" />
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Progressing in registry</div>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, activeFilingsProgress))}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-slate-600">{activeFilingsProgress}%</span>
            </div>
          </div>
        </div>

        {/* CARD 2: ACTION ITEMS */}
        <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between space-y-2 hover:border-indigo-300/60 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                ACTION ITEMS
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-0.5">
                {isLoading ? <div className="h-7 w-12 bg-slate-100 animate-pulse rounded-md mt-0.5" /> : actionItemsCount}
              </div>
            </div>
            <div className="size-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <ClipboardList className="size-4 text-indigo-600" />
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Requires your submission</div>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${actionItemsCount > 0 ? 100 : 0}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-slate-600">{actionItemsCount > 0 ? "Pending" : "0"}</span>
            </div>
          </div>
        </div>

        {/* CARD 3: TOTAL APPLICATIONS */}
        <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between space-y-2 hover:border-emerald-300/60 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                TOTAL APPLICATIONS
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-0.5">
                {isLoading ? <div className="h-7 w-12 bg-slate-100 animate-pulse rounded-md mt-0.5" /> : totalAppsCount}
              </div>
            </div>
            <div className="size-9 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <TrendingUp className="size-4 text-emerald-600" />
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">All-time statutory records</div>
            <div className="flex items-center gap-1 mt-1 text-[11px]">
              <span className="font-semibold text-slate-400">Total lifetime client records</span>
            </div>
          </div>
        </div>

        {/* CARD 4: UNREAD ALERTS */}
        <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between space-y-2 hover:border-rose-300/60 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                UNREAD ALERTS
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-0.5">
                {isLoading ? <div className="h-7 w-12 bg-slate-100 animate-pulse rounded-md mt-0.5" /> : unreadNotifs}
              </div>
            </div>
            <div className="size-9 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shrink-0">
              <Bell className="size-4 text-rose-500" />
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Registry &amp; status notices</div>
            <div className="flex items-center gap-1 mt-1 text-[11px]">
              <span className="font-semibold text-slate-400">In-app notifications</span>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. MIDDLE SECTION: ANALYTICS & RECENT ACTIVITY (COMPACT) */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
        {/* LEFT 2/3: FILING OVERVIEW ANALYTICS CHART */}
        <div className="lg:col-span-2 bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                <FileCheck className="size-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-none">Filing Overview</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Track the progress of your statutory filings</p>
              </div>
            </div>

            <button
              onClick={() => setTimeRange(timeRange === "Last 6 Months" ? "Last 12 Months" : "Last 6 Months")}
              className="text-[11px] font-semibold text-slate-700 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1"
            >
              <span>{timeRange}</span>
              <ChevronDown className="size-3 text-slate-400" />
            </button>
          </div>

          {/* DYNAMIC COMPACT SVG LINE CHART */}
          <div className="relative pt-1 pb-2">
            <div className="w-full h-48 sm:h-52 relative">
              <svg viewBox="0 0 600 150" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EAB308" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#EAB308" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Grid Lines */}
                {[0, 30, 60, 90, 120, 150].map((y, idx) => {
                  const valLabel = Math.round(chartMaxVal - (idx / 5) * chartMaxVal);
                  return (
                    <g key={idx}>
                      <line x1="30" y1={y} x2="590" y2={y} stroke="#F1F5F9" strokeWidth="1.5" strokeDasharray="3 3" />
                      <text x="18" y={y + 3} fill="#94A3B8" fontSize="9" fontWeight="600" textAnchor="end">
                        {valLabel}
                      </text>
                    </g>
                  );
                })}

                {/* Month X Labels */}
                {chartTimeline.map((item: any, i: number) => (
                  <text key={i} x={60 + i * 100} y="148" fill="#64748B" fontSize="10" fontWeight="600" textAnchor="middle">
                    {item.month}
                  </text>
                ))}

                {/* Area under Active Filings curve */}
                {activeAreaD && <path d={activeAreaD} fill="url(#goldGradient)" />}

                {/* Lines */}
                {activePathD && <path d={activePathD} fill="none" stroke="#EAB308" strokeWidth="2.5" strokeLinecap="round" />}
                {completedPathD && <path d={completedPathD} fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" />}
                {actionPathD && <path d={actionPathD} fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" />}
                {rejectedPathD && <path d={rejectedPathD} fill="none" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />}

                {/* Active Filing Circles */}
                {activePoints.map((pt, i) => (
                  <circle key={`active-${i}`} cx={pt.x} cy={pt.y} r="3.5" fill="#EAB308" stroke="#FFFFFF" strokeWidth="1.5" />
                ))}

                {/* Completed Circles */}
                {completedPoints.map((pt, i) => (
                  <circle key={`completed-${i}`} cx={pt.x} cy={pt.y} r="3" fill="#22C55E" stroke="#FFFFFF" strokeWidth="1" />
                ))}
              </svg>
            </div>
          </div>

          {/* BOTTOM LEGEND */}
          <div className="flex flex-wrap items-center justify-center gap-5 pt-1.5 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
              <span className="size-2 rounded-full bg-amber-500 inline-block" />
              <span>Active Filings</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
              <span className="size-2 rounded-full bg-emerald-500 inline-block" />
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
              <span className="size-2 rounded-full bg-blue-500 inline-block" />
              <span>Action Items</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
              <span className="size-2 rounded-full bg-rose-500 inline-block" />
              <span>Rejected</span>
            </div>
          </div>
        </div>

        {/* RIGHT 1/3: RECENT ACTIVITY */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-3.5">
              <div className="size-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                <Zap className="size-4 fill-amber-500/20" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-none">Recent Activity</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Latest updates on your filings</p>
              </div>
            </div>

            {/* STACKED REAL ACTIVITY LIST */}
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-9 bg-slate-100 animate-pulse rounded-lg" />
                ))}
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs">
                <p className="font-semibold">No recent activity recorded</p>
                <p className="text-[10px] mt-0.5">Activities will appear here as your filings progress</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.slice(0, 3).map((act: any, idx: number) => {
                  const isLast = idx === Math.min(2, recentActivity.length - 1);
                  return (
                    <div
                      key={act.id || idx}
                      className={`flex items-start justify-between gap-2.5 ${!isLast ? "pb-2.5 border-b border-slate-100" : ""}`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div
                          className={`size-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                            act.type === "APPROVED"
                              ? "bg-emerald-500/10 text-emerald-600"
                              : act.type === "REJECTED"
                              ? "bg-rose-500/10 text-rose-600"
                              : act.type === "PAYMENT"
                              ? "bg-amber-500/10 text-amber-600"
                              : "bg-blue-500/10 text-blue-600"
                          }`}
                        >
                          {act.type === "APPROVED" ? (
                            <CheckCircle2 className="size-3.5" />
                          ) : act.type === "REJECTED" ? (
                            <XCircle className="size-3.5" />
                          ) : act.type === "PAYMENT" ? (
                            <Clock className="size-3.5" />
                          ) : (
                            <FileText className="size-3.5" />
                          )}
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-bold text-slate-900 leading-tight truncate">{act.title}</div>
                          <div className="text-[10px] text-slate-500 font-medium truncate mt-0.5">{act.subtitle}</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                        {formatRelativeTime(act.timestamp)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <Link
            href="/client/applications"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 hover:text-amber-700 transition-colors pt-3 mt-1 border-t border-slate-100"
          >
            <span>View all activity</span>
            <ArrowRight className="size-3" />
          </Link>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 4. BOTTOM SECTION: 3 EQUAL COMPACT CARDS */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
        {/* CARD 1: UPCOMING DEADLINES */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2.5 mb-3.5">
              <div className="size-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                <Calendar className="size-4 text-amber-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-none">Upcoming Deadlines</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Important dates to keep in mind</p>
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-2.5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 bg-slate-100 animate-pulse rounded-lg" />
                ))}
              </div>
            ) : upcomingDeadlines.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs">
                <p className="font-semibold">No upcoming deadlines</p>
                <p className="text-[10px] mt-0.5">All statutory deadlines are up to date</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {upcomingDeadlines.slice(0, 3).map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between gap-2.5 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="bg-amber-50 border border-amber-200/80 rounded-lg px-2 py-1 text-center shrink-0 min-w-[42px]">
                        <div className="text-xs font-extrabold text-slate-900 leading-none">{item.day}</div>
                        <div className="text-[9px] font-bold text-amber-600 mt-0.5">{item.month}</div>
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
            className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 hover:text-amber-700 transition-colors pt-2.5 border-t border-slate-100"
          >
            <span>View all deadlines</span>
            <ArrowRight className="size-3" />
          </Link>
        </div>

        {/* CARD 2: COMPLIANCE HEALTH */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="size-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="size-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-none">Compliance Health</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Your compliance status at a glance</p>
              </div>
            </div>

            {/* DONUT CHART & BREAKDOWN */}
            <div className="flex items-center justify-between gap-3 py-1">
              {/* Donut Chart */}
              <div className="relative size-28 sm:size-32 shrink-0 flex items-center justify-center">
                <svg viewBox="0 0 80 80" className="w-full h-full transform -rotate-90">
                  <circle cx="40" cy="40" r="30" fill="transparent" stroke="#F1F5F9" strokeWidth="8" />
                  <circle
                    cx="40"
                    cy="40"
                    r="30"
                    fill="transparent"
                    stroke="#22C55E"
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeOffset}
                    strokeLinecap="round"
                    className="transition-all duration-700"
                  />
                </svg>

                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-extrabold text-slate-900 leading-none">
                    {isLoading ? "—" : `${complianceScore}%`}
                  </span>
                  <span className="text-[9px] font-bold text-slate-500 mt-0.5">Compliant</span>
                </div>
              </div>

              {/* Breakdown Legend List */}
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

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-600 font-medium text-[11px]">
                    <span className="size-2 rounded-full bg-blue-500 inline-block" />
                    <span>Attention</span>
                  </div>
                  <span className="font-bold text-slate-900 text-xs">{attentionCount}</span>
                </div>
              </div>
            </div>
          </div>

          <Link
            href="/client/applications"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 hover:text-amber-700 transition-colors pt-2.5 border-t border-slate-100"
          >
            <span>View compliance report</span>
            <ArrowRight className="size-3" />
          </Link>
        </div>

        {/* CARD 3: DARK SERVICE CTA WITH 3D SHIELD ARTWORK */}
        <div className="bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0B132B] rounded-xl p-4 sm:p-5 shadow-md relative overflow-hidden flex flex-col justify-between md:col-span-2 lg:col-span-1 text-white border border-slate-800">
          <div className="absolute -top-12 -right-12 size-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 size-36 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-2 max-w-[65%] sm:max-w-[70%]">
            <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-white leading-tight">
              Stay compliant, stay ahead.
            </h3>
            <p className="text-[11px] text-slate-300 leading-relaxed font-normal">
              We&apos;ll help you meet every deadline and requirement with ease.
            </p>
          </div>

          {/* 3D METALLIC GOLD SHIELD ARTWORK */}
          <div className="absolute right-1 bottom-2 w-24 sm:w-32 h-28 sm:h-36 z-0 pointer-events-none opacity-95">
            <svg viewBox="0 0 160 180" className="w-full h-full drop-shadow-xl">
              <defs>
                <linearGradient id="shieldGoldGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#FDE047" />
                  <stop offset="30%" stopColor="#D4AF37" />
                  <stop offset="70%" stopColor="#CA8A04" />
                  <stop offset="100%" stopColor="#854D0E" />
                </linearGradient>
                <linearGradient id="folderDarkGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#334155" />
                  <stop offset="100%" stopColor="#1E293B" />
                </linearGradient>
                <linearGradient id="docPaperGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#94A3B8" />
                  <stop offset="100%" stopColor="#475569" />
                </linearGradient>
              </defs>

              <rect x="50" y="20" width="90" height="120" rx="8" fill="url(#folderDarkGrad)" stroke="#475569" strokeWidth="1.5" transform="rotate(8 95 80)" />
              <rect x="40" y="30" width="85" height="115" rx="8" fill="url(#docPaperGrad)" stroke="#64748B" strokeWidth="1.5" transform="rotate(3 82 87)" />

              <path
                d="M 50 45 C 50 45, 80 35, 80 35 C 80 35, 110 45, 110 45 C 110 85, 95 125, 80 140 C 65 125, 50 85, 50 45 Z"
                fill="url(#shieldGoldGrad)"
                stroke="#FEF08A"
                strokeWidth="2"
              />

              <path
                d="M 58 52 C 58 52, 80 44, 80 44 C 80 44, 102 52, 102 52 C 102 85, 90 118, 80 128 C 70 118, 58 85, 58 52 Z"
                fill="none"
                stroke="#FEF08A"
                strokeWidth="1"
                opacity="0.6"
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
