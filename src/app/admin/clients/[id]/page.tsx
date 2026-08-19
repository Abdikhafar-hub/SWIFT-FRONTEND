"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building,
  User,
  Phone,
  Mail,
  MapPin,
  FileCheck2,
  FolderOpen,
  DollarSign,
  CreditCard,
  Plus,
  ExternalLink,
  ChevronRight,
  Download,
  Clock,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { PageShell } from "@/components/ui/layout-primitives";
import { Card, StatCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table-primitives";
import { StatusBadge, SlaBadge, PriorityBadge } from "@/components/domain/status-badges";
import { Skeleton, ErrorState } from "@/components/ui/feedback-primitives";
import { Modal } from "@/components/ui/modal";
import { FormField, Textarea } from "@/components/ui/form-primitives";
import { Input } from "@/components/ui/input";
import { adminApi } from "@/lib/api/admin";
import { formatCurrency, formatDate } from "@/lib/utils/format";

type Client360Tab = "applications" | "documents" | "invoices" | "transactions";

export default function AdminClientDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<Client360Tab>("applications");

  // Review modal state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [isDuplicateFlagged, setIsDuplicateFlagged] = useState(false);
  const [duplicateReason, setDuplicateReason] = useState("");

  const { data: client, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-client-360", id],
    queryFn: () => adminApi.getClientById(id),
    enabled: Boolean(id),
  });

  const reviewMutation = useMutation({
    mutationFn: (payload: { reviewNotes?: string; isDuplicateFlagged?: boolean; duplicateReason?: string | null }) =>
      adminApi.reviewRegistration(id, payload),
    onSuccess: () => {
      setIsReviewModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin-client-360", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-registrations"] });
      queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
      queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
    },
  });

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    reviewMutation.mutate({
      reviewNotes: reviewNotes.trim() || undefined,
      isDuplicateFlagged,
      duplicateReason: isDuplicateFlagged ? duplicateReason.trim() || "Flagged during review" : null,
    });
  };

  if (isLoading) {
    return (
      <PageShell title="Loading Client 360 Dossier...">
        <div className="space-y-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </PageShell>
    );
  }

  if (error || !client) {
    return (
      <PageShell title="Client 360 Dossier">
        <ErrorState onRetry={() => refetch()} />
      </PageShell>
    );
  }

  const applications = client.applications || [];
  const documents = client.documents || [];
  const invoices = client.invoices || [];
  const transactions = client.transactions || [];

  const totalInvoiced = invoices.reduce(
    (acc, inv) => acc + (typeof inv.totalAmount === "number" ? inv.totalAmount : parseFloat(String(inv.totalAmount || 0))),
    0
  );
  const totalPaid = invoices.reduce(
    (acc, inv) => acc + (typeof inv.amountPaid === "number" ? inv.amountPaid : parseFloat(String(inv.amountPaid || 0))),
    0
  );
  const totalDue = invoices.reduce(
    (acc, inv) => acc + (typeof inv.amountDue === "number" ? inv.amountDue : parseFloat(String(inv.amountDue || 0))),
    0
  );

  return (
    <PageShell
      eyebrow={`CLIENT 360 • ${client.clientNumber || "REGISTERED ENTITY"}`}
      title={client.fullName || client.businessName || "Client Entity"}
      description={`KRA PIN: ${client.kraPin || "N/A"} • Phone: ${client.phone || "N/A"} • Email: ${client.email}`}
      actions={
        <div className="flex items-center gap-2">
          <Link href="/admin/clients">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="size-3.5" />}>
              Clients Directory
            </Button>
          </Link>
          <Link href={`/admin/applications?clientId=${client.id}`}>
            <Button variant="gold" size="sm" leftIcon={<Plus className="size-4" />}>
              New Filing
            </Button>
          </Link>
        </div>
      }
    >
      {/* 1. EXECUTIVE SUMMARY STATS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Filings"
          value={applications.length}
          subtitle="Statutory applications"
          icon={<FileCheck2 className="size-5 text-navy dark:text-gold" />}
        />

        <StatCard
          title="Verified Documents"
          value={documents.length}
          subtitle="Stored in encrypted vault"
          icon={<FolderOpen className="size-5 text-gold-dark dark:text-gold" />}
        />

        <StatCard
          title="Gross Collections (KES)"
          value={formatCurrency(totalPaid)}
          subtitle={`Total Invoiced: ${formatCurrency(totalInvoiced)}`}
          icon={<DollarSign className="size-5 text-emerald-600" />}
        />

        <StatCard
          title="Outstanding Balance (KES)"
          value={formatCurrency(totalDue)}
          subtitle="Pending settlement"
          variant={totalDue > 0 ? "gold" : "default"}
          icon={<CreditCard className="size-5 text-amber-600" />}
        />
      </div>

      {/* 1.5. REVIEW STATUS BANNER */}
      <div className="mt-5">
        {!client.isReviewed ? (
          <div className="rounded-xs border border-amber-500/30 bg-amber-500/5 p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xs bg-amber-500/15">
                <Clock className="size-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Pending Administrative Review</p>
                <p className="text-xs text-muted-foreground">
                  This client registered on {client.createdAt ? formatDate(client.createdAt) : "N/A"} and has not been vetted by an administrator.
                </p>
              </div>
            </div>
            <Button
              variant="gold"
              size="sm"
              leftIcon={<ShieldCheck className="size-4" />}
              onClick={() => {
                setReviewNotes(client.reviewNotes || "");
                setIsDuplicateFlagged(Boolean(client.isDuplicateFlagged));
                setDuplicateReason(client.duplicateReason || "");
                setIsReviewModalOpen(true);
              }}
            >
              Review & Approve
            </Button>
          </div>
        ) : (
          <div className="rounded-xs border border-emerald-500/30 bg-emerald-500/5 p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xs bg-emerald-500/15">
                <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Reviewed & Verified</p>
                <p className="text-xs text-muted-foreground">
                  Vetted on {client.reviewedAt ? formatDate(client.reviewedAt) : "N/A"}
                  {client.reviewedBy?.email && ` by ${client.reviewedBy.email}`}
                  {client.reviewNotes && ` — ${client.reviewNotes}`}
                </p>
              </div>
            </div>
            {client.isDuplicateFlagged && (
              <Badge tone="destructive" size="sm">
                <AlertTriangle className="mr-1 size-3" />
                Duplicate Flagged
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* 2. ENTITY PROFILE CARD */}
      <div className="mt-6">
        <Card padding="md">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-muted-foreground block text-[11px]">Entity Type</span>
              <div className="mt-1">
                <Badge tone={client.clientType === "BUSINESS" ? "gold" : "neutral"} size="sm">
                  {client.clientType}
                </Badge>
              </div>
            </div>

            <div>
              <span className="text-muted-foreground block text-[11px]">National ID / Registration #</span>
              <strong className="text-foreground font-mono">{client.idNumber || client.kraPin || "N/A"}</strong>
            </div>

            <div>
              <span className="text-muted-foreground block text-[11px]">Postal / Physical Address</span>
              <span className="text-foreground truncate block">{client.address || "N/A"}</span>
            </div>

            <div>
              <span className="text-muted-foreground block text-[11px]">Member Since</span>
              <span className="text-foreground">{formatDate(client.createdAt)}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* 3. 360-DEGREE TABS */}
      <div className="mt-6 flex flex-wrap items-center gap-1 border-b border-border pb-1">
        <button
          type="button"
          onClick={() => setActiveTab("applications")}
          className={`flex items-center gap-2 rounded-xs px-3.5 py-2 text-xs font-bold transition-all ${
            activeTab === "applications"
              ? "border-b-2 border-gold text-gold-dark dark:text-gold bg-gold/5"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
          }`}
        >
          <FileCheck2 className="size-3.5" />
          <span>Applications History ({applications.length})</span>
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
          <span>Document Vault ({documents.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("invoices")}
          className={`flex items-center gap-2 rounded-xs px-3.5 py-2 text-xs font-bold transition-all ${
            activeTab === "invoices"
              ? "border-b-2 border-gold text-gold-dark dark:text-gold bg-gold/5"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
          }`}
        >
          <DollarSign className="size-3.5" />
          <span>Invoices ({invoices.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("transactions")}
          className={`flex items-center gap-2 rounded-xs px-3.5 py-2 text-xs font-bold transition-all ${
            activeTab === "transactions"
              ? "border-b-2 border-gold text-gold-dark dark:text-gold bg-gold/5"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
          }`}
        >
          <CreditCard className="size-3.5" />
          <span>Payment Ledger ({transactions.length})</span>
        </button>
      </div>

      {/* 4. TAB CONTENTS */}
      <div className="mt-6">
        {/* TAB 1: APPLICATIONS */}
        {activeTab === "applications" && (
          <div className="space-y-4">
            {applications.length === 0 ? (
              <Card padding="lg" className="text-center text-xs text-muted-foreground">
                No statutory applications filed by this client yet.
              </Card>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dossier #</TableHead>
                    <TableHead>Statutory Service</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>SLA</TableHead>
                    <TableHead>Date Filed</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-mono text-xs font-bold text-foreground">
                        #{app.applicationNumber}
                      </TableCell>
                      <TableCell className="font-semibold text-xs text-foreground">
                        {app.service?.name || "Statutory Service"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={app.status} size="sm" />
                      </TableCell>
                      <TableCell>
                        <PriorityBadge priority={app.priority} size="sm" />
                      </TableCell>
                      <TableCell>
                        <SlaBadge status={app.slaStatus} size="sm" />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(app.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/admin/applications/${app.id}`}>
                          <Button variant="gold" size="xs" rightIcon={<ChevronRight className="size-3.5" />}>
                            Dossier
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}

        {/* TAB 2: DOCUMENTS */}
        {activeTab === "documents" && (
          <div className="space-y-4">
            {documents.length === 0 ? (
              <Card padding="lg" className="text-center text-xs text-muted-foreground">
                No documents uploaded for this client yet.
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {documents.map((doc) => (
                  <Card key={doc.id} padding="md" className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h5 className="text-xs font-bold text-foreground">{doc.title || doc.currentVersion?.fileName || "Document"}</h5>
                        <span className="text-[11px] font-mono text-muted-foreground">
                          {doc.documentType || "STATUTORY"} • {doc.currentVersion?.mimeType || "application/pdf"}
                        </span>
                      </div>
                      <Badge tone={doc.status === "APPROVED" ? "success" : doc.status === "PENDING_REVIEW" ? "warning" : "neutral"} size="sm">
                        {doc.status || "PENDING"}
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

        {/* TAB 3: INVOICES */}
        {activeTab === "invoices" && (
          <div className="space-y-4">
            {invoices.length === 0 ? (
              <Card padding="lg" className="text-center text-xs text-muted-foreground">
                No invoices generated for this client.
              </Card>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Amount Paid</TableHead>
                    <TableHead>Amount Due</TableHead>
                    <TableHead>Issued Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-mono text-xs font-bold text-foreground">
                        #{inv.invoiceNumber}
                      </TableCell>
                      <TableCell>
                        <Badge tone={inv.status === "PAID" ? "success" : "warning"} size="sm">
                          {inv.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold text-foreground">
                        {formatCurrency(inv.totalAmount, inv.currency)}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-emerald-600 font-semibold">
                        {formatCurrency(inv.amountPaid, inv.currency)}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-gold-dark dark:text-gold font-bold">
                        {formatCurrency(inv.amountDue, inv.currency)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(inv.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}

        {/* TAB 4: TRANSACTIONS */}
        {activeTab === "transactions" && (
          <div className="space-y-4">
            {transactions.length === 0 ? (
              <Card padding="lg" className="text-center text-xs text-muted-foreground">
                No payment transactions recorded for this client.
              </Card>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction #</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reference Code</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Settlement Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-mono text-xs font-semibold text-foreground">
                        {tx.transactionNumber}
                      </TableCell>
                      <TableCell>
                        <Badge tone="neutral" size="sm">{tx.paymentMethod}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {tx.externalReference || "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold text-emerald-600">
                        {formatCurrency(tx.amount, tx.currency || "KES")}
                      </TableCell>
                      <TableCell>
                        <Badge tone={tx.status === "PAID" || tx.status === "COMPLETED" ? "success" : "warning"} size="sm">
                          {tx.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(tx.paidAt || tx.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}
      </div>

      {/* ADMINISTRATIVE REVIEW MODAL */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => {
          if (!reviewMutation.isPending) {
            setIsReviewModalOpen(false);
          }
        }}
        title={`Vetting Review — ${client.clientNumber}`}
      >
        <form onSubmit={handleReviewSubmit} className="space-y-4">
          <div className="rounded-xs border border-border bg-muted/30 p-4 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-sm font-bold text-foreground">{client.fullName || client.businessName}</h4>
                <p className="text-xs text-muted-foreground">{client.email} • {client.phone}</p>
              </div>
              <Badge tone="neutral" size="sm">{client.clientType}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border/60">
              <div>
                <span className="text-muted-foreground">KRA PIN: </span>
                <span className="font-mono font-semibold">{client.kraPin || "N/A"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">National ID: </span>
                <span className="font-mono font-semibold">{client.nationalId || client.idNumber || "N/A"}</span>
              </div>
            </div>
          </div>

          {client.isDuplicateFlagged && (
            <div className="rounded-xs border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300">
              <div className="flex items-center gap-2 font-bold mb-1">
                <AlertTriangle className="size-4" />
                <span>Duplicate Risk Detected</span>
              </div>
              <p>{client.duplicateReason || "Shares contact or KRA PIN details with another profile."}</p>
            </div>
          )}

          <FormField label="Administrative Review Notes" hint="Internal vetting notes and KYC verification observations">
            <Textarea
              placeholder="e.g. KRA PIN verified, national ID cross-checked against registry."
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              rows={3}
            />
          </FormField>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="flagDuplicate360"
              checked={isDuplicateFlagged}
              onChange={(e) => setIsDuplicateFlagged(e.target.checked)}
              className="rounded border-border text-gold focus:ring-gold size-4"
            />
            <label htmlFor="flagDuplicate360" className="text-xs font-semibold text-foreground cursor-pointer">
              Flag as potential duplicate / requires KYC escalation
            </label>
          </div>

          {isDuplicateFlagged && (
            <FormField label="Duplicate Escalation Reason">
              <Input
                placeholder="Specify duplicate criteria..."
                value={duplicateReason}
                onChange={(e) => setDuplicateReason(e.target.value)}
              />
            </FormField>
          )}

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsReviewModalOpen(false)}
              disabled={reviewMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="gold"
              size="sm"
              isLoading={reviewMutation.isPending}
              leftIcon={<ShieldCheck className="size-4" />}
            >
              {client.isReviewed ? "Update Review Notes" : "Approve & Mark Reviewed"}
            </Button>
          </div>
        </form>
      </Modal>
    </PageShell>
  );
}
