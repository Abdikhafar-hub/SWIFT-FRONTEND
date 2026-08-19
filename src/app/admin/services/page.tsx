"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Edit3, CheckCircle2, Sliders, Shield, Clock } from "lucide-react";
import { PageShell } from "@/components/ui/layout-primitives";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table-primitives";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { FormField, Textarea } from "@/components/ui/form-primitives";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton, ErrorState, EmptyState } from "@/components/ui/feedback-primitives";
import { adminApi, type CreateServicePayload } from "@/lib/api/admin";
import { formatCurrency } from "@/lib/utils/format";
import type { Service } from "@/types";

export default function AdminServicesPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [governmentFee, setGovernmentFee] = useState<number>(0);
  const [serviceFee, setServiceFee] = useState<number>(1500);
  const [slaHours, setSlaHours] = useState<number>(24);
  const [active, setActive] = useState<boolean>(true);

  const { data: services = [], isLoading, error, refetch } = useQuery({
    queryKey: ["admin-services"],
    queryFn: () => adminApi.getServices(),
  });

  const saveMutation = useMutation({
    mutationFn: (payload: CreateServicePayload) => {
      if (editingService) {
        return adminApi.updateService(editingService.id, payload);
      }
      return adminApi.createService(payload);
    },
    onSuccess: () => {
      setIsModalOpen(false);
      setEditingService(null);
      setName("");
      setDescription("");
      setGovernmentFee(0);
      setServiceFee(1500);
      setSlaHours(24);
      setActive(true);
      queryClient.invalidateQueries({ queryKey: ["admin-services"] });
    },
  });

  const handleOpenEdit = (svc: Service) => {
    setEditingService(svc);
    setName(svc.name);
    setDescription(svc.description || "");
    setGovernmentFee(typeof svc.governmentFee === "number" ? svc.governmentFee : parseFloat(String(svc.governmentFee || 0)));
    setServiceFee(typeof svc.serviceFee === "number" ? svc.serviceFee : parseFloat(String(svc.serviceFee || 0)));
    setSlaHours(svc.slaHours || 24);
    setActive(svc.active ?? true);
    setIsModalOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingService(null);
    setName("");
    setDescription("");
    setGovernmentFee(0);
    setServiceFee(1500);
    setSlaHours(24);
    setActive(true);
    setIsModalOpen(true);
  };

  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.category?.name && s.category.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <PageShell
      eyebrow="STATUTORY CATALOG"
      title="Services & Fee Schedule Management"
      description="Configure official government gazette fees, Swift Doc service pricing, and SLA turnaround limits."
      actions={
        <Button
          variant="gold"
          size="sm"
          leftIcon={<Plus className="size-4" />}
          onClick={handleOpenCreate}
        >
          Add Statutory Service
        </Button>
      }
    >
      <div className="mb-6 max-w-md">
        <Input
          placeholder="Search statutory services catalog..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftAddon={<Search className="size-4" />}
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : error ? (
        <ErrorState onRetry={() => refetch()} />
      ) : filteredServices.length === 0 ? (
        <EmptyState
          title="No statutory services found"
          description="No services matched the search filter."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Statutory Service</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Government Fee</TableHead>
              <TableHead>Swift Doc Fee</TableHead>
              <TableHead>Total Fee (KES)</TableHead>
              <TableHead>Statutory SLA</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredServices.map((svc) => {
              const govFee = typeof svc.governmentFee === "number" ? svc.governmentFee : parseFloat(String(svc.governmentFee || 0));
              const sFee = typeof svc.serviceFee === "number" ? svc.serviceFee : parseFloat(String(svc.serviceFee || 0));
              const total = govFee + sFee;

              return (
                <TableRow key={svc.id}>
                  <TableCell>
                    <span className="font-bold text-foreground text-xs block">{svc.name}</span>
                    {svc.description && (
                      <p className="text-[11px] text-muted-foreground line-clamp-1 max-w-xs">{svc.description}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {svc.category?.name || "Statutory Filing"}
                  </TableCell>
                  <TableCell className="font-semibold text-xs text-foreground font-mono">
                    {formatCurrency(govFee, svc.currency)}
                  </TableCell>
                  <TableCell className="font-semibold text-xs text-gold-dark dark:text-gold font-mono">
                    {formatCurrency(sFee, svc.currency)}
                  </TableCell>
                  <TableCell className="font-bold text-xs text-foreground font-mono">
                    {formatCurrency(total, svc.currency)}
                  </TableCell>
                  <TableCell className="text-xs">
                    <span className="inline-flex items-center gap-1 font-semibold">
                      <Clock className="size-3 text-muted-foreground" />
                      {svc.slaHours || 24}h
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge tone={svc.active ? "success" : "neutral"} size="sm">
                      {svc.active ? "Active" : "Disabled"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="xs"
                      leftIcon={<Edit3 className="size-3.5" />}
                      onClick={() => handleOpenEdit(svc)}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {/* CREATE / EDIT SERVICE MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingService ? "Update Statutory Service" : "Add Statutory Service"}
        description="Configure gazette fees, professional charges, and target SLA turnaround."
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="gold"
              size="sm"
              isLoading={saveMutation.isPending}
              disabled={!name.trim()}
              onClick={() =>
                saveMutation.mutate({
                  name,
                  description: description || undefined,
                  governmentFee: Number(governmentFee),
                  serviceFee: Number(serviceFee),
                  slaHours: Number(slaHours),
                  active,
                })
              }
            >
              {editingService ? "Save Changes" : "Create Service"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormField label="Service Legal Title" required>
            <Input
              placeholder="e.g. Private Company Registration (BRS CR1)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </FormField>

          <FormField label="Statutory Scope / Description">
            <Textarea
              placeholder="Official statutory scope, gazetted requirements, and delivery expectations..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Official Government Fee (KES)" required>
              <Input
                type="number"
                min={0}
                value={governmentFee}
                onChange={(e) => setGovernmentFee(Number(e.target.value))}
              />
            </FormField>

            <FormField label="Swift Doc Service Fee (KES)" required>
              <Input
                type="number"
                min={0}
                value={serviceFee}
                onChange={(e) => setServiceFee(Number(e.target.value))}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Target SLA (Hours)" required>
              <Input
                type="number"
                min={1}
                value={slaHours}
                onChange={(e) => setSlaHours(Number(e.target.value))}
              />
            </FormField>

            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
                <Checkbox checked={active} onChange={() => setActive(!active)} />
                <span className="font-semibold text-foreground">Service is Active in Catalog</span>
              </label>
            </div>
          </div>
        </div>
      </Modal>
    </PageShell>
  );
}
