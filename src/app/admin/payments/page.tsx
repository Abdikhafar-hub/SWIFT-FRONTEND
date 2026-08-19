"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CreditCard,
  DollarSign,
  Receipt as ReceiptIcon,
  RotateCcw,
  Search,
  Plus,
  ArrowRight,
  TrendingUp,
  Download,
  AlertTriangle,
  Building,
  User,
  Sliders,
  Calendar,
  Clock,
  Eye,
  CheckCircle2,
  PieChart,
  ShieldCheck,
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
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { FormField, Textarea } from "@/components/ui/form-primitives";
import { PaymentStatusBadge } from "@/components/domain/status-badges";
import {
  AdminManualPaymentModal,
  AdminCreateInvoiceModal,
  AdminInvoiceDetailModal,
  AdminFinancialAdjustmentModal,
  AdminReverseTransactionModal,
  AdminReceiptDetailModal,
  AdminRequestRefundModal,
  AdminRefundReviewModal,
} from "@/components/domain";
import { EmptyState, Skeleton, ErrorState } from "@/components/ui/feedback-primitives";
import { adminApi } from "@/lib/api/admin";
import { formatDate, formatCurrency } from "@/lib/utils/format";
import type {
  Payment,
  PaymentTransaction,
  Receipt,
  Refund,
  AgingBucket,
  OutstandingInvoice,
} from "@/types";

type FinancialTab = "invoices" | "transactions" | "receipts" | "refunds" | "aging";

