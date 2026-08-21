"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  ChevronRight,
  Plus,
  Filter,
  UserCheck,
  Clock,
  ShieldCheck,
  Landmark,
  AlertTriangle,
  Inbox,
  CheckCircle2,
  Globe,
  Plane,
} from "lucide-react";
import { PageShell } from "@/components/ui/layout-primitives";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Pagination,
} from "@/components/ui/table-primitives";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { FormField, Textarea } from "@/components/ui/form-primitives";
import { StatusBadge, SlaBadge, PriorityBadge } from "@/components/domain/status-badges";
import { EmptyState, Skeleton, ErrorState } from "@/components/ui/feedback-primitives";
import { adminApi } from "@/lib/api/admin";
import { formatDate } from "@/lib/utils/format";
import type { ApplicationStatus, ApplicationPriority } from "@/types";

type QueueTab = "all" | "visa" | "unassigned" | "qc" | "government" | "dueSoon" | "overdue";

export default function AdminApplicationsPage() {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<QueueTab>("all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [page, setPage] = useState(1);

  // New Application Modal State
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newClientId, setNewClientId] = useState("");
  const [newServiceId, setNewServiceId] = useState("");
  const [newPriority, setNewPriority] = useState<ApplicationPriority>("NORMAL");
  const [newNotes, setNewNotes] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);

  // Dynamic Visa Intake State
  const [destinationCountry, setDestinationCountry] = useState("");
  const [visaCategory, setVisaCategory] = useState("Visitor / Tourist");
  const [passportNumber, setPassportNumber] = useState("");
  const [passportExpiry, setPassportExpiry] = useState("");
  const [travelStartDate, setTravelStartDate] = useState("");
  const [travelEndDate, setTravelEndDate] = useState("");

  // Fetch Clients & Services for creation dropdowns
  const { data: clientsData, isLoading: isClientsLoading } = useQuery({
    queryKey: ["admin-clients-select"],
    queryFn: () => adminApi.getClients({ limit: 100 }),
    enabled: isNewModalOpen,
  });

  const { data: servicesData, isLoading: isServicesLoading } = useQuery({
    queryKey: ["admin-services-select"],
    queryFn: () => adminApi.getServices(),
    enabled: isNewModalOpen,
  });

  const clients = clientsData?.items || [];
  const services = servicesData || [];

  const selectedService = services.find((s) => s.id === newServiceId);
  const isVisaService = Boolean(
    selectedService &&
      (selectedService.code?.includes("VISA") ||
        selectedService.name?.toLowerCase().includes("visa") ||
        selectedService.category?.code === "CAT-VISA" ||
        selectedService.category?.name?.toLowerCase().includes("visa"))
  );

  const handleServiceSelect = (serviceId: string) => {
    setNewServiceId(serviceId);
    setModalError(null);
    const srv = services.find((s) => s.id === serviceId);
    if (srv) {
      const nameLower = srv.name.toLowerCase();
      if (nameLower.includes("uk") || nameLower.includes("united kingdom")) {
        setDestinationCountry("United Kingdom");
      } else if (nameLower.includes("canada")) {
        setDestinationCountry("Canada");
      } else if (nameLower.includes("australia")) {
        setDestinationCountry("Australia");
      } else if (nameLower.includes("schengen") || nameLower.includes("germany")) {
        setDestinationCountry("Germany");
      } else if (nameLower.includes("us") || nameLower.includes("united states")) {
        setDestinationCountry("United States");
      } else {
        setDestinationCountry("");
      }

      if (nameLower.includes("student") || nameLower.includes("study")) {
        setVisaCategory("Student & Education");
      } else if (nameLower.includes("work")) {
        setVisaCategory("Work & Employment");
      } else if (nameLower.includes("transit")) {
        setVisaCategory("Transit / Courtesy");
      } else if (nameLower.includes("family") || nameLower.includes("partner")) {
        setVisaCategory("Family & Settlement");
      } else {
        setVisaCategory("Visitor / Tourist");
      }
    }
  };

  // Work Queue Query
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-work-queue", activeTab, page, search, statusFilter, priorityFilter],
    queryFn: () => {
      let queueParams: any = {
        page,
        limit: 10,
        search: search || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
      };

      if (activeTab === "visa") {
        queueParams.search = search ? `visa ${search}` : "visa";
      } else if (activeTab === "unassigned") {
        queueParams.needsAttention = "unassigned";
      } else if (activeTab === "qc") {
        queueParams.status = "DOCUMENT_REVIEW";
      } else if (activeTab === "government") {
        queueParams.status = "GOVERNMENT_PROCESSING";
      } else if (activeTab === "dueSoon") {
        queueParams.slaStatus = "AT_RISK";
      } else if (activeTab === "overdue") {
        queueParams.overdue = "true";
      }

      return adminApi.getWorkQueue(queueParams);
    },
  });

  const createApplicationMutation = useMutation({
    mutationFn: (payload: {
      clientId: string;
      serviceId: string;
      priority: ApplicationPriority;
      notesSummary?: string;
      metadata?: Record<string, unknown>;
    }) => adminApi.createAdminApplication(payload),
    onSuccess: () => {
      setIsNewModalOpen(false);
      setNewClientId("");
      setNewServiceId("");
      setNewNotes("");
      setModalError(null);
      setDestinationCountry("");
      setPassportNumber("");
      setPassportExpiry("");
      setTravelStartDate("");
      setTravelEndDate("");
      queryClient.invalidateQueries({ queryKey: ["admin-work-queue"] });
      queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
    },
    onError: (err: any) => {
      setModalError(err.message || "Failed to initiate filing application.");
    },
  });

  const handleCreateDossier = () => {
    setModalError(null);
    if (!newClientId) {
      setModalError("Please select a target client entity.");
      return;
    }
    if (!newServiceId) {
      setModalError("Please select a statutory service catalog item.");
      return;
    }

    const metadata: Record<string, any> = {};
    if (isVisaService) {
      if (!destinationCountry.trim()) {
        setModalError("Destination Country is required for Visa applications.");
        return;
      }
      if (!visaCategory.trim()) {
        setModalError("Visa Category is required for Visa applications.");
        return;
      }
      metadata.destinationCountry = destinationCountry.trim();
      metadata.visaCategory = visaCategory.trim();
      if (passportNumber.trim()) metadata.passportNumber = passportNumber.trim().toUpperCase();
      if (passportExpiry) metadata.passportExpiry = passportExpiry;
      if (travelStartDate) metadata.travelStartDate = travelStartDate;
      if (travelEndDate) metadata.travelEndDate = travelEndDate;
      if (selectedService?.defaultGovernmentAgency) {
        metadata.processingEmbassy = selectedService.defaultGovernmentAgency;
      }
    }

    createApplicationMutation.mutate({
      clientId: newClientId,
      serviceId: newServiceId,
      priority: newPriority,
      notesSummary: newNotes.trim() || undefined,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    });
  };

  const applications = data?.items || [];
  const pagination = data?.pagination;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-4 sm:p-5 lg:p-6 space-y-4 max-w-[1550px] mx-auto font-sans">
      {/* ------------------------------------------------------------------ */}
      {/* 1. HEADER SECTION */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Master Statutory Work Queue
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Process client dossiers, enforce statutory QA standards, track registry filings, and maintain strict SLAs.
          </p>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="bg-gradient-to-r from-[#C5A059] to-[#D4AF37] hover:from-[#b49049] hover:to-[#c39e26] text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition-all transform hover:-translate-y-0.5 flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
        >
          <Plus className="size-3.5 stroke-[3]" />
          <span>New Client Filing</span>
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. QUEUE FILTER TABS */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-wrap items-center gap-2 pb-1 border-b border-slate-200/60">
        <button
          type="button"
          onClick={() => {
            setActiveTab("all");
            setPage(1);
          }}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
            activeTab === "all"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50"
          }`}
        >
          <span>All Filings</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("visa");
            setPage(1);
          }}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
            activeTab === "visa"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50"
          }`}
        >
          <Landmark className="size-3.5" />
          <span>Visa Dossiers</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("unassigned");
            setPage(1);
          }}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
            activeTab === "unassigned"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50"
          }`}
        >
          <Inbox className="size-3.5" />
          <span>Unassigned Queue</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("qc");
            setPage(1);
          }}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
            activeTab === "qc"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50"
          }`}
        >
          <ShieldCheck className="size-3.5" />
          <span>Quality Check (QC)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("government");
            setPage(1);
          }}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
            activeTab === "government"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50"
          }`}
        >
          <Landmark className="size-3.5" />
          <span>Gov Processing</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("dueSoon");
            setPage(1);
          }}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
            activeTab === "dueSoon"
              ? "bg-amber-600 text-white shadow-xs"
              : "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
          }`}
        >
          <Clock className="size-3.5" />
          <span>Due Soon (&lt;24h)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("overdue");
            setPage(1);
          }}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
            activeTab === "overdue"
              ? "bg-rose-600 text-white shadow-xs"
              : "bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100"
          }`}
        >
          <AlertTriangle className="size-3.5" />
          <span>SLA Overdue</span>
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. SEARCH & FILTER CONTROLS */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by app #, client name, PIN, or service..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium text-slate-800 placeholder-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-semibold text-slate-700"
          >
            <option value="">All Priorities</option>
            <option value="URGENT">Urgent Priority</option>
            <option value="HIGH">High Priority</option>
            <option value="NORMAL">Normal Priority</option>
            <option value="LOW">Low Priority</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-semibold text-slate-700"
          >
            <option value="">All Lifecycle States</option>
            <option value="NEW">New Application</option>
            <option value="QUALIFICATION">Qualification</option>
            <option value="REQUIREMENTS_PENDING">Requirements Pending</option>
            <option value="DOCUMENT_REVIEW">Document Review</option>
            <option value="READY_FOR_SUBMISSION">Ready for Submission</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="GOVERNMENT_PROCESSING">Government Processing</option>
            <option value="APPROVED">Approved</option>
            <option value="QUALITY_CHECK">Quality Check</option>
            <option value="READY_FOR_DELIVERY">Ready for Delivery</option>
            <option value="CLOSED">Closed / Completed</option>
          </select>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 4. TABLE CONTAINER */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-slate-100 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <p className="text-xs font-bold text-rose-600">Failed to load work queue items.</p>
            <button
              onClick={() => refetch()}
              className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
            >
              Retry Loading
            </button>
          </div>
        ) : applications.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <h3 className="text-sm font-bold text-slate-800">No applications in selected queue</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No statutory applications matched the current filters or workload bucket.
            </p>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Dossier #</th>
                    <th className="py-3 px-4">Client Entity</th>
                    <th className="py-3 px-4">Statutory Service</th>
                    <th className="py-3 px-4">Lifecycle State</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Officer</th>
                    <th className="py-3 px-4">SLA Progress</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        #{app.applicationNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 text-xs">
                            {app.client?.fullName || app.client?.businessName || "Client"}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {app.client?.phone || app.client?.email || ""}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 text-xs block group-hover:text-amber-700 transition-colors">
                          {app.service?.name || "Statutory Service"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {app.service?.category?.name || "Government Filing"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={app.status} size="sm" />
                      </td>
                      <td className="py-3 px-4">
                        <PriorityBadge priority={app.priority} size="sm" />
                      </td>
                      <td className="py-3 px-4">
                        {app.assignedAdmin ? (
                          <span className="inline-flex items-center gap-1 font-bold text-slate-800 text-[11px]">
                            <UserCheck className="size-3 text-emerald-600" />
                            {app.assignedAdmin.fullName || app.assignedAdmin.email}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <SlaBadge status={app.slaStatus} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link href={`/admin/applications/${app.id}`}>
                          <button className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors bg-amber-50 hover:bg-amber-100/80 px-2.5 py-1 rounded-lg border border-amber-200/60">
                            <span>Process Dossier</span>
                            <ChevronRight className="size-3.5" />
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PAGINATION FOOTER */}
            {pagination && (pagination.totalPages ?? 0) > 1 && (
              <div className="px-4 py-3 bg-slate-50/60 border-t border-slate-200/80 flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>
                  Page {pagination.page} of {pagination.totalPages} ({pagination.total} total items)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* NEW APPLICATION INTAKE MODAL */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => {
          setIsNewModalOpen(false);
          setModalError(null);
        }}
        title="Initiate Statutory Client Filing"
        description="Create a new government application dossier on behalf of an authenticated client entity."
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsNewModalOpen(false);
                setModalError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="gold"
              size="sm"
              isLoading={createApplicationMutation.isPending}
              disabled={createApplicationMutation.isPending}
              onClick={handleCreateDossier}
            >
              Create Statutory Dossier
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {modalError && (
            <div className="rounded-xs border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-semibold text-rose-800 flex items-center justify-between">
              <span>{modalError}</span>
              <button
                type="button"
                onClick={() => setModalError(null)}
                className="text-rose-600 hover:text-rose-900 font-bold ml-2"
              >
                ✕
              </button>
            </div>
          )}

          <FormField label="Target Client" required>
            <Select
              value={newClientId}
              onChange={(e) => {
                setNewClientId(e.target.value);
                setModalError(null);
              }}
              options={[
                {
                  value: "",
                  label: isClientsLoading ? "Loading clients..." : "Select client entity...",
                },
                ...clients.map((c) => ({
                  value: c.id,
                  label: `${c.fullName || c.businessName || "Client"} (${c.phone || c.email})`,
                })),
              ]}
            />
          </FormField>

          <FormField label="Statutory Service" required>
            <Select
              value={newServiceId}
              onChange={(e) => handleServiceSelect(e.target.value)}
              options={[
                {
                  value: "",
                  label: isServicesLoading ? "Loading services catalog..." : "Select statutory service catalog...",
                },
                ...services.map((s) => ({
                  value: s.id,
                  label: `${s.name} — KES ${(Number(s.serviceFee) + Number(s.governmentFee || 0)).toLocaleString()}`,
                })),
              ]}
            />
          </FormField>

          {/* DYNAMIC VISA INTAKE METADATA SECTION */}
          {isVisaService && (
            <div className="space-y-3 p-3 rounded-xs border border-amber-300/80 bg-amber-50/40 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-amber-900 border-b border-amber-200/80 pb-2">
                <Globe className="size-4 text-amber-700" />
                <span>Consular &amp; Visa Intake Metadata</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label="Destination Country" required>
                  <Input
                    value={destinationCountry}
                    onChange={(e) => {
                      setDestinationCountry(e.target.value);
                      setModalError(null);
                    }}
                    placeholder="e.g. United Kingdom"
                  />
                </FormField>
                <FormField label="Visa Category" required>
                  <Select
                    value={visaCategory}
                    onChange={(e) => {
                      setVisaCategory(e.target.value);
                      setModalError(null);
                    }}
                    options={[
                      { value: "Visitor / Tourist", label: "Visitor / Tourist" },
                      { value: "Business & Investment", label: "Business & Investment" },
                      { value: "Student & Education", label: "Student & Education" },
                      { value: "Work & Employment", label: "Work & Employment" },
                      { value: "Transit / Courtesy", label: "Transit / Courtesy" },
                      { value: "Family & Settlement", label: "Family & Settlement" },
                    ]}
                  />
                </FormField>
                <FormField label="Passport Number">
                  <Input
                    value={passportNumber}
                    onChange={(e) => setPassportNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. AK8910234"
                    className="font-mono uppercase"
                  />
                </FormField>
                <FormField label="Passport Expiry Date">
                  <Input
                    type="date"
                    value={passportExpiry}
                    onChange={(e) => setPassportExpiry(e.target.value)}
                  />
                </FormField>
                <FormField label="Intended Travel Start Date">
                  <Input
                    type="date"
                    value={travelStartDate}
                    onChange={(e) => setTravelStartDate(e.target.value)}
                  />
                </FormField>
                <FormField label="Intended Return Date">
                  <Input
                    type="date"
                    value={travelEndDate}
                    onChange={(e) => setTravelEndDate(e.target.value)}
                  />
                </FormField>
              </div>
            </div>
          )}

          <FormField label="Priority Tier" required>
            <Select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value as ApplicationPriority)}
              options={[
                { value: "LOW", label: "Low Priority" },
                { value: "NORMAL", label: "Normal Priority (Standard SLA)" },
                { value: "HIGH", label: "High Priority (Expedited)" },
                { value: "URGENT", label: "Urgent Priority (Direct Officer Focus)" },
              ]}
            />
          </FormField>

          <FormField label="Intake Notes / Instructions">
            <Textarea
              placeholder="Record initial client instructions or special statutory filing context..."
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              rows={3}
            />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
