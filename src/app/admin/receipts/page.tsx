"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  FileCheck,
  Search,
  ArrowRight,
  Eye,
  DollarSign,
  Calendar,
  CheckCircle2,
  FileText,
  Download,
  CreditCard,
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
import { AdminReceiptDetailModal } from "@/components/domain";
import { EmptyState, Skeleton, ErrorState } from "@/components/ui/feedback-primitives";
import { adminApi } from "@/lib/api/admin";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { Receipt } from "@/types";

export default function AdminReceiptsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);

  // Financial summary
  const { data: summary } = useQuery({
    queryKey: ["admin-financial-summary"],
    queryFn: () => adminApi.getFinancialSummary(),
  });

  // Receipts query
  const {
    data: receiptsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-receipts-list", page],
    queryFn: () => adminApi.getReceipts({ page, limit: 15 }),
  });

  const rawReceipts = Array.isArray(receiptsData) ? receiptsData : receiptsData?.items || [];
  const pagination = Array.isArray(receiptsData) ? null : receiptsData?.pagination;

  // Filter receipts by search
  const filteredReceipts = rawReceipts.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const matchNum = r.receiptNumber?.toLowerCase().includes(q);
    const matchPay = r.paymentId?.toLowerCase().includes(q);
    const matchClient =
      (r as any).payment?.user?.fullName?.toLowerCase().includes(q) ||
      (r as any).payment?.user?.businessName?.toLowerCase().includes(q);
    return matchNum || matchPay || matchClient;
  });

  const totalReceiptsAmount = filteredReceipts.reduce((sum, r) => sum + (r.amount || 0), 0);

  return (
    <PageShell
      eyebrow="FINANCIAL OPERATIONS"
      title="Official Statutory Receipts"
      description="Fiscal receipts, automated VAT invoices, and statutory payment certifications issued to clients."
    >
      {/* 1. RECEIPTS METRICS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Receipts Issued"
          value={pagination?.total || rawReceipts.length}
          subtitle="Certified official receipts"
          icon={<FileCheck className="size-5 text-navy dark:text-gold" />}
        />

        <StatCard
          title="Gross Value Receipted"
          value={formatCurrency(summary?.totalCollected || totalReceiptsAmount)}
          subtitle="Cumulative receipted revenue"
          icon={<DollarSign className="size-5 text-emerald-600" />}
        />

        <StatCard
          title="M-Pesa Receipts"
          value={rawReceipts.filter((r) => r.paymentMethod === "MPESA").length}
          subtitle="Mobile money confirmations"
          icon={<CreditCard className="size-5 text-gold-dark dark:text-gold" />}
        />

        <StatCard
          title="Bank / EFT Receipts"
          value={rawReceipts.filter((r) => r.paymentMethod !== "MPESA").length}
          subtitle="Wire & direct transfers"
          icon={<FileText className="size-5 text-muted-foreground" />}
        />
      </div>

      {/* 2. FILTERS & SEARCH */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3 max-w-md">
          <Input
            placeholder="Search by receipt #, payment reference, or client..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            leftAddon={<Search className="size-4" />}
          />
        </div>
      </div>

      {/* 3. RECEIPTS TABLE */}
      <div className="mt-6">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : error ? (
          <ErrorState onRetry={() => refetch()} />
        ) : filteredReceipts.length === 0 ? (
          <EmptyState
            icon={<FileCheck className="size-7" />}
            title="No receipts recorded"
            description="Receipts generated upon payment settlement will appear in this ledger."
          />
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt #</TableHead>
                  <TableHead>Invoice / Payment Ref</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Issued Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReceipts.map((receipt) => (
                  <TableRow key={receipt.id} className="hover:bg-muted/30">
                    <TableCell>
                      <Link
                        href={`/admin/receipts/${receipt.id}`}
                        className="font-mono text-xs font-bold text-navy dark:text-gold hover:underline block"
                      >
                        {receipt.receiptNumber || `#${receipt.id.slice(0, 8)}`}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/invoices/${receipt.paymentId}`}
                        className="font-mono text-xs text-muted-foreground hover:underline"
                      >
                        #{receipt.paymentId.slice(0, 8)}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold text-foreground">
                      {formatCurrency(receipt.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge tone="neutral" size="sm">{receipt.paymentMethod}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {formatDate(receipt.issuedAt || receipt.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="xs"
                          leftIcon={<Eye className="size-3.5" />}
                          onClick={() => setSelectedReceipt(receipt)}
                        >
                          Preview
                        </Button>
                        <Link href={`/admin/receipts/${receipt.id}`}>
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

      {/* RECEIPT PREVIEW MODAL */}
      {selectedReceipt && (
        <AdminReceiptDetailModal
          receipt={selectedReceipt}
          isOpen={Boolean(selectedReceipt)}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </PageShell>
  );
}
