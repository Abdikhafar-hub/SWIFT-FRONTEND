"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  FileText,
  Building2,
  CreditCard,
  MessageSquare,
  History,
  Truck,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Download,
  Receipt as ReceiptIcon,
  Smartphone,
  ExternalLink,
} from "lucide-react";
import { PageShell } from "@/components/ui/layout-primitives";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ApplicationStatusBadge,
  RequirementStatusBadge,
  PriorityBadge,
  SlaIndicator,
} from "@/components/domain/status-badges";
import { RequirementSubmissionCard } from "@/components/domain/requirement-submission-card";
import { GovernmentTrackerCard } from "@/components/domain/government-tracker-card";
import { ApplicationMessages } from "@/components/domain/application-messages";
import { ApplicationTimelineView } from "@/components/domain/application-timeline-view";
import { MpesaPaymentModal } from "@/components/domain/mpesa-payment-modal";
import { ReceiptModal } from "@/components/domain/receipt-modal";
import { Skeleton, ErrorState } from "@/components/ui/feedback-primitives";
import { applicationsApi } from "@/lib/api/applications";
import { paymentsApi } from "@/lib/api/payments";
import { useAuth } from "@/lib/auth/auth-context";
import { formatDate, formatKES } from "@/lib/utils/format";
import type { ApplicationStatus, Receipt } from "@/types";

type DossierTab = "requirements" | "government" | "financials" | "messages" | "timeline" | "delivery";

