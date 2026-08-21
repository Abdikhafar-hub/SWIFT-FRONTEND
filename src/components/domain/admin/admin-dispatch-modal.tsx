"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Truck, Send, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { adminApi } from "@/lib/api/admin";

interface AdminDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  delivery: any;
  onSuccess?: () => void;
}

export function AdminDispatchModal({
  isOpen,
  onClose,
  delivery,
  onSuccess,
}: AdminDispatchModalProps) {
  const queryClient = useQueryClient();

  const [dispatchDate, setDispatchDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [carrier, setCarrier] = useState(delivery?.carrier || "Fargo Courier");
  const [trackingNumber, setTrackingNumber] = useState(delivery?.trackingNumber || "");
  const [handoverReference, setHandoverReference] = useState("");
  const [notes, setNotes] = useState("");

  const dispatchMutation = useMutation({
    mutationFn: () =>
      adminApi.dispatchDeliveryAction(delivery?.id, {
        dispatchDate,
        carrier,
        trackingNumber,
        handoverReference,
        notes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-deliveries-list"] });
      queryClient.invalidateQueries({ queryKey: ["admin-delivery-item", delivery?.id] });
      onClose();
      if (onSuccess) onSuccess();
    },
  });

  if (!delivery) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Dispatch"
      description={`Handover shipment ${delivery.dispatchReference || delivery.id} to courier or physical transport.`}
    >
      <div className="space-y-4 text-xs font-sans">
        {/* Read-Only Dispatch Summary */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-400 font-bold">Delivery Ref:</span>
            <span className="font-mono font-bold text-slate-900">{delivery.dispatchReference || delivery.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 font-bold">Client / Dossier:</span>
            <span className="font-bold text-slate-800">
              {delivery.application?.client?.fullName || delivery.recipientName} (#{delivery.application?.applicationNumber || "Case"})
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 font-bold">Recipient:</span>
            <span className="font-bold text-slate-800">{delivery.recipientName} ({delivery.recipientPhone})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 font-bold">Address:</span>
            <span className="font-medium text-slate-700">{delivery.physicalAddress || "Handover"}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Actual Dispatch Date</label>
            <input
              type="date"
              value={dispatchDate}
              onChange={(e) => setDispatchDate(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 font-medium text-slate-800 focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Courier Carrier</label>
            <input
              type="text"
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              placeholder="e.g. Fargo Courier / G4S"
              className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 font-medium text-slate-800 focus:border-amber-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Waybill / Tracking Number</label>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="e.g. WB-839201"
              className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 font-mono font-bold text-amber-700 focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Courier Handover Ref (Optional)</label>
            <input
              type="text"
              value={handoverReference}
              onChange={(e) => setHandoverReference(e.target.value)}
              placeholder="e.g. HND-FARGO-981"
              className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 font-medium text-slate-800 focus:border-amber-500"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">Dispatch Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Courier rider ID, vehicle registration, or dispatch seal number..."
            className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 font-medium text-slate-800 focus:border-amber-500"
          />
        </div>

        {dispatchMutation.isError && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{(dispatchMutation.error as Error)?.message || "Failed to dispatch delivery"}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={dispatchMutation.isPending}
            onClick={() => dispatchMutation.mutate()}
            className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
          >
            {dispatchMutation.isPending ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Truck className="w-3.5 h-3.5" />
            )}
            <span>Confirm Dispatch</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
