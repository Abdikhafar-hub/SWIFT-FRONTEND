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
    <PageShell
      eyebrow="CLIENT REGISTRY"
      title="Verified Client Entities & Profiles"
      description="360-degree management of Kenyan citizens, foreign investors, businesses, and institutional accounts."
      actions={
        <div className="flex items-center gap-2">
          <Link href="/admin/registrations">
            <Button variant="outline" size="sm" leftIcon={<UserPlus className="size-4 text-amber-500" />}>
              New Registrations Queue
            </Button>
          </Link>
          <Button
            variant="gold"
            size="sm"
            leftIcon={<Plus className="size-4" />}
            onClick={() => setIsNewClientModalOpen(true)}
          >
            Register Client Entity
          </Button>
        </div>
      }
    >
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
            className="w-44 text-xs"
            options={[
              { value: "all", label: "All Review Statuses" },
              { value: "true", label: "Reviewed & Vetted" },
              { value: "false", label: "Pending Review" },
            ]}
          />

          <Select
            value={clientTypeFilter}
            onChange={(e) => {
              setClientTypeFilter(e.target.value);
              setPage(1);
            }}
            className="w-44 text-xs"
            options={[
              { value: "", label: "All Client Types" },
              { value: "INDIVIDUAL", label: "Individual Citizens" },
              { value: "BUSINESS", label: "Corporate Entities" },
              { value: "ORGANIZATION", label: "Organizations" },
            ]}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : error ? (
        <ErrorState onRetry={() => refetch()} />
      ) : clients.length === 0 ? (
        <EmptyState
          icon={<Users className="size-7" />}
          title="No clients found"
          description="No registered client accounts matched your search criteria."
        />
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client Entity</TableHead>
                <TableHead>Client Number</TableHead>
                <TableHead>Contact Information</TableHead>
                <TableHead>KRA PIN / ID</TableHead>
                <TableHead>Account Type</TableHead>
                <TableHead>Vetting Status</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground font-bold text-xs">
                        {client.clientType === "BUSINESS" ? (
                          <Building className="size-4 text-gold" />
                        ) : (
                          <User className="size-4 text-navy dark:text-gold" />
                        )}
                      </div>
                      <div>
                        <span className="font-bold text-xs text-foreground block">
                          {client.fullName || client.businessName || "Client"}
                        </span>
                        {client.businessName && client.businessName !== client.fullName && (
                          <span className="text-[11px] text-muted-foreground">{client.businessName}</span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs font-semibold text-muted-foreground">
                    {client.clientNumber || "—"}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5 text-xs">
                      <span className="text-foreground block">{client.email}</span>
                      <span className="text-muted-foreground font-mono text-[11px]">{client.phone}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-foreground">
                    {client.kraPin || client.idNumber || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge tone={client.clientType === "BUSINESS" ? "gold" : "neutral"} size="sm">
                      {client.clientType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 items-start">
                      {client.isReviewed ? (
                        <Badge tone="success" size="sm" className="text-[10px]">
                          <CheckCircle2 className="mr-1 size-3" />
                          Vetted
                        </Badge>
                      ) : (
                        <Badge tone="warning" size="sm" className="text-[10px]">
                          <Clock className="mr-1 size-3" />
                          Pending Review
                        </Badge>
                      )}
                      {client.isDuplicateFlagged && (
                        <Badge tone="destructive" size="sm" className="text-[9px] py-0 px-1">
                          <AlertTriangle className="mr-1 size-2.5" />
                          Duplicate
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {client.createdAt ? formatDate(client.createdAt) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/clients/${client.id}`}>
                      <Button variant="gold" size="xs" rightIcon={<ChevronRight className="size-3.5" />}>
                        Client 360
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
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
    </PageShell>
  );
}
