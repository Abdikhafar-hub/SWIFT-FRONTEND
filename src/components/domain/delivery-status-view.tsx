"use client";

import React from "react";
import { Truck, CheckCircle2, FileText, Download, MapPin, User, Phone, PackageCheck, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils/format";
import type { ApplicationDelivery } from "@/types";

interface DeliveryStatusViewProps {
  deliveries?: ApplicationDelivery[];
  deliveredAt?: string | null;
  status?: string;
  className?: string;
}

export function DeliveryStatusView({
  deliveries = [],
  deliveredAt,
  status,
  className,
}: DeliveryStatusViewProps) {
  if (!deliveries || deliveries.length === 0) {
    const isCompletedOrReady = status === "READY_FOR_DELIVERY" || status === "DELIVERED" || status === "CLOSED";

    return (
      <Card className={className}>
        <CardContent className="p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-500">
            <Truck className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-sm font-semibold text-slate-900">
              {isCompletedOrReady
                ? "Delivery Preparation in Progress"
                : "Delivery Not Yet Initiated"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isCompletedOrReady
                ? "Your statutory application has passed quality control. Dispatch details and tracking numbers will appear here once handed to courier or released digitally."
                : "Deliverables will be dispatched after your statutory application completes government processing and quality check."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className || ""}`}>
      {deliveries.map((item) => {
        const isDispatched = item.confirmationStatus === "DISPATCHED" || item.confirmationStatus === "CONFIRMED";
        const isConfirmed = item.confirmationStatus === "CONFIRMED" || Boolean(item.deliveredAt);

        return (
          <Card key={item.id} className="border-border">
            <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-gold-600" />
                <CardTitle className="text-base font-semibold text-slate-900">
                  Dispatch Reference: {item.dispatchReference || item.id.substring(0, 8)}
                </CardTitle>
              </div>
              <Badge
                tone={isConfirmed ? "success" : isDispatched ? "info" : "neutral"}
                className="uppercase tracking-wider text-[11px]"
              >
                {item.confirmationStatus || (isConfirmed ? "CONFIRMED" : "PENDING")}
              </Badge>
            </CardHeader>

            <CardContent className="pt-4 space-y-6">
              {/* Primary Dispatch Summary Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 bg-muted/40 rounded-lg space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                    Delivery Method
                  </span>
                  <p className="text-sm font-medium text-slate-900 flex items-center gap-2">
                    <PackageCheck className="w-4 h-4 text-slate-600" />
                    {item.deliveryMethod}
                  </p>
                </div>

                <div className="p-3 bg-muted/40 rounded-lg space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                    Courier / Carrier
                  </span>
                  <p className="text-sm font-medium text-slate-900 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-slate-600" />
                    {item.carrier || "Official Swift Doc Courier Service"}
                  </p>
                </div>

                <div className="p-3 bg-muted/40 rounded-lg space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                    Waybill / Tracking Number
                  </span>
                  <p className="text-sm font-mono font-bold text-slate-900 flex items-center gap-2">
                    {item.trackingNumber || "Pending Courier Scan"}
                  </p>
                </div>
              </div>

              {/* Recipient Details */}
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-slate-500" /> Recipient & Destination Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground">Recipient Name:</span>{" "}
                    <span className="font-semibold text-slate-900">{item.recipientName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Contact Phone:</span>{" "}
                    <span className="font-semibold text-slate-900">{item.recipientPhone}</span>
                  </div>
                  {item.recipientEmail && (
                    <div>
                      <span className="text-muted-foreground">Contact Email:</span>{" "}
                      <span className="font-semibold text-slate-900">{item.recipientEmail}</span>
                    </div>
                  )}
                  {item.physicalAddress && (
                    <div className="col-span-1 md:col-span-2 flex items-start gap-1 text-slate-900 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
                      <span>{item.physicalAddress}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Delivery Actions & Attachments */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="text-xs text-muted-foreground">
                  {item.deliveredAt ? (
                    <span className="text-emerald-700 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Delivered on {formatDateTime(item.deliveredAt)}
                    </span>
                  ) : (
                    <span>Dispatched on {formatDateTime(item.createdAt)}</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {item.proofDocumentUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(item.proofDocumentUrl!, "_blank")}
                      className="text-xs gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-600" />
                      View Delivery Proof
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
