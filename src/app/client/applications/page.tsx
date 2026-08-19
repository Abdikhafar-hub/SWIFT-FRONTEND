"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, ChevronRight, FileText, Filter, ArrowRight } from "lucide-react";
import { PageShell } from "@/components/ui/layout-primitives";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, Pagination } from "@/components/ui/table-primitives";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ApplicationStatusBadge, PriorityBadge, SlaIndicator } from "@/components/domain/status-badges";
import { EmptyState, Skeleton, ErrorState } from "@/components/ui/feedback-primitives";
import { applicationsApi } from "@/lib/api/applications";
import { formatDate, formatKES } from "@/lib/utils/format";
import type { ApplicationStatus } from "@/types";

export default function ClientApplicationsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["client-applications", page, search, statusFilter],
    queryFn: () =>
      applicationsApi.getApplications({
        page,
        limit: 10,
        search: search || undefined,
        status: statusFilter || undefined,
      }),
  });

  const applications = data?.items || [];
  const meta = data?.meta;

  return (
    <PageShell
      eyebrow="REGISTRY DOSSIERS"
      title="My Statutory Applications"
      description="Real-time statutory filing tracker: monitor requirement approvals, government reviews, official receipts, and final deliveries."
      actions={
        <Link href="/client/services">
          <Button variant="gold" size="sm" leftIcon={<Plus className="size-4" />}>
            New Application
          </Button>
        </Link>
      }
    >
      {/* Filter and Search Bar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3 max-w-md">
          <Input
            placeholder="Search by application number or service..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            leftAddon={<Search className="size-4" />}
            className="text-xs"
          />
        </div>

        <div className="flex items-center gap-3">
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-56 text-xs font-medium"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="PENDING_PAYMENT">Pending Payment</option>
            <option value="PAID">Paid</option>
            <option value="REQUIREMENTS_PENDING">Requirements Pending</option>
            <option value="REQUIREMENTS_SUBMITTED">Requirements Submitted</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="READY_FOR_SUBMISSION">Ready for Submission</option>
            <option value="GOVERNMENT_PROCESSING">Government Processing</option>
            <option value="DOCUMENT_RECEIVED">Document Received</option>
            <option value="READY_FOR_DELIVERY">Ready for Delivery</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CLOSED">Closed & Completed</option>
            <option value="REJECTED">Rejected</option>
          </Select>
        </div>
      </div>

      {/* Main Table or Loading/Empty State */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : error ? (
        <ErrorState onRetry={() => refetch()} />
      ) : applications.length === 0 ? (
        <EmptyState
          title="No statutory filings found"
          description={
            search || statusFilter
              ? "No applications match the selected filter criteria. Clear filters to view all filings."
              : "You have not initiated any statutory document applications yet."
          }
          action={
            <Link href="/client/services">
              <Button variant="gold" size="sm">
                Browse Service Catalog
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Application #</TableHead>
                <TableHead>Statutory Service</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>SLA / Priority</TableHead>
                <TableHead>Billing</TableHead>
                <TableHead>Date Initiated</TableHead>
                <TableHead className="text-right">Dossier</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((app) => (
                <TableRow key={app.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-mono text-xs font-bold text-foreground">
                    #{app.applicationNumber}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground text-xs">
                        {app.service?.name || "Statutory Service"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {app.service?.authority || "Official Registry"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <ApplicationStatusBadge status={app.status as ApplicationStatus} size="sm" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {app.slaStatus && <SlaIndicator status={app.slaStatus} size="sm" />}
                      <PriorityBadge priority={app.priority} size="sm" />
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {Number(app.dueAmount) > 0 ? (
                      <span className="font-bold text-amber-600 dark:text-amber-400">
                        Due: {formatKES(app.dueAmount)}
                      </span>
                    ) : (
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        Settled
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(app.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/client/applications/${app.id}`}>
                      <Button
                        variant="ghost"
                        size="xs"
                        className="text-gold-dark dark:text-gold hover:text-gold-light gap-1 font-bold"
                      >
                        <span>Open Dossier</span>
                        <ChevronRight className="size-3.5" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {meta && (
            <Pagination
              currentPage={meta.page || 1}
              totalPages={meta.totalPages || 1}
              totalItems={meta.total || 0}
              pageSize={meta.limit || 10}
              onPageChange={(p) => setPage(p)}
            />
          )}
        </div>
      )}
    </PageShell>
  );
}
