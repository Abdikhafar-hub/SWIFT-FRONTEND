"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Package,
  X,
  Truck,
  User,
  MapPin,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Building2,
  Send,
} from "lucide-react";
import { adminApi } from "@/lib/api/admin";
import { formatDate } from "@/lib/utils/format";

interface AdminDeliveryDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  deliveryId: string;
}

export function AdminDeliveryDetailDrawer({
  isOpen,
  onClose,
  deliveryId,
}: AdminDeliveryDetailDrawerProps) {
  const { data: delivery, isLoading } = useQuery({
    queryKey: ["admin-delivery-item", deliveryId],
    queryFn: () => adminApi.getDeliveryById(deliveryId),
    enabled: isOpen && Boolean(deliveryId),
  });

  if (!isOpen) return null;

  // Parse structured notes if present
  let parsedNotes: any = {};
  if (delivery?.notes) {
    try {
      parsedNotes = JSON.parse(delivery.notes);
    } catch {
      parsedNotes = { customNotes: delivery.notes };
    }
  }

  const timeline = parsedNotes.timeline || [
    {
      timestamp: delivery?.createdAt || new Date().toISOString(),
      status: delivery?.confirmationStatus || "AWAITING_DISPATCH",
      description: "Delivery record created",
      actor: "Operations Admin",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <span>{delivery?.dispatchReference || deliveryId}</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Comprehensive Logistics Dossier &amp; Operational Audit Trail
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-700 border border-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Body */}
        {isLoading || !delivery ? (
          <div className="p-8 text-center text-slate-500 font-medium text-xs space-y-2">
            <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p>Fetching logistics dossier details...</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs font-sans">
            {/* 1. OVERVIEW BANNER */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status</span>
                <span className="inline-block mt-1 px-2 py-0.5 rounded font-bold text-[10px] bg-amber-100 text-amber-800 border border-amber-200">
                  {delivery.confirmationStatus || "AWAITING_DISPATCH"}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Delivery Type</span>
                <span className="font-bold text-slate-800 text-xs block mt-1">
                  {parsedNotes.deliveryType || "Certificate Delivery"}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Priority</span>
                <span className="font-bold text-amber-700 text-xs block mt-1">
                  {parsedNotes.priority || "Normal"}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Created Date</span>
                <span className="font-mono text-slate-700 text-[11px] block mt-1">
                  {formatDate(delivery.createdAt)}
                </span>
              </div>
            </div>

            {/* 2. CLIENT & DOSSIER */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <Building2 className="w-4 h-4 text-slate-400" />
                <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">Client &amp; Case Dossier</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-slate-400 font-bold block text-[10px]">Client Name</span>
                  <span className="font-bold text-slate-900 text-xs">
                    {delivery.application?.client?.fullName || delivery.recipientName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px]">Dossier Reference</span>
                  <span className="font-mono font-bold text-amber-700 text-xs">
                    #{delivery.application?.applicationNumber || "N/A"} ({delivery.application?.service?.name || "Service"})
                  </span>
                </div>
              </div>
            </div>

            {/* 3. RECIPIENT & DESTINATION */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">Recipient &amp; Destination</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-slate-400 font-bold block text-[10px]">Recipient Name</span>
                  <span className="font-bold text-slate-800">{delivery.recipientName}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px]">Phone &amp; Email</span>
                  <span className="font-medium text-slate-800">
                    {delivery.recipientPhone} {delivery.recipientEmail ? `· ${delivery.recipientEmail}` : ""}
                  </span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-400 font-bold block text-[10px]">Physical Delivery Address</span>
                  <span className="font-medium text-slate-800">
                    {delivery.physicalAddress || "CBD Handover"} {parsedNotes.cityCounty ? `, ${parsedNotes.cityCounty}` : ""}
                  </span>
                </div>
              </div>
            </div>

            {/* 4. COURIER & WAYBILL */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <Truck className="w-4 h-4 text-slate-400" />
                <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">Courier &amp; Tracking Details</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <span className="text-slate-400 font-bold block text-[10px]">Courier Provider</span>
                  <span className="font-bold text-slate-800">{delivery.carrier || "Direct Handover"}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px]">Waybill / Tracking #</span>
                  <span className="font-mono font-bold text-amber-700">{delivery.trackingNumber || "N/A"}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px]">Dispatch Method</span>
                  <span className="font-semibold text-slate-800">{parsedNotes.dispatchMethod || "Courier"}</span>
                </div>
              </div>
            </div>

            {/* 5. DOCUMENTS INCLUDED */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <FileText className="w-4 h-4 text-slate-400" />
                <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">
                  Documents Included in Shipment
                </h3>
              </div>
              {parsedNotes.documents && parsedNotes.documents.length > 0 ? (
                <div className="space-y-1.5 pt-1">
                  {parsedNotes.documents.map((doc: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="font-bold text-slate-800">{doc.name}</span>
                      <span className="font-mono text-[10px] text-slate-500">{doc.type}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 italic text-[11px] pt-1">Standard statutory filings &amp; official certificate included.</p>
              )}
            </div>

            {/* 6. OPERATIONAL TIMELINE */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">Operational Lifecycle Timeline</h3>
              </div>

              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {timeline.map((event: any, idx: number) => (
                  <div key={idx} className="relative">
                    <span className="absolute -left-[23px] top-0.5 w-3 h-3 rounded-full bg-amber-500 ring-4 ring-white" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-slate-400">
                          {formatDate(event.timestamp)}
                        </span>
                        <span className="font-bold px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700">
                          {event.status}
                        </span>
                      </div>
                      <p className="font-bold text-slate-900 mt-0.5">{event.description}</p>
                      {event.actor && <span className="text-[10px] text-slate-400 font-medium">By: {event.actor}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
}
