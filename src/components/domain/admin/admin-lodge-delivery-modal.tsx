"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Package,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Truck,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { adminApi } from "@/lib/api/admin";
import type { Application, ClientProfile } from "@/types";

interface AdminLodgeDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface DocumentItem {
  id: string;
  name: string;
  type: string;
  reference: string;
  date: string;
}

export function AdminLodgeDeliveryModal({
  isOpen,
  onClose,
  onSuccess,
}: AdminLodgeDeliveryModalProps) {
  const queryClient = useQueryClient();

  // Step / Section State
  const [deliveryType, setDeliveryType] = useState("Certificate");
  const [priority, setPriority] = useState("Normal");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedAppId, setSelectedAppId] = useState("");

  // Recipient & Address State
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [physicalAddress, setPhysicalAddress] = useState("");
  const [cityCounty, setCityCounty] = useState("Nairobi");
  const [postalCode, setPostalCode] = useState("00100");
  const [deliveryInstructions, setDeliveryInstructions] = useState("");

  // Dispatch & Courier State
  const [carrier, setCarrier] = useState("Fargo Courier");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [dispatchMethod, setDispatchMethod] = useState("Courier");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [dispatchDate, setDispatchDate] = useState("");

  // Documents & Notes State
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [docNameInput, setDocNameInput] = useState("");
  const [docTypeInput, setDocTypeInput] = useState("CERTIFICATE");
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  // Validation State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successBanner, setSuccessBanner] = useState<any | null>(null);

  // 1. Query client directory
  const { data: clientsData } = useQuery({
    queryKey: ["admin-clients-directory"],
    queryFn: () => adminApi.getClients({ page: 1, limit: 100 }),
    enabled: isOpen,
  });
  const clients: ClientProfile[] = clientsData?.items || [];

  // 2. Query applications/dossiers
  const { data: appsData } = useQuery({
    queryKey: ["admin-applications-directory"],
    queryFn: () => adminApi.getApplications({ page: 1, limit: 100 }),
    enabled: isOpen,
  });
  const rawFetchedItems = (appsData as any)?.items || (Array.isArray(appsData) ? appsData : []);
  const applications: Application[] = rawFetchedItems;

  // Auto prefill recipient when client is selected
  useEffect(() => {
    if (selectedClientId) {
      const client = clients.find((c) => c.id === selectedClientId);
      if (client) {
        setRecipientName(client.fullName || client.businessName || "");
        setRecipientPhone(client.phone || "");
        setRecipientEmail(client.email || "");
        setPhysicalAddress(client.address || "");
      }
    }
  }, [selectedClientId, clients]);

  // Auto select client when dossier application is selected
  const handleAppSelect = (appId: string) => {
    setSelectedAppId(appId);
    if (!appId) return;
    const app = applications.find((a) => a.id === appId);
    if (app && app.client) {
      setSelectedClientId(app.client.id || app.clientId);
      setRecipientName(app.client.fullName || app.client.businessName || "");
      setRecipientPhone(app.client.phone || "");
      setRecipientEmail(app.client.email || "");
      setPhysicalAddress(app.client.address || "");

      // Pre-attach application documents if present
      if (app.documents && app.documents.length > 0 && documents.length === 0) {
        const initialDocs = app.documents.map((d) => ({
          id: d.id,
          name: d.title || "Statutory Certificate",
          type: d.documentType || "CERTIFICATE",
          reference: d.documentNumber || `DOC-${d.id.slice(0, 6)}`,
          date: new Date().toLocaleDateString("en-GB"),
        }));
        setDocuments(initialDocs);
      }
    }
  };

  // Generate Waybill helper
  const handleGenerateWaybill = () => {
    const randomCode = Math.floor(100000 + Math.random() * 900000);
    const prefix = carrier.toUpperCase().includes("FARGO")
      ? "WB-FRG"
      : carrier.toUpperCase().includes("G4S")
      ? "WB-G4S"
      : "WB-SD";
    setTrackingNumber(`${prefix}-${new Date().getFullYear()}-${randomCode}`);
  };

  // Add Document Item
  const handleAddDocumentItem = () => {
    if (!docNameInput.trim()) return;
    const newDoc: DocumentItem = {
      id: `doc-${Date.now()}`,
      name: docNameInput.trim(),
      type: docTypeInput,
      reference: `REF-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toLocaleDateString("en-GB"),
    };
    setDocuments([...documents, newDoc]);
    setDocNameInput("");
    setShowAddDoc(false);
  };

  const handleRemoveDoc = (id: string) => {
    setDocuments(documents.filter((d) => d.id !== id));
  };

  // Lodge Delivery Mutation
  const lodgeMutation = useMutation({
    mutationFn: (payload: any) => adminApi.lodgeDelivery(payload),
    onSuccess: (data) => {
      setSuccessBanner({
        dispatchReference: data.dispatchReference || `DLV-${Date.now()}`,
        trackingNumber: data.trackingNumber || trackingNumber || "WB-PENDING",
        recipientName: data.recipientName,
        carrier: data.carrier || carrier,
        status: data.confirmationStatus || "AWAITING_DISPATCH",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-deliveries-list"] });
      queryClient.invalidateQueries({ queryKey: ["admin-applications"] });
      if (onSuccess) onSuccess();
    },
  });

  // Validate form
  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!selectedClientId) errs.client = "Please select an existing client";
    if (!recipientName.trim()) errs.recipientName = "Recipient name is required";
    if (!recipientPhone.trim()) errs.recipientPhone = "Recipient phone (+254) is required";
    if (!physicalAddress.trim()) errs.physicalAddress = "Delivery physical address is required";
    if (!deliveryType) errs.deliveryType = "Delivery type is required";
    if (!dispatchMethod) errs.dispatchMethod = "Dispatch method is required";
    if (documents.length === 0) errs.documents = "At least one document must be attached to the delivery";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    lodgeMutation.mutate({
      applicationId: selectedAppId || undefined,
      clientId: selectedClientId,
      deliveryType,
      priority,
      deliveryMethod: "PHYSICAL",
      recipientName,
      recipientPhone,
      recipientEmail,
      physicalAddress,
      cityCounty,
      postalCode,
      deliveryInstructions,
      carrier,
      trackingNumber,
      dispatchMethod,
      expectedDeliveryDate,
      dispatchDate,
      documents,
      specialInstructions,
      internalNotes,
    });
  };

  const selectedClient = clients.find((c) => c.id === selectedClientId);
  const selectedApp = applications.find((a) => a.id === selectedAppId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Lodge New Delivery"
      description="Create a dispatch record and prepare documents for physical delivery."
      size="xl"
    >
      {successBanner ? (
        /* SUCCESS SUMMARY BANNER */
        <div className="py-6 px-4 space-y-4 text-center">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full mx-auto flex items-center justify-center border border-emerald-200">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Delivery Lodged Successfully</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              The shipment has been queued with initial status: <span className="font-bold text-amber-700">AWAITING_DISPATCH</span>
            </p>
          </div>

          <div className="max-w-md mx-auto p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
            <div className="flex justify-between border-b border-slate-200/80 pb-2">
              <span className="text-slate-400 font-bold">Delivery Reference:</span>
              <span className="font-mono font-bold text-slate-900">{successBanner.dispatchReference}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/80 pb-2">
              <span className="text-slate-400 font-bold">Waybill / Tracking:</span>
              <span className="font-mono font-bold text-amber-700">{successBanner.trackingNumber}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/80 pb-2">
              <span className="text-slate-400 font-bold">Recipient:</span>
              <span className="font-bold text-slate-800">{successBanner.recipientName}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/80 pb-2">
              <span className="text-slate-400 font-bold">Courier Carrier:</span>
              <span className="font-bold text-slate-800">{successBanner.carrier}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-bold">Initial Status:</span>
              <span className="font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[11px]">
                AWAITING_DISPATCH
              </span>
            </div>
          </div>

          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => {
                setSuccessBanner(null);
                onClose();
              }}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all shadow-xs"
            >
              Done &amp; Close
            </button>
          </div>
        </div>
      ) : (
        /* MULTI-SECTION LODGE FORM */
        <form onSubmit={handleSubmit} className="space-y-6 text-xs font-sans max-h-[75vh] overflow-y-auto pr-1">
          {/* ------------------------------------------------------------------ */}
          {/* SECTION A — DELIVERY REFERENCE */}
          {/* ------------------------------------------------------------------ */}
          <div className="p-4 rounded-xl bg-slate-50/60 border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2">
              <Package className="w-4 h-4 text-amber-600" />
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Section A — Delivery Reference &amp; Client Association
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Delivery Type */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Delivery Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={deliveryType}
                  onChange={(e) => setDeliveryType(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                >
                  <option value="Client Documents">Client Documents</option>
                  <option value="Certificate">Certificate</option>
                  <option value="Statutory Document">Statutory Document</option>
                  <option value="Compliance Documents">Compliance Documents</option>
                  <option value="Application Documents">Application Documents</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Priority <span className="text-rose-500">*</span>
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                >
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              {/* Related Case / Dossier */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Related Dossier / Case
                </label>
                <select
                  value={selectedAppId}
                  onChange={(e) => handleAppSelect(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                >
                  <option value="">-- Standalone / Select Case --</option>
                  {applications.map((app) => (
                    <option key={app.id} value={app.id}>
                      #{app.applicationNumber} - {app.service?.name} ({app.client?.fullName || "Client"})
                    </option>
                  ))}
                </select>
                {selectedApp && (
                  <span className="text-[10px] text-amber-700 font-mono font-bold mt-1 block">
                    Selected Dossier: #{selectedApp.applicationNumber}
                  </span>
                )}
              </div>
            </div>

            {/* Client Directory Selection */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Client Directory <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className={`w-full px-3 py-1.5 rounded-lg bg-white border font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 ${
                  errors.client ? "border-rose-400 bg-rose-50/20" : "border-slate-200"
                }`}
              >
                <option value="">-- Search &amp; Select Existing Client --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName || c.businessName} ({c.email || c.phone})
                  </option>
                ))}
              </select>
              {errors.client && <span className="text-[10px] font-bold text-rose-600 mt-1 block">{errors.client}</span>}
            </div>

            {/* Client Read-Only Summary Card */}
            {selectedClient && (
              <div className="p-3 rounded-lg bg-white border border-slate-200 text-slate-700 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="font-bold text-slate-900">{selectedClient.fullName || selectedClient.businessName}</span>
                </div>
                <div className="flex items-center gap-4 text-[11px] text-slate-500 font-medium">
                  <span>Phone: <strong className="text-slate-800">{selectedClient.phone || "N/A"}</strong></span>
                  <span>Email: <strong className="text-slate-800">{selectedClient.email || "N/A"}</strong></span>
                </div>
              </div>
            )}
          </div>

          {/* ------------------------------------------------------------------ */}
          {/* SECTION B — RECIPIENT & DESTINATION */}
          {/* ------------------------------------------------------------------ */}
          <div className="p-4 rounded-xl bg-slate-50/60 border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2">
              <MapPin className="w-4 h-4 text-amber-600" />
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Section B — Recipient &amp; Destination Address
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Recipient Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className={`w-full px-3 py-1.5 rounded-lg bg-white border font-medium text-slate-800 focus:border-amber-500 ${
                    errors.recipientName ? "border-rose-400" : "border-slate-200"
                  }`}
                />
                {errors.recipientName && (
                  <span className="text-[10px] font-bold text-rose-600 mt-1 block">{errors.recipientName}</span>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Recipient Phone (+254) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  placeholder="+254712345678"
                  className={`w-full px-3 py-1.5 rounded-lg bg-white border font-medium text-slate-800 focus:border-amber-500 ${
                    errors.recipientPhone ? "border-rose-400" : "border-slate-200"
                  }`}
                />
                {errors.recipientPhone && (
                  <span className="text-[10px] font-bold text-rose-600 mt-1 block">{errors.recipientPhone}</span>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Recipient Email</label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 font-medium text-slate-800 focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Delivery Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={physicalAddress}
                  onChange={(e) => setPhysicalAddress(e.target.value)}
                  placeholder="e.g. Westlands Commercial Center, 4th Floor, Suite 402"
                  className={`w-full px-3 py-1.5 rounded-lg bg-white border font-medium text-slate-800 focus:border-amber-500 ${
                    errors.physicalAddress ? "border-rose-400" : "border-slate-200"
                  }`}
                />
                {errors.physicalAddress && (
                  <span className="text-[10px] font-bold text-rose-600 mt-1 block">{errors.physicalAddress}</span>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">City / County</label>
                <input
                  type="text"
                  value={cityCounty}
                  onChange={(e) => setCityCounty(e.target.value)}
                  placeholder="Nairobi"
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 font-medium text-slate-800 focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Delivery Instructions for Courier</label>
              <textarea
                value={deliveryInstructions}
                onChange={(e) => setDeliveryInstructions(e.target.value)}
                rows={2}
                placeholder="Gate pass requirements, security call before arrival, office hours..."
                className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 font-medium text-slate-800 focus:border-amber-500"
              />
            </div>
          </div>

          {/* ------------------------------------------------------------------ */}
          {/* SECTION C — COURIER & DISPATCH INFORMATION */}
          {/* ------------------------------------------------------------------ */}
          <div className="p-4 rounded-xl bg-slate-50/60 border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2">
              <Truck className="w-4 h-4 text-amber-600" />
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Section C — Courier &amp; Dispatch Details
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Courier / Carrier</label>
                <select
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 font-semibold text-slate-800 focus:border-amber-500"
                >
                  <option value="Fargo Courier">Fargo Courier</option>
                  <option value="G4S Secure Logistics">G4S Secure Logistics</option>
                  <option value="Speedaf Express">Speedaf Express</option>
                  <option value="Sendy Logistics">Sendy Logistics</option>
                  <option value="Swift Doc In-House Rider">Swift Doc In-House Rider</option>
                  <option value="Registered Mail">Registered Mail</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Tracking / Waybill Number
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="e.g. WB-839201"
                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 font-mono font-bold text-amber-700 focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateWaybill}
                    className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold text-[11px] rounded-lg transition-all shrink-0"
                    title="Auto generate waybill number"
                  >
                    Generate Waybill
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Dispatch Method</label>
                <select
                  value={dispatchMethod}
                  onChange={(e) => setDispatchMethod(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 font-semibold text-slate-800 focus:border-amber-500"
                >
                  <option value="Courier">Courier</option>
                  <option value="Hand Delivery">Hand Delivery</option>
                  <option value="Internal Dispatch">Internal Dispatch</option>
                  <option value="Registered Mail">Registered Mail</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Expected Delivery Date</label>
                <input
                  type="date"
                  value={expectedDeliveryDate}
                  onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 font-medium text-slate-800 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Dispatch Date</label>
                <input
                  type="date"
                  value={dispatchDate}
                  onChange={(e) => setDispatchDate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 font-medium text-slate-800 focus:border-amber-500"
                />
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200/60 text-amber-800 text-[11px] font-medium flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 text-amber-700" />
              <span>
                Initial Status will be set to <strong className="font-bold">AWAITING_DISPATCH</strong> until physical handover occurs.
              </span>
            </div>
          </div>

          {/* ------------------------------------------------------------------ */}
          {/* SECTION D — DOCUMENTS TO DELIVER */}
          {/* ------------------------------------------------------------------ */}
          <div className="p-4 rounded-xl bg-slate-50/60 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                  Section D — Documents Included in Shipment ({documents.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddDoc(true)}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold text-[11px] flex items-center gap-1 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Document</span>
              </button>
            </div>

            {errors.documents && (
              <span className="text-[10px] font-bold text-rose-600 block">{errors.documents}</span>
            )}

            {documents.length === 0 ? (
              <div className="p-4 text-center text-slate-400 bg-white rounded-lg border border-dashed border-slate-200">
                No documents attached yet. Click <strong>+ Add Document</strong> to include statutory certificates or filings.
              </div>
            ) : (
              <div className="space-y-1.5">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-amber-600 shrink-0" />
                      <div>
                        <span className="font-bold text-slate-900">{doc.name}</span>
                        <div className="text-[10px] text-slate-500 font-medium flex items-center gap-2">
                          <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">{doc.type}</span>
                          <span>Ref: {doc.reference}</span>
                          <span>Date: {doc.date}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveDoc(doc.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                      title="Remove document"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Add Doc Input Inline */}
            {showAddDoc && (
              <div className="p-3 rounded-lg bg-white border border-amber-200 space-y-2">
                <div className="font-bold text-slate-800 text-[11px]">Add Document to Dispatch Manifest</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Document Title (e.g. Official Business Registration Certificate)"
                    value={docNameInput}
                    onChange={(e) => setDocNameInput(e.target.value)}
                    className="px-2.5 py-1 rounded bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:border-amber-500"
                  />
                  <select
                    value={docTypeInput}
                    onChange={(e) => setDocTypeInput(e.target.value)}
                    className="px-2.5 py-1 rounded bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:border-amber-500"
                  >
                    <option value="CERTIFICATE">CERTIFICATE</option>
                    <option value="STATUTORY_FILING">STATUTORY FILING</option>
                    <option value="CR12_EXTRACT">CR12 EXTRACT</option>
                    <option value="TAX_COMPLIANCE">TAX COMPLIANCE</option>
                    <option value="PASSPORT_DOC">PASSPORT DOC</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddDoc(false)}
                    className="px-2 py-1 bg-slate-100 text-slate-600 rounded font-bold text-[11px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddDocumentItem}
                    className="px-3 py-1 bg-amber-600 text-white rounded font-bold text-[11px]"
                  >
                    Confirm Add
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ------------------------------------------------------------------ */}
          {/* SECTION E — PROOF & INTERNAL INSTRUCTIONS */}
          {/* ------------------------------------------------------------------ */}
          <div className="p-4 rounded-xl bg-slate-50/60 border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2">
              <FileText className="w-4 h-4 text-amber-600" />
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Section E — Special Instructions &amp; Internal Notes
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Special Instructions (Recipient-Facing)
                </label>
                <textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  rows={2}
                  placeholder="Instructions printed on waybill or delivery label..."
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 font-medium text-slate-800 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Internal Operations Notes <span className="text-amber-700 font-bold">(Restricted - Admin Only)</span>
                </label>
                <textarea
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  rows={2}
                  placeholder="Confidential ops notes, client special request, internal routing history..."
                  className="w-full px-3 py-1.5 rounded-lg bg-white border border-amber-200 bg-amber-50/20 font-medium text-slate-800 focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Submission Action Bar */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={lodgeMutation.isPending}
              className="px-5 py-2 bg-gradient-to-r from-[#C5A059] to-[#D4AF37] hover:from-[#b49049] hover:to-[#c39e26] text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              {lodgeMutation.isPending ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Lodging Delivery...</span>
                </>
              ) : (
                <>
                  <Package className="w-3.5 h-3.5" />
                  <span>Lodge Delivery</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
