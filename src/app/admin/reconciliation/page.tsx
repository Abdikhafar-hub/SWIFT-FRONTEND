"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Scale,
  CheckCircle2,
  AlertTriangle,
  Upload,
  RefreshCw,
  Search,
  FileSpreadsheet,
  HelpCircle,
  ShieldCheck,
  Building2,
  Smartphone,
  ExternalLink,
  Info,
  Layers,
  ArrowRight,
  Filter,
} from "lucide-react";
import { PageShell } from "@/components/ui/layout-primitives";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FormField, Textarea } from "@/components/ui/form-primitives";
import { Button } from "@/components/ui/button";
import { adminApi } from "@/lib/api/admin";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { ReconciliationRecord, ReconciliationStatus } from "@/types";

export default function AdminReconciliationPage() {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReconciliationStatus | "">("");
  const [providerFilter, setProviderFilter] = useState<string>("");
  const [sweepResult, setSweepResult] = useState<{
    scanned: number;
    matched: number;
    suspicious: number;
    duplicates: number;
    unchanged: number;
  } | null>(null);

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

  // Real-time authoritative backend reconciliation metrics
  const { data: reconMetrics, isLoading: isMetricsLoading } = useQuery({
    queryKey: ["admin-reconciliation-metrics"],
    queryFn: () => adminApi.getReconciliationMetrics(),
  });

  // Reconciliation records list with true server-side search and filters
  const {
    data: recordsData,
    isLoading: isRecordsLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-reconciliation-records", page, statusFilter, providerFilter, search],
    queryFn: () =>
      adminApi.getReconciliationRecords({
        page,
        limit: 10,
        status: statusFilter || undefined,
        provider: providerFilter || undefined,
        search: search.trim() || undefined,
      }),
  });

  // Run automated multi-pass reconciliation engine sweep
  const runSweepMutation = useMutation({
    mutationFn: () => adminApi.runReconciliationEngine(),
    onSuccess: (data) => {
      setSweepResult(data);
      queryClient.invalidateQueries({ queryKey: ["admin-reconciliation-records"] });
      queryClient.invalidateQueries({ queryKey: ["admin-reconciliation-metrics"] });
    },
  });

  // Ingest external statement entry
  const ingestMutation = useMutation({
    mutationFn: () =>
      adminApi.ingestStatementEntry({
        reference: ingestReference.trim(),
        amount: parseFloat(ingestAmount) || 0,
        provider: ingestProvider,
        notes: ingestNotes.trim() || undefined,
      }),
    onSuccess: () => {
      setIsIngestModalOpen(false);
      setIngestReference("");
      setIngestAmount("");
      setIngestNotes("");
      queryClient.invalidateQueries({ queryKey: ["admin-reconciliation-records"] });
      queryClient.invalidateQueries({ queryKey: ["admin-reconciliation-metrics"] });
    },
  });

  // Resolve discrepancy mutation
  const resolveMutation = useMutation({
    mutationFn: () => {
      if (!resolvingItem) throw new Error("No item selected for resolution");
      return adminApi.manualResolveReconciliation(resolvingItem.id, {
        status: resolutionStatus,
        transactionId: resolutionTransactionId.trim() || undefined,
        matchedTransactionId: resolutionTransactionId.trim() || undefined,
        notes: resolutionNotes.trim() || undefined,
      });
    },
    onSuccess: () => {
      setResolvingItem(null);
      setResolutionNotes("");
      setResolutionTransactionId("");
      queryClient.invalidateQueries({ queryKey: ["admin-reconciliation-records"] });
      queryClient.invalidateQueries({ queryKey: ["admin-reconciliation-metrics"] });
    },
  });

  const records = recordsData?.items || [];
  const pagination = recordsData?.pagination;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-4 sm:p-5 lg:p-6 space-y-4 max-w-[1550px] mx-auto font-sans">
      {/* ------------------------------------------------------------------ */}
      {/* 1. HEADER SECTION */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            M-Pesa &amp; Bank Financial Reconciliation Engine
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Automated multi-pass cross-check between Safaricom Daraja settlements, bank statements, and statutory commercial invoices.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <button
            onClick={() => runSweepMutation.mutate()}
            disabled={runSweepMutation.isPending}
            className="bg-white border border-slate-200 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`size-3.5 text-slate-500 ${runSweepMutation.isPending ? "animate-spin" : ""}`} />
            <span>{runSweepMutation.isPending ? "Scanning Ledger..." : "Run Auto-Recon Sweep"}</span>
          </button>

          <button
            onClick={() => setIsIngestModalOpen(true)}
            className="bg-gradient-to-r from-[#C5A059] to-[#D4AF37] hover:from-[#b49049] hover:to-[#c39e26] text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1.5 transform hover:-translate-y-0.5"
          >
            <Upload className="size-3.5 stroke-[3]" />
            <span>Ingest Statement</span>
          </button>
        </div>
      </div>

      {/* SWEEP RESULT FEEDBACK BANNER */}
      {sweepResult && (
        <div className="bg-emerald-50/90 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-xs text-emerald-900">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Automated Sweep Complete:</strong> Scanned <strong>{sweepResult.scanned}</strong> unreconciled statements. Matched <strong>{sweepResult.matched}</strong> entries, flagged <strong>{sweepResult.suspicious}</strong> amount variances, and detected <strong>{sweepResult.duplicates}</strong> ambiguous entries.
            </span>
          </div>
          <button
            onClick={() => setSweepResult(null)}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline ml-3"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 2. RECONCILIATION SUMMARY KPIS */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Statement Volume</span>
            <span className="text-xl font-extrabold text-slate-900 font-mono mt-0.5 block">
              {isMetricsLoading ? "—" : formatCurrency(reconMetrics?.totalIngestedVolume || 0)}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              {reconMetrics?.totalRecords ?? 0} statement lines recorded
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
            <FileSpreadsheet className="size-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Matched &amp; Cleared</span>
            <span className="text-xl font-extrabold text-emerald-600 font-mono mt-0.5 block">
              {isMetricsLoading ? "—" : formatCurrency(reconMetrics?.matchedVolume || 0)}
            </span>
            <span className="text-[10px] text-emerald-700 font-bold">
              {reconMetrics?.matchedCount ?? 0} entries ({reconMetrics?.reconciledRate ?? 100}% clear rate)
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60">
            <CheckCircle2 className="size-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Unmatched Discrepancies</span>
            <span className="text-xl font-extrabold text-amber-600 font-mono mt-0.5 block">
              {isMetricsLoading ? "—" : formatCurrency(reconMetrics?.unmatchedVolume || 0)}
            </span>
            <span className="text-[10px] text-amber-700 font-bold">
              {reconMetrics?.unmatchedCount ?? 0} pending matching
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60">
            <AlertTriangle className="size-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Audit Flags &amp; Duplicates</span>
            <span className="text-xl font-extrabold text-rose-600 font-mono mt-0.5 block">
              {isMetricsLoading ? "—" : (reconMetrics?.suspiciousCount || 0) + (reconMetrics?.duplicateCount || 0)}
            </span>
            <span className="text-[10px] text-rose-700 font-bold">
              {reconMetrics?.suspiciousCount ?? 0} variance, {reconMetrics?.duplicateCount ?? 0} duplicate
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200/60">
            <HelpCircle className="size-4" />
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. RECONCILIATION RECORDS CONTAINER */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Reconciliation &amp; Settlement Register</h3>
            <p className="text-xs text-slate-500 font-medium">
              Real-time cross-check ledger matching bank &amp; M-Pesa receipts against internal invoices.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-2.5 size-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search ref, notes, or provider..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium text-slate-800 placeholder-slate-400"
              />
            </div>

            <select
              value={providerFilter}
              onChange={(e) => {
                setProviderFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-semibold text-slate-700"
            >
              <option value="">All Providers</option>
              <option value="MPESA">Safaricom M-Pesa</option>
              <option value="BANK">Bank Wire</option>
              <option value="PESAPAL">Pesapal Gateway</option>
              <option value="MANUAL">Direct Cash</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as ReconciliationStatus | "");
                setPage(1);
              }}
              className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-semibold text-slate-700"
            >
              <option value="">All Statuses</option>
              <option value="MATCHED">Matched &amp; Cleared</option>
              <option value="UNMATCHED">Unmatched Discrepancy</option>
              <option value="DUPLICATE">Duplicate Entry</option>
              <option value="SUSPICIOUS">Suspicious Audit Flag</option>
              <option value="REVERSED">Reversed Settlement</option>
            </select>
          </div>
        </div>

        {isRecordsLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-slate-100 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <p className="text-xs font-bold text-rose-600">Failed to load reconciliation records.</p>
            <button
              onClick={() => refetch()}
              className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
            >
              Retry Loading
            </button>
          </div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <CheckCircle2 className="size-8 text-emerald-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">Zero Matching Discrepancies Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              All financial statement line items match statutory commercial invoices.
            </p>
            <button
              onClick={() => setIsIngestModalOpen(true)}
              className="bg-gradient-to-r from-[#C5A059] to-[#D4AF37] hover:from-[#b49049] hover:to-[#c39e26] text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-xs transition-all inline-flex items-center gap-1.5"
            >
              <Upload className="size-3.5 stroke-[2.5]" />
              <span>Ingest Statement Line</span>
            </button>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Provider</th>
                    <th className="py-3 px-4">Reference / Tx Code</th>
                    <th className="py-3 px-4 text-right">Statement Amount</th>
                    <th className="py-3 px-4">Linked Invoice / Client</th>
                    <th className="py-3 px-4">Recon Status</th>
                    <th className="py-3 px-4">Reconciled Date</th>
                    <th className="py-3 px-4 text-right">Audit Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {records.map((item: ReconciliationRecord) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                          {item.provider === "MPESA" ? (
                            <Smartphone className="size-3.5 text-emerald-600" />
                          ) : (
                            <Building2 className="size-3.5 text-amber-700" />
                          )}
                          <span>{item.provider || "MPESA"}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <Link
                          href={`/admin/reconciliation/${item.id}`}
                          className="font-mono text-xs text-slate-900 font-bold hover:text-amber-600 hover:underline flex items-center gap-1"
                        >
                          <span>{item.reference || "—"}</span>
                          <ExternalLink className="size-3 text-slate-400" />
                        </Link>
                      </td>

                      <td className="py-3 px-4 font-mono text-xs font-extrabold text-slate-900 text-right">
                        {formatCurrency(Number(item.amount || 0), item.currency || "KES")}
                      </td>

                      <td className="py-3 px-4">
                        {item.transaction?.payment ? (
                          <div>
                            <span className="font-mono font-bold text-slate-900 block text-xs">
                              {item.transaction.payment.invoiceNumber}
                            </span>
                            <span className="text-[11px] text-slate-500 block truncate max-w-[180px]">
                              {item.transaction.payment.client?.fullName ||
                                item.transaction.payment.client?.businessName ||
                                item.transaction.payment.application?.service?.name ||
                                "Commercial Client"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Unlinked</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                            item.status === "MATCHED"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                              : item.status === "SUSPICIOUS" || item.status === "REVERSED"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : item.status === "DUPLICATE"
                              ? "bg-amber-50 text-amber-800 border-amber-200/80"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-xs text-slate-500 font-medium">
                        {item.reconciledAt ? (
                          <div>
                            <span className="block text-slate-700 font-semibold">{formatDate(item.reconciledAt)}</span>
                            {item.reconciledBy?.email && (
                              <span className="block text-[10px] text-slate-400">{item.reconciledBy.email}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">Pending Sweep</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/admin/reconciliation/${item.id}`}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-2.5 py-1 rounded-lg transition-all"
                          >
                            Dossier
                          </Link>

                          {item.status !== "MATCHED" && (
                            <button
                              onClick={() => {
                                setResolvingItem(item);
                                setResolutionStatus(item.status || "MATCHED");
                                setResolutionNotes(item.notes || "");
                                setResolutionTransactionId(item.transactionId || "");
                              }}
                              className="bg-gradient-to-r from-[#C5A059] to-[#D4AF37] hover:from-[#b49049] hover:to-[#c39e26] text-white font-bold text-xs px-2.5 py-1 rounded-lg shadow-xs transition-all"
                            >
                              Resolve
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="px-4 py-3 bg-slate-50/60 border-t border-slate-200/80 flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>
                  Page {pagination.page} of {pagination.totalPages} ({pagination.total} total statement lines)
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

      {/* INGEST STATEMENT MODAL */}
      <Modal
        isOpen={isIngestModalOpen}
        onClose={() => setIsIngestModalOpen(false)}
        title="Ingest Statement Entry"
        description="Record an external M-Pesa paybill line or bank deposit to match against internal invoices."
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
              Ingest &amp; Match
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
                placeholder="e.g. QKH718290 or Bank Reference"
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
              placeholder="Record bank ledger slip number, payer details, or narrative..."
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
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Reference Code:</span>
                <span className="font-mono font-bold text-slate-900">{resolvingItem.reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Statement Amount:</span>
                <span className="font-mono font-extrabold text-emerald-600">
                  {formatCurrency(Number(resolvingItem.amount || 0), resolvingItem.currency || "KES")}
                </span>
              </div>
            </div>
          )}

          <FormField label="Resolution Strategy" required>
            <Select
              value={resolutionStatus}
              onChange={(e) => setResolutionStatus(e.target.value as ReconciliationStatus)}
              options={[
                { value: "MATCHED", label: "Mark as Matched & Clear Invoice" },
                { value: "UNMATCHED", label: "Keep as Unmatched Discrepancy" },
                { value: "DUPLICATE", label: "Flag as Duplicate Entry" },
                { value: "SUSPICIOUS", label: "Flag as Suspicious / Variance" },
                { value: "REVERSED", label: "Mark as Reversed Settlement" },
              ]}
            />
          </FormField>

          <FormField label="Target Internal Transaction ID / Ref (Optional)">
            <Input
              placeholder="Paste Payment Transaction UUID or M-Pesa Ref..."
              value={resolutionTransactionId}
              onChange={(e) => setResolutionTransactionId(e.target.value)}
            />
          </FormField>

          <FormField label="Compliance Auditor Remarks" required>
            <Textarea
              placeholder="Provide clear justification for audit resolution outcome..."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              rows={3}
            />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
