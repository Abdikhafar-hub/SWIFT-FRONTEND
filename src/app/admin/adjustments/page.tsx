"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Sliders,
  Search,
  Plus,
  ArrowRight,
  Eye,
  DollarSign,
  AlertTriangle,
  Receipt,
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdminFinancialAdjustmentModal } from "@/components/domain";
import { EmptyState, Skeleton, ErrorState } from "@/components/ui/feedback-primitives";
import { adminApi } from "@/lib/api/admin";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { Payment } from "@/types";

export default function AdminAdjustmentsPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedInvoiceForAdjust, setSelectedInvoiceForAdjust] = useState<Payment | null>(null);

  // Query all invoices
  const {
    data: invoicesData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-invoices-adjustments-queue", page, search],
    queryFn: () =>
      adminApi.getInvoices({
        page,
        limit: 20,
        search: search || undefined,
      }),
  });

  const invoices: Payment[] = invoicesData?.items || [];
  const pagination = invoicesData?.pagination;

  // Filter invoices that have discounts, balance adjustments, or are eligible for adjustments
  const adjustedInvoices = invoices.filter((inv) => (inv.discount && Number(inv.discount) > 0) || inv.balanceRemaining !== undefined);

  return (
    <PageShell
      eyebrow="FINANCIAL OPERATIONS"
      title="Financial Adjustments & Fee Waivers"
      description="Administrative credit notes, statutory fee waivers, discount overrides, and manual balance reconciliations."
    >
      {/* 1. ADJUSTMENT METRICS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Invoices with Adjustments"
          value={adjustedInvoices.length}
          subtitle="Credit/waiver applied"
          icon={<Sliders className="size-5 text-navy dark:text-gold" />}
        />

        <StatCard
          title="Total Invoices Audited"
          value={pagination?.total || invoices.length}
          subtitle="Available for fee adjustment"
          icon={<Receipt className="size-5 text-emerald-600" />}
        />

        <StatCard
          title="Waivers & Discounts"
          value={formatCurrency(
            adjustedInvoices.reduce((sum, inv) => sum + Number(inv.discount || 0), 0)
          )}
          subtitle="Total concessions granted"
          icon={<DollarSign className="size-5 text-gold-dark dark:text-gold" />}
        />

        <StatCard
          title="Adjustable Balances"
          value={invoices.filter((i) => i.status !== "PAID" && i.status !== "VOID").length}
          subtitle="Open for credit notes"
          icon={<FileText className="size-5 text-muted-foreground" />}
        />
      </div>

      {/* 2. FILTERS & SEARCH */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3 max-w-md">
          <Input
            placeholder="Search invoice #, client name, or application..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            leftAddon={<Search className="size-4" />}
          />
        </div>
      </div>

      {/* 3. ADJUSTMENTS LEDGER TABLE */}
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
            icon={<Sliders className="size-7" />}
            title="No billing records found"
            description="Invoices eligible for fee adjustments will be listed here."
          />
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Client Entity</TableHead>
                  <TableHead>Gross Amount</TableHead>
                  <TableHead>Discount / Credit</TableHead>
                  <TableHead>Net Balance Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
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
                    <TableCell className="text-xs text-foreground font-semibold">
                      {inv.user?.fullName || inv.user?.businessName || inv.client?.fullName || "Client"}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-foreground">
                      {formatCurrency(inv.amount)}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-emerald-600">
                      {inv.discount && Number(inv.discount) > 0 ? `-${formatCurrency(inv.discount)}` : "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold text-foreground">
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
                            : "warning"
                        }
                        size="sm"
                      >
                        {inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="gold"
                          size="xs"
                          leftIcon={<Sliders className="size-3" />}
                          onClick={() => setSelectedInvoiceForAdjust(inv)}
                        >
                          Apply Adjustment
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

      {/* ADJUSTMENT MODAL */}
      {selectedInvoiceForAdjust && (
        <AdminFinancialAdjustmentModal
          paymentId={selectedInvoiceForAdjust.id}
          invoiceNumber={selectedInvoiceForAdjust.invoiceNumber}
          currentAmount={selectedInvoiceForAdjust.amount}
          isOpen={Boolean(selectedInvoiceForAdjust)}
          onClose={() => setSelectedInvoiceForAdjust(null)}
          onSuccess={() => {
            refetch();
            queryClient.invalidateQueries({ queryKey: ["admin-invoices-list"] });
            queryClient.invalidateQueries({ queryKey: ["admin-financial-summary"] });
          }}
        />
      )}
    </PageShell>
  );
}
