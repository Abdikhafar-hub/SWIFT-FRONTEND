"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  UserPlus,
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronRight,
  Building,
  User,
  Phone,
  Mail,
  ShieldAlert,
  ShieldCheck,
  Eye,
  FileCheck,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { PageShell } from "@/components/ui/layout-primitives";
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
import { Card, StatCard } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { FormField, Textarea } from "@/components/ui/form-primitives";
import { EmptyState, Skeleton, ErrorState } from "@/components/ui/feedback-primitives";
import { adminApi } from "@/lib/api/admin";
import { formatDate } from "@/lib/utils/format";
import type { ClientProfile } from "@/types";

export default function AdminRegistrationsPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [clientTypeFilter, setClientTypeFilter] = useState("");
  const [reviewedFilter, setReviewedFilter] = useState<string>("false"); // "false" = Pending, "true" = Reviewed, "all" = All
  const [duplicateFilter, setDuplicateFilter] = useState<string>("");
  const [page, setPage] = useState(1);

  // Review Modal State
  const [selectedClient, setSelectedClient] = useState<ClientProfile | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [isDuplicateFlagged, setIsDuplicateFlagged] = useState(false);
  const [duplicateReason, setDuplicateReason] = useState("");

  const isReviewedParam =
    reviewedFilter === "false" ? false : reviewedFilter === "true" ? true : undefined;
  const isDuplicateParam =
    duplicateFilter === "true" ? true : duplicateFilter === "false" ? false : undefined;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-registrations", page, search, clientTypeFilter, reviewedFilter, duplicateFilter],
    queryFn: () =>
      adminApi.getRegistrations({
        page,
        limit: 10,
        search: search || undefined,
        clientType: clientTypeFilter || undefined,
        isReviewed: isReviewedParam,
        isDuplicateFlagged: isDuplicateParam,
      }),
  });

  // Query for counts
  const { data: allPendingData } = useQuery({
    queryKey: ["admin-registrations-count-pending"],
    queryFn: () => adminApi.getRegistrations({ limit: 1, isReviewed: false }),
  });

  const { data: allReviewedData } = useQuery({
    queryKey: ["admin-registrations-count-reviewed"],
    queryFn: () => adminApi.getRegistrations({ limit: 1, isReviewed: true }),
  });

  const reviewMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: { reviewNotes?: string; isDuplicateFlagged?: boolean; duplicateReason?: string | null };
    }) => adminApi.reviewRegistration(id, payload),
    onSuccess: () => {
      setIsReviewModalOpen(false);
      setSelectedClient(null);
      setReviewNotes("");
      setDuplicateReason("");
      queryClient.invalidateQueries({ queryKey: ["admin-registrations"] });
      queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
      queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
    },
  });

  const openReviewModal = (client: ClientProfile) => {
    setSelectedClient(client);
    setReviewNotes(client.reviewNotes || "");
    setIsDuplicateFlagged(Boolean(client.isDuplicateFlagged));
    setDuplicateReason(client.duplicateReason || "");
    setIsReviewModalOpen(true);
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;

    reviewMutation.mutate({
      id: selectedClient.id,
      payload: {
        reviewNotes: reviewNotes.trim() || undefined,
        isDuplicateFlagged,
        duplicateReason: isDuplicateFlagged ? duplicateReason.trim() || "Flagged during review" : null,
      },
    });
  };

  const registrations = data?.items || [];
  const pagination = data?.pagination;

  const pendingCount = allPendingData?.pagination?.total ?? 0;
  const reviewedCount = allReviewedData?.pagination?.total ?? 0;

  return (
    <PageShell
      eyebrow="OPERATIONAL INTAKE"
      title="New Client Registrations Queue"
      description="Vetting and onboarding queue for newly registered citizens, foreign investors, and enterprise accounts."
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className="size-3.5" />}
            onClick={() => refetch()}
          >
            Refresh
          </Button>
          <Link href="/admin/clients">
            <Button variant="gold" size="sm" leftIcon={<Users className="size-4" />}>
              Master Client Registry
            </Button>
          </Link>
        </div>
      }
    >
      {/* 1. INTAKE SUMMARY STATS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard
          title="Pending Administrative Review"
          value={pendingCount}
          subtitle="New accounts awaiting vetting"
          variant={pendingCount > 0 ? "gold" : "default"}
          icon={<Clock className="size-5 text-amber-600 dark:text-amber-400" />}
        />

        <StatCard
          title="Verified & Reviewed"
          value={reviewedCount}
          subtitle="Approved client accounts"
          icon={<CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />}
        />

        <StatCard
          title="Potential Duplicates"
          value={registrations.filter((r) => r.isDuplicateFlagged).length}
          subtitle="Matching KRA/Phone in page"
          icon={<ShieldAlert className="size-5 text-rose-600 dark:text-rose-400" />}
        />

        <StatCard
          title="Total Registered Clients"
          value={pendingCount + reviewedCount}
          subtitle="Lifetime client profiles"
          icon={<Users className="size-5 text-navy dark:text-gold" />}
        />
      </div>

      {/* 2. FILTER CONTROLS */}
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between bg-card p-4 rounded-xs border border-border">
        <div className="flex flex-1 items-center gap-3 max-w-md">
          <Input
            placeholder="Search by name, email, phone, or KRA PIN..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            leftAddon={<Search className="size-4" />}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={reviewedFilter}
            onChange={(e) => {
              setReviewedFilter(e.target.value);
              setPage(1);
            }}
            className="w-48"
          >
            <option value="false">Pending Review Only</option>
            <option value="true">Reviewed / Vetted</option>
            <option value="all">All Statuses</option>
          </Select>

          <Select
            value={clientTypeFilter}
            onChange={(e) => {
              setClientTypeFilter(e.target.value);
              setPage(1);
            }}
            className="w-40"
          >
            <option value="">All Types</option>
            <option value="INDIVIDUAL">Individual</option>
            <option value="BUSINESS">Business</option>
            <option value="ORGANIZATION">Organization</option>
          </Select>

          <Select
            value={duplicateFilter}
            onChange={(e) => {
              setDuplicateFilter(e.target.value);
              setPage(1);
            }}
            className="w-44"
          >
            <option value="">All Duplication</option>
            <option value="true">Flagged Duplicates</option>
            <option value="false">Clean Records</option>
          </Select>
        </div>
      </div>

      {/* 3. REGISTRATIONS TABLE */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : error ? (
        <ErrorState onRetry={() => refetch()} />
      ) : registrations.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="size-8 text-emerald-600" />}
          title={
            reviewedFilter === "false"
              ? "All Caught Up! No Pending Registrations"
              : "No Client Registrations Found"
          }
          description={
            reviewedFilter === "false"
              ? "All new client registrations have been vetted and reviewed by administrative staff."
              : "No clients match the current search and filter criteria."
          }
          action={
            <Link href="/admin/clients">
              <Button variant="outline" size="sm">
                View Master Client Registry
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="rounded-xs border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client Number</TableHead>
                <TableHead>Client / Entity Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Contact Information</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registrations.map((client) => {
                const isPending = !client.isReviewed;
                return (
                  <TableRow key={client.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-mono text-xs font-bold text-foreground">
                      {client.clientNumber}
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-foreground">
                          {client.fullName || client.businessName || "Unnamed Client"}
                        </span>
                        {client.businessName && client.fullName && (
                          <span className="text-[11px] text-muted-foreground">
                            {client.businessName}
                          </span>
                        )}
                        {client.kraPin && (
                          <span className="text-[10px] font-mono text-muted-foreground">
                            PIN: {client.kraPin}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge tone="neutral" className="text-[10px] font-semibold uppercase">
                        {client.clientType === "BUSINESS" ? (
                          <Building className="mr-1 size-3 text-gold" />
                        ) : (
                          <User className="mr-1 size-3 text-muted-foreground" />
                        )}
                        {client.clientType}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Mail className="size-3 text-muted-foreground" />
                          <span className="truncate max-w-[180px]">{client.email}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="size-3 text-muted-foreground" />
                          <span>{client.phone}</span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      {client.createdAt ? formatDate(client.createdAt) : "—"}
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col gap-1 items-start">
                        {isPending ? (
                          <Badge tone="warning" size="sm">
                            <Clock className="mr-1 size-3" />
                            Pending Review
                          </Badge>
                        ) : (
                          <Badge tone="success" size="sm">
                            <CheckCircle2 className="mr-1 size-3" />
                            Reviewed
                          </Badge>
                        )}

                        {client.isDuplicateFlagged && (
                          <Badge tone="danger" size="sm">
                            <AlertTriangle className="mr-1 size-2.5" />
                            Duplicate Alert
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isPending ? (
                          <Button
                            variant="gold"
                            size="xs"
                            leftIcon={<FileCheck className="size-3.5" />}
                            onClick={() => openReviewModal(client)}
                          >
                            Review Profile
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="xs"
                            leftIcon={<Eye className="size-3.5" />}
                            onClick={() => openReviewModal(client)}
                          >
                            Details
                          </Button>
                        )}

                        <Link href={`/admin/clients/${client.id}`}>
                          <Button variant="ghost" size="xs" title="Open Client 360">
                            <ExternalLink className="size-3.5 text-muted-foreground hover:text-foreground" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {pagination && pagination.totalPages > 1 && (
            <div className="p-4 border-t border-border">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                pageSize={pagination.limit}
                onPageChange={(p: number) => setPage(p)}
              />
            </div>
          )}
        </div>
      )}

      {/* 4. ADMINISTRATIVE REVIEW MODAL */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => {
          if (!reviewMutation.isPending) {
            setIsReviewModalOpen(false);
            setSelectedClient(null);
          }
        }}
        title={`Vetting Dossier • ${selectedClient?.clientNumber || "Client"}`}
      >
        {selectedClient && (
          <form onSubmit={handleReviewSubmit} className="space-y-4">
            {/* Identity Summary Card */}
            <div className="rounded-xs border border-border bg-muted/30 p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    {selectedClient.fullName || selectedClient.businessName}
                  </h4>
                  <p className="text-xs text-muted-foreground">{selectedClient.clientNumber}</p>
                </div>
                <Badge tone="neutral" size="sm">
                  {selectedClient.clientType}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Email: </span>
                  <span className="font-semibold text-foreground">{selectedClient.email}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Phone: </span>
                  <span className="font-semibold text-foreground">{selectedClient.phone}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">National ID: </span>
                  <span className="font-semibold text-foreground">
                    {selectedClient.nationalId || selectedClient.idNumber || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">KRA PIN: </span>
                  <span className="font-semibold text-foreground font-mono">
                    {selectedClient.kraPin || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Location: </span>
                  <span className="font-semibold text-foreground">
                    {selectedClient.city || selectedClient.county || "Kenya"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Registered: </span>
                  <span className="font-semibold text-foreground">
                    {selectedClient.createdAt ? formatDate(selectedClient.createdAt) : "—"}
                  </span>
                </div>
              </div>

              {selectedClient.isReviewed && selectedClient.reviewedAt && (
                <div className="pt-2 border-t border-border/60 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="size-4" />
                  <span>
                    Previously reviewed on {formatDate(selectedClient.reviewedAt)}
                    {selectedClient.reviewedBy?.email && ` by ${selectedClient.reviewedBy.email}`}
                  </span>
                </div>
              )}
            </div>

            {/* Duplication Warning */}
            {selectedClient.isDuplicateFlagged && (
              <div className="rounded-xs border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300">
                <div className="flex items-center gap-2 font-bold mb-1">
                  <ShieldAlert className="size-4 text-rose-600" />
                  <span>Duplicate Risk Detected</span>
                </div>
                <p>{selectedClient.duplicateReason || "This client shares contact or KRA PIN details with an existing profile."}</p>
              </div>
            )}

            {/* Review Notes Input */}
            <FormField label="Administrative Review Notes" hint="Internal vetting notes and KYC verification observations">
              <Textarea
                placeholder="e.g. Identity verified via national registry; contact phone confirmed via OTP."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={3}
              />
            </FormField>

            {/* Duplication Flag Control */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="flagDuplicate"
                checked={isDuplicateFlagged}
                onChange={(e) => setIsDuplicateFlagged(e.target.checked)}
                className="rounded border-border text-gold focus:ring-gold size-4"
              />
              <label htmlFor="flagDuplicate" className="text-xs font-semibold text-foreground cursor-pointer">
                Flag profile as potential duplicate / requires KYC escalation
              </label>
            </div>

            {isDuplicateFlagged && (
              <FormField label="Duplicate Escalation Reason">
                <Input
                  placeholder="Specify duplicate criteria..."
                  value={duplicateReason}
                  onChange={(e) => setDuplicateReason(e.target.value)}
                />
              </FormField>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <Link href={`/admin/clients/${selectedClient.id}`} target="_blank">
                <Button variant="ghost" size="sm" leftIcon={<ExternalLink className="size-3.5" />}>
                  Open Full Client 360
                </Button>
              </Link>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsReviewModalOpen(false);
                    setSelectedClient(null);
                  }}
                  disabled={reviewMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="gold"
                  size="sm"
                  isLoading={reviewMutation.isPending}
                  leftIcon={<ShieldCheck className="size-4" />}
                >
                  {selectedClient.isReviewed ? "Update Review Notes" : "Approve & Mark Reviewed"}
                </Button>
              </div>
            </div>
          </form>
        )}
      </Modal>
    </PageShell>
  );
}
