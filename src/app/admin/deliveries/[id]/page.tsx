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
        status: confirmStatus,
        receivedBy: receivedBy || undefined,
        idNumberVerified: idNumberVerified || undefined,
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
    <PageShell
      eyebrow={`FULFILLMENT SHIPMENT • ${matchedDelivery.trackingNumber || matchedDelivery.id.slice(0, 8)}`}
      title={matchedDelivery.courierName ? `Courier: ${matchedDelivery.courierName}` : "Direct Dispatch"}
      description={`Tracking: ${matchedDelivery.trackingNumber || "N/A"} • Method: ${matchedDelivery.deliveryMethod} • Status: ${matchedDelivery.status}`}
      actions={
        <div className="flex items-center gap-2">
          <Link href="/admin/deliveries">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="size-3.5" />}>
              Deliveries Queue
            </Button>
          </Link>
          {matchedDelivery.status !== "DELIVERED" && (
            <Button
              variant="gold"
              size="sm"
              leftIcon={<CheckCircle2 className="size-3.5" />}
              onClick={() => {
                setReceivedBy(matchedDelivery?.recipientName || "");
                setIsConfirmModalOpen(true);
              }}
            >
              Confirm Proof of Delivery
            </Button>
          )}
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Shipment Overview & Recipient Info */}
        <div className="space-y-6 lg:col-span-2">
          <Card padding="md" className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Shipment Tracking & Transit Profile
                </span>
                <h3 className="text-base font-bold text-foreground">
                  {matchedDelivery.courierName || "Standard Delivery Fulfillment"}
                </h3>
              </div>
              <Badge
                tone={
                  matchedDelivery.status === "DELIVERED"
                    ? "success"
                    : matchedDelivery.status === "FAILED"
                    ? "destructive"
                    : "gold"
                }
                size="md"
              >
                {matchedDelivery.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="rounded-xs border border-border bg-muted/20 p-2.5">
                <span className="text-muted-foreground block text-[11px]">Tracking #</span>
                <strong className="text-foreground font-mono">{matchedDelivery.trackingNumber || "—"}</strong>
              </div>

              <div className="rounded-xs border border-border bg-muted/20 p-2.5">
                <span className="text-muted-foreground block text-[11px]">Method</span>
                <strong className="text-foreground">{matchedDelivery.deliveryMethod}</strong>
              </div>

              <div className="rounded-xs border border-border bg-muted/20 p-2.5">
                <span className="text-muted-foreground block text-[11px]">Dispatched Date</span>
                <span className="text-foreground">
                  {formatDate(matchedDelivery.dispatchedAt || matchedDelivery.createdAt)}
                </span>
              </div>

              <div className="rounded-xs border border-border bg-muted/20 p-2.5">
                <span className="text-muted-foreground block text-[11px]">Delivered Date</span>
                <span className="text-emerald-600 font-semibold">
                  {matchedDelivery.deliveredAt ? formatDate(matchedDelivery.deliveredAt) : "In Transit"}
                </span>
              </div>
            </div>

            {/* Recipient Contact & Delivery Address */}
            <div className="rounded-xs border border-border bg-muted/20 p-3.5 space-y-3 text-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Consignee & Destination Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Recipient Name</span>
                  <strong className="text-foreground">{matchedDelivery.recipientName || "—"}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Recipient Phone</span>
                  <span className="text-foreground font-mono">{matchedDelivery.recipientPhone || "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">National ID Verified</span>
                  <span className="text-foreground font-mono">{(matchedDelivery as any).idNumberVerified || "Pending Handover"}</span>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Physical Delivery Address</span>
                <p className="text-foreground mt-0.5">{matchedDelivery.deliveryAddress || "N/A"}</p>
              </div>
            </div>

            {matchedDelivery.notes && (
              <div className="rounded-xs border border-border bg-muted/20 p-3 text-xs space-y-1">
                <span className="text-[11px] font-bold text-muted-foreground">Officer / Courier Notes:</span>
                <p className="text-foreground">{matchedDelivery.notes}</p>
              </div>
            )}
          </Card>
        </div>

        {/* Right Col: Host Application Profile */}
        <div className="space-y-6">
          {matchedApp && (
            <Card padding="md" className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-foreground">Host Application</h4>
                <Link
                  href={`/admin/applications/${matchedApp.id}`}
                  className="text-xs font-semibold text-gold-dark dark:text-gold hover:underline flex items-center gap-1"
                >
                  <span>Full 360</span>
                  <ExternalLink className="size-3" />
                </Link>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Dossier #</span>
                  <Link
                    href={`/admin/applications/${matchedApp.id}`}
                    className="font-mono font-bold text-navy dark:text-gold hover:underline"
                  >
                    #{matchedApp.applicationNumber}
                  </Link>
                </div>
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Service Name</span>
                  <span className="font-semibold text-foreground">{matchedApp.service?.name}</span>
                </div>
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Client Name</span>
                  <span className="font-bold text-foreground">
                    {matchedApp.client?.fullName || matchedApp.client?.businessName || "Client"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Application Status</span>
                  <Badge tone="neutral" size="sm">{matchedApp.status}</Badge>
                </div>
              </div>
            </Card>
          )}

          {/* Quick Confirmation Trigger */}
          {matchedDelivery.status !== "DELIVERED" && (
            <Card padding="md" className="space-y-3 text-xs border-emerald-500/40 bg-emerald-500/5">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-emerald-600" />
                <span>Proof of Delivery Confirmation</span>
              </h4>
              <p className="text-muted-foreground">
                Confirm recipient handover to officially complete fulfillment.
              </p>
              <Button
                variant="gold"
                size="sm"
                className="w-full"
                onClick={() => {
                  setReceivedBy(matchedDelivery?.recipientName || "");
                  setIsConfirmModalOpen(true);
                }}
              >
                Record Delivery Confirmation
              </Button>
            </Card>
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

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
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
    </PageShell>
  );
}
