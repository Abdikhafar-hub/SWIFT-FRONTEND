"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Truck,
  Package,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Plus,
  Send,
  Eye,
  MapPin,
  Phone,
  User,
  ExternalLink,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  SlidersHorizontal,
  CheckCheck,
  AlertCircle,
  FileText,
  Calendar,
} from "lucide-react";
import { adminApi } from "@/lib/api/admin";
import { formatDate } from "@/lib/utils/format";
import {
  AdminLodgeDeliveryModal,
  AdminDispatchModal,
  AdminConfirmDeliveryModal,
  AdminFailedDeliveryModal,
  AdminDeliveryDetailDrawer,
} from "@/components/domain";
import type { ApplicationDelivery } from "@/types";
import { parseISO, isSameDay, subDays, startOfMonth, startOfDay, endOfDay } from "date-fns";

export default function AdminDeliveriesPage() {
  const queryClient = useQueryClient();

  // State Management
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [courierFilter, setCourierFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [datePreset, setDatePreset] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal / Drawer Active States
  const [isLodgeModalOpen, setIsLodgeModalOpen] = useState(false);
  const [dispatchModalDelivery, setDispatchModalDelivery] = useState<any | null>(null);
  const [confirmModalDelivery, setConfirmModalDelivery] = useState<any | null>(null);
  const [failedModalDelivery, setFailedModalDelivery] = useState<any | null>(null);
  const [detailDrawerDeliveryId, setDetailDrawerDeliveryId] = useState<string | null>(null);

  // Query deliveries list & summary KPIs from real backend endpoint
  const {
    data: deliveriesData,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["admin-deliveries-list", page, pageSize, statusFilter, courierFilter],
    queryFn: () =>
      adminApi.getDeliveries({
        page: 1,
        limit: 200,
      }),
  });

  const allDeliveries: ApplicationDelivery[] = deliveriesData?.items || [];
  const metrics = deliveriesData?.summaryMetrics || {
    awaitingDispatchCount: allDeliveries.filter((d) => (d.confirmationStatus || d.status) === "AWAITING_DISPATCH" || (d.confirmationStatus || d.status) === "PENDING").length,
    inTransitCount: allDeliveries.filter((d) => (d.confirmationStatus || d.status) === "DISPATCHED" || (d.confirmationStatus || d.status) === "IN_TRANSIT").length,
    fulfilledCount: allDeliveries.filter((d) => (d.confirmationStatus || d.status) === "DELIVERED" || (d.confirmationStatus || d.status) === "CONFIRMED").length,
    totalDispatched: allDeliveries.length,
  };

  // Extract structured notes helper
  const getDeliveryMeta = (delivery: ApplicationDelivery) => {
    let meta: any = {};
    if (delivery.notes) {
      try {
        meta = JSON.parse(delivery.notes);
      } catch {
        meta = { customNotes: delivery.notes };
      }
    }
    return meta;
  };

  // Filter deliveries client side
  const filteredDeliveries = useMemo(() => {
    const now = new Date();

    return allDeliveries.filter((delivery) => {
      const meta = getDeliveryMeta(delivery);
      const statusStr = delivery.confirmationStatus || delivery.status || "AWAITING_DISPATCH";

      // 1. Search Query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchRef = (delivery.dispatchReference || "").toLowerCase().includes(q);
        const matchTrack = (delivery.trackingNumber || "").toLowerCase().includes(q);
        const matchRecipient = (delivery.recipientName || "").toLowerCase().includes(q);
        const matchCarrier = (delivery.carrier || "").toLowerCase().includes(q);
        const matchApp = (delivery.application?.applicationNumber || "").toLowerCase().includes(q);
        const matchClient = (delivery.application?.client?.fullName || delivery.application?.client?.businessName || "").toLowerCase().includes(q);

        if (!matchRef && !matchTrack && !matchRecipient && !matchCarrier && !matchApp && !matchClient) {
          return false;
        }
      }

      // 2. Status Filter
      if (statusFilter !== "ALL") {
        if (statusFilter === "AWAITING_DISPATCH" && statusStr !== "AWAITING_DISPATCH" && statusStr !== "PENDING") return false;
        if (statusFilter === "DISPATCHED" && statusStr !== "DISPATCHED") return false;
        if (statusFilter === "IN_TRANSIT" && statusStr !== "IN_TRANSIT") return false;
        if (statusFilter === "DELIVERED" && statusStr !== "DELIVERED" && statusStr !== "CONFIRMED") return false;
        if (statusFilter === "FAILED" && statusStr !== "FAILED" && statusStr !== "RETURNED") return false;
      }

      // 3. Delivery Type Filter
      if (typeFilter !== "ALL") {
        const delType = meta.deliveryType || "Client Documents";
        if (delType.toLowerCase() !== typeFilter.toLowerCase()) return false;
      }

      // 4. Courier Filter
      if (courierFilter !== "ALL") {
        const carrierStr = delivery.carrier || "";
        if (!carrierStr.toLowerCase().includes(courierFilter.toLowerCase())) return false;
      }

      // 5. Priority Filter
      if (priorityFilter !== "ALL") {
        const prio = meta.priority || "Normal";
        if (prio.toLowerCase() !== priorityFilter.toLowerCase()) return false;
      }

      // 6. Date Filter
      if (delivery.createdAt) {
        try {
          const createdAtDate = parseISO(delivery.createdAt);

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
          // Ignore parse errors
        }
      }

      return true;
    });
  }, [allDeliveries, search, statusFilter, typeFilter, courierFilter, priorityFilter, datePreset, fromDate, toDate]);

  const isFilterActive =
    Boolean(search.trim()) ||
    statusFilter !== "ALL" ||
    typeFilter !== "ALL" ||
    courierFilter !== "ALL" ||
    priorityFilter !== "ALL" ||
    datePreset !== "ALL" ||
    Boolean(fromDate) ||
    Boolean(toDate);

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setTypeFilter("ALL");
    setCourierFilter("ALL");
    setPriorityFilter("ALL");
    setDatePreset("ALL");
    setFromDate("");
    setToDate("");
    setPage(1);
  };

  // Pagination Computations
  const totalCount = filteredDeliveries.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedDeliveries = filteredDeliveries.slice(startIndex, startIndex + pageSize);

  // Status Badge Renderer
  const renderStatusBadge = (statusStr: string) => {
    switch (statusStr) {
      case "DELIVERED":
      case "CONFIRMED":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            DELIVERED
          </span>
        );
      case "IN_TRANSIT":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Truck className="w-3 h-3 text-indigo-600 animate-pulse" />
            IN_TRANSIT
          </span>
        );
      case "DISPATCHED":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            <Send className="w-3 h-3 text-blue-600" />
            DISPATCHED
          </span>
        );
      case "FAILED":
      case "RETURNED":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            {statusStr}
          </span>
        );
      case "AWAITING_DISPATCH":
      case "PENDING":
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            AWAITING_DISPATCH
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-4 sm:p-5 lg:p-6 space-y-4 max-w-[1550px] mx-auto font-sans">
      {/* ==================================================================== */}
      {/* 1. PAGE HEADER & PRIMARY CTA BUTTON */}
      {/* ==================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/60">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-700 shrink-0">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              Delivery &amp; Fulfillment Operations
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Courier dispatch management, waybill tracking numbers, physical dispatch to clients, and proof-of-delivery confirmation.
            </p>
          </div>
        </div>

        {/* PRIMARY ACTION CTA BUTTON: + Lodge Delivery */}
        <button
          onClick={() => setIsLodgeModalOpen(true)}
          className="bg-gradient-to-r from-[#C5A059] to-[#D4AF37] hover:from-[#b49049] hover:to-[#c39e26] text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Lodge Delivery</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* 2. OPERATIONAL KPIS */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Awaiting Dispatch */}
        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Awaiting Dispatch</span>
            <span className="text-xl font-extrabold text-amber-600 font-mono mt-0.5 block">
              {metrics.awaitingDispatchCount}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Ready for courier / handover</span>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60">
            <Package className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: In Transit / Dispatched */}
        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">In Transit / Dispatched</span>
            <span className="text-xl font-extrabold text-slate-900 font-mono mt-0.5 block">
              {metrics.inTransitCount}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Active with courier transport</span>
          </div>
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200/60">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Fulfilled (Delivered) */}
        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Fulfilled (Delivered)</span>
            <span className="text-xl font-extrabold text-emerald-600 font-mono mt-0.5 block">
              {metrics.fulfilledCount}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Proof of delivery confirmed</span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Total Dispatched */}
        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Dispatched</span>
            <span className="text-xl font-extrabold text-slate-700 font-mono mt-0.5 block">
              {metrics.totalDispatched}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">All logged shipments</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-100 text-slate-600 border border-slate-200">
            <Truck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. TOOLBAR: SEARCH & MULTI-DIMENSIONAL FILTERS */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[280px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Delivery ID, Waybill, Client, Recipient, Dossier #, or Courier..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-8 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Date Presets */}
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
              onClick={() => refetch()}
              disabled={isFetching}
              className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 transition-all shrink-0 ml-1"
              title="Refresh Deliveries"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-amber-600" : ""}`} />
            </button>
          </div>
        </div>

        {/* Custom Date Pickers */}
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
                className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800"
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
                className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800"
              />
            </div>
          </div>
        )}

        {/* Filter Dropdowns Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 flex-1">
            {/* Status Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:border-amber-500"
              >
                <option value="ALL">All Delivery States</option>
                <option value="AWAITING_DISPATCH">Awaiting Dispatch</option>
                <option value="DISPATCHED">Dispatched</option>
                <option value="IN_TRANSIT">In Transit</option>
                <option value="DELIVERED">Delivered</option>
                <option value="FAILED">Failed / Returned</option>
              </select>
            </div>

            {/* Delivery Type Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Delivery Type</label>
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:border-amber-500"
              >
                <option value="ALL">All Delivery Types</option>
                <option value="Client Documents">Client Documents</option>
                <option value="Certificate">Certificate</option>
                <option value="Statutory Document">Statutory Document</option>
                <option value="Compliance Documents">Compliance Documents</option>
                <option value="Application Documents">Application Documents</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Courier Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Courier Carrier</label>
              <select
                value={courierFilter}
                onChange={(e) => {
                  setCourierFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:border-amber-500"
              >
                <option value="ALL">All Couriers</option>
                <option value="Fargo">Fargo Courier</option>
                <option value="G4S">G4S Secure Logistics</option>
                <option value="Speedaf">Speedaf Express</option>
                <option value="Sendy">Sendy Logistics</option>
                <option value="In-House">Swift Doc In-House</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Priority</label>
              <select
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:border-amber-500"
              >
                <option value="ALL">All Priorities</option>
                <option value="Normal">Normal</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Clear Filters Action */}
          {isFilterActive && (
            <button
              onClick={handleClearFilters}
              className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1 transition-all shrink-0 self-end"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 4. MAIN DELIVERIES WORKSPACE TABLE */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-600 mx-auto mb-2" />
            <p className="font-semibold text-xs">Loading logistics &amp; delivery records...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <p className="font-bold text-slate-800 text-xs">Failed to load delivery operations list.</p>
            <button
              onClick={() => refetch()}
              className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200"
            >
              Retry
            </button>
          </div>
        ) : filteredDeliveries.length === 0 ? (
          /* ACTIONABLE EMPTY STATE */
          <div className="py-14 px-4 text-center">
            <div className="max-w-sm mx-auto space-y-3">
              <div className="p-3.5 rounded-full bg-amber-50 text-amber-700 w-14 h-14 mx-auto flex items-center justify-center border border-amber-200">
                <Truck className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">No deliveries have been lodged yet</h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Create your first delivery record to begin tracking document dispatch and fulfillment.
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setIsLodgeModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#C5A059] to-[#D4AF37] hover:from-[#b49049] hover:to-[#c39e26] text-white font-bold text-xs transition-all shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Lodge Delivery</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="py-3 px-4">DELIVERY REF</th>
                    <th className="py-3 px-4">CLIENT</th>
                    <th className="py-3 px-4">RECIPIENT</th>
                    <th className="py-3 px-4">WAYBILL</th>
                    <th className="py-3 px-4">COURIER</th>
                    <th className="py-3 px-4">STATUS</th>
                    <th className="py-3 px-4">EXPECTED / DISPATCH</th>
                    <th className="py-3 px-4 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {paginatedDeliveries.map((delivery) => {
                    const statusStr = delivery.confirmationStatus || delivery.status || "AWAITING_DISPATCH";
                    const meta = getDeliveryMeta(delivery);
                    const clientName =
                      delivery.application?.client?.fullName ||
                      delivery.application?.client?.businessName ||
                      "Verified Client";

                    return (
                      <tr key={delivery.id} className="hover:bg-slate-50/80 transition-colors group">
                        {/* Delivery Ref */}
                        <td className="py-3 px-4">
                          <button
                            onClick={() => setDetailDrawerDeliveryId(delivery.id)}
                            className="font-mono text-xs font-bold text-amber-700 hover:underline block text-left"
                          >
                            {delivery.dispatchReference || delivery.id.slice(0, 12)}
                          </button>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {meta.deliveryType || "Certificate Delivery"}
                          </span>
                        </td>

                        {/* Client */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{clientName}</div>
                          {delivery.application && (
                            <span className="text-[10px] font-mono text-slate-500 font-medium">
                              #{delivery.application.applicationNumber}
                            </span>
                          )}
                        </td>

                        {/* Recipient */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">{delivery.recipientName}</div>
                          <span className="text-[11px] text-slate-500 font-mono">{delivery.recipientPhone}</span>
                        </td>

                        {/* Waybill */}
                        <td className="py-3 px-4 font-mono font-bold text-amber-800 text-xs">
                          {delivery.trackingNumber || "No Waybill"}
                        </td>

                        {/* Courier */}
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-700 text-xs">
                            {delivery.carrier || "Direct Handover"}
                          </span>
                        </td>

                        {/* Status Badge */}
                        <td className="py-3 px-4 whitespace-nowrap">{renderStatusBadge(statusStr)}</td>

                        {/* Expected Date */}
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                          {formatDate(delivery.deliveredAt || delivery.createdAt)}
                        </td>

                        {/* Contextual Actions */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Detailed Inspector Trigger */}
                            <button
                              onClick={() => setDetailDrawerDeliveryId(delivery.id)}
                              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1 transition-all"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-500" />
                              <span>View</span>
                            </button>

                            {/* Lifecycle Action 1: AWAITING_DISPATCH -> Dispatch Modal */}
                            {(statusStr === "AWAITING_DISPATCH" || statusStr === "PENDING") && (
                              <button
                                onClick={() => setDispatchModalDelivery(delivery)}
                                className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold text-xs flex items-center gap-1 transition-all"
                              >
                                <Send className="w-3 h-3 text-amber-700" />
                                <span>Dispatch</span>
                              </button>
                            )}

                            {/* Lifecycle Action 2: DISPATCHED / IN_TRANSIT -> Confirm Delivery Modal */}
                            {(statusStr === "DISPATCHED" || statusStr === "IN_TRANSIT") && (
                              <>
                                <button
                                  onClick={() => setConfirmModalDelivery(delivery)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs flex items-center gap-1 transition-all"
                                >
                                  <CheckCheck className="w-3 h-3 text-emerald-700" />
                                  <span>Mark Delivered</span>
                                </button>

                                <button
                                  onClick={() => setFailedModalDelivery(delivery)}
                                  className="p-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all"
                                  title="Report Failed Delivery"
                                >
                                  <AlertCircle className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}

                            {/* Lifecycle Action 3: DELIVERED -> View POD */}
                            {(statusStr === "DELIVERED" || statusStr === "CONFIRMED") && delivery.proofDocumentUrl && (
                              <a
                                href={delivery.proofDocumentUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center gap-1"
                              >
                                <FileText className="w-3 h-3 text-slate-500" />
                                <span>POD</span>
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 border-t border-slate-100 bg-slate-50/50">
              <div className="text-xs text-slate-500 font-medium">
                Showing <span className="font-bold text-slate-800">{totalCount > 0 ? startIndex + 1 : 0}</span>–
                <span className="font-bold text-slate-800">{Math.min(startIndex + pageSize, totalCount)}</span> of{" "}
                <span className="font-bold text-amber-700">{totalCount.toLocaleString()}</span> deliveries
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
                    disabled={currentPage <= 1 || isLoading}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs disabled:opacity-40 shadow-2xs flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </button>

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages || isLoading}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs disabled:opacity-40 shadow-2xs flex items-center gap-1"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* MODALS & DRAWERS */}
      {/* ==================================================================== */}
      {/* 1. Lodge New Delivery Modal */}
      {isLodgeModalOpen && (
        <AdminLodgeDeliveryModal
          isOpen={isLodgeModalOpen}
          onClose={() => setIsLodgeModalOpen(false)}
          onSuccess={() => refetch()}
        />
      )}

      {/* 2. Confirm Dispatch Modal */}
      {dispatchModalDelivery && (
        <AdminDispatchModal
          isOpen={Boolean(dispatchModalDelivery)}
          onClose={() => setDispatchModalDelivery(null)}
          delivery={dispatchModalDelivery}
          onSuccess={() => refetch()}
        />
      )}

      {/* 3. Confirm Delivery (Mark Delivered) Modal */}
      {confirmModalDelivery && (
        <AdminConfirmDeliveryModal
          isOpen={Boolean(confirmModalDelivery)}
          onClose={() => setConfirmModalDelivery(null)}
          delivery={confirmModalDelivery}
          onSuccess={() => refetch()}
        />
      )}

      {/* 4. Report Failed Delivery Modal */}
      {failedModalDelivery && (
        <AdminFailedDeliveryModal
          isOpen={Boolean(failedModalDelivery)}
          onClose={() => setFailedModalDelivery(null)}
          delivery={failedModalDelivery}
          onSuccess={() => refetch()}
        />
      )}

      {/* 5. Detailed Logistical Inspector Drawer */}
      {detailDrawerDeliveryId && (
        <AdminDeliveryDetailDrawer
          isOpen={Boolean(detailDrawerDeliveryId)}
          onClose={() => setDetailDrawerDeliveryId(null)}
          deliveryId={detailDrawerDeliveryId}
        />
      )}
    </div>
  );
}
