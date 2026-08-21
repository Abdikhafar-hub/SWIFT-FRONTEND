"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/admin";
import { AuditLog } from "@/types/audit";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  RefreshCw,
  Eye,
  Activity,
  Layers,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Key,
  FileText,
  CreditCard,
  Building2,
  Truck,
  Settings,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Zap,
  UserCheck,
} from "lucide-react";

export default function AdminAuditTrailPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedEntityType, setSelectedEntityType] = useState<string>("ALL");
  const [dateRangePreset, setDateRangePreset] = useState<string>("ALL");
  const [customFrom, setCustomFrom] = useState<string>("");
  const [customTo, setCustomTo] = useState<string>("");

  const [isAutoRefresh, setIsAutoRefresh] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Calculate Date Filters based on Preset
  const getDateParams = () => {
    if (dateRangePreset === "CUSTOM") {
      return { from: customFrom || undefined, to: customTo || undefined };
    }
    const now = new Date();
    if (dateRangePreset === "TODAY") {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return { from: todayStart.toISOString() };
    }
    if (dateRangePreset === "24H") {
      const past24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      return { from: past24h.toISOString() };
    }
    if (dateRangePreset === "7D") {
      const past7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return { from: past7d.toISOString() };
    }
    if (dateRangePreset === "30D") {
      const past30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return { from: past30d.toISOString() };
    }
    return { from: undefined, to: undefined };
  };

  const dateParams = getDateParams();

  // Primary Audit Logs Query
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: [
      "admin-audit-trail",
      page,
      limit,
      debouncedSearch,
      selectedRole,
      selectedCategory,
      selectedStatus,
      selectedEntityType,
      dateRangePreset,
      dateParams.from,
      dateParams.to,
    ],
    queryFn: () =>
      adminApi.getAuditLogs({
        page,
        limit,
        search: debouncedSearch || undefined,
        role: selectedRole !== "ALL" ? selectedRole : undefined,
        category: selectedCategory !== "ALL" ? selectedCategory : undefined,
        status: selectedStatus !== "ALL" ? selectedStatus : undefined,
        entityType: selectedEntityType !== "ALL" ? selectedEntityType : undefined,
        from: dateParams.from,
        to: dateParams.to,
      }),
    refetchInterval: isAutoRefresh ? 10000 : false,
  });

  const paginationObj = data?.pagination || data?.meta;
  const meta = {
    total: paginationObj?.total ?? 0,
    page: paginationObj?.page ?? 1,
    limit: paginationObj?.limit ?? 25,
    totalPages: paginationObj?.totalPages ?? 1,
    hasNextPage: paginationObj
      ? "hasNextPage" in paginationObj
        ? Boolean((paginationObj as any).hasNextPage)
        : (paginationObj.page ?? 1) < (paginationObj.totalPages ?? 1)
      : false,
    hasPrevPage: paginationObj
      ? "hasPreviousPage" in paginationObj
        ? Boolean((paginationObj as any).hasPreviousPage)
        : (paginationObj.page ?? 1) > 1
      : false,
  };
  const logs = data?.items || [];
  const summary = data?.summaryMetrics || {
    totalEvents: 0,
    eventsToday: 0,
    successCount: 0,
    failureCount: 0,
    activeUsersToday: 0,
    loginEventsToday: 0,
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Helper for Status Badge styling
  const renderStatusBadge = (status?: string | null) => {
    const st = (status || "SUCCESS").toUpperCase();
    switch (st) {
      case "SUCCESS":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            SUCCESS
          </span>
        );
      case "FAILURE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            FAILURE
          </span>
        );
      case "WARNING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            WARNING
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Info className="w-3.5 h-3.5 text-blue-600" />
            {st}
          </span>
        );
    }
  };

  // Helper for Category Icon
  const renderCategoryIcon = (category?: string | null) => {
    const cat = (category || "SYSTEM").toUpperCase();
    switch (cat) {
      case "AUTH":
        return <Key className="w-4 h-4 text-amber-600" />;
      case "APPLICATION":
        return <FileText className="w-4 h-4 text-emerald-600" />;
      case "DOCUMENT":
        return <Layers className="w-4 h-4 text-blue-600" />;
      case "QUALITY_CONTROL":
        return <ShieldCheck className="w-4 h-4 text-purple-600" />;
      case "GOVERNMENT":
        return <Building2 className="w-4 h-4 text-indigo-600" />;
      case "INVOICE":
      case "PAYMENT":
      case "REFUND":
      case "FINANCIAL":
        return <CreditCard className="w-4 h-4 text-emerald-600" />;
      case "DELIVERY":
        return <Truck className="w-4 h-4 text-amber-600" />;
      case "SETTINGS":
      case "SECURITY":
        return <Settings className="w-4 h-4 text-slate-500" />;
      default:
        return <Activity className="w-4 h-4 text-slate-500" />;
    }
  };

  // Date Formatting Helper
  const formatDateDisplay = (isoStr: string) => {
    try {
      const parsed = parseISO(isoStr);
      return {
        full: format(parsed, "dd MMM yyyy, HH:mm:ss"),
        relative: formatDistanceToNow(parsed, { addSuffix: true }),
      };
    } catch {
      return { full: isoStr, relative: "" };
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-4 sm:p-5 lg:p-6 space-y-4 max-w-[1550px] mx-auto font-sans">
      {/* ==================================================================== */}
      {/* 1. HEADER SECTION */}
      {/* ==================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/60">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-700 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              Administrative Audit Trail
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Immutable PostgreSQL security ledger and administrative activity monitoring center
            </p>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsAutoRefresh(!isAutoRefresh)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
              isAutoRefresh
                ? "bg-amber-50 text-amber-700 border-amber-300 shadow-xs"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-xs"
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${isAutoRefresh ? "text-amber-600 animate-pulse" : "text-slate-400"}`} />
            <span>{isAutoRefresh ? "Live 10s" : "Auto-Refresh Off"}</span>
          </button>

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="bg-gradient-to-r from-[#C5A059] to-[#D4AF37] hover:from-[#b49049] hover:to-[#c39e26] text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1.5 transform hover:-translate-y-0.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
            <span>Refresh Ledger</span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. REAL-TIME SUMMARY METRICS ROW */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
        {/* Metric 1 */}
        <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-1 hover:border-slate-300 transition-all">
          <div className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
            Total Events
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {summary.totalEvents.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">Immutable records</div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-1 hover:border-amber-300 transition-all">
          <div className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
            Events Today
          </div>
          <div className="text-2xl font-extrabold text-amber-700 tracking-tight">
            {summary.eventsToday.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">Recorded since 00:00</div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-emerald-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-1 hover:border-emerald-300 transition-all">
          <div className="text-[10px] font-extrabold tracking-wider text-emerald-600 uppercase">
            Successful
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 tracking-tight">
            {summary.successCount.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium">Verified actions</div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-rose-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-1 hover:border-rose-300 transition-all">
          <div className="text-[10px] font-extrabold tracking-wider text-rose-600 uppercase">
            Failed / Alerts
          </div>
          <div className="text-2xl font-extrabold text-rose-700 tracking-tight">
            {summary.failureCount.toLocaleString()}
          </div>
          <div className="text-[11px] text-rose-600 font-medium">Security interventions</div>
        </div>

        {/* Metric 5 */}
        <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-1 hover:border-blue-300 transition-all">
          <div className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
            Active Users Today
          </div>
          <div className="text-2xl font-extrabold text-blue-700 tracking-tight">
            {summary.activeUsersToday.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">Unique accounts</div>
        </div>

        {/* Metric 6 */}
        <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-1 hover:border-purple-300 transition-all">
          <div className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
            Logins Today
          </div>
          <div className="text-2xl font-extrabold text-purple-700 tracking-tight">
            {summary.loginEventsToday.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">Auth sessions</div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. FILTER CONTROLS TOOLBAR */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-3">
        {/* Top Row: Search & Date Range Presets */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search actor name, email, action, reference, IP address, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium"
            />
          </div>

          {/* Date Range Presets */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
            {["ALL", "TODAY", "24H", "7D", "30D", "CUSTOM"].map((preset) => (
              <button
                key={preset}
                onClick={() => {
                  setDateRangePreset(preset);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${
                  dateRangePreset === preset
                    ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Range Inputs */}
        {dateRangePreset === "CUSTOM" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">From Date</label>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 font-medium focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">To Date</label>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 font-medium focus:border-amber-500"
              />
            </div>
          </div>
        )}

        {/* Dropdown Filters Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          {/* Category */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Action Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            >
              <option value="ALL">All Categories</option>
              <option value="AUTH">Authentication & Security</option>
              <option value="APPLICATION">Applications & Filings</option>
              <option value="DOCUMENT">Document Vault & Verification</option>
              <option value="QUALITY_CONTROL">Quality Control (QC)</option>
              <option value="GOVERNMENT">Government Processing</option>
              <option value="PAYMENT">Payments & Financial</option>
              <option value="DELIVERY">Delivery & Dispatch</option>
              <option value="SERVICE">Services Catalog</option>
              <option value="SYSTEM">System Operations</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Event Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="FAILURE">FAILURE</option>
              <option value="WARNING">WARNING</option>
              <option value="INFO">INFO</option>
            </select>
          </div>

          {/* Role */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Actor Role</label>
            <select
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">ADMIN</option>
              <option value="CLIENT">CLIENT</option>
            </select>
          </div>

          {/* Entity Type */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Entity Resource</label>
            <select
              value={selectedEntityType}
              onChange={(e) => {
                setSelectedEntityType(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            >
              <option value="ALL">All Entities</option>
              <option value="User">User</option>
              <option value="Client">Client</option>
              <option value="Application">Application</option>
              <option value="Document">Document</option>
              <option value="Payment">Payment / Invoice</option>
              <option value="QualityCheck">QualityCheck</option>
              <option value="GovernmentApplication">GovernmentApplication</option>
              <option value="Delivery">Delivery</option>
              <option value="Service">Service</option>
            </select>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 4. AUDIT LOG LEDGER TABLE */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3.5">ACTION &amp; CATEGORY</th>
                <th className="py-2.5 px-3.5">DESCRIPTION / REF</th>
                <th className="py-2.5 px-3.5">ACTOR</th>
                <th className="py-2.5 px-3.5">IP / USER AGENT</th>
                <th className="py-2.5 px-3.5">DATE &amp; TIME (EAT)</th>
                <th className="py-2.5 px-3.5">STATUS</th>
                <th className="py-2.5 px-3.5 text-right">INSPECT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="inline-flex items-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-amber-600" />
                      <span className="font-semibold text-slate-700">Querying PostgreSQL audit records...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 space-y-1">
                    <ShieldAlert className="w-8 h-8 mx-auto text-slate-400" />
                    <p className="font-bold text-slate-800 text-xs">No audit log records match the selected filters.</p>
                    <p className="text-[11px] text-slate-500">Try resetting search parameters or selecting a broader date range.</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const timeDisp = formatDateDisplay(log.createdAt);
                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => setSelectedLog(log)}
                    >
                      {/* Action & Category */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-slate-100 border border-slate-200 shrink-0">
                            {renderCategoryIcon(log.actionCategory)}
                          </div>
                          <div>
                            <div className="font-mono font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                              {log.action}
                            </div>
                            <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                              {log.actionCategory || log.entityType || log.resource || "SYSTEM"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Description / Reference */}
                      <td className="py-3 px-3.5">
                        <div className="max-w-xs sm:max-w-sm truncate text-slate-800 font-semibold text-[11px]">
                          {log.description || `${log.action} on ${log.entityType || log.resource}`}
                        </div>
                        {(log.entityReference || log.resourceId) && (
                          <div className="font-mono text-[10px] text-amber-700 font-bold truncate">
                            Ref: {log.entityReference || log.resourceId}
                          </div>
                        )}
                      </td>

                      {/* Actor */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="font-semibold text-slate-800 text-[11px]">
                          {log.actorName || log.actorEmail || "System"}
                        </div>
                        {log.actorEmail && (
                          <div className="text-[10px] text-slate-500 truncate font-mono">{log.actorEmail}</div>
                        )}
                        {log.actorRole && (
                          <span
                            className={`inline-block text-[9px] font-extrabold px-1.5 py-0.2 rounded mt-0.5 ${
                              log.actorRole === "ADMIN"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-blue-50 text-blue-700 border border-blue-200"
                            }`}
                          >
                            {log.actorRole}
                          </span>
                        )}
                      </td>

                      {/* IP / User Agent */}
                      <td className="py-3 px-3.5 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        <div>{log.ipAddress || "Internal"}</div>
                        {log.userAgent && (
                          <div className="max-w-[120px] truncate text-[9px] text-slate-400">
                            {log.userAgent}
                          </div>
                        )}
                      </td>

                      {/* Date & Time */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="font-mono text-slate-800 font-bold text-[11px]">{timeDisp.full}</div>
                        <div className="text-[10px] text-slate-400 font-medium">{timeDisp.relative}</div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3.5 whitespace-nowrap">{renderStatusBadge(log.status)}</td>

                      {/* Inspect Button */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-100 hover:text-amber-800 border border-slate-200 text-slate-600 transition-all shadow-2xs"
                          title="Inspect forensic details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 border-t border-slate-100 bg-slate-50/50">
          <div className="text-xs text-slate-500 font-medium">
            Showing <span className="font-bold text-slate-800">{logs.length > 0 ? (meta.page - 1) * meta.limit + 1 : 0}</span> to{" "}
            <span className="font-bold text-slate-800">{Math.min(meta.page * meta.limit, meta.total)}</span> of{" "}
            <span className="font-bold text-amber-700">{meta.total.toLocaleString()}</span> entries
          </div>

          <div className="flex items-center gap-2">
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!meta.hasPrevPage || isFetching}
                className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 disabled:opacity-40 shadow-2xs"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-2.5 py-1 text-xs font-mono font-semibold text-slate-600">
                Page <strong className="text-amber-700">{meta.page}</strong> of {meta.totalPages}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={!meta.hasNextPage || isFetching}
                className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 disabled:opacity-40 shadow-2xs"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 5. FORENSIC DETAIL INSPECTOR MODAL */}
      {/* ==================================================================== */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-3xl max-h-[90vh] bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Forensic Event Detail Inspector</h2>
                  <p className="text-xs text-slate-500 font-mono">ID: {selectedLog.id}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyId(selectedLog.id)}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs inline-flex items-center gap-1.5 shadow-2xs"
                >
                  {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  {copiedId ? "Copied" : "Copy ID"}
                </button>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200 transition-all"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5 overflow-y-auto">
              {/* Event Primary Attributes */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <div>
                  <div className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">Action</div>
                  <div className="font-mono font-bold text-amber-700 text-xs mt-0.5">{selectedLog.action}</div>
                </div>
                <div>
                  <div className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">Category</div>
                  <div className="font-bold text-slate-800 text-xs mt-0.5">{selectedLog.actionCategory || "SYSTEM"}</div>
                </div>
                <div>
                  <div className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">Status</div>
                  <div className="mt-0.5">{renderStatusBadge(selectedLog.status)}</div>
                </div>
                <div>
                  <div className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">Entity / Resource</div>
                  <div className="font-semibold text-slate-800 text-xs mt-0.5">{selectedLog.entityType || selectedLog.resource || "N/A"}</div>
                </div>
                <div>
                  <div className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">Entity Reference</div>
                  <div className="font-mono text-amber-700 font-bold text-xs mt-0.5 truncate">{selectedLog.entityReference || selectedLog.resourceId || "N/A"}</div>
                </div>
                <div>
                  <div className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">Timestamp (EAT)</div>
                  <div className="font-mono text-slate-800 font-semibold text-xs mt-0.5">
                    {formatDateDisplay(selectedLog.createdAt).full}
                  </div>
                </div>
              </div>

              {/* Human Description */}
              <div>
                <h3 className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider mb-1">Description</h3>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-medium">
                  {selectedLog.description || "No description provided."}
                </div>
              </div>

              {/* Actor & Security Context */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <h4 className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider">Actor Context</h4>
                  <div className="text-xs space-y-1">
                    <div>
                      <span className="text-slate-400 font-medium">Name: </span>
                      <strong className="text-slate-800">{selectedLog.actorName || "N/A"}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Email: </span>
                      <strong className="text-slate-800 font-mono">{selectedLog.actorEmail || "System"}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Role: </span>
                      <span className="font-bold text-amber-700">{selectedLog.actorRole || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Actor ID: </span>
                      <span className="font-mono text-slate-500 text-[11px]">{selectedLog.actorId || "N/A"}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <h4 className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider">Client &amp; Network Context</h4>
                  <div className="text-xs space-y-1">
                    <div>
                      <span className="text-slate-400 font-medium">IP Address: </span>
                      <strong className="text-slate-800 font-mono">{selectedLog.ipAddress || "Internal/Unknown"}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">User Agent: </span>
                      <div className="text-[11px] text-slate-600 font-mono break-all line-clamp-2 mt-0.5">
                        {selectedLog.userAgent || "None"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* State Diff: Previous vs New Value */}
              {(Boolean(selectedLog.previousValue) || Boolean(selectedLog.newValue)) && (
                <div className="space-y-1.5">
                  <h3 className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">State Transition Diff</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Boolean(selectedLog.previousValue) && (
                      <div>
                        <div className="text-[11px] text-rose-700 font-bold mb-1">Previous State</div>
                        <pre className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-rose-300 overflow-x-auto max-h-40">
                          {JSON.stringify(selectedLog.previousValue, null, 2)}
                        </pre>
                      </div>
                    )}
                    {Boolean(selectedLog.newValue) && (
                      <div>
                        <div className="text-[11px] text-emerald-700 font-bold mb-1">New State</div>
                        <pre className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-40">
                          {JSON.stringify(selectedLog.newValue, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* JSON Metadata Payload */}
              {Boolean(selectedLog.metadata) && (
                <div className="space-y-1.5">
                  <h3 className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Audit Metadata Payload</h3>
                  <pre className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-amber-300 overflow-x-auto max-h-48">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end px-6 py-3.5 border-t border-slate-200 bg-slate-50/80">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white transition-all shadow-2xs"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
