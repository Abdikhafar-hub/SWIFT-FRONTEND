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
    <PageShell
      eyebrow="CASE OPERATIONS"
      title="Delivery & Fulfillment Operations"
      description="Courier dispatch management, waybill tracking numbers, physical dispatch to clients, and proof-of-delivery confirmation."
      actions={
        readyToDispatchApps.length > 0 ? (
          <Button
            variant="gold"
            size="sm"
            leftIcon={<Send className="size-3.5" />}
            onClick={() => setSelectedAppForDispatch(readyToDispatchApps[0])}
          >
            Dispatch Completed Filing
          </Button>
        ) : undefined
      }
    >
      {/* 1. DELIVERY METRICS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Awaiting Dispatch"
          value={pendingDispatchCount}
          subtitle="Ready for courier / handover"
          variant={pendingDispatchCount > 0 ? "gold" : "default"}
          icon={<Package className="size-5 text-gold-dark dark:text-gold" />}
        />

        <StatCard
          title="In Transit / Dispatched"
          value={inTransitCount}
          subtitle="Active with courier"
          icon={<Truck className="size-5 text-navy dark:text-gold" />}
        />

        <StatCard
          title="Fulfilled (Delivered)"
          value={deliveredCount}
          subtitle="Proof of delivery confirmed"
          icon={<CheckCircle2 className="size-5 text-emerald-600" />}
        />

        <StatCard
          title="Total Dispatched"
          value={totalDeliveries}
          subtitle="All recorded shipments"
          icon={<Truck className="size-5 text-muted-foreground" />}
        />
      </div>

      {/* 2. READY TO DISPATCH QUEUE BANNER */}
      {readyToDispatchApps.length > 0 && (
        <div className="mt-6 rounded-xs border border-gold/40 bg-gold/5 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="size-4 text-gold" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Applications Ready for Client Dispatch ({readyToDispatchApps.length})
              </h4>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {readyToDispatchApps.map((app) => (
              <div
                key={app.id}
                className="rounded-xs border border-border bg-card p-3 flex flex-col justify-between shadow-xs space-y-2"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/admin/applications/${app.id}`}
                      className="font-mono font-bold text-navy dark:text-gold hover:underline"
                    >
                      #{app.applicationNumber}
                    </Link>
                    <Badge tone="gold" size="sm">READY</Badge>
                  </div>
                  <p className="font-semibold text-foreground mt-1">{app.service?.name}</p>
                  <span className="text-muted-foreground block text-[11px]">
                    {app.client?.fullName || app.client?.businessName || "Verified Entity"}
                  </span>
                </div>

                <Button
                  variant="gold"
                  size="xs"
                  leftIcon={<Send className="size-3" />}
                  onClick={() => setSelectedAppForDispatch(app)}
                >
                  Dispatch via Courier / Digital
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. FILTERS & SEARCH */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3 max-w-md">
          <Input
            placeholder="Search by tracking #, courier, recipient, or dossier #..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            leftAddon={<Search className="size-4" />}
          />
        </div>

        <div className="flex items-center gap-3">
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-48 text-xs"
            options={[
              { value: "ALL", label: "All Delivery States" },
              { value: "PENDING", label: "Pending Dispatch" },
              { value: "DISPATCHED", label: "Dispatched" },
              { value: "IN_TRANSIT", label: "In Transit" },
              { value: "DELIVERED", label: "Delivered" },
              { value: "FAILED", label: "Failed / Returned" },
            ]}
          />
        </div>
      </div>

      {/* 4. DELIVERIES TABLE */}
      <div className="mt-6">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : error ? (
          <ErrorState onRetry={() => refetch()} />
        ) : filteredDeliveries.length === 0 ? (
          <EmptyState
            icon={<Truck className="size-7" />}
            title="No delivery shipments found"
            description="Shipments will appear here once certificates and documents are dispatched."
          />
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tracking # / Courier</TableHead>
                  <TableHead>Dossier #</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Dispatch Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedDeliveries.map(({ delivery, application }) => (
                  <TableRow key={delivery.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="space-y-0.5">
                        <Link
                          href={`/admin/deliveries/${delivery.id}`}
                          className="font-mono text-xs font-bold text-navy dark:text-gold hover:underline block"
                        >
                          {delivery.trackingNumber || "No Tracking #"}
                        </Link>
                        <span className="text-[11px] text-muted-foreground">
                          {delivery.courierName || "Direct Handover"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/applications/${application.id}`}
                        className="font-mono text-xs font-bold text-navy dark:text-gold hover:underline"
                      >
                        #{application.applicationNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs text-foreground font-semibold">
                      {delivery.recipientName || application.client?.fullName || "Verified Client"}
                    </TableCell>
                    <TableCell>
                      <Badge tone="neutral" size="sm">{delivery.deliveryMethod}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        tone={
                          delivery.status === "DELIVERED"
                            ? "success"
                            : delivery.status === "FAILED"
                            ? "destructive"
                            : "gold"
                        }
                        size="sm"
                      >
                        {delivery.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {formatDate(delivery.dispatchedAt || delivery.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/admin/deliveries/${delivery.id}`}>
                        <Button variant="ghost" size="xs" leftIcon={<Eye className="size-3.5" />}>
                          Dossier
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={filteredDeliveries.length}
              pageSize={pageSize}
              onChange={(p) => setPage(p)}
            />
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
    </PageShell>
  );
}
