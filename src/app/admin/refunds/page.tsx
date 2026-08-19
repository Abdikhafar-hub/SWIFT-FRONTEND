"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  RotateCcw,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  DollarSign,
  Eye,
  ArrowRight,
  Sliders,
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
  AdminApproveRefundModal,
  AdminRejectRefundModal,
} from "@/components/domain";
import { EmptyState, Skeleton, ErrorState } from "@/components/ui/feedback-primitives";
import { adminApi } from "@/lib/api/admin";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { Refund, RefundStatus } from "@/types";

export default function AdminRefundsPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);

  // Modals state
  const [selectedRefundForApprove, setSelectedRefundForApprove] = useState<Refund | null>(null);
  const [selectedRefundForReject, setSelectedRefundForReject] = useState<Refund | null>(null);

  // Query refunds
  const {
    data: refundsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-refunds-list", page, statusFilter],
    queryFn: () =>
      adminApi.getRefunds({
        page,
        limit: 15,
        status: statusFilter || undefined,
      }),
  });

  const rawRefunds: Refund[] = Array.isArray(refundsData)
    ? refundsData
    : (refundsData as any)?.items || [];
  const pagination = Array.isArray(refundsData) ? null : (refundsData as any)?.pagination;

  // Search filter
  const filteredRefunds = rawRefunds.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const matchNum = r.refundNumber?.toLowerCase().includes(q);
    const matchReason = r.reason?.toLowerCase().includes(q);
    const matchTx = r.transactionId?.toLowerCase().includes(q);
    const matchPay = r.paymentId?.toLowerCase().includes(q);
    return matchNum || matchReason || matchTx || matchPay;
  });

  // Metrics
  const requestedCount = rawRefunds.filter((r) => r.status === "REQUESTED").length;
  const approvedCount = rawRefunds.filter((r) => r.status === "APPROVED" || r.status === "PROCESSING").length;
  const completedCount = rawRefunds.filter((r) => r.status === "COMPLETED").length;
  const totalRefundedSum = rawRefunds
    .filter((r) => r.status === "COMPLETED")
    .reduce((sum, r) => sum + Number(r.amount || 0), 0);

  return (
    <PageShell
      eyebrow="FINANCIAL OPERATIONS"
      title="Refund Claims & Reversals"
      description="Disputed statutory payments, customer refund authorizations, and escrow balances."
    >
      {/* 1. REFUND METRICS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Pending Approval"
          value={requestedCount}
          subtitle="Awaiting compliance sign-off"
          variant={requestedCount > 0 ? "gold" : "default"}
          icon={<Clock className="size-5 text-gold-dark dark:text-gold" />}
        />

        <StatCard
          title="Approved & Queued"
          value={approvedCount}
          subtitle="Ready for disbursement"
          icon={<RotateCcw className="size-5 text-navy dark:text-gold" />}
        />

        <StatCard
          title="Completed Refunds"
          value={completedCount}
          subtitle="Disbursed to clients"
          icon={<CheckCircle2 className="size-5 text-emerald-600" />}
        />

        <StatCard
          title="Total Value Refunded"
          value={formatCurrency(totalRefundedSum)}
          subtitle="Cumulative refunded amount"
          icon={<DollarSign className="size-5 text-muted-foreground" />}
        />
      </div>

      {/* 2. FILTERS & SEARCH */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3 max-w-md">
          <Input
            placeholder="Search by refund #, reason, or payment reference..."
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
              { value: "", label: "All Refund States" },
              { value: "REQUESTED", label: "Requested / Pending" },
              { value: "APPROVED", label: "Approved" },
              { value: "PROCESSING", label: "Processing" },
              { value: "COMPLETED", label: "Completed" },
              { value: "REJECTED", label: "Rejected" },
            ]}
          />
        </div>
      </div>

      {/* 3. REFUNDS TABLE */}
      <div className="mt-6">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : error ? (
          <ErrorState onRetry={() => refetch()} />
        ) : filteredRefunds.length === 0 ? (
          <EmptyState
            icon={<RotateCcw className="size-7" />}
            title="No refund records found"
            description="No refund claims match the current filter parameters."
          />
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Refund #</TableHead>
                  <TableHead>Claim Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reason & Justification</TableHead>
                  <TableHead>Payment Reference</TableHead>
                  <TableHead>Date Filed</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRefunds.map((refund) => (
                  <TableRow key={refund.id} className="hover:bg-muted/30">
                    <TableCell>
                      <Link
                        href={`/admin/refunds/${refund.id}`}
                        className="font-mono text-xs font-bold text-navy dark:text-gold hover:underline block"
                      >
                        {refund.refundNumber || `#${refund.id.slice(0, 8)}`}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold text-foreground">
                      {formatCurrency(refund.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        tone={
                          refund.status === "COMPLETED"
                            ? "success"
                            : refund.status === "REJECTED"
                            ? "destructive"
                            : refund.status === "APPROVED" || refund.status === "PROCESSING"
                            ? "gold"
                            : "warning"
                        }
                        size="sm"
                      >
                        {refund.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-foreground max-w-xs truncate">
                      {refund.reason || "Client Refund Claim"}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/invoices/${refund.paymentId}`}
                        className="font-mono text-xs text-muted-foreground hover:underline"
                      >
                        #{refund.paymentId.slice(0, 8)}
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {formatDate(refund.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {refund.status === "REQUESTED" && (
                          <>
                            <Button
                              variant="ghost"
                              size="xs"
                              className="text-emerald-600 hover:bg-emerald-500/10"
                              leftIcon={<CheckCircle2 className="size-3" />}
                              onClick={() => setSelectedRefundForApprove(refund)}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="ghost"
                              size="xs"
                              className="text-destructive hover:bg-destructive/10"
                              leftIcon={<XCircle className="size-3" />}
                              onClick={() => setSelectedRefundForReject(refund)}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        <Link href={`/admin/refunds/${refund.id}`}>
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

      {/* APPROVE REFUND MODAL */}
      {selectedRefundForApprove && (
        <AdminApproveRefundModal
          refundId={selectedRefundForApprove.id}
          refundNumber={selectedRefundForApprove.refundNumber}
          amount={selectedRefundForApprove.amount}
          isOpen={Boolean(selectedRefundForApprove)}
          onClose={() => setSelectedRefundForApprove(null)}
          onSuccess={() => {
            refetch();
            queryClient.invalidateQueries({ queryKey: ["admin-financial-summary"] });
          }}
        />
      )}

      {/* REJECT REFUND MODAL */}
      {selectedRefundForReject && (
        <AdminRejectRefundModal
          refundId={selectedRefundForReject.id}
          refundNumber={selectedRefundForReject.refundNumber}
          isOpen={Boolean(selectedRefundForReject)}
          onClose={() => setSelectedRefundForReject(null)}
          onSuccess={() => {
            refetch();
            queryClient.invalidateQueries({ queryKey: ["admin-financial-summary"] });
          }}
        />
      )}
    </PageShell>
  );
}
