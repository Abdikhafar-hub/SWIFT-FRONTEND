"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  FileCheck,
  Landmark,
  DollarSign,
  Truck,
  MessageSquare,
  ShieldCheck,
  FolderOpen,
  Clock,
  UserCheck,
  AlertCircle,
  Plus,
  Send,
  Download,
  AlertTriangle,
} from "lucide-react";
import { PageShell } from "@/components/ui/layout-primitives";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { FormField, Textarea } from "@/components/ui/form-primitives";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  StatusBadge,
  SlaBadge,
  PriorityBadge,
} from "@/components/domain/status-badges";
import { ApplicationTimelineView } from "@/components/domain/application-timeline-view";
import { Skeleton, ErrorState } from "@/components/ui/feedback-primitives";
import {
  AdminStatusControl,
  AdminRequirementReviewer,
  AdminGovernmentController,
  AdminQcModal,
  AdminManualPaymentModal,
  AdminDeliveryModal,
  AdminCreateInvoiceModal,
  AdminInvoiceDetailModal,
  AdminFinancialAdjustmentModal,
  AdminReceiptDetailModal,
} from "@/components/domain";
import { adminApi } from "@/lib/api/admin";
import { applicationsApi } from "@/lib/api/applications";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { ApplicationStatus, NoteVisibility, Payment, PaymentTransaction } from "@/types";

type DossierTab =
  | "overview"
  | "requirements"
  | "government"
  | "financials"
  | "documents"
  | "delivery"
  | "notes";

