"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  Eye,
  Download,
  FileCheck,
  ShieldAlert,
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
import { EmptyState, Skeleton, ErrorState } from "@/components/ui/feedback-primitives";
import { adminApi } from "@/lib/api/admin";
import { formatDate } from "@/lib/utils/format";
import type { Application, ApplicationRequirement } from "@/types";

export default function AdminDocumentsPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [sweepResult, setSweepResult] = useState<any | null>(null);

  // Query applications to aggregate all documents/requirements
  const {
    data: appsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-documents-vault-applications"],
    queryFn: () => adminApi.getApplications({ page: 1, limit: 100 }),
  });

  const applications: Application[] = appsData?.items || [];

  // Flatten all documents/requirements
  const allDocuments: Array<{
    req: ApplicationRequirement;
    application: Application;
  }> = [];

  applications.forEach((app) => {
    if (app.requirements && app.requirements.length > 0) {
      app.requirements.forEach((r) => {
        allDocuments.push({ req: r, application: app });
      });
    }
  });

  // Expiry sweep mutation
  const sweepMutation = useMutation({
    mutationFn: () => adminApi.triggerExpiryCheck(),
    onSuccess: (data) => {
      setSweepResult(data);
      refetch();
    },
  });

  // Filter documents
  const filteredDocuments = allDocuments.filter(({ req, application }) => {
    if (search) {
      const q = search.toLowerCase();
      const matchKey = req.requirementKey?.toLowerCase().includes(q);
      const matchDocName = req.documentName?.toLowerCase().includes(q);
      const matchApp = application.applicationNumber?.toLowerCase().includes(q);
      const matchClient =
        application.client?.fullName?.toLowerCase().includes(q) ||
        application.client?.businessName?.toLowerCase().includes(q);
      if (!matchKey && !matchDocName && !matchApp && !matchClient) return false;
    }
    if (statusFilter !== "ALL" && req.status !== statusFilter) return false;
    return true;
  });

  // Metrics
  const totalCount = allDocuments.length;
  const approvedCount = allDocuments.filter((d) => d.req.status === "APPROVED").length;
  const submittedCount = allDocuments.filter((d) => d.req.status === "SUBMITTED" || d.req.status === "UNDER_REVIEW").length;
  const rejectedCount = allDocuments.filter((d) => d.req.status === "REJECTED").length;

  const pageSize = 12;
  const totalPages = Math.ceil(filteredDocuments.length / pageSize) || 1;
  const paginatedDocs = filteredDocuments.slice((page - 1) * pageSize, page * pageSize);

  return (
    <PageShell
      eyebrow="CLIENT OPERATIONS"
      title="Central Document Vault & Expiry Monitor"
      description="All statutory client documents, identity certifications, registry filings, and automatic expiry sweeps."
      actions={
        <Button
          variant="gold"
          size="sm"
          isLoading={sweepMutation.isPending}
          leftIcon={<RefreshCw className="size-3.5" />}
          onClick={() => sweepMutation.mutate()}
        >
          Run Document Expiry Sweep
        </Button>
      }
    >
      {/* 1. VAULT METRICS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Vault Documents"
          value={totalCount}
          subtitle="Across all active dossiers"
          icon={<FileText className="size-5 text-navy dark:text-gold" />}
        />

        <StatCard
          title="Verified & Approved"
          value={approvedCount}
          subtitle="Statutory compliance checked"
          icon={<CheckCircle2 className="size-5 text-emerald-600" />}
        />

        <StatCard
          title="Pending Officer Review"
          value={submittedCount}
          subtitle="Requires compliance verification"
          variant={submittedCount > 0 ? "gold" : "default"}
          icon={<Clock className="size-5 text-gold-dark dark:text-gold" />}
        />

        <StatCard
          title="Flagged / Rejected"
          value={rejectedCount}
          subtitle="Document defects identified"
          variant={rejectedCount > 0 ? "elevated" : "default"}
          icon={<AlertTriangle className="size-5 text-destructive" />}
        />
      </div>

      {/* EXPIRY SWEEP BANNER */}
      {sweepResult && (
        <div className="mt-4 rounded-xs border border-emerald-500/40 bg-emerald-500/10 p-3.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-600" />
            <span className="font-bold text-foreground">
              Document Expiry Sweep Executed: Checked {sweepResult.checkedCount || totalCount} documents.
            </span>
          </div>
          <Button variant="ghost" size="xs" onClick={() => setSweepResult(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {/* 2. FILTERS & SEARCH */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3 max-w-md">
          <Input
            placeholder="Search by document type, file name, client, or case #..."
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
              { value: "ALL", label: "All Document States" },
              { value: "SUBMITTED", label: "Pending Review" },
              { value: "APPROVED", label: "Approved" },
              { value: "REJECTED", label: "Rejected" },
              { value: "PENDING", label: "Pending Upload" },
            ]}
          />
        </div>
      </div>

      {/* 3. DOCUMENTS VAULT TABLE */}
      <div className="mt-6">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : error ? (
          <ErrorState onRetry={() => refetch()} />
        ) : filteredDocuments.length === 0 ? (
          <EmptyState
            icon={<FileText className="size-7" />}
            title="No documents found"
            description="Uploaded client documentation will appear in this centralized repository."
          />
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document Key / Type</TableHead>
                  <TableHead>Dossier #</TableHead>
                  <TableHead>Client Entity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>File Size / Format</TableHead>
                  <TableHead>Upload Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedDocs.map(({ req, application }) => (
                  <TableRow key={req.id} className="hover:bg-muted/30">
                    <TableCell>
                      <Link
                        href={`/admin/documents/${req.id}`}
                        className="font-semibold text-xs text-navy dark:text-gold hover:underline block"
                      >
                        {req.documentName || req.requirementKey?.replace(/_/g, " ") || "Statutory Document"}
                      </Link>
                      <span className="font-mono text-[11px] text-muted-foreground block">
                        {req.requirementKey}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/applications/${application.id}`}
                        className="font-mono text-xs font-bold text-foreground hover:underline"
                      >
                        #{application.applicationNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs text-foreground font-semibold">
                      {application.client?.fullName || application.client?.businessName || "Verified Client"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        tone={
                          req.status === "APPROVED"
                            ? "success"
                            : req.status === "REJECTED"
                            ? "destructive"
                            : req.status === "SUBMITTED"
                            ? "gold"
                            : "neutral"
                        }
                        size="sm"
                      >
                        {req.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {req.fileSize ? `${Math.round(req.fileSize / 1024)} KB` : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {formatDate(req.uploadedAt || req.updatedAt || req.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/admin/documents/${req.id}`}>
                          <Button variant="ghost" size="xs" leftIcon={<Eye className="size-3.5" />}>
                            Inspect
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={filteredDocuments.length}
              pageSize={pageSize}
              onChange={(p) => setPage(p)}
            />
          </div>
        )}
      </div>
    </PageShell>
  );
}
