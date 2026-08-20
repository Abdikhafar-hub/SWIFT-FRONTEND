"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Users, Plus, ChevronRight, Building, User, Phone, Mail, Clock, CheckCircle2, AlertTriangle, UserPlus } from "lucide-react";
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
import { Modal } from "@/components/ui/modal";
import { FormField, Textarea } from "@/components/ui/form-primitives";
import { EmptyState, Skeleton, ErrorState } from "@/components/ui/feedback-primitives";
import { adminApi, type CreateAdminClientPayload } from "@/lib/api/admin";
import { formatDate } from "@/lib/utils/format";

export default function AdminClientsPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [clientTypeFilter, setClientTypeFilter] = useState("");
  const [reviewedFilter, setReviewedFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  // New Client Modal
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [clientType, setClientType] = useState<"INDIVIDUAL" | "BUSINESS">("INDIVIDUAL");
  const [kraPin, setKraPin] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [address, setAddress] = useState("");

  const isReviewedParam =
    reviewedFilter === "false" ? false : reviewedFilter === "true" ? true : undefined;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-clients", page, search, clientTypeFilter, reviewedFilter],
    queryFn: () =>
      adminApi.getClients({
        page,
        limit: 10,
        search: search || undefined,
        clientType: clientTypeFilter || undefined,
        isReviewed: isReviewedParam,
      }),
  });

  const createClientMutation = useMutation({
    mutationFn: (payload: CreateAdminClientPayload) => adminApi.createClient(payload),
    onSuccess: () => {
      setIsNewClientModalOpen(false);
      setFullName("");
      setEmail("");
      setPhone("");
      setKraPin("");
      setIdNumber("");
      setBusinessName("");
      setAddress("");
      queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
    },
  });

  const clients = data?.items || [];
  const pagination = data?.pagination;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-4 sm:p-5 lg:p-6 space-y-4 max-w-[1550px] mx-auto font-sans">
      {/* ------------------------------------------------------------------ */}
      {/* 1. HEADER SECTION */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Verified Client Entities &amp; Profiles
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            360-degree management of Kenyan citizens, foreign investors, businesses, and institutional accounts.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <Link href="/admin/registrations">
            <button className="bg-white border border-slate-200 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-1.5 shadow-xs">
              <UserPlus className="size-3.5 text-amber-600" />
              <span>New Registrations Queue</span>
            </button>
          </Link>
          <button
            onClick={() => setIsNewClientModalOpen(true)}
            className="bg-gradient-to-r from-[#C5A059] to-[#D4AF37] hover:from-[#b49049] hover:to-[#c39e26] text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1.5 transform hover:-translate-y-0.5"
          >
            <Plus className="size-3.5 stroke-[3]" />
            <span>Register Client Entity</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. SEARCH & FILTER CONTROLS */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
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

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={reviewedFilter}
            onChange={(e) => {
              setReviewedFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-semibold text-slate-700"
          >
            <option value="all">All Review Statuses</option>
            <option value="true">Reviewed &amp; Vetted</option>
            <option value="false">Pending Review</option>
          </select>

          <select
            value={clientTypeFilter}
            onChange={(e) => {
              setClientTypeFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-semibold text-slate-700"
          >
            <option value="">All Client Types</option>
            <option value="INDIVIDUAL">Individual Citizens</option>
            <option value="BUSINESS">Corporate Entities</option>
            <option value="ORGANIZATION">Organizations</option>
          </select>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. TABLE CONTAINER */}
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
            <p className="text-xs font-bold text-rose-600">Failed to load registered clients.</p>
            <button
              onClick={() => refetch()}
              className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
            >
              Retry Loading
            </button>
          </div>
        ) : clients.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <h3 className="text-sm font-bold text-slate-800">No clients found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No registered client accounts matched your search criteria.
            </p>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Client Entity</th>
                    <th className="py-3 px-4">Client Number</th>
                    <th className="py-3 px-4">Contact Information</th>
                    <th className="py-3 px-4">KRA PIN / ID</th>
                    <th className="py-3 px-4">Account Type</th>
                    <th className="py-3 px-4">Vetting Status</th>
                    <th className="py-3 px-4">Registered</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {clients.map((client) => (
                    <tr key={client.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs">
                            {client.clientType === "BUSINESS" ? (
                              <Building className="size-4 text-amber-600" />
                            ) : (
                              <User className="size-4 text-slate-700" />
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-xs text-slate-900 block group-hover:text-amber-700 transition-colors">
                              {client.fullName || client.businessName || "Client"}
                            </span>
                            {client.businessName && client.businessName !== client.fullName && (
                              <span className="text-[10px] text-slate-400 font-medium">{client.businessName}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs font-bold text-slate-800">
                        {client.clientNumber || "—"}
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-0.5 text-xs">
                          <span className="text-slate-900 font-medium block">{client.email}</span>
                          <span className="text-slate-400 font-mono text-[10px]">{client.phone}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-800 font-semibold">
                        {client.kraPin || client.idNumber || "—"}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                          client.clientType === "BUSINESS"
                            ? "bg-amber-50 text-amber-800 border-amber-200/80"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}>
                          {client.clientType}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          {client.isReviewed ? (
                            <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                              <CheckCircle2 className="mr-1 size-3 text-emerald-600" />
                              Vetted
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                              <Clock className="mr-1 size-3 text-amber-600" />
                              Pending Review
                            </span>
                          )}
                          {client.isDuplicateFlagged && (
                            <span className="inline-flex items-center text-[9px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-200">
                              <AlertTriangle className="mr-1 size-2.5 text-rose-600" />
                              Duplicate
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500 font-medium">
                        {client.createdAt ? formatDate(client.createdAt) : "—"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link href={`/admin/clients/${client.id}`}>
                          <button className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors bg-amber-50 hover:bg-amber-100/80 px-2.5 py-1 rounded-lg border border-amber-200/60">
                            <span>Client 360</span>
                            <ChevronRight className="size-3.5" />
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PAGINATION FOOTER */}
            {pagination && pagination.totalPages > 1 && (
              <div className="px-4 py-3 bg-slate-50/60 border-t border-slate-200/80 flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>
                  Page {pagination.page} of {pagination.totalPages} ({pagination.total} total clients)
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

      {/* REGISTER NEW CLIENT MODAL */}
      <Modal
        isOpen={isNewClientModalOpen}
        onClose={() => setIsNewClientModalOpen(false)}
        title="Register New Client Entity"
        description="Add a verified citizen or corporate profile directly to the Swift Doc directory."
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsNewClientModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="gold"
              size="sm"
              isLoading={createClientMutation.isPending}
              disabled={!fullName || !email || !phone}
              onClick={() =>
                createClientMutation.mutate({
                  fullName,
                  email,
                  phone,
                  clientType,
                  kraPin: kraPin || undefined,
                  idNumber: idNumber || undefined,
                  businessName: businessName || undefined,
                  address: address || undefined,
                })
              }
            >
              Register Entity
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormField label="Client Account Type" required>
            <Select
              value={clientType}
              onChange={(e) => setClientType(e.target.value as any)}
              options={[
                { value: "INDIVIDUAL", label: "Individual Citizen / Resident" },
                { value: "BUSINESS", label: "Corporate Entity / Company" },
              ]}
            />
          </FormField>

          <FormField label="Full Legal Name" required>
            <Input
              placeholder="e.g. John Kamau Mwangi or Safaricom Limited"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Email Address" required>
              <Input
                type="email"
                placeholder="client@domain.co.ke"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </FormField>

            <FormField label="Phone (+254)" required>
              <Input
                placeholder="+254712345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="KRA PIN Number">
              <Input
                placeholder="A012345678Z"
                value={kraPin}
                onChange={(e) => setKraPin(e.target.value)}
              />
            </FormField>

            <FormField label={clientType === "BUSINESS" ? "Registration Number" : "National ID / Passport"}>
              <Input
                placeholder={clientType === "BUSINESS" ? "PVT-XXXXXX" : "12345678"}
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
              />
            </FormField>
          </div>

          <FormField label="Physical / Postal Address">
            <Input
              placeholder="e.g. P.O. Box 40200 Nairobi, Westlands"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
