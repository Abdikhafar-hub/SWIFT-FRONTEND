"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, RefreshCw, AlertTriangle } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { adminApi } from "@/lib/api/admin";

interface AdminFailedDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  delivery: any;
  onSuccess?: () => void;
}

export function AdminFailedDeliveryModal({
  isOpen,
  onClose,
  delivery,
  onSuccess,
}: AdminFailedDeliveryModalProps) {
  const queryClient = useQueryClient();

  const [failureReason, setFailureReason] = useState("Recipient unavailable");
  const [nextAction, setNextAction] = useState("Retry Delivery");
  const [notes, setNotes] = useState("");

  const failMutation = useMutation({
    mutationFn: () =>
      adminApi.reportFailedDelivery(delivery?.id, {
        failureReason,
        nextAction,
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
      title="Report Failed Delivery"
      description={`Record an unsuccessful delivery attempt or return for shipment ${delivery.dispatchReference || delivery.id}.`}
    >
      <div className="space-y-4 text-xs font-sans">
        <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200 text-rose-900 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Delivery Failure Incident Log</span>
          </div>
          <p className="text-[11px] text-rose-700">
            This will mark shipment <strong className="font-mono">{delivery.dispatchReference || delivery.id}</strong> as FAILED / RETURNED and log the incident in the operational audit history.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Failure Reason</label>
            <select
              value={failureReason}
              onChange={(e) => setFailureReason(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 font-semibold text-slate-800 focus:border-rose-500"
            >
              <option value="Recipient unavailable">Recipient unavailable</option>
              <option value="Incorrect address">Incorrect address</option>
              <option value="Refused">Refused by recipient</option>
              <option value="Courier issue">Courier / Transport issue</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Recommended Next Action</label>
            <select
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 font-semibold text-slate-800 focus:border-rose-500"
            >
              <option value="Retry Delivery">Retry Delivery (Schedule 2nd Attempt)</option>
              <option value="Return to Office">Return to Office (Nairobi HQ)</option>
              <option value="Return to Sender">Return to Sender</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">Detailed Incident Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Provide courier attempt notes, phone unreachable logs, or address clarification..."
            className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 font-medium text-slate-800 focus:border-rose-500"
          />
        </div>

        {failMutation.isError && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{(failMutation.error as Error)?.message || "Failed to log delivery failure"}</span>
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
            disabled={failMutation.isPending}
            onClick={() => failMutation.mutate()}
            className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
          >
            {failMutation.isPending ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5" />
            )}
            <span>Log Failure</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
