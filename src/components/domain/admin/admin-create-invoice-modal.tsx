"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Plus, Trash2, FileText, AlertCircle } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { FormField, Textarea } from "@/components/ui/form-primitives";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { adminApi } from "@/lib/api/admin";
import { formatCurrency } from "@/lib/utils/format";
import type {
  CreateInvoiceLineItemInput,
  InvoiceLineItemCategory,
  PaymentStatus,
} from "@/types";

interface AdminCreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId?: string;
  clientId?: string;
  initialApplicationId?: string;
  initialClientId?: string;
  onCreated?: () => void;
  onSuccess?: () => void;
}

interface LineItemDraft extends CreateInvoiceLineItemInput {
  tempId: string;
}

export function AdminCreateInvoiceModal({
  isOpen,
  onClose,
  applicationId: defaultAppId = "",
  clientId: defaultClientId = "",
  initialApplicationId,
  initialClientId,
  onCreated,
  onSuccess,
}: AdminCreateInvoiceModalProps) {
  const queryClient = useQueryClient();

  const effectiveAppId = defaultAppId || initialApplicationId || "";
  const effectiveClientId = defaultClientId || initialClientId || "";

  const [applicationId, setApplicationId] = useState(effectiveAppId);
  const [clientId, setClientId] = useState(effectiveClientId);
  const [dueAt, setDueAt] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<PaymentStatus>("ISSUED");

  // Dynamic Line Items
  const [lineItems, setLineItems] = useState<LineItemDraft[]>([
    {
      tempId: "1",
      description: "Official Statutory Filing & Registry Fee",
      category: "GOVERNMENT_FEE",
      quantity: 1,
      unitAmount: 5000,
      isGovernmentFee: true,
      isTaxable: false,
    },
    {
      tempId: "2",
      description: "Document Verification & Professional Processing",
      category: "SERVICE_FEE",
      quantity: 1,
      unitAmount: 2500,
      isGovernmentFee: false,
      isTaxable: true,
    },
  ]);

  // Fetch applications list if no applicationId passed
  const { data: appsData } = useQuery({
    queryKey: ["admin-applications-select"],
    queryFn: () => adminApi.getApplications({ page: 1, limit: 50 }),
    enabled: !defaultAppId && isOpen,
  });

  const applications = appsData?.items || [];

  const handleAddLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      {
        tempId: String(Date.now()),
        description: "",
        category: "SERVICE_FEE",
        quantity: 1,
        unitAmount: 0,
        isGovernmentFee: false,
        isTaxable: true,
      },
    ]);
  };

  const handleRemoveLineItem = (tempId: string) => {
    if (lineItems.length <= 1) return;
    setLineItems((prev) => prev.filter((item) => item.tempId !== tempId));
  };

  const handleUpdateLineItem = (
    tempId: string,
    field: keyof CreateInvoiceLineItemInput,
    value: any
  ) => {
    setLineItems((prev) =>
      prev.map((item) => (item.tempId === tempId ? { ...item, [field]: value } : item))
    );
  };

  // Preview totals computed purely for UI guidance before backend authoritative calculation
  const previewSubtotal = lineItems.reduce(
    (acc, curr) => acc + (Number(curr.quantity) || 1) * (Number(curr.unitAmount) || 0),
    0
  );

  const createMutation = useMutation({
    mutationFn: () => {
      if (!applicationId) throw new Error("Application ID is required");
      return adminApi.createInvoice({
        applicationId,
        clientId: clientId || undefined,
        dueAt: dueAt || undefined,
        notes: notes || undefined,
        status,
        lineItems: lineItems.map(({ tempId, ...rest }) => ({
          ...rest,
          quantity: Number(rest.quantity) || 1,
          unitAmount: Number(rest.unitAmount) || 0,
        })),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-invoices-list"] });
      queryClient.invalidateQueries({ queryKey: ["admin-financial-summary"] });
      if (applicationId) {
        queryClient.invalidateQueries({ queryKey: ["admin-application", applicationId] });
      }
      onClose();
      if (onCreated) onCreated();
      if (onSuccess) onSuccess();
    },
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Commercial Invoice"
      description="Generate a statutory disbursement and service invoice for client compliance."
      size="xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs">
            <span className="text-muted-foreground">Estimated Subtotal: </span>
            <strong className="font-mono text-sm font-bold text-foreground">
              {formatCurrency(previewSubtotal, "KES")}
            </strong>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="gold"
              size="sm"
              isLoading={createMutation.isPending}
              disabled={!applicationId || lineItems.length === 0}
              onClick={() => createMutation.mutate()}
            >
              Generate Invoice
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
        {/* Application Target Selection */}
        {!defaultAppId ? (
          <FormField label="Target Statutory Application" required>
            <Select
              value={applicationId}
              onChange={(e) => setApplicationId(e.target.value)}
              options={[
                { value: "", label: "Select an active statutory application..." },
                ...applications.map((app) => ({
                  value: app.id,
                  label: `#${app.applicationNumber} — ${app.service?.name || "Statutory Service"} (${app.client?.fullName || "Client"})`,
                })),
              ]}
            />
          </FormField>
        ) : (
          <div className="rounded-xs border border-border bg-muted/20 p-3 text-xs flex justify-between">
            <span className="text-muted-foreground">Target Dossier:</span>
            <span className="font-mono font-bold text-foreground">{defaultAppId}</span>
          </div>
        )}

        {/* Invoice Metadata Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Initial Invoice Status" required>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as PaymentStatus)}
              options={[
                { value: "ISSUED", label: "ISSUED (Live & Actionable by Client)" },
                { value: "DRAFT", label: "DRAFT (Internal Review Only)" },
              ]}
            />
          </FormField>

          <FormField label="Payment Due Date (Optional)">
            <Input
              type="date"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
            />
          </FormField>
        </div>

        {/* Dynamic Line Items Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Itemized Fee Structure
              </h4>
              <p className="text-[11px] text-muted-foreground">
                Split statutory government fees from agency service fees.
              </p>
            </div>
            <Button
              variant="outline"
              size="xs"
              leftIcon={<Plus className="size-3.5" />}
              onClick={handleAddLineItem}
            >
              Add Fee Line
            </Button>
          </div>

          <div className="space-y-3">
            {lineItems.map((item, index) => (
              <div
                key={item.tempId}
                className="rounded-xs border border-border bg-muted/10 p-3 space-y-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-muted-foreground text-[11px]">
                    Line #{index + 1}
                  </span>
                  {lineItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveLineItem(item.tempId)}
                      className="text-destructive hover:text-destructive/80 p-1"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <FormField label="Fee Description" required>
                      <Input
                        placeholder="e.g. Official Registry Search Fee"
                        value={item.description}
                        onChange={(e) =>
                          handleUpdateLineItem(item.tempId, "description", e.target.value)
                        }
                      />
                    </FormField>
                  </div>

                  <FormField label="Category" required>
                    <Select
                      value={item.category || "SERVICE_FEE"}
                      onChange={(e) => {
                        const cat = e.target.value as InvoiceLineItemCategory;
                        handleUpdateLineItem(item.tempId, "category", cat);
                        if (cat === "GOVERNMENT_FEE") {
                          handleUpdateLineItem(item.tempId, "isGovernmentFee", true);
                          handleUpdateLineItem(item.tempId, "isTaxable", false);
                        }
                      }}
                      options={[
                        { value: "GOVERNMENT_FEE", label: "Government Fee (Statutory)" },
                        { value: "SERVICE_FEE", label: "Professional Service Fee" },
                        { value: "EXPEDITED_FEE", label: "Expedited Processing" },
                        { value: "COURIER_FEE", label: "Courier & Delivery" },
                        { value: "DOCUMENT_AUTHENTICATION", label: "Authentication / Notary" },
                        { value: "ADDITIONAL_SERVICE", label: "Additional Services" },
                        { value: "TAX", label: "Statutory Tax" },
                        { value: "DISCOUNT", label: "Discount / Rebate" },
                        { value: "OTHER", label: "Other" },
                      ]}
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
                  <FormField label="Quantity">
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity || 1}
                      onChange={(e) =>
                        handleUpdateLineItem(item.tempId, "quantity", parseInt(e.target.value) || 1)
                      }
                    />
                  </FormField>

                  <FormField label="Unit Amount (KES)" required>
                    <Input
                      type="number"
                      min={0}
                      value={item.unitAmount || 0}
                      onChange={(e) =>
                        handleUpdateLineItem(item.tempId, "unitAmount", parseFloat(e.target.value) || 0)
                      }
                    />
                  </FormField>

                  <div className="flex items-center gap-2 pb-2">
                    <Checkbox
                      id={`gov-${item.tempId}`}
                      checked={item.isGovernmentFee || false}
                      onChange={(e) =>
                        handleUpdateLineItem(item.tempId, "isGovernmentFee", e.target.checked)
                      }
                    />
                    <label htmlFor={`gov-${item.tempId}`} className="text-[11px] text-foreground font-medium cursor-pointer">
                      Gov Fee
                    </label>
                  </div>

                  <div className="flex items-center gap-2 pb-2">
                    <Checkbox
                      id={`tax-${item.tempId}`}
                      checked={item.isTaxable || false}
                      onChange={(e) =>
                        handleUpdateLineItem(item.tempId, "isTaxable", e.target.checked)
                      }
                    />
                    <label htmlFor={`tax-${item.tempId}`} className="text-[11px] text-foreground font-medium cursor-pointer">
                      Taxable
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Invoice Notes */}
        <FormField label="Invoice Notes / Commercial Terms">
          <Textarea
            placeholder="Terms of payment, gazette reference, bank disbursement details..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </FormField>

        {createMutation.isError && (
          <div className="flex items-center gap-2 rounded-xs bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <span>{(createMutation.error as Error)?.message || "Failed to create invoice"}</span>
          </div>
        )}
      </div>
    </Modal>
  );
}