export default function AdminApplicationDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<DossierTab>("overview");

  // Modal triggers
  const [isQcModalOpen, setIsQcModalOpen] = useState(false);
  const [isManualPayModalOpen, setIsManualPayModalOpen] = useState(false);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const [selectedDetailInvoiceId, setSelectedDetailInvoiceId] = useState<string | null>(null);
  const [selectedInvoiceForAdjust, setSelectedInvoiceForAdjust] = useState<Payment | null>(null);
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);

  // Form states
  const [assignedAdminId, setAssignedAdminId] = useState("");
  const [assignReason, setAssignReason] = useState("");

  const [actionTitle, setActionTitle] = useState("");
  const [actionDescription, setActionDescription] = useState("");
  const [actionPriority, setActionPriority] = useState<"NORMAL" | "HIGH" | "URGENT">("NORMAL");
  const [actionDeadline, setActionDeadline] = useState("");

  const [noteContent, setNoteContent] = useState("");
  const [noteVisibility, setNoteVisibility] = useState<NoteVisibility>("INTERNAL");

  // Queries
  const {
    data: application,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-application", id],
    queryFn: () => adminApi.getApplicationById(id),
  });

  const { data: readiness } = useQuery({
    queryKey: ["admin-readiness", id],
    queryFn: () => adminApi.getApplicationReadiness(id),
    enabled: Boolean(id),
  });

  const { data: timelineData } = useQuery({
    queryKey: ["admin-timeline", id],
    queryFn: () => applicationsApi.getTimeline(id),
    enabled: Boolean(id),
  });

  // Mutations
  const assignMutation = useMutation({
    mutationFn: () =>
      adminApi.assignAdmin(id, {
        adminId: assignedAdminId,
        reason: assignReason || undefined,
      }),
    onSuccess: () => {
      setIsAssignModalOpen(false);
      setAssignedAdminId("");
      setAssignReason("");
      queryClient.invalidateQueries({ queryKey: ["admin-application", id] });
    },
  });

  const unassignMutation = useMutation({
    mutationFn: () => adminApi.unassignAdmin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-application", id] });
    },
  });

  const createActionMutation = useMutation({
    mutationFn: () =>
      adminApi.createClientAction(id, {
        actionType: "DOCUMENT_UPLOAD",
        title: actionTitle,
        description: actionDescription,
        priority: actionPriority,
        deadline: actionDeadline || undefined,
      }),
    onSuccess: () => {
      setIsActionModalOpen(false);
      setActionTitle("");
      setActionDescription("");
      queryClient.invalidateQueries({ queryKey: ["admin-application", id] });
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: () =>
      adminApi.addNote(id, {
        content: noteContent,
        visibility: noteVisibility,
      }),
    onSuccess: () => {
      setNoteContent("");
      queryClient.invalidateQueries({ queryKey: ["admin-application", id] });
    },
  });

  if (isLoading) {
    return (
      <PageShell title="Loading Statutory Dossier...">
        <div className="space-y-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </PageShell>
    );
  }

  if (error || !application) {
    return (
      <PageShell title="Operations Dossier">
        <ErrorState onRetry={() => refetch()} />
      </PageShell>
    );
  }

  const requirements = application.requirements || [];
  const documents = application.documents || [];
  const governmentApplications = application.governmentApps || (application as any).governmentApplications || [];
  const invoices = application.payments || (application as any).invoices || [];
  const primaryInvoice = invoices[0];
  const deliveries = application.deliveries || (application.delivery ? [application.delivery] : []);
  const notes = application.notes || [];
  const activities = timelineData || [];
  const clientActions = application.clientActions || [];

  return (
    <PageShell
      eyebrow={`DOSSIER #${application.applicationNumber}`}
      title={application.service?.name || "Statutory Dossier"}
      description={`Client: ${application.client?.fullName || application.client?.businessName || "Verified Entity"} • Reference: ${application.id}`}
      actions={
        <div className="flex items-center gap-2">
          <Link href="/admin/applications">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="size-3.5" />}>
              Work Queue
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            className="text-gold-dark border-gold/40 hover:bg-gold/10"
            leftIcon={<ShieldCheck className="size-4" />}
            onClick={() => setIsQcModalOpen(true)}
          >
            Statutory QC
          </Button>
        </div>
      }
    >
      {/* 1. TOP STATUS & SLA COMPLIANCE CONTROL PANEL */}
      <AdminStatusControl
        application={application}
        onUpdated={() => {
          queryClient.invalidateQueries({ queryKey: ["admin-application", id] });
          queryClient.invalidateQueries({ queryKey: ["admin-readiness", id] });
        }}
      />

      {/* 2. DOSSIER 7-TAB NAVIGATION */}
      <div className="mt-6 flex flex-wrap items-center gap-1 border-b border-border pb-1">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 rounded-xs px-3.5 py-2 text-xs font-bold transition-all ${
            activeTab === "overview"
              ? "border-b-2 border-gold text-gold-dark dark:text-gold bg-gold/5"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
          }`}
        >
          <span>1. Overview & Readiness</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("requirements")}
          className={`flex items-center gap-2 rounded-xs px-3.5 py-2 text-xs font-bold transition-all ${
            activeTab === "requirements"
              ? "border-b-2 border-gold text-gold-dark dark:text-gold bg-gold/5"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
          }`}
        >
          <FileCheck className="size-3.5" />
          <span>2. Requirements ({requirements.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("government")}
          className={`flex items-center gap-2 rounded-xs px-3.5 py-2 text-xs font-bold transition-all ${
            activeTab === "government"
              ? "border-b-2 border-gold text-gold-dark dark:text-gold bg-gold/5"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
          }`}
        >
          <Landmark className="size-3.5" />
          <span>3. Government Filings ({governmentApplications.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("financials")}
          className={`flex items-center gap-2 rounded-xs px-3.5 py-2 text-xs font-bold transition-all ${
            activeTab === "financials"
              ? "border-b-2 border-gold text-gold-dark dark:text-gold bg-gold/5"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
          }`}
        >
          <DollarSign className="size-3.5" />
          <span>4. Financials & Settlement</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("documents")}
          className={`flex items-center gap-2 rounded-xs px-3.5 py-2 text-xs font-bold transition-all ${
            activeTab === "documents"
              ? "border-b-2 border-gold text-gold-dark dark:text-gold bg-gold/5"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
          }`}
        >
          <FolderOpen className="size-3.5" />
          <span>5. Document Vault ({documents.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("delivery")}
          className={`flex items-center gap-2 rounded-xs px-3.5 py-2 text-xs font-bold transition-all ${
            activeTab === "delivery"
              ? "border-b-2 border-gold text-gold-dark dark:text-gold bg-gold/5"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
          }`}
        >
          <Truck className="size-3.5" />
          <span>6. Delivery Fulfillment</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("notes")}
          className={`flex items-center gap-2 rounded-xs px-3.5 py-2 text-xs font-bold transition-all ${
            activeTab === "notes"
              ? "border-b-2 border-gold text-gold-dark dark:text-gold bg-gold/5"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
          }`}
        >
          <MessageSquare className="size-3.5" />
          <span>7. Notes & Actions ({notes.length})</span>
        </button>
      </div>

      {/* 3. TAB CONTENT VIEWS */}
      <div className="mt-6">
        {/* TAB 1: OVERVIEW & READINESS */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left Col: Readiness & Summary */}
            <div className="space-y-6 lg:col-span-2">
              {/* Readiness Audit Report */}
              {readiness && (
                <Card padding="md" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <ShieldCheck className="size-4 text-gold" />
                      <span>Statutory Submission Readiness Audit</span>
                    </h4>
                    <Badge tone={readiness.ready ? "success" : "warning"} size="md">
                      {readiness.ready ? "READY FOR REGISTRY SUBMISSION" : "BLOCKED / INCOMPLETE"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="rounded-xs border border-border bg-muted/20 p-2.5">
                      <span className="text-muted-foreground block text-[11px]">Requirements</span>
                      <strong className="text-foreground">
                        {readiness.satisfiedRequiredRequirements} / {readiness.requiredRequirements} Satisfied
                      </strong>
                    </div>

                    <div className="rounded-xs border border-border bg-muted/20 p-2.5">
                      <span className="text-muted-foreground block text-[11px]">Payment Status</span>
                      <strong className={readiness.isPaymentComplete ? "text-emerald-600" : "text-amber-600"}>
                        {readiness.isPaymentComplete ? "Settled in Full" : `Due: KES ${readiness.outstandingAmount}`}
                      </strong>
                    </div>

                    <div className="rounded-xs border border-border bg-muted/20 p-2.5">
                      <span className="text-muted-foreground block text-[11px]">Quality Check (QC)</span>
                      <strong className={readiness.qualityCheckPassed ? "text-emerald-600" : "text-muted-foreground"}>
                        {readiness.qualityCheckPassed ? "Certified Passed" : "Pending QC"}
                      </strong>
                    </div>

                    <div className="rounded-xs border border-border bg-muted/20 p-2.5">
                      <span className="text-muted-foreground block text-[11px]">Gov Status</span>
                      <strong className="text-foreground">
                        {readiness.governmentProcessingStatus || "Not Submitted"}
                      </strong>
                    </div>
                  </div>

                  {readiness.blockers && readiness.blockers.length > 0 && (
                    <div className="rounded-xs border border-amber-500/30 bg-amber-500/10 p-3 text-xs space-y-1">
                      <strong className="text-amber-900 dark:text-amber-200 block font-bold">
                        Pending Actions Before Registry Submission:
                      </strong>
                      <ul className="list-disc list-inside space-y-0.5 text-amber-800 dark:text-amber-300">
                        {readiness.blockers.map((b: string, i: number) => (
                          <li key={i}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Card>
              )}

              {/* Visa Application Specific Context Card */}
              {(() => {
                const meta = (application.metadata || {}) as Record<string, any>;
                if (!meta.destinationCountry && !meta.passportNumber && !meta.visaCategory) return null;
                return (
                  <Card padding="md" className="space-y-3 border-gold/40 bg-gold/5">
                    <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Landmark className="size-4 text-gold" />
                      <span>Consular Intake & Visa Passport Parameters</span>
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      {meta.destinationCountry && (
                        <div className="rounded-xs border border-border bg-card p-2.5">
                          <span className="text-muted-foreground block text-[10px] uppercase font-bold">Destination Country</span>
                          <strong className="text-foreground">{String(meta.destinationCountry)}</strong>
                        </div>
                      )}
                      {meta.visaCategory && (
                        <div className="rounded-xs border border-border bg-card p-2.5">
                          <span className="text-muted-foreground block text-[10px] uppercase font-bold">Visa Category</span>
                          <strong className="text-foreground">{String(meta.visaCategory)}</strong>
                        </div>
                      )}
                      {meta.passportNumber && (
                        <div className="rounded-xs border border-border bg-card p-2.5">
                          <span className="text-muted-foreground block text-[10px] uppercase font-bold">Passport Number</span>
                          <strong className="font-mono text-foreground">{String(meta.passportNumber)}</strong>
                        </div>
                      )}
                      {meta.passportExpiry && (
                        <div className="rounded-xs border border-border bg-card p-2.5">
                          <span className="text-muted-foreground block text-[10px] uppercase font-bold">Passport Expiry</span>
                          <strong className="font-mono text-foreground">{String(meta.passportExpiry)}</strong>
                        </div>
                      )}
                      {(meta.travelStartDate || meta.travelEndDate) && (
                        <div className="rounded-xs border border-border bg-card p-2.5 sm:col-span-2">
                          <span className="text-muted-foreground block text-[10px] uppercase font-bold">Intended Travel Period</span>
                          <strong className="text-foreground">
                            {meta.travelStartDate ? String(meta.travelStartDate) : "N/A"} to{" "}
                            {meta.travelEndDate ? String(meta.travelEndDate) : "N/A"}
                          </strong>
                        </div>
                      )}
                      {meta.processingEmbassy && (
                        <div className="rounded-xs border border-border bg-card p-2.5 sm:col-span-2">
                          <span className="text-muted-foreground block text-[10px] uppercase font-bold">Processing Authority / Embassy</span>
                          <strong className="text-gold-dark dark:text-gold">{String(meta.processingEmbassy)}</strong>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })()}

              {/* Client Action Items Bar */}
              <Card padding="md" className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-foreground">Client Action Items & Directives</h4>
                  <Button
                    variant="gold"
                    size="xs"
                    leftIcon={<Plus className="size-3.5" />}
                    onClick={() => setIsActionModalOpen(true)}
                  >
                    Dispatch Action Item
                  </Button>
                </div>

                {clientActions.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No active action items requested from client.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {clientActions.map((act) => (
                      <div
                        key={act.id}
                        className="flex items-start justify-between rounded-xs border border-border bg-muted/20 p-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <strong className="text-foreground">{act.title}</strong>
                            <Badge tone={act.status === "COMPLETED" ? "success" : "warning"} size="sm">
                              {act.status}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground">{act.description}</p>
                          {act.dueAt && (
                            <span className="text-[11px] text-amber-600 flex items-center gap-1">
                              <Clock className="size-3" /> Due: {formatDate(act.dueAt)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Event Timeline */}
              <Card padding="md">
                <CardHeader>
                  <CardTitle>Lifecycle & Audit Event Stream</CardTitle>
                </CardHeader>
                <CardContent>
                  <ApplicationTimelineView activities={activities} />
                </CardContent>
              </Card>
            </div>

            {/* Right Col: Client Profile & Assigned Officer */}
            <div className="space-y-6">
              {/* Officer Assignment Card */}
              <Card padding="md" className="space-y-3">
                <h4 className="text-sm font-bold text-foreground">Operational Officer Assignment</h4>
                {application.assignedAdmin ? (
                  <div className="rounded-xs border border-border bg-muted/30 p-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Assigned Officer:</span>
                      <strong className="text-foreground flex items-center gap-1">
                        <UserCheck className="size-3.5 text-emerald-600" />
                        {application.assignedAdmin.fullName || application.assignedAdmin.email}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Officer Email:</span>
                      <span className="text-foreground">{application.assignedAdmin.email}</span>
                    </div>
                    <div className="pt-2 border-t border-border flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => setIsAssignModalOpen(true)}
                      >
                        Reassign Officer
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        className="text-destructive hover:bg-destructive/10"
                        isLoading={unassignMutation.isPending}
                        onClick={() => unassignMutation.mutate()}
                      >
                        Unassign
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xs border border-amber-500/30 bg-amber-500/10 p-3 text-xs space-y-2">
                    <span className="text-amber-900 dark:text-amber-200 block">
                      This dossier is currently <strong>Unassigned</strong> in the work queue.
                    </span>
                    <Button
                      variant="gold"
                      size="xs"
                      leftIcon={<UserCheck className="size-3.5" />}
                      onClick={() => setIsAssignModalOpen(true)}
                    >
                      Assign Operational Officer
                    </Button>
                  </div>
                )}
              </Card>

              {/* Client Profile Card */}
              <Card padding="md" className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-foreground">Client Entity Profile</h4>
                  {application.client && (
                    <Link
                      href={`/admin/clients/${application.client.id}`}
                      className="text-xs font-semibold text-gold-dark dark:text-gold hover:underline"
                    >
                      Client 360
                    </Link>
                  )}
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <span className="text-muted-foreground">Entity Name</span>
                    <span className="font-bold text-foreground">
                      {application.client?.fullName || application.client?.businessName || "Client"}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <span className="text-muted-foreground">Entity Type</span>
                    <Badge tone="neutral" size="sm">
                      {application.client?.clientType || "INDIVIDUAL"}
                    </Badge>
                  </div>
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <span className="text-muted-foreground">KRA PIN</span>
                    <span className="font-mono text-foreground">{application.client?.kraPin || "N/A"}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <span className="text-muted-foreground">Contact Phone</span>
                    <span className="font-mono text-foreground">{application.client?.phone || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email</span>
                    <span className="text-foreground">{application.client?.email || "N/A"}</span>
                  </div>
                </div>
              </Card>

              {/* Service Gazette Parameters */}
              <Card padding="md" className="space-y-2 text-xs">
                <h4 className="text-sm font-bold text-foreground">Service Parameters</h4>
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Statutory SLA</span>
                  <span className="font-bold text-foreground">{application.service?.slaHours || 24} Hours</span>
                </div>
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Government Fee</span>
                  <span className="font-mono font-semibold text-foreground">
                    KES {(application.service?.governmentFee || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service Fee</span>
                  <span className="font-mono font-semibold text-foreground">
                    KES {(application.service?.serviceFee || 0).toLocaleString()}
                  </span>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 2: REQUIREMENTS & QC */}
        {activeTab === "requirements" && (
          <div className="space-y-6">
            <AdminRequirementReviewer
              applicationId={application.id}
              requirements={requirements}
              documents={documents}
              onReviewed={() => {
                queryClient.invalidateQueries({ queryKey: ["admin-application", id] });
                queryClient.invalidateQueries({ queryKey: ["admin-readiness", id] });
              }}
            />
          </div>
        )}

        {/* TAB 3: GOVERNMENT FILINGS */}
        {activeTab === "government" && (
          <div className="space-y-6">
            <AdminGovernmentController
              applicationId={application.id}
              governmentApps={governmentApplications}
              onUpdated={() => {
                queryClient.invalidateQueries({ queryKey: ["admin-application", id] });
                queryClient.invalidateQueries({ queryKey: ["admin-readiness", id] });
              }}
            />
          </div>
        )}

        {/* TAB 4: FINANCIALS & SETTLEMENT */}
        {activeTab === "financials" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-foreground">Application Commercial Invoices</h3>
                <p className="text-xs text-muted-foreground">
                  Statutory disbursements, professional fees, M-Pesa settlements, line item adjustments, and manual receipts.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="xs"
                  leftIcon={<DollarSign className="size-3.5" />}
                  onClick={() => setIsCreateInvoiceOpen(true)}
                >
                  Create New Invoice
                </Button>
                {primaryInvoice && primaryInvoice.status !== "PAID" && (
                  <Button
                    variant="gold"
                    size="xs"
                    leftIcon={<DollarSign className="size-3.5" />}
                    onClick={() => setIsManualPayModalOpen(true)}
                  >
                    Record Manual Payment
                  </Button>
                )}
              </div>
            </div>

            {invoices.length === 0 ? (
              <Card padding="lg" className="text-center text-xs text-muted-foreground">
                No invoices generated for this application.
                <div className="mt-3">
                  <Button
                    variant="gold"
                    size="xs"
                    onClick={() => setIsCreateInvoiceOpen(true)}
                  >
                    Create Commercial Invoice
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                {invoices.map((inv: Payment) => (
                  <Card key={inv.id} padding="md" className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-3">
                      <div>
                        <button
                          type="button"
                          onClick={() => setSelectedDetailInvoiceId(inv.id)}
                          className="font-mono text-sm font-bold text-navy dark:text-gold hover:underline text-left block"
                        >
                          Invoice #{inv.invoiceNumber}
                        </button>
                        <p className="text-xs text-muted-foreground">
                          Issued: {formatDate(inv.createdAt)} • Due: {inv.dueAt ? formatDate(inv.dueAt) : "On Demand"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-2 sm:mt-0">
                        <Badge
                          tone={
                            inv.status === "PAID"
                              ? "success"
                              : inv.status === "OVERDUE"
                              ? "destructive"
                              : inv.status === "DRAFT"
                              ? "neutral"
                              : "warning"
                          }
                          size="md"
                        >
                          {inv.status}
                        </Badge>
                        <span className="text-base font-bold text-foreground font-mono">
                          {formatCurrency(inv.totalAmount, inv.currency)}
                        </span>
                      </div>
                    </div>

                    {/* Financial Breakdown Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="rounded-xs border border-border bg-muted/20 p-2.5">
                        <span className="text-muted-foreground block text-[11px]">Government Fees</span>
                        <strong className="text-foreground">{formatCurrency(inv.governmentFee, inv.currency)}</strong>
                      </div>
                      <div className="rounded-xs border border-border bg-muted/20 p-2.5">
                        <span className="text-muted-foreground block text-[11px]">Service Fees</span>
                        <strong className="text-foreground">{formatCurrency(inv.serviceFee, inv.currency)}</strong>
                      </div>
                      <div className="rounded-xs border border-border bg-muted/20 p-2.5">
                        <span className="text-muted-foreground block text-[11px]">Total Settled</span>
                        <strong className="text-emerald-600">{formatCurrency(inv.amountPaid, inv.currency)}</strong>
                      </div>
                      <div className="rounded-xs border border-border bg-muted/20 p-2.5">
                        <span className="text-muted-foreground block text-[11px]">Outstanding Due</span>
                        <strong className="text-gold-dark dark:text-gold">{formatCurrency(inv.amountDue, inv.currency)}</strong>
                      </div>
                    </div>

                    {/* Invoice Action Bar */}
                    <div className="flex items-center justify-between pt-1 text-xs">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => setSelectedDetailInvoiceId(inv.id)}
                        >
                          View Full Dossier & Line Items
                        </Button>
                        {inv.status !== "PAID" && (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => setSelectedInvoiceForAdjust(inv)}
                          >
                            Add Adjustment
                          </Button>
                        )}
                      </div>
                      {inv.status !== "PAID" && (
                        <Button
                          variant="gold"
                          size="xs"
                          onClick={() => setIsManualPayModalOpen(true)}
                        >
                          Settle Invoice
                        </Button>
                      )}
                    </div>

                    {/* Transactions list */}
                    {inv.transactions && inv.transactions.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-border">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          Payment Transactions & Receipts
                        </span>
                        <div className="space-y-1.5">
                          {inv.transactions.map((tx: PaymentTransaction) => (
                            <div
                              key={tx.id}
                              className="flex items-center justify-between rounded-xs border border-border bg-muted/30 px-3 py-2 text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <Badge tone="neutral" size="sm">{tx.paymentMethod}</Badge>
                                <span className="font-mono text-foreground font-semibold">
                                  {tx.externalReference || tx.transactionNumber}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-mono font-bold text-emerald-600">
                                  +{formatCurrency(tx.amount, tx.currency || inv.currency)}
                                </span>
                                <span className="text-[11px] text-muted-foreground">
                                  {formatDate(tx.paidAt || tx.createdAt)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: DOCUMENT VAULT */}
        {activeTab === "documents" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-foreground">Encrypted Document Vault</h3>
                <p className="text-xs text-muted-foreground">
                  Permanent audit repository of client certificates, IDs, and statutory filings.
                </p>
              </div>
            </div>

            {documents.length === 0 ? (
              <Card padding="lg" className="text-center text-xs text-muted-foreground">
                No documents uploaded for this application yet.
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {documents.map((doc) => (
                  <Card key={doc.id} padding="md" className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <FolderOpen className="size-4 text-gold shrink-0" />
                        <div>
                          <h5 className="text-xs font-bold text-foreground truncate">{doc.title || doc.currentVersion?.fileName || "Document"}</h5>
                          <span className="text-[11px] font-mono text-muted-foreground">
                            {doc.documentType} • {doc.currentVersion?.mimeType || "application/pdf"}
                          </span>
                        </div>
                      </div>
                      <Badge tone={doc.status === "APPROVED" ? "success" : doc.status === "PENDING_REVIEW" ? "warning" : "neutral"} size="sm">
                        {doc.status}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border text-xs">
                      <span className="text-muted-foreground text-[11px]">{formatDate(doc.createdAt)}</span>
                      {doc.currentVersion?.secureUrl && (
                        <a
                          href={doc.currentVersion.secureUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gold-dark hover:underline dark:text-gold flex items-center gap-1 font-semibold"
                        >
                          <Download className="size-3.5" />
                          <span>Download Asset</span>
                        </a>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: DELIVERY FULFILLMENT */}
        {activeTab === "delivery" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-foreground">Delivery & Dispatch Operations</h3>
                <p className="text-xs text-muted-foreground">
                  Track physical courier dispatches and digital vault certificate releases.
                </p>
              </div>
              <Button
                variant="gold"
                size="sm"
                leftIcon={<Truck className="size-4" />}
                onClick={() => setIsDeliveryModalOpen(true)}
              >
                Dispatch Delivery
              </Button>
            </div>

            {deliveries.length === 0 ? (
              <Card padding="lg" className="text-center text-xs text-muted-foreground">
                No delivery dispatched yet. When statutory processing is complete, dispatch the certificates.
              </Card>
            ) : (
              <div className="space-y-4">
                {deliveries.map((del: any) => (
                  <Card key={del.id} padding="md" className="space-y-3">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <div className="flex items-center gap-2">
                        <Truck className="size-4 text-gold" />
                        <span className="text-sm font-bold text-foreground">
                          {del.deliveryMethod} Dispatch — {del.carrier || "Courier"}
                        </span>
                      </div>
                      <Badge tone={del.status === "DELIVERED" || del.status === "CONFIRMED" ? "success" : "gold"} size="md">
                        {del.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="rounded-xs border border-border bg-muted/20 p-2.5">
                        <span className="text-muted-foreground block text-[11px]">Recipient</span>
                        <strong className="text-foreground">{del.recipientName} ({del.recipientPhone})</strong>
                      </div>
                      <div className="rounded-xs border border-border bg-muted/20 p-2.5">
                        <span className="text-muted-foreground block text-[11px]">Tracking Waybill #</span>
                        <strong className="font-mono text-foreground">{del.trackingNumber || "N/A"}</strong>
                      </div>
                      <div className="rounded-xs border border-border bg-muted/20 p-2.5">
                        <span className="text-muted-foreground block text-[11px]">Physical Address</span>
                        <span className="text-foreground truncate block">{del.physicalAddress || "N/A"}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 7: INTERNAL NOTES & LEDGER */}
        {activeTab === "notes" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <h3 className="text-base font-semibold text-foreground">Officer Notes & Log</h3>
              {notes.length === 0 ? (
                <Card padding="md" className="text-center text-xs text-muted-foreground">
                  No internal notes recorded yet.
                </Card>
              ) : (
                <div className="space-y-3">
                  {notes.map((n) => (
                    <Card key={n.id} padding="md" className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge tone={n.visibility === "INTERNAL" ? "neutral" : "gold"} size="sm">
                            {n.visibility}
                          </Badge>
                          <span className="font-semibold text-foreground">
                            {n.author?.fullName || "Administrative Officer"}
                          </span>
                        </div>
                        <span className="text-[11px] text-muted-foreground">{formatDate(n.createdAt)}</span>
                      </div>
                      <p className="text-foreground whitespace-pre-wrap">{n.content}</p>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Add Note Card */}
            <div>
              <Card padding="md" className="space-y-3">
                <h4 className="text-sm font-bold text-foreground">Add Operational Note</h4>
                <FormField label="Note Visibility" required>
                  <Select
                    value={noteVisibility}
                    onChange={(e) => setNoteVisibility(e.target.value as NoteVisibility)}
                    options={[
                      { value: "INTERNAL", label: "Internal Only (Private to Admin Officers)" },
                      { value: "CLIENT_VISIBLE", label: "Client Visible (Shown in Client Portal)" },
                    ]}
                  />
                </FormField>

                <FormField label="Note Content" required>
                  <Textarea
                    placeholder="Record detailed operational remarks, registrar discussions, etc..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    rows={4}
                  />
                </FormField>

                <Button
                  variant="gold"
                  size="sm"
                  fullWidth
                  isLoading={addNoteMutation.isPending}
                  disabled={!noteContent.trim()}
                  onClick={() => addNoteMutation.mutate()}
                >
                  Record Note
                </Button>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* QC AUDIT MODAL */}
      <AdminQcModal
        isOpen={isQcModalOpen}
        onClose={() => setIsQcModalOpen(false)}
        applicationId={application.id}
        applicationNumber={application.applicationNumber}
      />

      {/* MANUAL PAYMENT MODAL */}
      {primaryInvoice && (
        <AdminManualPaymentModal
          isOpen={isManualPayModalOpen}
          onClose={() => setIsManualPayModalOpen(false)}
          invoice={primaryInvoice}
        />
      )}

      {/* DELIVERY MODAL */}
      <AdminDeliveryModal
        isOpen={isDeliveryModalOpen}
        onClose={() => setIsDeliveryModalOpen(false)}
        application={application}
        client={application.client}
      />

      {/* ASSIGN OFFICER MODAL */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Assign Operational Officer"
        description="Designate a case officer responsible for statutory verification and government filings."
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="gold"
              size="sm"
              isLoading={assignMutation.isPending}
              disabled={!assignedAdminId}
              onClick={() => assignMutation.mutate()}
            >
              Assign Officer
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormField label="Officer User ID (UUID)" required>
            <Input
              placeholder="Enter admin officer ID..."
              value={assignedAdminId}
              onChange={(e) => setAssignedAdminId(e.target.value)}
            />
          </FormField>

          <FormField label="Assignment Reason / Notes">
            <Input
              placeholder="e.g. Specialized registry experience for BRS corporate filings"
              value={assignReason}
              onChange={(e) => setAssignReason(e.target.value)}
            />
          </FormField>
        </div>
      </Modal>

      {/* CREATE CLIENT ACTION MODAL */}
      <Modal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        title="Dispatch Client Action Item"
        description="Notify client of an urgent requirement, missing signature, or government query."
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsActionModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="gold"
              size="sm"
              isLoading={createActionMutation.isPending}
              disabled={!actionTitle}
              onClick={() => createActionMutation.mutate()}
            >
              Send Action Item
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormField label="Action Title" required>
            <Input
              placeholder="e.g. Provide High-Resolution Certified ID Copy"
              value={actionTitle}
              onChange={(e) => setActionTitle(e.target.value)}
            />
          </FormField>

          <FormField label="Instructions for Client" required>
            <Textarea
              placeholder="Explain exactly what the client must do or upload..."
              value={actionDescription}
              onChange={(e) => setActionDescription(e.target.value)}
              rows={3}
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Urgency Priority" required>
              <Select
                value={actionPriority}
                onChange={(e) => setActionPriority(e.target.value as any)}
                options={[
                  { value: "NORMAL", label: "Normal (Standard)" },
                  { value: "HIGH", label: "High Priority" },
                  { value: "URGENT", label: "Urgent Priority" },
                ]}
              />
            </FormField>

            <FormField label="Fulfillment Deadline">
              <Input
                type="date"
                value={actionDeadline}
                onChange={(e) => setActionDeadline(e.target.value)}
              />
            </FormField>
          </div>
        </div>
      </Modal>

      {/* CREATE INVOICE MODAL BOUND TO THIS APPLICATION */}
      <AdminCreateInvoiceModal
        isOpen={isCreateInvoiceOpen}
        onClose={() => setIsCreateInvoiceOpen(false)}
        initialApplicationId={id}
        initialClientId={application.clientId}
        onCreated={() => {
          queryClient.invalidateQueries({ queryKey: ["admin-application", id] });
          queryClient.invalidateQueries({ queryKey: ["admin-readiness", id] });
        }}
      />

      {/* INVOICE DETAIL DOSSIER MODAL */}
      <AdminInvoiceDetailModal
        isOpen={Boolean(selectedDetailInvoiceId)}
        onClose={() => setSelectedDetailInvoiceId(null)}
        invoiceId={selectedDetailInvoiceId}
        onUpdated={() => {
          queryClient.invalidateQueries({ queryKey: ["admin-application", id] });
          queryClient.invalidateQueries({ queryKey: ["admin-readiness", id] });
        }}
      />

      {/* FINANCIAL ADJUSTMENT MODAL */}
      {selectedInvoiceForAdjust && (
        <AdminFinancialAdjustmentModal
          isOpen={Boolean(selectedInvoiceForAdjust)}
          onClose={() => setSelectedInvoiceForAdjust(null)}
          invoice={selectedInvoiceForAdjust}
          onAdjusted={() => {
            queryClient.invalidateQueries({ queryKey: ["admin-application", id] });
            queryClient.invalidateQueries({ queryKey: ["admin-readiness", id] });
          }}
        />
      )}

      {/* RECEIPT DETAIL MODAL */}
      {selectedReceiptId && (
        <AdminReceiptDetailModal
          isOpen={Boolean(selectedReceiptId)}
          onClose={() => setSelectedReceiptId(null)}
          receiptId={selectedReceiptId}
        />
      )}
    </PageShell>
  );
}
