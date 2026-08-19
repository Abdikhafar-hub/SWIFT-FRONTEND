"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Landmark,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Calendar,
  ExternalLink,
  ShieldCheck,
  Send,
  Sliders,
} from "lucide-react";
import { PageShell } from "@/components/ui/layout-primitives";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { FormField, Textarea } from "@/components/ui/form-primitives";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton, ErrorState } from "@/components/ui/feedback-primitives";
import { adminApi } from "@/lib/api/admin";
import { formatDate } from "@/lib/utils/format";
import type { GovernmentApplication, GovernmentStatus } from "@/types";

export default function AdminGovernmentDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const queryClient = useQueryClient();

  // Status update modal
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<GovernmentStatus>("IN_REVIEW");
  const [updatedReference, setUpdatedReference] = useState("");
  const [queryDetails, setQueryDetails] = useState("");
  const [queryResponse, setQueryResponse] = useState("");
  const [remarks, setRemarks] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");

  // Queries
  const { data: queueData, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-government-queue"],
    queryFn: () => adminApi.getGovernmentQueue({ page: 1, limit: 100 }),
  });

  const { data: historyData } = useQuery({
    queryKey: ["admin-government-history", id],
    queryFn: () => adminApi.getGovernmentStatusHistory(id),
    enabled: Boolean(id),
  });

  const filing = queueData?.items?.find((f) => f.id === id);

  // Status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: () =>
      adminApi.updateGovernmentStatus(id, {
        status: newStatus,
        externalReference: updatedReference || undefined,
        queryDetails: queryDetails || undefined,
        queryResponse: queryResponse || undefined,
        remarks: remarks || undefined,
        followUpDate: followUpDate || undefined,
      }),
    onSuccess: () => {
      setIsUpdateModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin-government-queue"] });
      queryClient.invalidateQueries({ queryKey: ["admin-government-history", id] });
    },
  });

  // Approval mutation
  const approvalMutation = useMutation({
    mutationFn: () =>
      adminApi.recordGovernmentApproval(id, {
        registrationNumber: registrationNumber || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-government-queue"] });
      queryClient.invalidateQueries({ queryKey: ["admin-government-history", id] });
    },
  });

  if (isLoading) {
    return (
      <PageShell title="Loading Agency Filing...">
        <div className="space-y-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </PageShell>
    );
  }

  if (error || !filing) {
    return (
      <PageShell title="Government Filing Dossier">
        <ErrorState
          title="Filing Record Not Found"
          message="Could not locate the requested statutory agency filing."
          onRetry={() => refetch()}
        />
      </PageShell>
    );
  }

  const history = historyData || filing.statusHistory || [];

  return (
    <PageShell
      eyebrow={`GOVERNMENT FILING • ${filing.platform}`}
      title={filing.governmentAgency || "Statutory Agency Filing"}
      description={`Reference: ${filing.externalReference || "Pending Agency Ref"} • Status: ${filing.status}`}
      actions={
        <div className="flex items-center gap-2">
          <Link href="/admin/government">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="size-3.5" />}>
              Registry Queue
            </Button>
          </Link>
          <Button
            variant="gold"
            size="sm"
            leftIcon={<Sliders className="size-3.5" />}
            onClick={() => {
              setNewStatus(filing.status);
              setUpdatedReference(filing.externalReference || "");
              setIsUpdateModalOpen(true);
            }}
          >
            Update Agency Status
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Filing Details & History */}
        <div className="space-y-6 lg:col-span-2">
          {/* Main Overview Card */}
          <Card padding="md" className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Statutory Submission Profile
                </span>
                <h3 className="text-base font-bold text-foreground">
                  {filing.governmentService || filing.platform}
                </h3>
              </div>
              <Badge
                tone={
                  filing.status === "APPROVED"
                    ? "success"
                    : filing.status === "QUERY_RAISED" || filing.status === "REJECTED"
                    ? "warning"
                    : "gold"
                }
                size="md"
              >
                {filing.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="rounded-xs border border-border bg-muted/20 p-2.5">
                <span className="text-muted-foreground block text-[11px]">Platform</span>
                <strong className="text-foreground">{filing.platform}</strong>
              </div>

              <div className="rounded-xs border border-border bg-muted/20 p-2.5">
                <span className="text-muted-foreground block text-[11px]">Agency Tracking #</span>
                <strong className="text-foreground font-mono">{filing.externalReference || "—"}</strong>
              </div>

              <div className="rounded-xs border border-border bg-muted/20 p-2.5">
                <span className="text-muted-foreground block text-[11px]">Submitted Date</span>
                <span className="text-foreground">{formatDate(filing.submittedAt || filing.createdAt)}</span>
              </div>

              <div className="rounded-xs border border-border bg-muted/20 p-2.5">
                <span className="text-muted-foreground block text-[11px]">Follow-Up Due</span>
                <span className="text-gold-dark dark:text-gold font-semibold">
                  {filing.followUpDate ? formatDate(filing.followUpDate) : "—"}
                </span>
              </div>
            </div>

            {filing.notes && (
              <div className="rounded-xs border border-border bg-muted/20 p-3 text-xs space-y-1">
                <span className="text-[11px] font-bold text-muted-foreground">Officer Remarks & Notes:</span>
                <p className="text-foreground">{filing.notes}</p>
              </div>
            )}

            {filing.portalUrl && (
              <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Official Government Portal Link:</span>
                <a
                  href={filing.portalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold-dark hover:underline dark:text-gold flex items-center gap-1 font-semibold"
                >
                  <span>Launch Agency Portal</span>
                  <ExternalLink className="size-3" />
                </a>
              </div>
            )}
          </Card>

          {/* Status Timeline History */}
          <Card padding="md" className="space-y-4">
            <CardHeader>
              <CardTitle>Government Status Audit History</CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-xs text-muted-foreground">No intermediate state transitions recorded.</p>
              ) : (
                <div className="space-y-3">
                  {history.map((h: any, idx: number) => (
                    <div
                      key={h.id || idx}
                      className="flex items-start justify-between rounded-xs border border-border bg-muted/20 p-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge tone="neutral" size="sm">{h.toStatus || h.status}</Badge>
                          {h.fromStatus && (
                            <span className="text-[11px] text-muted-foreground">
                              from {h.fromStatus}
                            </span>
                          )}
                        </div>
                        {h.remarks && <p className="text-foreground">{h.remarks}</p>}
                        {h.queryDetails && (
                          <p className="text-amber-600 font-semibold">Query: {h.queryDetails}</p>
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {formatDate(h.createdAt || h.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Host Dossier Profile */}
        <div className="space-y-6">
          {filing.application && (
            <Card padding="md" className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-foreground">Host Application</h4>
                <Link
                  href={`/admin/applications/${filing.application.id}`}
                  className="text-xs font-semibold text-gold-dark dark:text-gold hover:underline"
                >
                  Open 360
                </Link>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Dossier #</span>
                  <Link
                    href={`/admin/applications/${filing.application.id}`}
                    className="font-mono font-bold text-navy dark:text-gold hover:underline"
                  >
                    #{filing.application.applicationNumber}
                  </Link>
                </div>
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Service Name</span>
                  <span className="font-semibold text-foreground">{filing.application.service?.name}</span>
                </div>
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Client Entity</span>
                  <span className="font-bold text-foreground">
                    {filing.application.client?.fullName ||
                      filing.application.client?.businessName ||
                      "Client"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Filing Status</span>
                  <Badge tone="neutral" size="sm">{filing.application.status}</Badge>
                </div>
              </div>
            </Card>
          )}

          {/* Direct Approval Action Card */}
          {filing.status !== "APPROVED" && (
            <Card padding="md" className="space-y-3 text-xs">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-emerald-600" />
                <span>Record Official Agency Approval</span>
              </h4>
              <p className="text-muted-foreground">
                Once the registry issues the final registration number or certificate, certify approval here.
              </p>
              <FormField label="Official Registry Registration # (Optional)">
                <Input
                  placeholder="e.g. CPR/2026/123456"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                />
              </FormField>
              <Button
                variant="gold"
                size="sm"
                className="w-full"
                isLoading={approvalMutation.isPending}
                onClick={() => approvalMutation.mutate()}
              >
                Certify Statutory Approval
              </Button>
            </Card>
          )}
        </div>
      </div>

      {/* STATUS UPDATE MODAL */}
      {isUpdateModalOpen && (
        <Modal
          isOpen={isUpdateModalOpen}
          onClose={() => setIsUpdateModalOpen(false)}
          title="Update Agency Registry Status"
          description="Record status changes and agency queries received from the government portal."
          size="md"
        >
          <div className="space-y-4 text-xs">
            <FormField label="Statutory Agency Status" required>
              <Select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as GovernmentStatus)}
                options={[
                  { value: "SUBMITTED", label: "Submitted to Agency" },
                  { value: "IN_REVIEW", label: "In Review / Processing" },
                  { value: "QUERY_RAISED", label: "Query Raised by Registry" },
                  { value: "APPROVED", label: "Approved & Certified" },
                  { value: "REJECTED", label: "Rejected by Agency" },
                ]}
              />
            </FormField>

            <FormField label="Agency Tracking / Reference Code">
              <Input
                value={updatedReference}
                onChange={(e) => setUpdatedReference(e.target.value)}
                placeholder="e.g. BRS-BN-2026-987654"
              />
            </FormField>

            {newStatus === "QUERY_RAISED" && (
              <FormField label="Agency Query Details / Blocker" required>
                <Textarea
                  placeholder="Specify the query raised by the registry examiner..."
                  value={queryDetails}
                  onChange={(e) => setQueryDetails(e.target.value)}
                  rows={3}
                />
              </FormField>
            )}

            <FormField label="Scheduled Follow-up Date">
              <Input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
              />
            </FormField>

            <FormField label="Officer Audit Remarks">
              <Textarea
                placeholder="Document any additional operational remarks..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={2}
              />
            </FormField>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsUpdateModalOpen(false)}
                disabled={updateStatusMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="gold"
                size="sm"
                isLoading={updateStatusMutation.isPending}
                onClick={() => updateStatusMutation.mutate()}
              >
                Save Status Update
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </PageShell>
  );
}
