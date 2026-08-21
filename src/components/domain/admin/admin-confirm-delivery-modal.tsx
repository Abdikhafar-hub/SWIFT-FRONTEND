"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Upload, AlertTriangle, RefreshCw, FileText } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { adminApi } from "@/lib/api/admin";

interface AdminConfirmDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  delivery: any;
  onSuccess?: () => void;
}

export function AdminConfirmDeliveryModal({
  isOpen,
  onClose,
  delivery,
  onSuccess,
}: AdminConfirmDeliveryModalProps) {
  const queryClient = useQueryClient();

  const [deliveredAt, setDeliveredAt] = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [receivedBy, setReceivedBy] = useState(delivery?.recipientName || "");
  const [recipientPhone, setRecipientPhone] = useState(delivery?.recipientPhone || "");
  const [proofDocumentUrl, setProofDocumentUrl] = useState("");
  const [notes, setNotes] = useState("");

  const confirmMutation = useMutation({
    mutationFn: () =>
      adminApi.confirmDelivery(delivery?.id, {
        deliveredAt,
        receivedBy,
        recipientPhone,
        proofDocumentUrl,
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
      title="Confirm Delivery (Mark Delivered)"
      description={`Record proof of delivery and mark shipment ${delivery.dispatchReference || delivery.id} as fulfilled.`}
    >
      <div className="space-y-4 text-xs font-sans">
        <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-1.5">
          <div className="flex justify-between">
            <span className="text-emerald-800 font-bold">Delivery Ref:</span>
            <span className="font-mono font-bold text-slate-900">{delivery.dispatchReference || delivery.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-emerald-800 font-bold">Waybill Number:</span>
            <span className="font-mono font-bold text-amber-700">{delivery.trackingNumber || "N/A"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-emerald-800 font-bold">Carrier:</span>
            <span className="font-bold text-slate-800">{delivery.carrier || "Courier"}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Delivered Date &amp; Time</label>
            <input
              type="datetime-local"
              value={deliveredAt}
              onChange={(e) => setDeliveredAt(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 font-medium text-slate-800 focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Received By (Full Name)</label>
            <input
              type="text"
              value={receivedBy}
              onChange={(e) => setReceivedBy(e.target.value)}
              placeholder="e.g. John Doe / Director"
              className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 font-bold text-slate-900 focus:border-amber-500"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">Proof of Delivery (Signed POD Receipt URL / File)</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={proofDocumentUrl}
              onChange={(e) => setProofDocumentUrl(e.target.value)}
              placeholder="e.g. https://storage.swiftdoc.co/pod/receipt-9812.pdf"
              className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 font-medium text-slate-800 focus:border-amber-500"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">Delivery Confirmation Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="ID number verified, recipient signature confirmed, or front desk handover note..."
            className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 font-medium text-slate-800 focus:border-amber-500"
          />
        </div>

        {confirmMutation.isError && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{(confirmMutation.error as Error)?.message || "Failed to confirm delivery"}</span>
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
            disabled={confirmMutation.isPending}
            onClick={() => confirmMutation.mutate()}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
          >
            {confirmMutation.isPending ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}
            <span>Confirm Delivery</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
