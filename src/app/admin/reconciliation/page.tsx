"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Scale,
  CheckCircle2,
  AlertTriangle,
  Upload,
  RefreshCw,
  Search,
  FileSpreadsheet,
  Check,
  XCircle,
  HelpCircle,
  ShieldCheck,
  Building2,
  Smartphone,
  ExternalLink,
} from "lucide-react";
import { PageShell } from "@/components/ui/layout-primitives";
import { Card, StatCard } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Pagination,
} from "@/components/ui/table-primitives";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FormField, Textarea } from "@/components/ui/form-primitives";
import { Skeleton, ErrorState, EmptyState } from "@/components/ui/feedback-primitives";
import { adminApi } from "@/lib/api/admin";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { ReconciliationRecord, ReconciliationStatus } from "@/types";

export default function AdminReconciliationPage() {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReconciliationStatus | "">("");

  // Ingest Statement Modal
  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);
  const [ingestReference, setIngestReference] = useState("");
  const [ingestAmount, setIngestAmount] = useState("");
  const [ingestProvider, setIngestProvider] = useState("MPESA");
  const [ingestNotes, setIngestNotes] = useState("");

  // Resolve Discrepancy Modal
  const [resolvingItem, setResolvingItem] = useState<ReconciliationRecord | null>(null);
  const [resolutionStatus, setResolutionStatus] = useState<ReconciliationStatus>("MATCHED");
  const [resolutionTransactionId, setResolutionTransactionId] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");

  // Financial summary for KPI metrics
  const { data: finSummary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ["admin-financial-summary"],
    queryFn: () => adminApi.getFinancialSummary(),
  });

  // Reconciliation records list
  const {
    data: recordsData,
    isLoading: isRecordsLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-reconciliation-records", page, statusFilter],
    queryFn: () =>
      adminApi.getReconciliationRecords({
        page,
        limit: 10,
        status: statusFilter || undefined,
      }),
  });

  // Run reconciliation engine mutation
  const runSweepMutation = useMutation({
    mutationFn: () => adminApi.runReconciliationEngine(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reconciliation-records"] });
      queryClient.invalidateQueries({ queryKey: ["admin-financial-summary"] });
      queryClient.invalidateQueries({ queryKey: ["admin-invoices-list"] });
    },
  });

  // Ingest statement entry mutation
  const ingestMutation = useMutation({
    mutationFn: () =>
      adminApi.ingestStatementEntry({
        reference: ingestReference || `MPESA-${Date.now()}`,
        amount: parseFloat(ingestAmount) || 0,
        provider: ingestProvider,
        notes: ingestNotes || undefined,
      }),
    onSuccess: () => {
      setIsIngestModalOpen(false);
      setIngestReference("");
      setIngestAmount("");
      setIngestNotes("");
      queryClient.invalidateQueries({ queryKey: ["admin-reconciliation-records"] });
      queryClient.invalidateQueries({ queryKey: ["admin-financial-summary"] });
    },
  });

  // Resolve reconciliation mutation
  const resolveMutation = useMutation({
    mutationFn: () => {
      if (!resolvingItem) throw new Error("No item selected");
      return adminApi.manualResolveReconciliation(resolvingItem.id, {
        status: resolutionStatus,
        transactionId: resolutionTransactionId || undefined,
        notes: resolutionNotes || undefined,
      });
    },
    onSuccess: () => {
      setResolvingItem(null);
      setResolutionNotes("");
      setResolutionTransactionId("");
      queryClient.invalidateQueries({ queryKey: ["admin-reconciliation-records"] });
      queryClient.invalidateQueries({ queryKey: ["admin-financial-summary"] });
      queryClient.invalidateQueries({ queryKey: ["admin-invoices-list"] });
    },
  });

  const rawRecords = recordsData?.items || [];
  const records = search.trim()
    ? rawRecords.filter(
        (r) =>
          r.reference?.toLowerCase().includes(search.toLowerCase()) ||
          r.notes?.toLowerCase().includes(search.toLowerCase()) ||
          r.provider?.toLowerCase().includes(search.toLowerCase())
      )
    : rawRecords;

  const pagination = recordsData?.pagination;

  return (
    <PageShell
      eyebrow="FINANCIAL INTEGRITY & AUDIT"
      title="M-Pesa & Bank Reconciliation Engine"
      description="Automated cross-check between Safaricom Daraja API settlements, bank statements, and issued statutory invoices."
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            isLoading={runSweepMutation.isPending}
            leftIcon={<RefreshCw className="size-4" />}
            onClick={() => runSweepMutation.mutate()}
          >
            Run Auto-Recon Sweep
          </Button>
          <Button
            variant="gold"
            size="sm"
            leftIcon={<Upload className="size-4" />}
            onClick={() => setIsIngestModalOpen(true)}
          >
            Ingest Statement
          </Button>
        </div>
      }
    >
      {/* 1. RECONCILIATION SUMMARY KPIS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Gross Invoiced"
          value={isSummaryLoading ? "—" : formatCurrency(Number(finSummary?.metrics.totalInvoiced || 0))}
          subtitle={`${finSummary?.metrics.totalInvoices ?? 0} commercial invoices`}
          icon={<Scale className="size-5 text-navy dark:text-gold" />}
        />

        <StatCard
          title="Settled Collections"
          value={isSummaryLoading ? "—" : formatCurrency(Number(finSummary?.metrics.totalCollected || 0))}
          subtitle="Daraja + Direct Wire"
          icon={<CheckCircle2 className="size-5 text-emerald-600" />}
        />

        <StatCard
          title="Outstanding Receivable"
          value={isSummaryLoading ? "—" : formatCurrency(Number(finSummary?.metrics.totalOutstanding || 0))}
          subtitle="Pending settlement"
          variant={Number(finSummary?.metrics.totalOutstanding || 0) > 0 ? "gold" : "default"}
          icon={<AlertTriangle className="size-5 text-amber-600" />}
        />

        <StatCard
          title="Overdue Receivables"
          value={isSummaryLoading ? "—" : formatCurrency(Number(finSummary?.metrics.totalOverdue || 0))}
          subtitle={`${finSummary?.metrics.overdueInvoicesCount ?? 0} overdue invoices`}
          icon={<HelpCircle className="size-5 text-muted-foreground" />}
        />
      </div>

      {/* 2. RECONCILIATION RECORDS TABLE */}
      <div className="mt-8 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-bold text-foreground">Reconciliation & Settlement Register</h3>
            <p className="text-xs text-muted-foreground">
              M-Pesa reference matching, bank deposits, and automated invoice clearance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="w-56">
              <Input
                placeholder="Search reference or note..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftAddon={<Search className="size-3.5" />}
              />
            </div>

            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as ReconciliationStatus | "");
                setPage(1);
              }}
              className="w-44 text-xs"
              options={[
                { value: "", label: "All Statuses" },
                { value: "MATCHED", label: "Matched & Cleared" },
                { value: "UNMATCHED", label: "Unmatched Discrepancy" },
                { value: "DUPLICATE", label: "Duplicate Entry" },
                { value: "SUSPICIOUS", label: "Suspicious Audit Flag" },
                { value: "REVERSED", label: "Reversed Settlement" },
              ]}
            />
          </div>
        </div>

        {isRecordsLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : error ? (
          <ErrorState onRetry={() => refetch()} />
        ) : records.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 className="size-7 text-emerald-600" />}
            title="Zero Outstanding Discrepancies"
            description="All financial statement transactions are fully matched to commercial invoices."
            action={
              <Button
                variant="gold"
                size="xs"
                leftIcon={<Upload className="size-3.5" />}
                onClick={() => setIsIngestModalOpen(true)}
              >
                Ingest Statement Entry
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Reference / Tx Code</TableHead>
                  <TableHead className="text-right">Statement Amount</TableHead>
                  <TableHead>Recon Status</TableHead>
                  <TableHead>Reconciled Date</TableHead>
                  <TableHead>Ingested Date</TableHead>
                  <TableHead className="text-right">Audit Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((item: ReconciliationRecord) => (
                  <TableRow key={item.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-1.5 font-semibold text-xs">
                        {item.provider === "MPESA" ? (
                          <Smartphone className="size-3.5 text-emerald-600" />
                        ) : (
                          <Building2 className="size-3.5 text-navy dark:text-gold" />
                        )}
                        <span>{item.provider || "MPESA"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-foreground font-semibold">
                      {item.reference || "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold text-foreground text-right">
                      {formatCurrency(Number(item.amount || 0), item.currency || "KES")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        tone={
                          item.status === "MATCHED"
                            ? "success"
                            : item.status === "SUSPICIOUS" || item.status === "REVERSED"
                            ? "destructive"
                            : item.status === "DUPLICATE"
                            ? "warning"
                            : "neutral"
                        }
                        size="sm"
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {item.reconciledAt ? formatDate(item.reconciledAt) : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(item.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.status !== "MATCHED" ? (
                        <Button
                          variant="gold"
                          size="xs"
                          onClick={() => {
                            setResolvingItem(item);
                            setResolutionNotes(item.notes || "");
                            setResolutionTransactionId(item.transactionId || "");
                          }}
                        >
                          Resolve
                        </Button>
                      ) : (
                        <span className="text-[11px] text-emerald-600 font-semibold flex items-center justify-end gap-1">
                          <ShieldCheck className="size-3" />
                          <span>Cleared</span>
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {pagination && (
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                pageSize={pagination.limit}
                onChange={(p: number) => setPage(p)}
              />
            )}
          </div>
        )}
      </div>

      {/* INGEST STATEMENT MODAL */}
      <Modal
        isOpen={isIngestModalOpen}
        onClose={() => setIsIngestModalOpen(false)}
        title="Ingest Statement Entry"
        description="Record an M-Pesa or Bank Statement entry to match against pending invoices."
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsIngestModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="gold"
              size="sm"
              isLoading={ingestMutation.isPending}
              disabled={!ingestReference.trim() || !ingestAmount.trim()}
              onClick={() => ingestMutation.mutate()}
            >
              Ingest & Match
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Provider / Channel" required>
              <Select
                value={ingestProvider}
                onChange={(e) => setIngestProvider(e.target.value)}
                options={[
                  { value: "MPESA", label: "Safaricom M-Pesa C2B / Paybill" },
                  { value: "BANK", label: "Bank Wire (KCB / Equity / Stanbic)" },
                  { value: "PESAPAL", label: "Pesapal Card Gateway" },
                  { value: "MANUAL", label: "Direct Cash / Manual Deposit" },
                ]}
              />
            </FormField>

            <FormField label="Statement Reference / Tx Code" required>
              <Input
                placeholder="e.g. QKH718290 or RTGS Reference"
                value={ingestReference}
                onChange={(e) => setIngestReference(e.target.value)}
              />
            </FormField>
          </div>

          <FormField label="Settlement Amount (KES)" required>
            <Input
              type="number"
              min={1}
              placeholder="e.g. 5000"
              value={ingestAmount}
              onChange={(e) => setIngestAmount(e.target.value)}
            />
          </FormField>

          <FormField label="Statement Notes / Narrative">
            <Textarea
              placeholder="Record bank ledger slip number, payer notes, or transaction remarks..."
              value={ingestNotes}
              onChange={(e) => setIngestNotes(e.target.value)}
              rows={3}
            />
          </FormField>
        </div>
      </Modal>

      {/* RESOLVE DISCREPANCY MODAL */}
      <Modal
        isOpen={Boolean(resolvingItem)}
        onClose={() => setResolvingItem(null)}
        title="Resolve Reconciliation Discrepancy"
        description={`Audit resolution for entry #${resolvingItem?.reference || resolvingItem?.id}.`}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setResolvingItem(null)}>
              Cancel
            </Button>
            <Button
              variant="gold"
              size="sm"
              isLoading={resolveMutation.isPending}
              onClick={() => resolveMutation.mutate()}
            >
              Confirm Audit Resolution
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          {resolvingItem && (
            <div className="rounded-xs border border-border bg-muted/20 p-3 space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reference:</span>
                <span className="font-mono font-bold text-foreground">{resolvingItem.reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-mono font-bold text-emerald-600">
                  {formatCurrency(Number(resolvingItem.amount || 0), resolvingItem.currency || "KES")}
                </span>
              </div>
            </div>
          )}

          <FormField label="Resolution Outcome" required>
            <Select
              value={resolutionStatus}
              onChange={(e) => setResolutionStatus(e.target.value as ReconciliationStatus)}
              options={[
                { value: "MATCHED", label: "Mark as Matched & Clear Invoice" },
                { value: "UNMATCHED", label: "Keep as Unmatched Discrepancy" },
                { value: "DUPLICATE", label: "Flag as Duplicate Entry" },
                { value: "SUSPICIOUS", label: "Flag as Suspicious / Fraudulent" },
                { value: "REVERSED", label: "Mark as Reversed Settlement" },
              ]}
            />
          </FormField>

          <FormField label="Linked Transaction ID (Optional)">
            <Input
              placeholder="Enter Payment Transaction UUID..."
              value={resolutionTransactionId}
              onChange={(e) => setResolutionTransactionId(e.target.value)}
            />
          </FormField>

          <FormField label="Auditor Resolution Remarks" required>
            <Textarea
              placeholder="Explain justification for audit clearance or discrepancy status..."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              rows={3}
            />
          </FormField>
        </div>
      </Modal>
    </PageShell>
  );
}
