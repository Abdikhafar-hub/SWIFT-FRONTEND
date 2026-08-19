"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Landmark,
  Search,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Calendar,
  ExternalLink,
  Eye,
  Building,
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
import { AdminGovernmentSubmissionModal } from "@/components/domain";
import { EmptyState, Skeleton, ErrorState } from "@/components/ui/feedback-primitives";
import { adminApi } from "@/lib/api/admin";
import { formatDate } from "@/lib/utils/format";
import type { GovernmentApplication, GovernmentStatus } from "@/types";

export default function AdminGovernmentPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [agencyFilter, setAgencyFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  // Submission modal state
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedAppIdForSubmit, setSelectedAppIdForSubmit] = useState("");

  // Query government queue
  const {
    data: queueData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-government-queue", page, agencyFilter, statusFilter],
    queryFn: () =>
      adminApi.getGovernmentQueue({
        page,
        limit: 15,
        agency: agencyFilter || undefined,
        status: statusFilter || undefined,
      }),
  });

  const filings = queueData?.items || [];
  const pagination = queueData?.pagination;

  // Filter local search
  const filteredFilings = filings.filter((f) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const matchRef = f.externalReference?.toLowerCase().includes(q);
    const matchAgency = f.governmentAgency?.toLowerCase().includes(q);
    const matchApp = f.application?.applicationNumber?.toLowerCase().includes(q);
    const matchClient =
      f.application?.client?.fullName?.toLowerCase().includes(q) ||
      f.application?.client?.businessName?.toLowerCase().includes(q);
    return matchRef || matchAgency || matchApp || matchClient;
  });

  // Derived metrics
  const totalSubmissions = filings.length;
  const inReviewCount = filings.filter((f) => f.status === "IN_REVIEW" || f.status === "SUBMITTED").length;
  const queryCount = filings.filter((f) => f.status === "QUERY_RAISED" || f.status === "REJECTED").length;
  const approvedCount = filings.filter((f) => f.status === "APPROVED").length;

  return (
    <PageShell
      eyebrow="CASE OPERATIONS"
      title="Government Registry Operations"
      description="Agency tracking across eCitizen, BRS, ArdhiSasa, NTSA, KRA, and statutory registries with reference mapping."
      actions={
        <Button
          variant="gold"
          size="sm"
          leftIcon={<Plus className="size-3.5" />}
          onClick={() => setIsSubmitModalOpen(true)}
        >
          Register Agency Filing
        </Button>
      }
    >
      {/* 1. REGISTRY METRICS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Agency Filings"
          value={totalSubmissions}
          subtitle="Monitored in registry queue"
          icon={<Landmark className="size-5 text-navy dark:text-gold" />}
        />

        <StatCard
          title="Processing / In Review"
          value={inReviewCount}
          subtitle="Active at registry"
          icon={<Clock className="size-5 text-gold-dark dark:text-gold" />}
        />

        <StatCard
          title="Registry Queries"
          value={queryCount}
          subtitle="Action required from agency"
          variant={queryCount > 0 ? "gold" : "default"}
          icon={<AlertTriangle className="size-5 text-amber-600" />}
        />

        <StatCard
          title="Statutory Approvals"
          value={approvedCount}
          subtitle="Certified official approvals"
          icon={<CheckCircle2 className="size-5 text-emerald-600" />}
        />
      </div>

      {/* 2. FILTERS & SEARCH */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3 max-w-md">
          <Input
            placeholder="Search by registry reference, agency, or dossier #..."
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
            value={agencyFilter}
            onChange={(e) => {
              setAgencyFilter(e.target.value);
              setPage(1);
            }}
            className="w-48 text-xs"
            options={[
              { value: "", label: "All Government Registries" },
              { value: "BRS", label: "BRS (Business Registration)" },
              { value: "eCitizen", label: "eCitizen Portal" },
              { value: "Ardhi", label: "ArdhiSasa Land Registry" },
              { value: "iTax", label: "KRA iTax" },
              { value: "TIMS", label: "NTSA TIMS" },
              { value: "Immigration", label: "Immigration" },
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
              { value: "", label: "All Registry Statuses" },
              { value: "SUBMITTED", label: "Submitted to Agency" },
              { value: "IN_REVIEW", label: "In Review / Processing" },
              { value: "QUERY_RAISED", label: "Query Raised" },
              { value: "APPROVED", label: "Approved & Certified" },
              { value: "REJECTED", label: "Rejected by Registry" },
            ]}
          />
        </div>
      </div>

      {/* 3. GOVERNMENT FILINGS TABLE */}
      <div className="mt-6">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : error ? (
          <ErrorState onRetry={() => refetch()} />
        ) : filteredFilings.length === 0 ? (
          <EmptyState
            icon={<Landmark className="size-7" />}
            title="No government filings recorded"
            description="Agency submissions registered for statutory applications will appear here."
            action={
              <Button
                variant="gold"
                size="xs"
                leftIcon={<Plus className="size-3.5" />}
                onClick={() => setIsSubmitModalOpen(true)}
              >
                Register First Filing
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agency / Registry</TableHead>
                  <TableHead>External Reference</TableHead>
                  <TableHead>Dossier #</TableHead>
                  <TableHead>Client Entity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted Date</TableHead>
                  <TableHead>Follow-up Due</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFilings.map((filing) => (
                  <TableRow key={filing.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="space-y-0.5">
                        <Link
                          href={`/admin/government/${filing.id}`}
                          className="font-bold text-xs text-foreground hover:text-gold-dark dark:hover:text-gold hover:underline block"
                        >
                          {filing.governmentAgency || filing.platform}
                        </Link>
                        <span className="text-[11px] text-muted-foreground">
                          {filing.governmentService || filing.platform}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs font-bold text-foreground">
                        {filing.externalReference || "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {filing.application ? (
                        <Link
                          href={`/admin/applications/${filing.application.id}`}
                          className="font-mono text-xs font-bold text-navy dark:text-gold hover:underline"
                        >
                          #{filing.application.applicationNumber}
                        </Link>
                      ) : (
                        <span className="text-xs text-muted-foreground font-mono">
                          {filing.applicationId?.slice(0, 8)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-foreground font-semibold">
                      {filing.application?.client?.fullName ||
                        filing.application?.client?.businessName ||
                        "Verified Client"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        tone={
                          filing.status === "APPROVED"
                            ? "success"
                            : filing.status === "REJECTED" || filing.status === "QUERY_RAISED"
                            ? "warning"
                            : filing.status === "IN_REVIEW"
                            ? "gold"
                            : "neutral"
                        }
                        size="sm"
                      >
                        {filing.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {formatDate(filing.submittedAt || filing.createdAt)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {filing.followUpDate ? (
                        <span className="flex items-center gap-1 text-gold-dark dark:text-gold font-semibold">
                          <Calendar className="size-3" />
                          {formatDate(filing.followUpDate)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/admin/government/${filing.id}`}>
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

      {/* REGISTER SUBMISSION MODAL */}
      {isSubmitModalOpen && (
        <AdminGovernmentSubmissionModal
          applicationId={selectedAppIdForSubmit || ""}
          isOpen={isSubmitModalOpen}
          onClose={() => setIsSubmitModalOpen(false)}
          onSuccess={() => refetch()}
        />
      )}
    </PageShell>
  );
}