export default function AdminPaymentsPage() {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<FinancialTab>("invoices");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selectedAgingBucket, setSelectedAgingBucket] = useState<AgingBucket | undefined>(undefined);

  // Modals state
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [selectedInvoiceForPay, setSelectedInvoiceForPay] = useState<Payment | null>(null);
  const [selectedInvoiceForAdjust, setSelectedInvoiceForAdjust] = useState<Payment | null>(null);
  const [selectedTxForReverse, setSelectedTxForReverse] = useState<PaymentTransaction | null>(null);
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);
  const [selectedTxForRefund, setSelectedTxForRefund] = useState<PaymentTransaction | null>(null);
  const [isRequestRefundOpen, setIsRequestRefundOpen] = useState(false);
  const [selectedRefundForReview, setSelectedRefundForReview] = useState<Refund | null>(null);
  const [isBreakdownModalOpen, setIsBreakdownModalOpen] = useState(false);

  // Financial summary KPIs
  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ["admin-financial-summary"],
    queryFn: () => adminApi.getFinancialSummary(),
  });

  // Collections by method
  const { data: collectionsData } = useQuery({
    queryKey: ["admin-financial-collections"],
    queryFn: () => adminApi.getFinancialCollections(),
    enabled: activeTab === "aging",
  });

  // Outstanding / Aging Query
  const { data: outstandingData, isLoading: isOutstandingLoading } = useQuery({
    queryKey: ["admin-outstanding-invoices", selectedAgingBucket, page],
    queryFn: () =>
      adminApi.getOutstandingInvoices({
        page,
        limit: 15,
        agingBucket: selectedAgingBucket,
      }),
    enabled: activeTab === "aging",
  });

  // Invoices Query
  const {
    data: invoicesData,
    isLoading: isInvoicesLoading,
    error: invoicesError,
    refetch: refetchInvoices,
  } = useQuery({
    queryKey: ["admin-invoices-list", page, search, statusFilter],
    queryFn: () =>
      adminApi.getInvoices({
        page,
        limit: 10,
        search: search || undefined,
        status: statusFilter || undefined,
      }),
    enabled: activeTab === "invoices",
  });

  // Transactions Query
  const {
    data: transactionsData,
    isLoading: isTxLoading,
    error: txError,
  } = useQuery({
    queryKey: ["admin-transactions-list", page, search],
    queryFn: () =>
      adminApi.getTransactions({
        page,
        limit: 10,
        search: search || undefined,
      }),
    enabled: activeTab === "transactions",
  });

  // Receipts Query
  const {
    data: receiptsData,
    isLoading: isReceiptsLoading,
  } = useQuery({
    queryKey: ["admin-receipts-list", page],
    queryFn: () => adminApi.getReceipts({ page, limit: 10 }),
    enabled: activeTab === "receipts",
  });

  // Refunds Query
  const {
    data: refundsData,
    isLoading: isRefundsLoading,
  } = useQuery({
    queryKey: ["admin-refunds-list", page],
    queryFn: () => adminApi.getRefunds({ page, limit: 10 }),
    enabled: activeTab === "refunds",
  });

  const invoices = invoicesData?.items || [];
  const transactions = transactionsData?.items || [];
  const receipts = Array.isArray(receiptsData) ? receiptsData : receiptsData?.items || [];
  const refunds = Array.isArray(refundsData) ? refundsData : refundsData?.items || [];
  const outstandingList = outstandingData?.items || [];

  return (
    <PageShell
      eyebrow="FINANCIAL COMMAND"
      title="Financial Operations & Invoicing"
      description="Commercial revenue tracking, statutory fee disbursements, M-Pesa automated settlement, aging analysis, and bank deposits."
    >
      {/* 1. FINANCIAL EXECUTIVE KPIS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Gross Invoiced"
          value={formatCurrency(Number(summary?.metrics.totalInvoiced || 0))}
          subtitle={`${summary?.metrics.totalInvoices ?? 0} total invoices`}
          icon={<DollarSign className="size-5 text-navy dark:text-gold" />}
        />

        <StatCard
          title="Settled Collections"
          value={formatCurrency(Number(summary?.metrics.totalCollected || 0))}
          subtitle="M-Pesa + Bank clearing"
          icon={<TrendingUp className="size-5 text-emerald-600" />}
        />

        <StatCard
          title="Outstanding Due"
          value={formatCurrency(Number(summary?.metrics.totalOutstanding || 0))}
          subtitle="Awaiting client settlement"
          variant={Number(summary?.metrics.totalOutstanding || 0) > 0 ? "gold" : "default"}
          icon={<CreditCard className="size-5 text-gold-dark dark:text-gold" />}
        />

        <StatCard
          title="Overdue Aging"
          value={formatCurrency(Number(summary?.metrics.totalOverdue || 0))}
          subtitle={`${summary?.metrics.overdueInvoicesCount ?? 0} overdue invoices`}
          icon={<AlertTriangle className="size-5 text-destructive" />}
        />

        <div className="rounded-xs border border-border bg-card p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Net Commercial Rev</span>
            <button
              type="button"
              onClick={() => setIsBreakdownModalOpen(true)}
              className="text-[11px] text-gold-dark hover:underline font-semibold flex items-center gap-1"
            >
              <PieChart className="size-3" />
              <span>Breakdown</span>
            </button>
          </div>
          <div className="mt-2 font-mono text-xl font-black text-foreground">
            {formatCurrency(Number(summary?.metrics.netRevenue || 0))}
          </div>
          <span className="text-[10px] text-muted-foreground mt-1">
            Refunds: {formatCurrency(Number(summary?.metrics.totalRefunded || 0))} ({summary?.metrics.refundCount || 0})
          </span>
        </div>
      </div>

      {/* 2. TAB CONTROLS */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-1">
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab("invoices");
              setPage(1);
            }}
            className={`flex items-center gap-2 rounded-xs px-3.5 py-2 text-xs font-bold transition-all ${
              activeTab === "invoices"
                ? "border-b-2 border-gold text-gold-dark dark:text-gold bg-gold/5"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            <DollarSign className="size-3.5" />
            <span>1. Invoices Directory</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("transactions");
              setPage(1);
            }}
            className={`flex items-center gap-2 rounded-xs px-3.5 py-2 text-xs font-bold transition-all ${
              activeTab === "transactions"
                ? "border-b-2 border-gold text-gold-dark dark:text-gold bg-gold/5"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            <CreditCard className="size-3.5" />
            <span>2. Payment Transactions</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("receipts");
              setPage(1);
            }}
            className={`flex items-center gap-2 rounded-xs px-3.5 py-2 text-xs font-bold transition-all ${
              activeTab === "receipts"
                ? "border-b-2 border-gold text-gold-dark dark:text-gold bg-gold/5"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            <ReceiptIcon className="size-3.5" />
            <span>3. Statutory Receipts</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("refunds");
              setPage(1);
            }}
            className={`flex items-center gap-2 rounded-xs px-3.5 py-2 text-xs font-bold transition-all ${
              activeTab === "refunds"
                ? "border-b-2 border-gold text-gold-dark dark:text-gold bg-gold/5"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            <RotateCcw className="size-3.5" />
            <span>4. Refunds & Adjustments</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("aging");
              setPage(1);
            }}
            className={`flex items-center gap-2 rounded-xs px-3.5 py-2 text-xs font-bold transition-all ${
              activeTab === "aging"
                ? "border-b-2 border-gold text-gold-dark dark:text-gold bg-gold/5"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            <Clock className="size-3.5" />
            <span>5. Aging & Collections Analytics</span>
          </button>
        </div>

        {activeTab === "invoices" && (
          <Button
            variant="gold"
            size="xs"
            leftIcon={<Plus className="size-3.5" />}
            onClick={() => setIsCreateInvoiceOpen(true)}
          >
            Create Commercial Invoice
          </Button>
        )}

        {activeTab === "refunds" && (
          <Button
            variant="outline"
            size="xs"
            leftIcon={<Plus className="size-3.5" />}
            onClick={() => setIsRequestRefundOpen(true)}
          >
            Request Refund Claim
          </Button>
        )}
      </div>

      {/* 3. TAB VIEWS */}
      <div className="mt-6">
        {/* TAB 1: INVOICES */}
        {activeTab === "invoices" && (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-1 items-center gap-3 max-w-md">
                <Input
                  placeholder="Search by invoice # or client name..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  leftAddon={<Search className="size-4" />}
                />
              </div>

              <div className="flex items-center gap-3">
                <Select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-48 text-xs"
                  options={[
                    { value: "", label: "All Invoice Statuses" },
                    { value: "ISSUED", label: "Issued & Active" },
                    { value: "PAID", label: "Paid in Full" },
                    { value: "PARTIALLY_PAID", label: "Partially Paid" },
                    { value: "PENDING", label: "Pending Settlement" },
                    { value: "OVERDUE", label: "Overdue Receivables" },
                    { value: "DRAFT", label: "Internal Draft" },
                    { value: "CANCELLED", label: "Cancelled / Void" },
                  ]}
                />
              </div>
            </div>

            {isInvoicesLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : invoicesError ? (
              <ErrorState onRetry={() => refetchInvoices()} />
            ) : invoices.length === 0 ? (
              <EmptyState
                icon={<CreditCard className="size-7" />}
                title="No invoices found"
                description="No commercial invoices match the specified criteria."
                action={
                  <Button
                    variant="gold"
                    size="xs"
                    leftIcon={<Plus className="size-3.5" />}
                    onClick={() => setIsCreateInvoiceOpen(true)}
                  >
                    Create First Invoice
                  </Button>
                }
              />
            ) : (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Client Entity</TableHead>
                      <TableHead className="text-right">Total Amount</TableHead>
                      <TableHead className="text-right">Settled</TableHead>
                      <TableHead className="text-right">Balance Due</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Issued Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((inv) => (
                      <TableRow key={inv.id} className="hover:bg-muted/30">
                        <TableCell>
                          <button
                            type="button"
                            onClick={() => setSelectedInvoiceId(inv.id)}
                            className="font-mono text-xs font-bold text-navy dark:text-gold hover:underline text-left"
                          >
                            #{inv.invoiceNumber}
                          </button>
                        </TableCell>
                        <TableCell className="font-semibold text-xs text-foreground">
                          {inv.client?.fullName || "Verified Entity"}
                        </TableCell>
                        <TableCell className="font-bold text-xs text-foreground font-mono text-right">
                          {formatCurrency(inv.totalAmount, inv.currency)}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-emerald-600 font-semibold text-right">
                          {formatCurrency(inv.amountPaid, inv.currency)}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-gold-dark dark:text-gold font-bold text-right">
                          {formatCurrency(inv.amountDue, inv.currency)}
                        </TableCell>
                        <TableCell>
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
                            size="sm"
                          >
                            {inv.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(inv.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="xs"
                              leftIcon={<Eye className="size-3.5" />}
                              onClick={() => setSelectedInvoiceId(inv.id)}
                            >
                              Dossier
                            </Button>
                            {inv.status !== "PAID" && inv.status !== "CANCELLED" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="xs"
                                  leftIcon={<Sliders className="size-3.5" />}
                                  onClick={() => setSelectedInvoiceForAdjust(inv)}
                                >
                                  Adjust
                                </Button>
                                <Button
                                  variant="gold"
                                  size="xs"
                                  onClick={() => setSelectedInvoiceForPay(inv)}
                                >
                                  Pay
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {invoicesData?.pagination && (
                  <Pagination
                    currentPage={invoicesData.pagination.page}
                    totalPages={invoicesData.pagination.totalPages}
                    totalItems={invoicesData.pagination.total}
                    pageSize={invoicesData.pagination.limit}
                    onChange={(p) => setPage(p)}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: TRANSACTIONS */}
        {activeTab === "transactions" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-1 items-center gap-3 max-w-md">
                <Input
                  placeholder="Search by transaction # or reference..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  leftAddon={<Search className="size-4" />}
                />
              </div>
            </div>

            {isTxLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : transactions.length === 0 ? (
              <EmptyState
                icon={<CreditCard className="size-7" />}
                title="No payment transactions recorded"
                description="Transactions from M-Pesa STK push and direct bank wires will show here."
              />
            ) : (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tx #</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Reference Code</TableHead>
                      <TableHead className="text-right">Amount (KES)</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date Settled</TableHead>
                      <TableHead className="text-right">Audit Controls</TableHead>
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
                        <TableCell className="font-mono text-xs text-muted-foreground font-semibold">
                          {tx.externalReference || "—"}
                        </TableCell>
                        <TableCell className="font-mono text-xs font-bold text-emerald-600 text-right">
                          {formatCurrency(tx.amount, tx.currency || "KES")}
                        </TableCell>
                        <TableCell>
                          <Badge
                            tone={
                              tx.status === "PAID" || tx.status === "COMPLETED"
                                ? "success"
                                : tx.status === "FAILED"
                                ? "destructive"
                                : "warning"
                            }
                            size="sm"
                          >
                            {tx.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(tx.paidAt || tx.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {tx.status === "COMPLETED" || tx.status === "PAID" ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="xs"
                                  className="text-gold-dark hover:bg-gold/10"
                                  onClick={() => setSelectedTxForRefund(tx)}
                                >
                                  Refund
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="xs"
                                  className="text-destructive hover:bg-destructive/10"
                                  onClick={() => setSelectedTxForReverse(tx)}
                                >
                                  Reverse
                                </Button>
                              </>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {transactionsData?.pagination && (
                  <Pagination
                    currentPage={transactionsData.pagination.page}
                    totalPages={transactionsData.pagination.totalPages}
                    totalItems={transactionsData.pagination.total}
                    pageSize={transactionsData.pagination.limit}
                    onChange={(p) => setPage(p)}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: RECEIPTS */}
        {activeTab === "receipts" && (
          <div className="space-y-4">
            {isReceiptsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : receipts.length === 0 ? (
              <EmptyState
                icon={<ReceiptIcon className="size-7" />}
                title="No statutory receipts generated"
                description="Receipts are generated automatically upon completed invoice settlement."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt #</TableHead>
                    <TableHead>Payer / Client</TableHead>
                    <TableHead className="text-right">Amount Settled</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Date Issued</TableHead>
                    <TableHead className="text-right">Voucher</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receipts.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs font-bold text-foreground">
                        #{r.receiptNumber}
                      </TableCell>
                      <TableCell className="font-semibold text-xs text-foreground">
                        {r.payerName || r.client?.fullName || "Verified Entity"}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold text-emerald-600 text-right">
                        {formatCurrency(r.amount, r.currency || "KES")}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <Badge tone="neutral" size="sm">{r.paymentMethod || "M-PESA"}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(r.issuedAt || r.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="xs"
                          leftIcon={<ReceiptIcon className="size-3.5" />}
                          onClick={() => setSelectedReceiptId(r.id)}
                        >
                          View Voucher
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}

        {/* TAB 4: REFUNDS */}
        {activeTab === "refunds" && (
          <div className="space-y-4">
            {isRefundsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
              </div>
            ) : refunds.length === 0 ? (
              <EmptyState
                icon={<RotateCcw className="size-7" />}
                title="No refund requests recorded"
                description="Any customer refund requests or reversals will appear here."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Refund #</TableHead>
                    <TableHead className="text-right">Claim Amount</TableHead>
                    <TableHead>Stated Justification</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requested Date</TableHead>
                    <TableHead className="text-right">Audit Review</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {refunds.map((ref: any) => (
                    <TableRow key={ref.id}>
                      <TableCell className="font-mono text-xs font-bold text-foreground">
                        #{ref.refundNumber}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold text-foreground text-right">
                        {formatCurrency(ref.amount, "KES")}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                        {ref.reason}
                      </TableCell>
                      <TableCell>
                        <Badge
                          tone={
                            ref.status === "COMPLETED" || ref.status === "APPROVED"
                              ? "success"
                              : ref.status === "FAILED" || ref.status === "CANCELLED"
                              ? "destructive"
                              : "warning"
                          }
                          size="sm"
                        >
                          {ref.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(ref.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => setSelectedRefundForReview(ref)}
                        >
                          Review & Settle
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}

        {/* TAB 5: AGING & COLLECTIONS ANALYTICS */}
        {activeTab === "aging" && (
          <div className="space-y-6">
            {/* Collections by Channel */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <TrendingUp className="size-4 text-emerald-600" />
                <span>Collections by Payment Channel</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {collectionsData?.collectionsByMethod && collectionsData.collectionsByMethod.length > 0 ? (
                  collectionsData.collectionsByMethod.map((col) => (
                    <div
                      key={col.method}
                      className="rounded-xs border border-border bg-card p-3.5 space-y-1.5 shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">{col.method}</span>
                        <Badge tone="neutral" size="sm">
                          {col.transactionCount} Txs
                        </Badge>
                      </div>
                      <div className="font-mono text-lg font-bold text-emerald-600">
                        {formatCurrency(Number(col.totalAmount || 0))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full rounded-xs border border-border p-4 text-xs text-muted-foreground text-center">
                    No payment collection transactions recorded yet.
                  </div>
                )}
              </div>
            </div>

            {/* Aging Schedule Breakdown */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-2">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <Clock className="size-4 text-gold-dark" />
                    <span>Accounts Receivable Aging Schedule</span>
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Aging buckets calculated automatically against payment due dates.
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant={selectedAgingBucket === undefined ? "gold" : "outline"}
                    size="xs"
                    onClick={() => {
                      setSelectedAgingBucket(undefined);
                      setPage(1);
                    }}
                  >
                    All Buckets
                  </Button>
                  <Button
                    variant={selectedAgingBucket === "1-7" ? "gold" : "outline"}
                    size="xs"
                    onClick={() => {
                      setSelectedAgingBucket("1-7");
                      setPage(1);
                    }}
                  >
                    1-7 Days
                  </Button>
                  <Button
                    variant={selectedAgingBucket === "8-14" ? "gold" : "outline"}
                    size="xs"
                    onClick={() => {
                      setSelectedAgingBucket("8-14");
                      setPage(1);
                    }}
                  >
                    8-14 Days
                  </Button>
                  <Button
                    variant={selectedAgingBucket === "15-30" ? "gold" : "outline"}
                    size="xs"
                    onClick={() => {
                      setSelectedAgingBucket("15-30");
                      setPage(1);
                    }}
                  >
                    15-30 Days
                  </Button>
                  <Button
                    variant={selectedAgingBucket === "30+" ? "destructive" : "outline"}
                    size="xs"
                    onClick={() => {
                      setSelectedAgingBucket("30+");
                      setPage(1);
                    }}
                  >
                    30+ Days Overdue
                  </Button>
                </div>
              </div>

              {isOutstandingLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : outstandingList.length === 0 ? (
                <EmptyState
                  icon={<ShieldCheck className="size-7 text-emerald-600" />}
                  title="No outstanding receivables in this aging category"
                  description="All customer accounts in this bucket are completely settled."
                />
              ) : (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Service / Application</TableHead>
                        <TableHead>Aging Bucket</TableHead>
                        <TableHead>Days Overdue</TableHead>
                        <TableHead className="text-right">Balance Due</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {outstandingList.map((inv: OutstandingInvoice) => (
                        <TableRow key={inv.id}>
                          <TableCell className="font-mono text-xs font-bold text-foreground">
                            #{inv.invoiceNumber}
                          </TableCell>
                          <TableCell className="font-semibold text-xs text-foreground">
                            {inv.client?.fullName || "Client"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {inv.application?.service?.name || "Statutory Service"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              tone={
                                inv.agingBucket?.includes("30+")
                                  ? "destructive"
                                  : inv.agingBucket?.includes("15-30")
                                  ? "warning"
                                  : "neutral"
                              }
                              size="sm"
                            >
                              {inv.agingBucket || "Current"}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs font-bold text-destructive">
                            {inv.daysOverdue > 0 ? `${inv.daysOverdue} days` : "Current"}
                          </TableCell>
                          <TableCell className="font-mono text-xs font-bold text-gold-dark dark:text-gold text-right">
                            {formatCurrency(inv.amountDue, inv.currency)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="outline"
                                size="xs"
                                onClick={() => setSelectedInvoiceId(inv.id)}
                              >
                                View Dossier
                              </Button>
                              <Button
                                variant="gold"
                                size="xs"
                                onClick={() => setSelectedInvoiceForPay(inv)}
                              >
                                Record Payment
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {outstandingData?.pagination && (
                    <Pagination
                      currentPage={outstandingData.pagination.page}
                      totalPages={outstandingData.pagination.totalPages}
                      totalItems={outstandingData.pagination.total}
                      pageSize={outstandingData.pagination.limit}
                      onChange={(p) => setPage(p)}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* CREATE INVOICE MODAL */}
      <AdminCreateInvoiceModal
        isOpen={isCreateInvoiceOpen}
        onClose={() => setIsCreateInvoiceOpen(false)}
        onCreated={() => {
          queryClient.invalidateQueries({ queryKey: ["admin-invoices-list"] });
          queryClient.invalidateQueries({ queryKey: ["admin-financial-summary"] });
        }}
      />

      {/* INVOICE DETAIL DOSSIER MODAL */}
      <AdminInvoiceDetailModal
        isOpen={Boolean(selectedInvoiceId)}
        onClose={() => setSelectedInvoiceId(null)}
        invoiceId={selectedInvoiceId}
        onUpdated={() => {
          queryClient.invalidateQueries({ queryKey: ["admin-invoices-list"] });
          queryClient.invalidateQueries({ queryKey: ["admin-financial-summary"] });
        }}
      />

      {/* RECORD MANUAL PAYMENT MODAL */}
      {selectedInvoiceForPay && (
        <AdminManualPaymentModal
          isOpen={Boolean(selectedInvoiceForPay)}
          onClose={() => setSelectedInvoiceForPay(null)}
          invoice={selectedInvoiceForPay}
          onRecorded={() => {
            queryClient.invalidateQueries({ queryKey: ["admin-invoices-list"] });
            queryClient.invalidateQueries({ queryKey: ["admin-financial-summary"] });
          }}
        />
      )}

      {/* FINANCIAL ADJUSTMENT MODAL */}
      {selectedInvoiceForAdjust && (
        <AdminFinancialAdjustmentModal
          isOpen={Boolean(selectedInvoiceForAdjust)}
          onClose={() => setSelectedInvoiceForAdjust(null)}
          invoice={selectedInvoiceForAdjust}
          onAdjusted={() => {
            queryClient.invalidateQueries({ queryKey: ["admin-invoices-list"] });
            queryClient.invalidateQueries({ queryKey: ["admin-financial-summary"] });
          }}
        />
      )}

      {/* REVERSE TRANSACTION MODAL */}
      {selectedTxForReverse && (
        <AdminReverseTransactionModal
          isOpen={Boolean(selectedTxForReverse)}
          onClose={() => setSelectedTxForReverse(null)}
          transaction={selectedTxForReverse}
          onReversed={() => {
            queryClient.invalidateQueries({ queryKey: ["admin-transactions-list"] });
            queryClient.invalidateQueries({ queryKey: ["admin-invoices-list"] });
            queryClient.invalidateQueries({ queryKey: ["admin-financial-summary"] });
          }}
        />
      )}

      {/* RECEIPT DETAIL VOUCHER MODAL */}
      {selectedReceiptId && (
        <AdminReceiptDetailModal
          isOpen={Boolean(selectedReceiptId)}
          onClose={() => setSelectedReceiptId(null)}
          receiptId={selectedReceiptId}
        />
      )}

      {/* REQUEST REFUND MODAL */}
      <AdminRequestRefundModal
        isOpen={isRequestRefundOpen || Boolean(selectedTxForRefund)}
        onClose={() => {
          setIsRequestRefundOpen(false);
          setSelectedTxForRefund(null);
        }}
        transaction={selectedTxForRefund || undefined}
        onRequested={() => {
          queryClient.invalidateQueries({ queryKey: ["admin-refunds-list"] });
          queryClient.invalidateQueries({ queryKey: ["admin-financial-summary"] });
        }}
      />

      {/* REVIEW REFUND MODAL */}
      {selectedRefundForReview && (
        <AdminRefundReviewModal
          isOpen={Boolean(selectedRefundForReview)}
          onClose={() => setSelectedRefundForReview(null)}
          refund={selectedRefundForReview}
          onReviewed={() => {
            queryClient.invalidateQueries({ queryKey: ["admin-refunds-list"] });
            queryClient.invalidateQueries({ queryKey: ["admin-financial-summary"] });
          }}
        />
      )}

      {/* REVENUE BREAKDOWN MODAL */}
      {isBreakdownModalOpen && (
        <Modal
          isOpen={isBreakdownModalOpen}
          onClose={() => setIsBreakdownModalOpen(false)}
          title="Statutory Revenue Breakdown"
          description="Itemized distribution of gross invoiced compliance revenue."
          footer={
            <Button variant="ghost" size="sm" onClick={() => setIsBreakdownModalOpen(false)}>
              Close
            </Button>
          }
        >
          <div className="space-y-3 text-xs">
            <div className="rounded-xs border border-border bg-card p-3.5 space-y-2.5">
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Government Disbursements (Statutory)</span>
                <strong className="font-mono text-foreground font-bold">
                  {formatCurrency(Number(summary?.metrics.breakdown?.governmentFees || 0))}
                </strong>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Professional Service Fees</span>
                <strong className="font-mono text-foreground font-bold">
                  {formatCurrency(Number(summary?.metrics.breakdown?.serviceFees || 0))}
                </strong>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground">VAT / Commercial Tax</span>
                <strong className="font-mono text-foreground font-bold">
                  {formatCurrency(Number(summary?.metrics.breakdown?.tax || 0))}
                </strong>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-2 text-emerald-600">
                <span>Promotional Discounts / Waivers</span>
                <strong className="font-mono font-bold">
                  -{formatCurrency(Number(summary?.metrics.breakdown?.discounts || 0))}
                </strong>
              </div>
              <div className="flex justify-between pt-1 text-sm font-bold text-foreground">
                <span>Net Commercial Invoiced</span>
                <span className="font-mono text-gold-dark dark:text-gold">
                  {formatCurrency(Number(summary?.metrics.netRevenue || 0))}
                </span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </PageShell>
  );
}
