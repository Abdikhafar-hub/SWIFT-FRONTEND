"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Truck,
  Package,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Phone,
  User,
  Clock,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { PageShell } from "@/components/ui/layout-primitives";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { FormField, Textarea } from "@/components/ui/form-primitives";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton, ErrorState } from "@/components/ui/feedback-primitives";
import { adminApi } from "@/lib/api/admin";
import { formatDate } from "@/lib/utils/format";
import type { Application, ApplicationDelivery } from "@/types";

export default function AdminDeliveryDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const queryClient = useQueryClient();

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmStatus, setConfirmStatus] = useState<"DELIVERED" | "FAILED" | "RETURNED">("DELIVERED");
  const [receivedBy, setReceivedBy] = useState("");
  const [idNumberVerified, setIdNumberVerified] = useState("");
  const [notes, setNotes] = useState("");

  // Query applications to locate delivery
  const { data: appsData, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-applications-deliveries-queue"],
    queryFn: () => adminApi.getApplications({ page: 1, limit: 100 }),
  });

  const applications: Application[] = appsData?.items || [];

  let matchedDelivery: ApplicationDelivery | null = null;
  let matchedApp: Application | null = null;

  for (const app of applications) {
    if (app.deliveries) {
      const found = app.deliveries.find((d) => d.id === id);
      if (found) {
        matchedDelivery = found;
        matchedApp = app;
        break;
      }
    }
    if ((app as any).delivery && (app as any).delivery.id === id) {
      matchedDelivery = (app as any).delivery;
      matchedApp = app;
      break;
    }
  }

  const confirmMutation = useMutation({
    mutationFn: () =>
      adminApi.confirmDelivery(id, {
        receivedBy: receivedBy || undefined,
        notes: notes || undefined,
      }),
    onSuccess: () => {
      setIsConfirmModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin-applications-deliveries-queue"] });
    },
  });

  if (isLoading) {
    return (
      <PageShell title="Loading Delivery Dossier...">
        <div className="space-y-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </PageShell>
    );
  }

  if (error || !matchedDelivery) {
    return (
      <PageShell title="Delivery Fulfillment Dossier">
        <ErrorState
          title="Delivery Shipment Not Found"
          message="Could not locate the requested fulfillment shipment record."
          onRetry={() => refetch()}
        />
      </PageShell>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-4 sm:p-5 lg:p-6 space-y-4 max-w-[1550px] mx-auto font-sans">
      {/* ------------------------------------------------------------------ */}
      {/* 1. HEADER SECTION */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/80">
              Shipment #{matchedDelivery.trackingNumber || matchedDelivery.id.slice(0, 8)}
            </span>
            <span className="text-xs text-slate-500 font-mono font-medium">
              Method: {matchedDelivery.deliveryMethod}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            {matchedDelivery.courierName ? `Courier: ${matchedDelivery.courierName}` : "Direct Dispatch"}
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <Link href="/admin/deliveries">
            <button className="bg-white border border-slate-200 text-slate-700 font-bold text-xs px-3 py-2 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-1.5 shadow-xs">
              <ArrowLeft className="size-3.5 text-slate-500" />
              <span>Deliveries Queue</span>
            </button>
          </Link>
          {matchedDelivery.status !== "DELIVERED" && (
            <button
              onClick={() => {
                setReceivedBy(matchedDelivery?.recipientName || "");
                setIsConfirmModalOpen(true);
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            >
              <CheckCircle2 className="size-3.5" />
              <span>Confirm Proof of Delivery</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left 2 Cols: Shipment Overview & Recipient Info */}
        <div className="space-y-4 lg:col-span-2">
          <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Shipment Tracking &amp; Transit Profile
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {matchedDelivery.courierName || "Standard Delivery Fulfillment"}
                </h3>
              </div>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border ${
                  matchedDelivery.status === "DELIVERED"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200/80"
                    : matchedDelivery.status === "FAILED"
                    ? "bg-rose-50 text-rose-800 border-rose-200/80"
                    : "bg-amber-50 text-amber-800 border-amber-200/80"
                }`}
              >
                {matchedDelivery.status}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3">
                <span className="text-slate-400 block text-[10px] font-extrabold uppercase tracking-wider">Tracking #</span>
                <strong className="text-slate-900 font-mono font-bold block mt-0.5">{matchedDelivery.trackingNumber || "—"}</strong>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3">
                <span className="text-slate-400 block text-[10px] font-extrabold uppercase tracking-wider">Method</span>
                <strong className="text-slate-900 font-bold block mt-0.5">{matchedDelivery.deliveryMethod}</strong>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3">
                <span className="text-slate-400 block text-[10px] font-extrabold uppercase tracking-wider">Dispatched Date</span>
                <span className="text-slate-700 font-mono font-semibold block mt-0.5">
                  {formatDate(matchedDelivery.dispatchedAt || matchedDelivery.createdAt)}
                </span>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3">
                <span className="text-slate-400 block text-[10px] font-extrabold uppercase tracking-wider">Delivered Date</span>
                <span className="text-emerald-600 font-mono font-bold block mt-0.5">
                  {matchedDelivery.deliveredAt ? formatDate(matchedDelivery.deliveredAt) : "In Transit"}
                </span>
              </div>
            </div>

            {/* Recipient Contact & Delivery Address */}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3.5 space-y-3 text-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Consignee &amp; Destination Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-slate-400 block text-[10px] font-extrabold uppercase tracking-wider">Recipient Name</span>
                  <strong className="text-slate-900 font-bold mt-0.5 block">{matchedDelivery.recipientName || "—"}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-extrabold uppercase tracking-wider">Recipient Phone</span>
                  <span className="text-slate-900 font-mono font-bold mt-0.5 block">{matchedDelivery.recipientPhone || "—"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-extrabold uppercase tracking-wider">National ID Verified</span>
                  <span className="text-slate-900 font-mono font-bold mt-0.5 block">{(matchedDelivery as any).idNumberVerified || "Pending Handover"}</span>
                </div>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-extrabold uppercase tracking-wider">Physical Delivery Address</span>
                <p className="text-slate-800 font-medium mt-0.5">{matchedDelivery.deliveryAddress || "N/A"}</p>
              </div>
            </div>

            {matchedDelivery.notes && (
              <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3 text-xs space-y-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Officer / Courier Notes:</span>
                <p className="text-slate-700 font-medium">{matchedDelivery.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Host Application Profile */}
        <div className="space-y-4">
          {matchedApp && (
            <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-sm font-bold text-slate-900">Host Application</h4>
                <Link
                  href={`/admin/applications/${matchedApp.id}`}
                  className="text-xs font-bold text-amber-700 hover:underline flex items-center gap-1"
                >
                  <span>Full 360</span>
                  <ExternalLink className="size-3" />
                </Link>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-medium">Dossier #</span>
                  <Link
                    href={`/admin/applications/${matchedApp.id}`}
                    className="font-mono font-bold text-amber-700 hover:underline"
                  >
                    #{matchedApp.applicationNumber}
                  </Link>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-medium">Service Name</span>
                  <span className="font-bold text-slate-900">{matchedApp.service?.name}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-medium">Client Name</span>
                  <span className="font-bold text-slate-900">
                    {matchedApp.client?.fullName || matchedApp.client?.businessName || "Client"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Application Status</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                    {matchedApp.status}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Quick Confirmation Trigger */}
          {matchedDelivery.status !== "DELIVERED" && (
            <div className="bg-white rounded-xl p-4 border border-emerald-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-3 text-xs">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-emerald-600" />
                <span>Proof of Delivery Confirmation</span>
              </h4>
              <p className="text-slate-500 font-medium">
                Confirm recipient handover to officially complete fulfillment.
              </p>
              <button
                onClick={() => {
                  setReceivedBy(matchedDelivery?.recipientName || "");
                  setIsConfirmModalOpen(true);
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                <span>Record Delivery Confirmation</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CONFIRMATION MODAL */}
      {isConfirmModalOpen && (
        <Modal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          title="Confirm Document Delivery Fulfillment"
          description="Record official proof-of-delivery handover details."
          size="md"
        >
          <div className="space-y-4 text-xs">
            <FormField label="Fulfillment Status" required>
              <Select
                value={confirmStatus}
                onChange={(e) => setConfirmStatus(e.target.value as any)}
                options={[
                  { value: "DELIVERED", label: "Successfully Delivered to Recipient" },
                  { value: "FAILED", label: "Delivery Failed / Customer Unavailable" },
                  { value: "RETURNED", label: "Returned to Sender / Office" },
                ]}
              />
            </FormField>

            <FormField label="Received By (Individual Name)" required={confirmStatus === "DELIVERED"}>
              <Input
                value={receivedBy}
                onChange={(e) => setReceivedBy(e.target.value)}
                placeholder="Full name of recipient"
              />
            </FormField>

            <FormField label="National ID / Verification Code Verified">
              <Input
                value={idNumberVerified}
                onChange={(e) => setIdNumberVerified(e.target.value)}
                placeholder="e.g. 12345678"
              />
            </FormField>

            <FormField label="Delivery Handover Remarks">
              <Textarea
                placeholder="Document any handover notes or courier comments..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </FormField>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsConfirmModalOpen(false)}
                disabled={confirmMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="gold"
                size="sm"
                isLoading={confirmMutation.isPending}
                onClick={() => confirmMutation.mutate()}
              >
                Confirm Fulfillment
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