export default function ClientApplicationDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const { client } = useAuth();

  const [activeTab, setActiveTab] = useState<DossierTab>("requirements");
  const [isMpesaModalOpen, setIsMpesaModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);

  // 1. Fetch complete application dossier
  const {
    data: application,
    isLoading: isAppLoading,
    error: appError,
    refetch: refetchApp,
  } = useQuery({
    queryKey: ["client-application", id],
    queryFn: () => applicationsApi.getApplicationById(id),
    enabled: Boolean(id),
  });

  // 2. Fetch live readiness evaluation report
  const { data: readiness } = useQuery({
    queryKey: ["application-readiness", id],
    queryFn: () => applicationsApi.getApplicationReadiness(id),
    enabled: Boolean(id),
  });

  // 3. Fetch activity timeline
  const { data: timelineData = [] } = useQuery({
    queryKey: ["application-timeline", id],
    queryFn: () => applicationsApi.getTimeline(id),
    enabled: Boolean(id),
  });

  // 4. Fetch delivery records
  const { data: deliveryData = [] } = useQuery({
    queryKey: ["application-delivery", id],
    queryFn: () => applicationsApi.getDelivery(id),
    enabled: Boolean(id),
  });

  // 5. Fetch government tracking records
  const { data: governmentData = [] } = useQuery({
    queryKey: ["application-government-tracking", id],
    queryFn: () => applicationsApi.getGovernmentTracking(id),
    enabled: Boolean(id),
  });

  if (isAppLoading) {
    return (
      <PageShell title="Loading Application Dossier...">
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-96 lg:col-span-2" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </PageShell>
    );
  }

  if (appError || !application) {
    return (
      <PageShell title="Application Dossier">
        <ErrorState onRetry={() => refetchApp()} />
      </PageShell>
    );
  }

  const requirements = application.requirements || [];
  const payments = application.payments || [];
  const latestPayment = payments[0];
  const dueAmount = Number(application.dueAmount || latestPayment?.amountDue || 0);
  const paidAmount = Number(application.paidAmount || latestPayment?.amountPaid || 0);
  const isSettled = dueAmount <= 0;

  const governmentApp = governmentData[0] || (application.governmentApps ? application.governmentApps[0] : null);
  const delivery = deliveryData[0] || (application.delivery ? application.delivery[0] : null);

  const totalReqs = requirements.length || 1;
  const satisfiedReqs =
    requirements.filter((r) => r.isSatisfied && r.status !== "REJECTED" && r.status !== "CORRECTION_REQUIRED").length;
  const progressPercent = Math.min(100, Math.round((satisfiedReqs / totalReqs) * 100));

  return (
    <PageShell
      eyebrow="STATUTORY DOSSIER"
      title={`${application.service?.name || "Statutory Application"}`}
      description={`Application #${application.applicationNumber} • Filed on ${formatDate(application.createdAt)}`}
      actions={
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/client/applications">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="size-3.5" />}>
              Back to Filings
            </Button>
          </Link>
          <ApplicationStatusBadge status={application.status as ApplicationStatus} size="md" />
        </div>
      }
    >
      {/* Dossier Executive Summary Banner */}
      <div className="rounded-sm border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-black text-foreground">
                #{application.applicationNumber}
              </span>
              <PriorityBadge priority={application.priority} size="sm" />
              {application.slaStatus && <SlaIndicator status={application.slaStatus} size="sm" />}
            </div>
            <h2 className="font-display text-lg font-bold text-foreground">
              {application.service?.name}
            </h2>
            <span className="text-xs text-muted-foreground">
              Authority: {application.service?.authority || application.service?.category?.name || "Official Registry"} &bull; Target SLA:{" "}
              {application.service?.slaHours ? `${application.service.slaHours} Hours` : "2-4 Business Days"}
            </span>
          </div>

          {/* Settle Outstanding Invoice Quick Button */}
          {!isSettled && (
            <div className="flex items-center gap-3 rounded-xs border border-amber-500/40 bg-amber-500/10 p-3 shrink-0">
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  Outstanding Invoice Fee
                </span>
                <span className="font-mono text-sm font-black text-foreground">
                  {formatKES(dueAmount)}
                </span>
              </div>
              <Button
                size="sm"
                onClick={() => setIsMpesaModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-xs"
              >
                <Smartphone className="size-3.5" />
                <span>Pay via M-Pesa</span>
              </Button>
            </div>
          )}
        </div>

        {/* Readiness Checklist Progress Bar */}
        <div className="space-y-1.5 pt-2 border-t border-border/70">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-muted-foreground">REQUIREMENTS COMPLIANCE SCORE</span>
            <span className="text-foreground font-mono">
              {satisfiedReqs} / {totalReqs} Requirements Satisfied ({progressPercent}%)
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-gold transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Dynamic Readiness Engine Alerts (Blockers / Warnings) */}
        {readiness && (
          <div className="space-y-2 pt-1">
            {readiness.blockers.length > 0 && (
              <div className="rounded-xs border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive space-y-1">
                <div className="flex items-center gap-2 font-bold">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>Statutory Submission Blockers ({readiness.blockers.length})</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] pl-1">
                  {readiness.blockers.map((b, idx) => (
                    <li key={idx}>{b}</li>
                  ))}
                </ul>
              </div>
            )}

            {readiness.ready && (
              <div className="rounded-xs border border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/15 p-3 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2 font-bold">
                <CheckCircle2 className="size-4 shrink-0" />
                <span>All mandatory statutory requirements satisfied. Application qualified for government transmission.</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-border/80 pb-px mb-6 text-xs">
        <button
          onClick={() => setActiveTab("requirements")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 font-bold transition-all whitespace-nowrap ${
            activeTab === "requirements"
              ? "border-gold text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileText className="size-3.5" />
          <span>Statutory Requirements ({requirements.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("government")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 font-bold transition-all whitespace-nowrap ${
            activeTab === "government"
              ? "border-gold text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Building2 className="size-3.5" />
          <span>Government Tracking</span>
        </button>

        <button
          onClick={() => setActiveTab("financials")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 font-bold transition-all whitespace-nowrap ${
            activeTab === "financials"
              ? "border-gold text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <CreditCard className="size-3.5" />
          <span>Financials & Invoices</span>
        </button>

        <button
          onClick={() => setActiveTab("messages")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 font-bold transition-all whitespace-nowrap ${
            activeTab === "messages"
              ? "border-gold text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <MessageSquare className="size-3.5" />
          <span>Direct Officer Messaging</span>
        </button>

        <button
          onClick={() => setActiveTab("timeline")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 font-bold transition-all whitespace-nowrap ${
            activeTab === "timeline"
              ? "border-gold text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <History className="size-3.5" />
          <span>Timeline & Audit Trail</span>
        </button>

        {delivery && (
          <button
            onClick={() => setActiveTab("delivery")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 font-bold transition-all whitespace-nowrap ${
              activeTab === "delivery"
                ? "border-gold text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Truck className="size-3.5" />
            <span>Courier Delivery</span>
          </button>
        )}
      </div>

      {/* TAB CONTENT AREAS */}

      {/* 1. REQUIREMENTS TAB */}
      {activeTab === "requirements" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {requirements.length === 0 ? (
              <div className="rounded-sm border border-dashed border-border p-8 text-center bg-card text-muted-foreground text-xs">
                No custom statutory requirements specified for this filing.
              </div>
            ) : (
              requirements.map((req) => (
                <RequirementSubmissionCard
                  key={req.id}
                  applicationId={application.id}
                  requirement={req}
                />
              ))
            )}
          </div>

          {/* Right Summary Specs */}
          <div className="space-y-6">
            <Card padding="md">
              <CardHeader>
                <CardTitle className="text-sm">Application Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Application Number</span>
                  <span className="font-mono font-bold text-foreground">
                    #{application.applicationNumber}
                  </span>
                </div>
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Statutory Authority</span>
                  <span className="font-semibold text-foreground">
                    {application.service?.authority || "Official Registry"}
                  </span>
                </div>
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Priority Tier</span>
                  <PriorityBadge priority={application.priority} size="sm" />
                </div>
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Statutory Fee</span>
                  <span className="font-mono font-bold text-foreground">
                    {formatKES(application.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Settlement Status</span>
                  {isSettled ? (
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      Settled in Full
                    </span>
                  ) : (
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      Due: {formatKES(dueAmount)}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card padding="md" variant="gold">
              <h4 className="font-display text-sm font-bold text-foreground">
                Direct Compliance Support
              </h4>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Need guidance regarding statutory guidelines or document certification? Reach out to your assigned officer.
              </p>
              <Button
                variant="navy"
                size="xs"
                fullWidth
                className="mt-4"
                onClick={() => setActiveTab("messages")}
              >
                Open Communication Thread
              </Button>
            </Card>
          </div>
        </div>
      )}

      {/* 2. GOVERNMENT TRACKING TAB */}
      {activeTab === "government" && (
        <div className="space-y-6">
          {governmentApp ? (
            <GovernmentTrackerCard governmentApp={governmentApp} />
          ) : (
            <div className="rounded-sm border border-dashed border-border p-10 text-center bg-card space-y-3">
              <Building2 className="size-10 text-muted-foreground/40 mx-auto" />
              <h4 className="font-display text-base font-bold text-foreground">
                Awaiting Registry Transmission
              </h4>
              <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                Once all mandatory documents and filing fees are verified, our compliance team packages and transmits your filing to the official registry (eCitizen, BRS, or KRA). Real-time tracking numbers and registry status milestones will display here.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 3. FINANCIALS TAB */}
      {activeTab === "financials" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-sm border border-border bg-card p-4 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Total Statutory Fee
              </span>
              <div className="font-mono text-lg font-bold text-foreground">
                {formatKES(application.totalAmount)}
              </div>
            </div>

            <div className="rounded-sm border border-border bg-card p-4 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Amount Paid
              </span>
              <div className="font-mono text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {formatKES(paidAmount)}
              </div>
            </div>

            <div className="rounded-sm border border-border bg-card p-4 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Outstanding Balance
              </span>
              <div className="font-mono text-lg font-bold text-foreground">
                {formatKES(dueAmount)}
              </div>
            </div>
          </div>

          {/* Invoices List for this Application */}
          <div className="rounded-sm border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-border/70 p-4 bg-muted/20">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                Application Billing Ledgers
              </h4>
              {!isSettled && (
                <Button
                  size="sm"
                  onClick={() => setIsMpesaModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5"
                >
                  <Smartphone className="size-3.5" />
                  <span>Settle Invoice via M-Pesa</span>
                </Button>
              )}
            </div>

            {payments.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No invoices generated yet for this application.
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {payments.map((pmt) => (
                  <div
                    key={pmt.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-foreground">
                          #{pmt.invoiceNumber}
                        </span>
                        <span className="rounded-xs bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                          Status: {pmt.status}
                        </span>
                      </div>
                      <div className="text-muted-foreground">
                        Issued: {new Date(pmt.createdAt).toLocaleDateString()} &bull; Total:{" "}
                        <strong className="text-foreground font-mono">{formatKES(pmt.totalAmount)}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {pmt.receipts && pmt.receipts.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedReceipt(pmt.receipts![0])}
                          className="h-8 gap-1.5 text-xs"
                        >
                          <ReceiptIcon className="size-3.5 text-gold" />
                          <span>View Official Receipt</span>
                        </Button>
                      )}

                      {Number(pmt.amountDue) > 0 && (
                        <Button
                          size="sm"
                          onClick={() => setIsMpesaModalOpen(true)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5"
                        >
                          <Smartphone className="size-3.5" />
                          <span>Pay Now</span>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. MESSAGES TAB */}
      {activeTab === "messages" && (
        <ApplicationMessages applicationId={application.id} />
      )}

      {/* 5. TIMELINE TAB */}
      {activeTab === "timeline" && (
        <Card padding="md">
          <CardHeader>
            <CardTitle>Application Lifecycle & Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ApplicationTimelineView activities={timelineData} />
          </CardContent>
        </Card>
      )}

      {/* 6. DELIVERY TAB */}
      {activeTab === "delivery" && delivery && (
        <div className="rounded-sm border border-border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-border/70">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xs bg-gold/15 text-gold">
                <Truck className="size-5" />
              </div>
              <div>
                <h4 className="font-display text-base font-bold text-foreground">
                  Official Document Courier Dispatch
                </h4>
                <span className="text-xs text-muted-foreground">
                  Method: {delivery.deliveryMethod} &bull; Courier: {delivery.courierName || "Swift Doc Courier"}
                </span>
              </div>
            </div>
            <span className="rounded-xs bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {delivery.status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-muted-foreground">Recipient Name & Phone:</span>
              <div className="font-bold text-foreground">
                {delivery.recipientName} ({delivery.recipientPhone})
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground">Delivery Destination Address:</span>
              <div className="font-medium text-foreground">
                {delivery.deliveryAddress || "Nairobi CBD Office"}
              </div>
            </div>
            {delivery.trackingNumber && (
              <div className="space-y-1">
                <span className="text-muted-foreground">Courier Waybill / Tracking Number:</span>
                <div className="font-mono font-bold text-foreground">
                  {delivery.trackingNumber}
                </div>
              </div>
            )}
            {delivery.dispatchedAt && (
              <div className="space-y-1">
                <span className="text-muted-foreground">Dispatch Timestamp:</span>
                <div className="text-foreground">
                  {new Date(delivery.dispatchedAt).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* M-PESA PAYMENT MODAL */}
      {latestPayment && (
        <MpesaPaymentModal
          isOpen={isMpesaModalOpen}
          onClose={() => setIsMpesaModalOpen(false)}
          invoice={{
            id: latestPayment.id,
            invoiceNumber: latestPayment.invoiceNumber,
            totalAmount: latestPayment.totalAmount,
            amountDue: latestPayment.amountDue || application.dueAmount,
            amountPaid: latestPayment.amountPaid,
            currency: latestPayment.currency,
          }}
          clientPhone={client?.phone}
          onPaymentSuccess={() => {
            refetchApp();
          }}
        />
      )}

      {/* OFFICIAL VAT RECEIPT MODAL */}
      <ReceiptModal
        isOpen={Boolean(selectedReceipt)}
        onClose={() => setSelectedReceipt(null)}
        receipt={selectedReceipt}
      />
    </PageShell>
  );
}
