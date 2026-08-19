"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Truck, Send, CheckCircle2, AlertTriangle, MapPin } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { FormField, Textarea } from "@/components/ui/form-primitives";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { adminApi } from "@/lib/api/admin";
import type { Application, ClientProfile } from "@/types";

interface AdminDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  application?: Application;
  applicationId?: string;
  applicationNumber?: string;
  client?: ClientProfile;
  onDispatched?: () => void;
  onSuccess?: () => void;
}

export function AdminDeliveryModal({
  isOpen,
  onClose,
  application,
  applicationId,
  applicationNumber,
  client,
  onDispatched,
  onSuccess,
}: AdminDeliveryModalProps) {
  const queryClient = useQueryClient();

  const appId = application?.id || applicationId || "";
  const appNum = application?.applicationNumber || applicationNumber || "Case";

  const [deliveryMethod, setDeliveryMethod] = useState<"DIGITAL" | "PHYSICAL" | "BOTH">("PHYSICAL");
  const [recipientName, setRecipientName] = useState(
    client?.fullName || client?.businessName || application?.client?.fullName || application?.client?.businessName || ""
  );
  const [recipientPhone, setRecipientPhone] = useState(client?.phone || application?.client?.phone || "");
  const [recipientEmail, setRecipientEmail] = useState(client?.email || application?.client?.email || "");
  const [physicalAddress, setPhysicalAddress] = useState(client?.address || "");
  const [carrier, setCarrier] = useState("Fargo Courier Kenya");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [notes, setNotes] = useState("");

  const dispatchMutation = useMutation({
    mutationFn: () =>
      adminApi.dispatchDelivery(appId, {
        deliveryMethod,
        recipientName: recipientName || "Client",
        recipientPhone: recipientPhone || "+254700000000",
        recipientEmail: recipientEmail || undefined,
        physicalAddress: physicalAddress || undefined,
        carrier: carrier || undefined,
        trackingNumber: trackingNumber || undefined,
        notes: notes || undefined,
      }),
    onSuccess: () => {
      if (appId) {
        queryClient.invalidateQueries({ queryKey: ["admin-application", appId] });
      }
      queryClient.invalidateQueries({ queryKey: ["admin-applications"] });
      queryClient.invalidateQueries({ queryKey: ["admin-applications-deliveries-queue"] });
      onClose();
      if (onDispatched) onDispatched();
      if (onSuccess) onSuccess();
    },
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Dispatch Certificate & Statutory Delivery"
      description={`Initiate courier dispatch or digital delivery release for application #${appNum}.`}
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="gold"
            size="sm"
            isLoading={dispatchMutation.isPending}
            onClick={() => dispatchMutation.mutate()}
          >
            Confirm Dispatch
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <FormField label="Fulfillment Channel" required>
          <Select
            value={deliveryMethod}
            onChange={(e) => setDeliveryMethod(e.target.value as any)}
            options={[
              { value: "PHYSICAL", label: "Physical Courier Dispatch (Official Hard-Copy & Sealed Certificate)" },
              { value: "DIGITAL", label: "Digital Vault Release (Encrypted PDF Download)" },
              { value: "BOTH", label: "Both Physical Courier + Digital Vault Release" },
            ]}
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Recipient Name" required>
            <Input
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="e.g. John Doe / Company Director"
            />
          </FormField>

          <FormField label="Contact Phone (+254)" required>
            <Input
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              placeholder="+254712345678"
            />
          </FormField>
        </div>

        {deliveryMethod !== "DIGITAL" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Courier Partner / Carrier">
                <Select
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  options={[
                    { value: "Fargo Courier Kenya", label: "Fargo Courier Kenya" },
                    { value: "G4S Secure Logistics", label: "G4S Secure Logistics" },
                    { value: "Speedaf Express", label: "Speedaf Express" },
                    { value: "Sendy Logistics", label: "Sendy Logistics" },
                    { value: "Swift Doc In-House Dispatch", label: "Swift Doc In-House Dispatch (Nairobi CBD)" },
                    { value: "Client In-Person Collection", label: "Client In-Person Collection (Executive Office)" },
                  ]}
                />
              </FormField>

              <FormField label="Waybill / Tracking Number">
                <Input
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. FRG-NBO-2026-9812"
                />
              </FormField>
            </div>

            <FormField label="Delivery Physical Address" required>
              <Input
                value={physicalAddress}
                onChange={(e) => setPhysicalAddress(e.target.value)}
                placeholder="e.g. Westlands Commercial Center, 4th Floor, Suite 402, Nairobi"
              />
            </FormField>
          </>
        )}

        <FormField label="Dispatch / Waybill Notes">
          <Textarea
            placeholder="Special delivery instructions, gate pass requirements, or packaging notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </FormField>

        {dispatchMutation.isError && (
          <div className="flex items-center gap-2 rounded-xs bg-destructive/10 p-3 text-xs text-destructive">
            <AlertTriangle className="size-4 shrink-0" />
            <span>{(dispatchMutation.error as Error)?.message || "Failed to dispatch delivery"}</span>
          </div>
        )}
      </div>
    </Modal>
  );
}
