"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CreditCard,
  Search,
  Plus,
  RotateCcw,
  ArrowRight,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  Smartphone,
  Landmark,
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
  AdminReverseTransactionModal,
} from "@/components/domain";
import { EmptyState, Skeleton, ErrorState } from "@/components/ui/feedback-primitives";
import { adminApi } from "@/lib/api/admin";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { PaymentTransaction, PaymentMethod, PaymentTransactionStatus } from "@/types";

export default function AdminTransactionsPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);

  // Modals state
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [selectedTxForReverse, setSelectedTxForReverse] = useState<PaymentTransaction | null>(null);

  // Financial summary query
  const { data: summary } = useQuery({
    queryKey: ["admin-financial-summary"],
    queryFn: () => adminApi.getFinancialSummary(),
  });

  // Query transactions
  const {
    data: txData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-transactions-list", page, statusFilter, search],
    queryFn: () =>
      adminApi.getTransactions({
        page,
        limit: 15,
        status: statusFilter || undefined,
        search: search || undefined,
      }),
  });

  const transactions = txData?.items || [];
  const pagination = txData?.pagination;

  // Local filter for payment method if selected
  const filteredTransactions = transactions.filter((tx) => {
    if (methodFilter && tx.paymentMethod !== methodFilter) return false;
    return true;
  });

  return (
    <PageShell
      eyebrow="FINANCIAL OPERATIONS"
      title="Payment Transactions Ledger"
      description="Real-time payment gateway transactions, M-Pesa C2B callbacks, direct bank settlements, and reversals."
      actions={
        <Button
          variant="gold"
          size="sm"
          leftIcon={<Plus className="size-3.5" />}
          onClick={() => setIsManualModalOpen(true)}
        >
          Record Manual Payment
        </Button>
      }
    >
      {/* 1. TRANSACTION METRICS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Collected"
          value={formatCurrency(summary?.totalCollected || 0)}
          subtitle="Settled transactions"
          icon={<DollarSign className="size-5 text-navy dark:text-gold" />}
        />

        <StatCard
          title="M-Pesa Volumes"
          value={formatCurrency(summary?.byMethod?.MPESA || 0)}
          subtitle="Instant mobile settlements"
          icon={<Smartphone className="size-5 text-emerald-600" />}
        />

        <StatCard
          title="Bank / Card Transfers"
          value={formatCurrency((summary?.byMethod?.BANK_TRANSFER || 0) + (summary?.byMethod?.CREDIT_CARD || 0))}
          subtitle="Direct EFT & Wire"
          icon={<Landmark className="size-5 text-navy dark:text-gold" />}
        />

        <StatCard
          title="Active Transactions"
          value={pagination?.total || transactions.length}
          subtitle="Audited in ledger"
          icon={<CreditCard className="size-5 text-muted-foreground" />}
        />
      </div>

      {/* 2. FILTERS & SEARCH */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3 max-w-md">
          <Input
            placeholder="Search by reference code, M-Pesa receipt, or client..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            leftAddon={<Search className="size-4" />}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={methodFilter}
            onChange={(e) => {
              setMethodFilter(e.target.value);
              setPage(1);
            }}
            className="w-44 text-xs"
            options={[
              { value: "", label: "All Payment Methods" },
              { value: "MPESA", label: "M-Pesa (Express & C2B)" },
              { value: "BANK_TRANSFER", label: "Bank Transfer (EFT/RTGS)" },
              { value: "CREDIT_CARD", label: "Credit / Debit Card" },
              { value: "CASH", label: "Direct Cash" },
              { value: "WALLET", label: "Wallet / Credit" },
            ]}
          />

          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-44 text-xs"
            options={[
              { value: "", label: "All Transaction States" },
              { value: "COMPLETED", label: "Completed / Settled" },
              { value: "PENDING", label: "Pending Processing" },
              { value: "FAILED", label: "Failed" },
              { value: "REVERSED", label: "Reversed" },
            ]}
          />
        </div>
      </div>

      {/* 3. TRANSACTIONS TABLE */}
      <div className="mt-6">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : error ? (
          <ErrorState onRetry={() => refetch()} />
        ) : filteredTransactions.length === 0 ? (
          <EmptyState
            icon={<CreditCard className="size-7" />}
            title="No transactions found"
            description="No payment ledger entries match the specified filters."
            action={
              <Button
                variant="gold"
                size="xs"
                leftIcon={<Plus className="size-3.5" />}
                onClick={() => setIsManualModalOpen(true)}
              >
                Record First Payment
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference / Code</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Settlement Timestamp</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((tx) => (
                  <TableRow key={tx.id} className="hover:bg-muted/30">
                    <TableCell>
                      <Link
                        href={`/admin/transactions/${tx.id}`}
                        className="font-mono text-xs font-bold text-navy dark:text-gold hover:underline block"
                      >
                        {tx.reference || tx.externalReference || `#${tx.id.slice(0, 8)}`}
                      </Link>
                      {tx.mpesaReceiptNumber && (
                        <span className="font-mono text-[11px] text-muted-foreground block">
                          M-Pesa: {tx.mpesaReceiptNumber}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge tone="neutral" size="sm">
                        {tx.paymentMethod} {tx.channel ? `• ${tx.channel}` : ""}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold text-foreground">
                      {formatCurrency(tx.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        tone={
                          tx.status === "COMPLETED"
                            ? "success"
                            : tx.status === "FAILED"
                            ? "destructive"
                            : tx.status === "REVERSED"
                            ? "warning"
                            : "gold"
                        }
                        size="sm"
                      >
                        {tx.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {tx.paymentId ? (
                        <Link
                          href={`/admin/invoices/${tx.paymentId}`}
                          className="font-mono text-xs font-bold text-navy dark:text-gold hover:underline"
                        >
                          #{tx.paymentId.slice(0, 8)}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {formatDate(tx.completedAt || tx.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {tx.status === "COMPLETED" && (
                          <Button
                            variant="ghost"
                            size="xs"
                            className="text-destructive hover:bg-destructive/10"
                            leftIcon={<RotateCcw className="size-3" />}
                            onClick={() => setSelectedTxForReverse(tx)}
                          >
                            Reverse
                          </Button>
                        )}
                        <Link href={`/admin/transactions/${tx.id}`}>
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

      {/* RECORD MANUAL PAYMENT MODAL */}
      {isManualModalOpen && (
        <AdminManualPaymentModal
          applicationId=""
          isOpen={isManualModalOpen}
          onClose={() => setIsManualModalOpen(false)}
          onSuccess={() => {
            refetch();
            queryClient.invalidateQueries({ queryKey: ["admin-financial-summary"] });
          }}
        />
      )}

      {/* REVERSE TRANSACTION MODAL */}
      {selectedTxForReverse && (
        <AdminReverseTransactionModal
          transactionId={selectedTxForReverse.id}
          reference={selectedTxForReverse.reference || selectedTxForReverse.id.slice(0, 8)}
          amount={selectedTxForReverse.amount}
          isOpen={Boolean(selectedTxForReverse)}
          onClose={() => setSelectedTxForReverse(null)}
          onSuccess={() => {
            refetch();
            queryClient.invalidateQueries({ queryKey: ["admin-financial-summary"] });
          }}
        />
      )}
    </PageShell>
  );
}
