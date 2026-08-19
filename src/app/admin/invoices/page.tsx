"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Receipt,
  Search,
  Plus,
  ArrowRight,
  Eye,
  Sliders,
  DollarSign,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileText,
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
  AdminCreateInvoiceModal,
  AdminInvoiceDetailModal,
  AdminFinancialAdjustmentModal,
} from "@/components/domain";
import { EmptyState, Skeleton, ErrorState } from "@/components/ui/feedback-primitives";
import { adminApi } from "@/lib/api/admin";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { Payment, PaymentStatus } from "@/types";

export default function AdminInvoicesPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedInvoiceForDetail, setSelectedInvoiceForDetail] = useState<Payment | null>(null);
  const [selectedInvoiceForAdjustment, setSelectedInvoiceForAdjustment] = useState<Payment | null>(null);

  // Financial summary query
  const { data: summary } = useQuery({
    queryKey: ["admin-financial-summary"],
    queryFn: () => adminApi.getFinancialSummary(),
  });

  // Invoices list query
  const {
    data: invoicesData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-invoices-list", page, statusFilter, search],
    queryFn: () =>
      adminApi.getInvoices({
        page,
        limit: 15,
        status: (statusFilter as PaymentStatus) || undefined,
        search: search || undefined,
      }),
  });

  const invoices = invoicesData?.items || [];
  const pagination = invoicesData?.pagination;

  return (
    <PageShell
      eyebrow="FINANCIAL OPERATIONS"
      title="Invoices & Billing Command"
      description="Statutory billing ledger, manual invoice generation, outstanding balance tracking, and adjustments."
      actions={
        <Button
          variant="gold"
          size="sm"
          leftIcon={<Plus className="size-3.5" />}
          onClick={() => setIsCreateModalOpen(true)}
        >
          Create Manual Invoice
        </Button>
      }
    >
      {/* 1. FINANCIAL SUMMARY METRICS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Billed"
          value={formatCurrency(summary?.totalRevenue || 0)}
          subtitle="Cumulative gross billing"
          icon={<DollarSign className="size-5 text-navy dark:text-gold" />}
        />

        <StatCard
          title="Collected Revenue"
          value={formatCurrency(summary?.totalCollected || 0)}
          subtitle="Realized settled payments"
          icon={<CheckCircle2 className="size-5 text-emerald-600" />}
        />

        <StatCard
          title="Outstanding Receivables"
          value={formatCurrency(summary?.totalPending || 0)}
          subtitle="Uncollected balances"
          variant={Number(summary?.totalPending || 0) > 0 ? "gold" : "default"}
          icon={<Clock className="size-5 text-amber-600" />}
        />

        <StatCard
          title="Overdue Accounts"
          value={formatCurrency(summary?.totalOverdue || 0)}
          subtitle="Past statutory due date"
          variant={Number(summary?.totalOverdue || 0) > 0 ? "elevated" : "default"}
          icon={<AlertTriangle className="size-5 text-destructive" />}
        />
      </div>

      {/* 2. FILTERS & SEARCH */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3 max-w-md">
          <Input
            placeholder="Search by invoice #, client name, or reference..."
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
              { value: "PAID", label: "Paid in Full" },
              { value: "PARTIALLY_PAID", label: "Partially Paid" },
              { value: "PENDING", label: "Pending Payment" },
              { value: "OVERDUE", label: "Overdue" },
              { value: "CANCELLED", label: "Cancelled / Voided" },
            ]}
          />
        </div>
      </div>

      {/* 3. INVOICES TABLE */}
      <div className="mt-6">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : error ? (
          <ErrorState onRetry={() => refetch()} />
        ) : invoices.length === 0 ? (
          <EmptyState
            icon={<Receipt className="size-7" />}
            title="No invoices found"
            description="No billing records match the current filter criteria."
            action={
              <Button
                variant="gold"
                size="xs"
                leftIcon={<Plus className="size-3.5" />}
                onClick={() => setIsCreateModalOpen(true)}
              >
                Create Invoice
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Dossier #</TableHead>
                  <TableHead>Client Entity</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Balance Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
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
                      {inv.application ? (
                        <Link
                          href={`/admin/applications/${inv.application.id}`}
                          className="font-mono text-xs font-bold text-foreground hover:underline"
                        >
                          #{inv.application.applicationNumber}
                        </Link>
                      ) : (
                        <span className="text-xs text-muted-foreground font-mono">
                          {inv.applicationId?.slice(0, 8) || "—"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-foreground font-semibold">
                      {inv.user?.fullName || inv.user?.businessName || inv.client?.fullName || "Client"}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold text-foreground">
                      {formatCurrency(inv.amount)}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {inv.balanceRemaining !== undefined
                        ? formatCurrency(inv.balanceRemaining)
                        : inv.status === "PAID"
                        ? formatCurrency(0)
                        : formatCurrency(inv.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        tone={
                          inv.status === "PAID"
                            ? "success"
                            : inv.status === "OVERDUE"
                            ? "destructive"
                            : inv.status === "PARTIALLY_PAID"
                            ? "gold"
                            : "warning"
                        }
                        size="sm"
                      >
                        {inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {inv.dueDate ? formatDate(inv.dueDate) : "Immediate"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="xs"
                          leftIcon={<Sliders className="size-3" />}
                          onClick={() => setSelectedInvoiceForAdjustment(inv)}
                        >
                          Adjust
                        </Button>
                        <Link href={`/admin/invoices/${inv.id}`}>
                          <Button variant="ghost" size="xs" leftIcon={<Eye className="size-3.5" />}>
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

      {/* CREATE INVOICE MODAL */}
      {isCreateModalOpen && (
        <AdminCreateInvoiceModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            refetch();
            queryClient.invalidateQueries({ queryKey: ["admin-financial-summary"] });
          }}
        />
      )}

      {/* FINANCIAL ADJUSTMENT MODAL */}
      {selectedInvoiceForAdjustment && (
        <AdminFinancialAdjustmentModal
          paymentId={selectedInvoiceForAdjustment.id}
          invoiceNumber={selectedInvoiceForAdjustment.invoiceNumber}
          currentAmount={selectedInvoiceForAdjustment.amount}
          isOpen={Boolean(selectedInvoiceForAdjustment)}
          onClose={() => setSelectedInvoiceForAdjustment(null)}
          onSuccess={() => {
            refetch();
            queryClient.invalidateQueries({ queryKey: ["admin-financial-summary"] });
          }}
        />
      )}
    </PageShell>
  );
}
