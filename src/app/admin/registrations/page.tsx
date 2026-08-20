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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-4 sm:p-5 lg:p-6 space-y-4 max-w-[1550px] mx-auto font-sans">
      {/* ------------------------------------------------------------------ */}
      {/* 1. HEADER SECTION */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            New Client Registrations Queue
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Vetting and onboarding queue for newly registered citizens, foreign investors, and enterprise accounts.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <button
            onClick={() => refetch()}
            className="bg-white border border-slate-200 text-slate-700 font-bold text-xs px-3 py-2 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-1.5 shadow-xs"
          >
            <RefreshCw className="size-3.5 text-slate-500" />
            <span>Refresh</span>
          </button>
          <Link href="/admin/clients">
            <button className="bg-gradient-to-r from-[#C5A059] to-[#D4AF37] hover:from-[#b49049] hover:to-[#c39e26] text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1.5 transform hover:-translate-y-0.5">
              <Users className="size-3.5" />
              <span>Master Client Registry</span>
            </button>
          </Link>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. INTAKE SUMMARY STATS */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Pending Review</span>
            <span className="text-xl font-extrabold text-amber-600 font-mono mt-0.5 block">{pendingCount}</span>
            <span className="text-[10px] text-slate-500 font-medium">Awaiting onboarding vetting</span>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60">
            <Clock className="size-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Verified &amp; Vetted</span>
            <span className="text-xl font-extrabold text-emerald-600 font-mono mt-0.5 block">{reviewedCount}</span>
            <span className="text-[10px] text-slate-500 font-medium">Approved client profiles</span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60">
            <CheckCircle2 className="size-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Potential Duplicates</span>
            <span className="text-xl font-extrabold text-rose-600 font-mono mt-0.5 block">
              {registrations.filter((r) => r.isDuplicateFlagged).length}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Matching KRA / Phone</span>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200/60">
            <ShieldAlert className="size-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Directory Accounts</span>
            <span className="text-xl font-extrabold text-slate-900 font-mono mt-0.5 block">{pendingCount + reviewedCount}</span>
            <span className="text-[10px] text-slate-500 font-medium">Lifetime registered profiles</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
            <Users className="size-4" />
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. SEARCH & FILTER CONTROLS */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col lg:flex-row items-center justify-between gap-3">
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, phone, or KRA PIN..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium text-slate-800 placeholder-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <select
            value={reviewedFilter}
            onChange={(e) => {
              setReviewedFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-semibold text-slate-700"
          >
            <option value="false">Pending Review Only</option>
            <option value="true">Reviewed / Vetted</option>
            <option value="all">All Review Statuses</option>
          </select>

          <select
            value={clientTypeFilter}
            onChange={(e) => {
              setClientTypeFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-semibold text-slate-700"
          >
            <option value="">All Account Types</option>
            <option value="INDIVIDUAL">Individual Citizens</option>
            <option value="BUSINESS">Corporate Entities</option>
            <option value="ORGANIZATION">Organizations</option>
          </select>

          <select
            value={duplicateFilter}
            onChange={(e) => {
              setDuplicateFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-semibold text-slate-700"
          >
            <option value="">All Duplication Risk</option>
            <option value="true">Flagged Duplicates</option>
            <option value="false">Clean Records</option>
          </select>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 4. REGISTRATIONS TABLE */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-slate-100 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <p className="text-xs font-bold text-rose-600">Failed to load registration queue.</p>
            <button
              onClick={() => refetch()}
              className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
            >
              Retry Loading
            </button>
          </div>
        ) : registrations.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <h3 className="text-sm font-bold text-slate-800">
              {reviewedFilter === "false" ? "All Caught Up! No Pending Registrations" : "No Client Registrations Found"}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {reviewedFilter === "false"
                ? "All new client registrations have been vetted and reviewed by administrative staff."
                : "No clients match the current search and filter criteria."}
            </p>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Client Number</th>
                    <th className="py-3 px-4">Client / Entity Name</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Contact Information</th>
                    <th className="py-3 px-4">Registered</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {registrations.map((client) => {
                    const isPending = !client.isReviewed;
                    return (
                      <tr key={client.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {client.clientNumber}
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 text-xs group-hover:text-amber-700 transition-colors">
                              {client.fullName || client.businessName || "Unnamed Client"}
                            </span>
                            {client.businessName && client.fullName && (
                              <span className="text-[10px] text-slate-400 font-medium">
                                {client.businessName}
                              </span>
                            )}
                            {client.kraPin && (
                              <span className="text-[10px] font-mono text-slate-400">
                                PIN: {client.kraPin}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border inline-flex items-center gap-1 ${
                            client.clientType === "BUSINESS"
                              ? "bg-amber-50 text-amber-800 border-amber-200/80"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}>
                            {client.clientType === "BUSINESS" ? (
                              <Building className="size-3 text-amber-600" />
                            ) : (
                              <User className="size-3 text-slate-600" />
                            )}
                            {client.clientType}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-0.5 text-xs text-slate-600">
                            <span className="font-medium text-slate-900 truncate max-w-[180px]">{client.email}</span>
                            <span className="font-mono text-[10px] text-slate-400">{client.phone}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-xs text-slate-500 font-medium">
                          {client.createdAt ? formatDate(client.createdAt) : "—"}
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1 items-start">
                            {isPending ? (
                              <span className="inline-flex items-center text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                                <Clock className="mr-1 size-3 text-amber-600" />
                                Pending Review
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                                <CheckCircle2 className="mr-1 size-3 text-emerald-600" />
                                Reviewed
                              </span>
                            )}

                            {client.isDuplicateFlagged && (
                              <span className="inline-flex items-center text-[9px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-200">
                                <AlertTriangle className="mr-1 size-2.5 text-rose-600" />
                                Duplicate Alert
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isPending ? (
                              <button
                                onClick={() => openReviewModal(client)}
                                className="bg-gradient-to-r from-[#C5A059] to-[#D4AF37] hover:from-[#b49049] hover:to-[#c39e26] text-white font-bold text-xs px-2.5 py-1 rounded-lg shadow-xs transition-all flex items-center gap-1"
                              >
                                <FileCheck className="size-3 stroke-[2.5]" />
                                <span>Review Profile</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => openReviewModal(client)}
                                className="bg-white border border-slate-200 text-slate-700 font-bold text-xs px-2.5 py-1 rounded-lg hover:bg-slate-50 transition-all flex items-center gap-1"
                              >
                                <Eye className="size-3 text-slate-500" />
                                <span>Details</span>
                              </button>
                            )}

                            <Link href={`/admin/clients/${client.id}`}>
                              <button className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors" title="Open Client 360">
                                <ExternalLink className="size-3.5" />
                              </button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* PAGINATION FOOTER */}
            {pagination && pagination.totalPages > 1 && (
              <div className="px-4 py-3 bg-slate-50/60 border-t border-slate-200/80 flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>
                  Page {pagination.page} of {pagination.totalPages} ({pagination.total} total items)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. ADMINISTRATIVE REVIEW MODAL */}
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
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {selectedClient.fullName || selectedClient.businessName}
                  </h4>
                  <p className="text-xs font-mono text-slate-500">{selectedClient.clientNumber}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                  {selectedClient.clientType}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400">Email: </span>
                  <span className="font-semibold text-slate-800">{selectedClient.email}</span>
                </div>
                <div>
                  <span className="text-slate-400">Phone: </span>
                  <span className="font-semibold text-slate-800 font-mono">{selectedClient.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400">National ID: </span>
                  <span className="font-semibold text-slate-800">
                    {selectedClient.nationalId || selectedClient.idNumber || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">KRA PIN: </span>
                  <span className="font-semibold text-slate-800 font-mono">
                    {selectedClient.kraPin || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Location: </span>
                  <span className="font-semibold text-slate-800">
                    {selectedClient.city || selectedClient.county || "Kenya"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Registered: </span>
                  <span className="font-semibold text-slate-800">
                    {selectedClient.createdAt ? formatDate(selectedClient.createdAt) : "—"}
                  </span>
                </div>
              </div>

              {selectedClient.isReviewed && selectedClient.reviewedAt && (
                <div className="pt-2 border-t border-slate-200/80 text-xs text-emerald-700 flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  <span>
                    Previously reviewed on {formatDate(selectedClient.reviewedAt)}
                    {selectedClient.reviewedBy?.email && ` by ${selectedClient.reviewedBy.email}`}
                  </span>
                </div>
              )}
            </div>

            {/* Duplication Warning */}
            {selectedClient.isDuplicateFlagged && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
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
                className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 size-4"
              />
              <label htmlFor="flagDuplicate" className="text-xs font-semibold text-slate-800 cursor-pointer">
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
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
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
    </div>
  );
}
