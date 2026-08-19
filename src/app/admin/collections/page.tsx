"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  TrendingUp,
  AlertTriangle,
  Clock,
  DollarSign,
  Search,
  Eye,
  Calendar,
  Send,
  Sliders,
  CreditCard,
  Building,
  User,
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
import {
  AdminManualPaymentModal,
  AdminFinancialAdjustmentModal,
} from "@/components/domain";
import { EmptyState, Skeleton, ErrorState } from "@/components/ui/feedback-primitives";
import { adminApi } from "@/lib/api/admin";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { OutstandingInvoice, Payment } from "@/types";

export default function AdminCollectionsPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [bucketFilter, setBucketFilter] = useState<string>("");
  const [page, setPage] = useState(1);

  // Modal states
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<OutstandingInvoice | null>(null);
  const [selectedInvoiceForAdjustment, setSelectedInvoiceForAdjustment] = useState<OutstandingInvoice | null>(null);

  // Collections metrics
  const {
    data: collectionsData,
    isLoading: isMetricsLoading,
    error: metricsError,
  } = useQuery({
    queryKey: ["admin-financial-collections"],
    queryFn: () => adminApi.getFinancialCollections(),
  });

  // Outstanding invoices list query
  const {
    data: outstandingData,
    isLoading: isListLoading,
    error: listError,
    refetch,
  } = useQuery({
    queryKey: ["admin-outstanding-invoices", page, bucketFilter],
    queryFn: () =>
      adminApi.getOutstandingInvoices({
        page,
        limit: 15,
        agingBucket: bucketFilter || undefined,
      }),
  });

  const invoices: OutstandingInvoice[] = outstandingData?.items || [];
  const pagination = outstandingData?.pagination;

  // Search filter
  const filteredInvoices = invoices.filter((inv) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const matchNum = inv.invoiceNumber?.toLowerCase().includes(q);
    const matchClient =
      inv.client?.fullName?.toLowerCase().includes(q) ||
      inv.client?.businessName?.toLowerCase().includes(q) ||
      inv.client?.email?.toLowerCase().includes(q);
    return matchNum || matchClient;
  });

  const aging = collectionsData?.aging;
  const performanceRate = collectionsData?.collectionRate;

  return (
    <PageShell
      eyebrow="FINANCIAL OPERATIONS"
      title="Collections & Aging Receivables Command"
      description="Aging debt ledger (Current, 30, 60, 90+ days), uncollected statutory fees, and arrears recovery."
    >
      {/* 1. AGING BUCKETS & RECOVERY METRICS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Current (< 30 Days)"
          value={formatCurrency(aging?.under30Days?.amount || 0)}
          subtitle={`${aging?.under30Days?.count || 0} invoices on track`}
          icon={<Clock className="size-5 text-emerald-600" />}
        />

        <StatCard
          title="30 – 60 Days Arrears"
          value={formatCurrency(aging?.days30To60?.amount || 0)}
          subtitle={`${aging?.days30To60?.count || 0} accounts flagged`}
          icon={<AlertTriangle className="size-5 text-gold-dark dark:text-gold" />}
        />

        <StatCard
          title="60 – 90 Days Arrears"
          value={formatCurrency(aging?.days60To90?.amount || 0)}
          subtitle={`${aging?.days60To90?.count || 0} overdue accounts`}
          variant={Number(aging?.days60To90?.amount || 0) > 0 ? "gold" : "default"}
          icon={<AlertTriangle className="size-5 text-amber-600" />}
        />

        <StatCard
          title="Critical (90+ Days)"
          value={formatCurrency(aging?.over90Days?.amount || 0)}
          subtitle={`${aging?.over90Days?.count || 0} legal collection`}
          variant={Number(aging?.over90Days?.amount || 0) > 0 ? "elevated" : "default"}
          icon={<AlertTriangle className="size-5 text-destructive" />}
        />

        <StatCard
          title="Total Outstanding"
          value={formatCurrency(aging?.totalOutstanding?.amount || 0)}
          subtitle={`Recovery Rate: ${performanceRate ? `${performanceRate}%` : "—"}`}
          icon={<DollarSign className="size-5 text-navy dark:text-gold" />}
        />
      </div>

      {/* 2. FILTERS & SEARCH */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3 max-w-md">
          <Input
            placeholder="Search by invoice #, client name, or email..."
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
            value={bucketFilter}
            onChange={(e) => {
              setBucketFilter(e.target.value);
              setPage(1);
            }}
            className="w-48 text-xs"
            options={[
              { value: "", label: "All Aging Buckets" },
              { value: "CURRENT", label: "Current (< 30 Days)" },
              { value: "30_TO_60", label: "30 to 60 Days" },
              { value: "60_TO_90", label: "60 to 90 Days" },
              { value: "OVER_90", label: "Over 90 Days (Critical)" },
            ]}
          />
        </div>
      </div>

      {/* 3. RECEIVABLES TABLE */}
      <div className="mt-6">
        {isListLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : listError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : filteredInvoices.length === 0 ? (
          <EmptyState
            icon={<TrendingUp className="size-7" />}
            title="No outstanding arrears in this bucket"
            description="All candidate accounts have zero overdue balance."
          />
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Client Entity</TableHead>
                  <TableHead>Total Billed</TableHead>
                  <TableHead>Outstanding Balance</TableHead>
                  <TableHead>Aging Tier</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Collection Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((inv) => (
                  <TableRow key={inv.id} className="hover:bg-muted/30">
                    <TableCell>
                      <Link
                        href={`/admin/invoices/${inv.id}`}
                        className="font-mono text-xs font-bold text-navy dark:text-gold hover:underline"
                      >
                        #{inv.invoiceNumber || inv.id.slice(0, 8)}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <span className="font-semibold text-xs text-foreground block">
                          {inv.client?.fullName || inv.client?.businessName || "Verified Client"}
                        </span>
                        <span className="text-[11px] text-muted-foreground block">
                          {inv.client?.phone || inv.client?.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-foreground">
                      {formatCurrency(inv.totalAmount || inv.amount)}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold text-destructive">
                      {formatCurrency(inv.outstandingBalance || inv.balanceRemaining || inv.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        tone={
                          inv.agingBucket === "OVER_90"
                            ? "destructive"
                            : inv.agingBucket === "60_TO_90" || inv.agingBucket === "30_TO_60"
                            ? "warning"
                            : "gold"
                        }
                        size="sm"
                      >
                        {inv.agingBucket?.replace(/_/g, " ") || `${inv.daysOverdue || 0} Days`}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {inv.dueDate ? formatDate(inv.dueDate) : "Immediate"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="gold"
                          size="xs"
                          leftIcon={<DollarSign className="size-3" />}
                          onClick={() => setSelectedInvoiceForPayment(inv)}
                        >
                          Settle
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          leftIcon={<Sliders className="size-3" />}
                          onClick={() => setSelectedInvoiceForAdjustment(inv)}
                        >
                          Adjust
                        </Button>
                        <Link href={`/admin/invoices/${inv.id}`}>
                          <Button variant="ghost" size="xs">
                            Dossier
                          </Button>
                        </Link>
                      </div>
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
                onChange={(p) => setPage(p)}
              />
            )}
          </div>
        )}
      </div>

      {/* RECORD PAYMENT MODAL */}
      {selectedInvoiceForPayment && (
        <AdminManualPaymentModal
          applicationId={selectedInvoiceForPayment.applicationId || ""}
          outstandingAmount={
            selectedInvoiceForPayment.outstandingBalance ||
            selectedInvoiceForPayment.balanceRemaining ||
            selectedInvoiceForPayment.amount
          }
          isOpen={Boolean(selectedInvoiceForPayment)}
          onClose={() => setSelectedInvoiceForPayment(null)}
          onSuccess={() => {
            refetch();
            queryClient.invalidateQueries({ queryKey: ["admin-financial-collections"] });
          }}
        />
      )}

      {/* ADJUSTMENT MODAL */}
      {selectedInvoiceForAdjustment && (
        <AdminFinancialAdjustmentModal
          paymentId={selectedInvoiceForAdjustment.id}
          invoiceNumber={selectedInvoiceForAdjustment.invoiceNumber}
          currentAmount={selectedInvoiceForAdjustment.totalAmount || selectedInvoiceForAdjustment.amount}
          isOpen={Boolean(selectedInvoiceForAdjustment)}
          onClose={() => setSelectedInvoiceForAdjustment(null)}
          onSuccess={() => {
            refetch();
            queryClient.invalidateQueries({ queryKey: ["admin-financial-collections"] });
          }}
        />
      )}
    </PageShell>
  );
}
