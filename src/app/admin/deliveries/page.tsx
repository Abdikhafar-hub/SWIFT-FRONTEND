"use client";

import React, { useState } from "react";
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
import { AdminDeliveryModal } from "@/components/domain";
import { EmptyState, Skeleton, ErrorState } from "@/components/ui/feedback-primitives";
import { adminApi } from "@/lib/api/admin";
import { formatDate } from "@/lib/utils/format";
import type { Application, ApplicationDelivery } from "@/types";

export default function AdminDeliveriesPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  // Dispatch modal
  const [selectedAppForDispatch, setSelectedAppForDispatch] = useState<Application | null>(null);

  // Query applications
  const { data: appsData, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-applications-deliveries-queue"],
    queryFn: () => adminApi.getApplications({ page: 1, limit: 100 }),
  });

  const applications: Application[] = appsData?.items || [];

  // Extract all deliveries with their host applications
  const allDeliveries: Array<{
    delivery: ApplicationDelivery;
    application: Application;
  }> = [];

  applications.forEach((app) => {
    if (app.deliveries && app.deliveries.length > 0) {
      app.deliveries.forEach((d) => {
        allDeliveries.push({ delivery: d, application: app });
      });
    } else if ((app as any).delivery) {
      allDeliveries.push({ delivery: (app as any).delivery, application: app });
    }
  });

  // Ready for delivery applications (not yet dispatched)
  const readyToDispatchApps = applications.filter(
    (app) => app.status === "READY_FOR_DELIVERY" || ((app.status as string) === "APPROVED" && (!app.deliveries || app.deliveries.length === 0))
  );

  // Filter deliveries
  const filteredDeliveries = allDeliveries.filter(({ delivery, application }) => {
    if (search) {
      const q = search.toLowerCase();
      const matchTrack = delivery.trackingNumber?.toLowerCase().includes(q);
      const matchCarrier = delivery.courierName?.toLowerCase().includes(q);
      const matchRecipient = delivery.recipientName?.toLowerCase().includes(q);
      const matchApp = application.applicationNumber?.toLowerCase().includes(q);
      const matchClient =
        application.client?.fullName?.toLowerCase().includes(q) ||
        application.client?.businessName?.toLowerCase().includes(q);
      if (!matchTrack && !matchCarrier && !matchRecipient && !matchApp && !matchClient) return false;
    }
    if (statusFilter !== "ALL" && delivery.status !== statusFilter) return false;
    return true;
  });

  // Metrics
  const totalDeliveries = allDeliveries.length;
  const inTransitCount = allDeliveries.filter((d) => d.delivery.status === "DISPATCHED" || d.delivery.status === "IN_TRANSIT").length;
  const deliveredCount = allDeliveries.filter((d) => d.delivery.status === "DELIVERED").length;
  const pendingDispatchCount = readyToDispatchApps.length;

  const pageSize = 10;
  const totalPages = Math.ceil(filteredDeliveries.length / pageSize) || 1;
  const paginatedDeliveries = filteredDeliveries.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-4 sm:p-5 lg:p-6 space-y-4 max-w-[1550px] mx-auto font-sans">
      {/* ------------------------------------------------------------------ */}
      {/* 1. HEADER SECTION */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Delivery &amp; Fulfillment Operations
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Courier dispatch management, waybill tracking numbers, physical dispatch to clients, and proof-of-delivery confirmation.
          </p>
        </div>

        {readyToDispatchApps.length > 0 && (
          <button
            onClick={() => setSelectedAppForDispatch(readyToDispatchApps[0])}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
          >
            <Send className="size-3.5" />
            <span>Dispatch Completed Filing</span>
          </button>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. DELIVERY METRICS */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Awaiting Dispatch</span>
            <span className="text-xl font-extrabold text-amber-600 font-mono mt-0.5 block">{pendingDispatchCount}</span>
            <span className="text-[10px] text-slate-500 font-medium">Ready for courier / handover</span>
          </div>
          <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60">
            <Package className="size-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">In Transit / Dispatched</span>
            <span className="text-xl font-extrabold text-slate-900 font-mono mt-0.5 block">{inTransitCount}</span>
            <span className="text-[10px] text-slate-500 font-medium">Active with courier</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
            <Truck className="size-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Fulfilled (Delivered)</span>
            <span className="text-xl font-extrabold text-emerald-600 font-mono mt-0.5 block">{deliveredCount}</span>
            <span className="text-[10px] text-slate-500 font-medium">Proof of delivery confirmed</span>
          </div>
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60">
            <CheckCircle2 className="size-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Dispatched</span>
            <span className="text-xl font-extrabold text-slate-700 font-mono mt-0.5 block">{totalDeliveries}</span>
            <span className="text-[10px] text-slate-500 font-medium">All recorded shipments</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-100 text-slate-600 border border-slate-200">
            <Truck className="size-4" />
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. READY TO DISPATCH QUEUE BANNER */}
      {/* ------------------------------------------------------------------ */}
      {readyToDispatchApps.length > 0 && (
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="size-4 text-amber-700" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                Applications Ready for Client Dispatch ({readyToDispatchApps.length})
              </h4>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {readyToDispatchApps.map((app) => (
              <div
                key={app.id}
                className="rounded-xl border border-slate-200/80 bg-white p-3 flex flex-col justify-between shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-2"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/admin/applications/${app.id}`}
                      className="font-mono font-bold text-amber-700 hover:underline"
                    >
                      #{app.applicationNumber}
                    </Link>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                      READY
                    </span>
                  </div>
                  <p className="font-bold text-slate-900 mt-1">{app.service?.name}</p>
                  <span className="text-slate-500 block text-[11px] font-medium">
                    {app.client?.fullName || app.client?.businessName || "Verified Entity"}
                  </span>
                </div>

                <button
                  onClick={() => setSelectedAppForDispatch(app)}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5"
                >
                  <Send className="size-3" />
                  <span>Dispatch via Courier / Digital</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 4. FILTERS & SEARCH */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by tracking #, courier, recipient, or dossier #..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium text-slate-800 placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-semibold text-slate-700"
          >
            <option value="ALL">All Delivery States</option>
            <option value="PENDING">Pending Dispatch</option>
            <option value="DISPATCHED">Dispatched</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="DELIVERED">Delivered</option>
            <option value="FAILED">Failed / Returned</option>
          </select>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 5. DELIVERIES TABLE */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-slate-100 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <p className="text-xs font-bold text-rose-600">Failed to load delivery queue.</p>
            <button
              onClick={() => refetch()}
              className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
            >
              Retry Loading
            </button>
          </div>
        ) : filteredDeliveries.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Truck className="size-8 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No delivery shipments found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Shipments will appear here once certificates and documents are dispatched.
            </p>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Tracking # / Courier</th>
                    <th className="py-3 px-4">Dossier #</th>
                    <th className="py-3 px-4">Recipient</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Dispatch Date</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {paginatedDeliveries.map(({ delivery, application }) => (
                    <tr key={delivery.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <Link
                            href={`/admin/deliveries/${delivery.id}`}
                            className="font-mono text-xs font-bold text-amber-700 hover:underline block"
                          >
                            {delivery.trackingNumber || "No Tracking #"}
                          </Link>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {delivery.courierName || "Direct Handover"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/admin/applications/${application.id}`}
                          className="font-mono text-xs font-bold text-amber-700 hover:underline"
                        >
                          #{application.applicationNumber}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-800 font-bold">
                        {delivery.recipientName || application.client?.fullName || "Verified Client"}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                          {delivery.deliveryMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                            delivery.status === "DELIVERED"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200/80"
                              : delivery.status === "FAILED"
                              ? "bg-rose-50 text-rose-800 border-rose-200/80"
                              : "bg-amber-50 text-amber-800 border-amber-200/80"
                          }`}
                        >
                          {delivery.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500 font-mono">
                        {formatDate(delivery.dispatchedAt || delivery.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link href={`/admin/deliveries/${delivery.id}`}>
                          <button className="bg-white border border-slate-200 text-slate-700 font-bold text-xs px-2.5 py-1 rounded-lg hover:bg-slate-50 transition-all inline-flex items-center gap-1">
                            <Eye className="size-3 text-slate-500" />
                            <span>Dossier</span>
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="px-4 py-3 bg-slate-50/60 border-t border-slate-200/80 flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>
                  Page {page} of {totalPages} ({filteredDeliveries.length} total items)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page >= totalPages}
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

      {/* DISPATCH MODAL */}
      {selectedAppForDispatch && (
        <AdminDeliveryModal
          applicationId={selectedAppForDispatch.id}
          applicationNumber={selectedAppForDispatch.applicationNumber}
          isOpen={Boolean(selectedAppForDispatch)}
          onClose={() => setSelectedAppForDispatch(null)}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}
