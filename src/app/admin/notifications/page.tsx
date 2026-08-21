"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  CheckCheck,
  Sliders,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Calendar,
  Eye,
  RefreshCw,
  SlidersHorizontal,
  User,
  Clock,
  ShieldAlert,
} from "lucide-react";
import { notificationsApi } from "@/lib/api/notifications";
import { format, parseISO, isSameDay, subDays, startOfMonth, endOfDay, startOfDay } from "date-fns";
import type { Notification } from "@/types";

type SeverityLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export default function AdminNotificationsPage() {
  const queryClient = useQueryClient();

  // State Management
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL"); // ALL | UNREAD | READ
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [datePreset, setDatePreset] = useState<string>("ALL");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  // Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Layout Toggle State
  const [showChannelsConfig, setShowChannelsConfig] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null);

  // 1. Fetch live administrative notifications
  const {
    data: notifications = [],
    isLoading: isNotifsLoading,
    error: notifsError,
    refetch: refetchNotifs,
    isFetching,
  } = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: () => notificationsApi.getNotifications(),
  });

  // 2. Fetch live notification preferences
  const {
    data: preferences,
    isLoading: isPrefsLoading,
  } = useQuery({
    queryKey: ["admin-notification-preferences"],
    queryFn: () => notificationsApi.getPreferences(),
  });

  // 3. Mark single notification as read / acknowledge
  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
    },
  });

  // 4. Mark all as read
  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
    },
  });

  // 5. Update notification preferences
  const updatePrefMutation = useMutation({
    mutationFn: (payload: {
      emailEnabled?: boolean;
      smsEnabled?: boolean;
      inAppEnabled?: boolean;
      marketingEnabled?: boolean;
    }) => notificationsApi.updatePreferences(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notification-preferences"] });
    },
  });

  // Helper: Infer severity level from notification properties
  const getNotificationSeverity = (notif: Notification): SeverityLevel => {
    if (notif.metadata && typeof notif.metadata.severity === "string") {
      const sev = (notif.metadata.severity as string).toUpperCase();
      if (["CRITICAL", "HIGH", "MEDIUM", "LOW"].includes(sev)) {
        return sev as SeverityLevel;
      }
    }
    const typeUpper = (notif.type || "").toUpperCase();
    const titleUpper = (notif.title || "").toUpperCase();

    if (
      typeUpper.includes("BREACH") ||
      typeUpper.includes("CRITICAL") ||
      typeUpper.includes("SECURITY") ||
      titleUpper.includes("BREACH") ||
      titleUpper.includes("SECURITY")
    ) {
      return "CRITICAL";
    }
    if (
      typeUpper.includes("SLA") ||
      typeUpper.includes("STATUTORY") ||
      typeUpper.includes("OVERDUE") ||
      titleUpper.includes("SLA") ||
      titleUpper.includes("OVERDUE")
    ) {
      return "HIGH";
    }
    if (
      typeUpper.includes("REGISTRATION") ||
      typeUpper.includes("PAYMENT") ||
      typeUpper.includes("DOCUMENT") ||
      titleUpper.includes("REGISTRATION") ||
      titleUpper.includes("PAYMENT")
    ) {
      return "MEDIUM";
    }
    return "LOW";
  };

  // Helper: Extract Client identifier / name
  const getClientInfo = (notif: Notification): string => {
    if (notif.metadata) {
      if (typeof notif.metadata.clientName === "string" && notif.metadata.clientName) {
        return notif.metadata.clientName;
      }
      if (typeof notif.metadata.clientCompany === "string" && notif.metadata.clientCompany) {
        return notif.metadata.clientCompany;
      }
      if (typeof notif.metadata.clientId === "string" && notif.metadata.clientId) {
        return `Client ${notif.metadata.clientId.slice(0, 8)}`;
      }
    }
    if (notif.clientId) {
      return `Client ${notif.clientId.slice(0, 8)}`;
    }
    return "System / N/A";
  };

  // Filter Logic Execution
  const filteredNotifications = useMemo(() => {
    const now = new Date();

    return notifications.filter((notif) => {
      // 1. Text Search Filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const clientInfo = getClientInfo(notif).toLowerCase();
        const titleMatches = notif.title.toLowerCase().includes(query);
        const msgMatches = notif.message.toLowerCase().includes(query);
        const typeMatches = notif.type.toLowerCase().includes(query);
        const clientMatches = clientInfo.includes(query);
        if (!titleMatches && !msgMatches && !typeMatches && !clientMatches) {
          return false;
        }
      }

      // 2. Status Filter
      if (statusFilter === "UNREAD" && notif.status === "READ") return false;
      if (statusFilter === "READ" && notif.status !== "READ") return false;

      // 3. Type Filter
      if (typeFilter !== "ALL") {
        const notifType = (notif.type || "").toUpperCase();
        if (typeFilter === "NEW_REGISTRATION" && !notifType.includes("REGISTRATION")) return false;
        if (typeFilter === "SLA_BREACH" && !notifType.includes("SLA") && !notifType.includes("BREACH")) return false;
        if (typeFilter === "STATUTORY" && !notifType.includes("STATUTORY") && !notifType.includes("DOCUMENT")) return false;
        if (typeFilter === "PAYMENT" && !notifType.includes("PAYMENT") && !notifType.includes("INVOICE")) return false;
        if (typeFilter === "SYSTEM" && !notifType.includes("SYSTEM")) return false;
        if (typeFilter === "SECURITY" && !notifType.includes("SECURITY")) return false;
        if (
          typeFilter === "OTHER" &&
          (notifType.includes("REGISTRATION") ||
            notifType.includes("SLA") ||
            notifType.includes("STATUTORY") ||
            notifType.includes("PAYMENT") ||
            notifType.includes("SYSTEM") ||
            notifType.includes("SECURITY"))
        ) {
          return false;
        }
      }

      // 4. Severity Filter
      const severity = getNotificationSeverity(notif);
      if (severityFilter !== "ALL" && severity !== severityFilter) {
        return false;
      }

      // 5. Date Filter
      if (notif.createdAt) {
        try {
          const createdAtDate = parseISO(notif.createdAt);

          if (datePreset === "TODAY") {
            if (!isSameDay(createdAtDate, now)) return false;
          } else if (datePreset === "YESTERDAY") {
            const yesterday = subDays(now, 1);
            if (!isSameDay(createdAtDate, yesterday)) return false;
          } else if (datePreset === "LAST_7_DAYS") {
            const sevenDaysAgo = subDays(now, 7);
            if (createdAtDate < startOfDay(sevenDaysAgo)) return false;
          } else if (datePreset === "LAST_30_DAYS") {
            const thirtyDaysAgo = subDays(now, 30);
            if (createdAtDate < startOfDay(thirtyDaysAgo)) return false;
          } else if (datePreset === "THIS_MONTH") {
            const monthStart = startOfMonth(now);
            if (createdAtDate < monthStart) return false;
          } else if (datePreset === "CUSTOM") {
            if (fromDate) {
              const fromParsed = startOfDay(parseISO(fromDate));
              if (createdAtDate < fromParsed) return false;
            }
            if (toDate) {
              const toParsed = endOfDay(parseISO(toDate));
              if (createdAtDate > toParsed) return false;
            }
          }
        } catch {
          // If date parsing fails, keep in list
        }
      }

      return true;
    });
  }, [notifications, searchTerm, statusFilter, typeFilter, severityFilter, datePreset, fromDate, toDate]);

  // Check if any filters are active
  const isFilterActive =
    Boolean(searchTerm.trim()) ||
    statusFilter !== "ALL" ||
    typeFilter !== "ALL" ||
    severityFilter !== "ALL" ||
    datePreset !== "ALL" ||
    Boolean(fromDate) ||
    Boolean(toDate);

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("ALL");
    setTypeFilter("ALL");
    setSeverityFilter("ALL");
    setDatePreset("ALL");
    setFromDate("");
    setToDate("");
    setPage(1);
  };

  // Pagination Computations
  const totalCount = filteredNotifications.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedNotifications = filteredNotifications.slice(startIndex, startIndex + pageSize);

  const unreadCount = notifications.filter((n) => n.status !== "READ").length;

  // Render Severity Badge
  const renderSeverityBadge = (severity: SeverityLevel) => {
    switch (severity) {
      case "CRITICAL":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            Critical
          </span>
        );
      case "HIGH":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-orange-50 text-orange-700 border border-orange-200">
            <AlertTriangle className="w-3 h-3 text-orange-600" />
            High
          </span>
        );
      case "MEDIUM":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
            <Info className="w-3 h-3 text-amber-600" />
            Medium
          </span>
        );
      case "LOW":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
            <Info className="w-3 h-3 text-slate-400" />
            Low
          </span>
        );
    }
  };

  // Format Date & Time cleanly
  const formatDateTimeDisplay = (isoString?: string) => {
    if (!isoString) return "N/A";
    try {
      const d = parseISO(isoString);
      return format(d, "dd MMM yyyy · HH:mm");
    } catch {
      return isoString;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-4 sm:p-5 lg:p-6 space-y-4 max-w-[1550px] mx-auto font-sans">
      {/* ==================================================================== */}
      {/* 1. PAGE HEADER */}
      {/* ==================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/60">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-700 shrink-0">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              System Telemetry &amp; Administrative Notifications
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Live operational event stream, statutory queue alerts, SLA escalations, and automated channel routing preferences.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          {/* Toggle Officer Alert Channels Collapsible */}
          <button
            onClick={() => setShowChannelsConfig(!showChannelsConfig)}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-xs flex items-center gap-1.5 transition-all"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            <span>{showChannelsConfig ? "Hide Channels" : "Officer Channels"}</span>
            {showChannelsConfig ? (
              <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>

          {/* Mark All Read Action */}
          {unreadCount > 0 && (
            <button
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              className="bg-gradient-to-r from-[#C5A059] to-[#D4AF37] hover:from-[#b49049] hover:to-[#c39e26] text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark All Read ({unreadCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. SECONDARY: OFFICER ALERT ROUTING CHANNELS (COLLAPSIBLE CONFIG PANEL) */}
      {/* ==================================================================== */}
      {showChannelsConfig && (
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-3 transition-all animate-in fade-in zoom-in-98 duration-150">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200/60">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Officer Alert Routing Channels Configuration
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Configure dispatch channels for statutory QC reviews, SLA risks, and registry changes.
            </span>
          </div>

          {isPrefsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 bg-slate-100 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {/* Channel 1 */}
              <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-all">
                <input
                  type="checkbox"
                  checked={preferences?.inAppEnabled ?? true}
                  onChange={(e) => updatePrefMutation.mutate({ inAppEnabled: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500/20"
                />
                <div>
                  <span className="font-bold text-slate-800 text-xs block">In-App Command Feed</span>
                  <span className="text-[10px] text-slate-500 block font-medium leading-tight">
                    Direct alerts on administrative navigation and dashboard.
                  </span>
                </div>
              </label>

              {/* Channel 2 */}
              <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-all">
                <input
                  type="checkbox"
                  checked={preferences?.emailEnabled ?? true}
                  onChange={(e) => updatePrefMutation.mutate({ emailEnabled: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500/20"
                />
                <div>
                  <span className="font-bold text-slate-800 text-xs block">Transactional Email Alerts</span>
                  <span className="text-[10px] text-slate-500 block font-medium leading-tight">
                    Dispatch critical SLA breaches to officer email.
                  </span>
                </div>
              </label>

              {/* Channel 3 */}
              <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-all">
                <input
                  type="checkbox"
                  checked={preferences?.smsEnabled ?? false}
                  onChange={(e) => updatePrefMutation.mutate({ smsEnabled: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500/20"
                />
                <div>
                  <span className="font-bold text-slate-800 text-xs block">SMS Emergency Broadcasts</span>
                  <span className="text-[10px] text-slate-500 block font-medium leading-tight">
                    Safaricom / Africa&apos;s Talking SMS for critical incidents.
                  </span>
                </div>
              </label>

              {/* Channel 4 */}
              <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-all">
                <input
                  type="checkbox"
                  checked={preferences?.marketingEnabled ?? false}
                  onChange={(e) => updatePrefMutation.mutate({ marketingEnabled: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500/20"
                />
                <div>
                  <span className="font-bold text-slate-800 text-xs block">Gazette &amp; Regulatory Digests</span>
                  <span className="text-[10px] text-slate-500 block font-medium leading-tight">
                    Weekly Kenyan statutory registry bulletins &amp; fee updates.
                  </span>
                </div>
              </label>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* 3. COMPACT TOOLBAR / FILTER CONTROL BAR */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-3">
        {/* Top Row: Search & Quick Date Preset */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Field */}
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search notifications, client name, client ID, title, or alert type..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-8 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Date Presets & Refresh */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
              Date:
            </span>
            {[
              { id: "ALL", label: "All Time" },
              { id: "TODAY", label: "Today" },
              { id: "YESTERDAY", label: "Yesterday" },
              { id: "LAST_7_DAYS", label: "Last 7 Days" },
              { id: "LAST_30_DAYS", label: "Last 30 Days" },
              { id: "THIS_MONTH", label: "This Month" },
              { id: "CUSTOM", label: "Custom Range" },
            ].map((preset) => (
              <button
                key={preset.id}
                onClick={() => {
                  setDatePreset(preset.id);
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${
                  datePreset === preset.id
                    ? "bg-amber-500 text-white border-amber-600 shadow-2xs"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {preset.label}
              </button>
            ))}

            <button
              onClick={() => refetchNotifs()}
              disabled={isFetching}
              className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 transition-all shrink-0 ml-1"
              title="Refresh Notifications"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-amber-600" : ""}`} />
            </button>
          </div>
        </div>

        {/* Custom Date Pickers (Shown when CUSTOM selected) */}
        {datePreset === "CUSTOM" && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-bold text-slate-500">From:</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPage(1);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:border-amber-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-bold text-slate-500">To:</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setPage(1);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:border-amber-500"
              />
            </div>
          </div>
        )}

        {/* Dropdown Filters Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 flex-1">
            {/* Status Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="UNREAD">Unread Only ({unreadCount})</option>
                <option value="READ">Read / Acknowledged</option>
              </select>
            </div>

            {/* Alert Type Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Alert Type
              </label>
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">All Alert Types</option>
                <option value="NEW_REGISTRATION">New Registration</option>
                <option value="SLA_BREACH">SLA Breach</option>
                <option value="STATUTORY">Statutory Alert</option>
                <option value="PAYMENT">Payment</option>
                <option value="SYSTEM">System</option>
                <option value="SECURITY">Security</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            {/* Severity Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Severity
              </label>
              <select
                value={severityFilter}
                onChange={(e) => {
                  setSeverityFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            {/* Clear Filters Action */}
            <div className="flex items-end">
              {isFilterActive && (
                <button
                  onClick={handleClearFilters}
                  className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1 transition-all w-full justify-center"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear Filters</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 4. PRIMARY CONTENT: NOTIFICATION DATA TABLE */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3.5 w-12 text-center">STATUS</th>
                <th className="py-2.5 px-3.5">ALERT DETAILS</th>
                <th className="py-2.5 px-3.5">TYPE</th>
                <th className="py-2.5 px-3.5">CLIENT</th>
                <th className="py-2.5 px-3.5">SEVERITY</th>
                <th className="py-2.5 px-3.5">DATE &amp; TIME</th>
                <th className="py-2.5 px-3.5 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isNotifsLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="inline-flex items-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-amber-600" />
                      <span className="font-semibold text-slate-700">Loading system alerts telemetry...</span>
                    </div>
                  </td>
                </tr>
              ) : notifsError ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="space-y-2">
                      <ShieldAlert className="w-8 h-8 text-rose-500 mx-auto" />
                      <p className="font-bold text-slate-800 text-xs">Failed to load administrative notifications.</p>
                      <button
                        onClick={() => refetchNotifs()}
                        className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200"
                      >
                        Retry
                      </button>
                    </div>
                  </td>
                </tr>
              ) : paginatedNotifications.length === 0 ? (
                /* ----------------------------------------------------------- */
                /* 10. CLEAN EMPTY STATE */
                /* ----------------------------------------------------------- */
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="max-w-sm mx-auto space-y-2">
                      <div className="p-3 rounded-full bg-slate-100 text-slate-400 w-12 h-12 mx-auto flex items-center justify-center">
                        <Bell className="w-6 h-6" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-800">No notifications found</h3>
                      <p className="text-xs text-slate-500 font-medium">
                        {isFilterActive
                          ? "Try adjusting your search query, type, or date filters."
                          : "No administrative queue alerts or telemetry events recorded yet."}
                      </p>
                      {isFilterActive && (
                        <button
                          onClick={handleClearFilters}
                          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold hover:bg-amber-100 transition-all"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Clear Filters</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedNotifications.map((notif: Notification) => {
                  const isUnread = notif.status !== "READ";
                  const severity = getNotificationSeverity(notif);
                  const clientStr = getClientInfo(notif);

                  return (
                    <tr
                      key={notif.id}
                      className={`transition-colors group hover:bg-slate-50/80 ${
                        isUnread ? "bg-amber-50/30" : ""
                      }`}
                    >
                      {/* Status Indicator */}
                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        {isUnread ? (
                          <span
                            className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-amber-100"
                            title="Unread alert"
                          />
                        ) : (
                          <span
                            className="inline-block w-2 h-2 rounded-full bg-slate-300"
                            title="Acknowledged / Read"
                          />
                        )}
                      </td>

                      {/* Alert Details */}
                      <td className="py-3 px-3.5">
                        <div className="flex items-start gap-2.5">
                          <div
                            className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${
                              isUnread ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            <Bell className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div
                              className={`text-xs ${
                                isUnread ? "font-bold text-slate-900" : "font-semibold text-slate-700"
                              }`}
                            >
                              {notif.title}
                            </div>
                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 font-medium">
                              {notif.message}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {notif.type || "SYSTEM_ALERT"}
                        </span>
                      </td>

                      {/* Client */}
                      <td className="py-3 px-3.5 whitespace-nowrap font-medium text-slate-700 text-xs">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{clientStr}</span>
                        </div>
                      </td>

                      {/* Severity */}
                      <td className="py-3 px-3.5 whitespace-nowrap">{renderSeverityBadge(severity)}</td>

                      {/* Date & Time */}
                      <td className="py-3 px-3.5 whitespace-nowrap font-mono text-[11px] text-slate-600 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{formatDateTimeDisplay(notif.createdAt)}</span>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {isUnread ? (
                            <button
                              disabled={markReadMutation.isPending}
                              onClick={() => markReadMutation.mutate(notif.id)}
                              className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold text-xs transition-all shadow-2xs flex items-center gap-1 disabled:opacity-50"
                            >
                              <CheckCheck className="w-3 h-3 text-amber-700" />
                              <span>Acknowledge</span>
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 px-2 py-0.5 rounded bg-slate-50 border border-slate-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Acknowledged
                            </span>
                          )}

                          <button
                            onClick={() => setSelectedNotif(notif)}
                            className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                            title="Inspect notification details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ==================================================================== */}
        {/* 9. PAGINATION BAR */}
        {/* ==================================================================== */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 border-t border-slate-100 bg-slate-50/50">
          <div className="text-xs text-slate-500 font-medium">
            Showing <span className="font-bold text-slate-800">{totalCount > 0 ? startIndex + 1 : 0}</span>–
            <span className="font-bold text-slate-800">{Math.min(startIndex + pageSize, totalCount)}</span> of{" "}
            <span className="font-bold text-amber-700">{totalCount.toLocaleString()}</span> notifications
          </div>

          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1 || isNotifsLoading}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs disabled:opacity-40 shadow-2xs flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2))
                .map((pNum) => (
                  <button
                    key={pNum}
                    onClick={() => setPage(pNum)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all border ${
                      currentPage === pNum
                        ? "bg-amber-500 text-white border-amber-600 shadow-2xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {pNum}
                  </button>
                ))}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages || isNotifsLoading}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs disabled:opacity-40 shadow-2xs flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* OPTIONAL: NOTIFICATION DETAIL INSPECTOR MODAL */}
      {/* ==================================================================== */}
      {selectedNotif && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                  <Bell className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-slate-900">Notification Detail Inspector</h3>
              </div>
              <button
                onClick={() => setSelectedNotif(null)}
                className="p-1 rounded-lg bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-700 border border-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Title</div>
                <div className="font-bold text-slate-900 text-sm mt-0.5">{selectedNotif.title}</div>
              </div>

              <div>
                <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Message Payload</div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium mt-1 leading-relaxed">
                  {selectedNotif.message}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div>
                  <div className="text-[10px] font-extrabold uppercase text-slate-400">Type</div>
                  <div className="font-mono font-bold text-slate-800 text-xs mt-0.5">{selectedNotif.type}</div>
                </div>
                <div>
                  <div className="text-[10px] font-extrabold uppercase text-slate-400">Status</div>
                  <div className="font-bold text-xs mt-0.5">
                    {selectedNotif.status === "READ" ? (
                      <span className="text-emerald-700">READ / ACKNOWLEDGED</span>
                    ) : (
                      <span className="text-amber-700">UNREAD</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-extrabold uppercase text-slate-400">Created At</div>
                  <div className="font-mono text-slate-700 text-xs mt-0.5">
                    {formatDateTimeDisplay(selectedNotif.createdAt)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-extrabold uppercase text-slate-400">Client Info</div>
                  <div className="font-semibold text-slate-800 text-xs mt-0.5">{getClientInfo(selectedNotif)}</div>
                </div>
              </div>

              {selectedNotif.metadata && (
                <div>
                  <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider mb-1">Metadata</div>
                  <pre className="p-3 rounded-xl bg-slate-900 text-emerald-400 text-[11px] font-mono overflow-x-auto max-h-40">
                    {JSON.stringify(selectedNotif.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-200 bg-slate-50">
              {selectedNotif.status !== "READ" && (
                <button
                  onClick={() => {
                    markReadMutation.mutate(selectedNotif.id);
                    setSelectedNotif(null);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-all shadow-xs flex items-center gap-1.5"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Acknowledge Notification</span>
                </button>
              )}
              <button
                onClick={() => setSelectedNotif(null)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
