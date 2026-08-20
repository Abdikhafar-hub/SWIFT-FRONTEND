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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-4 sm:p-5 lg:p-6 space-y-4 max-w-[1550px] mx-auto font-sans">
      {/* ------------------------------------------------------------------ */}
      {/* 1. HEADER SECTION */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Services &amp; Fee Schedule Catalog
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Configure official government gazette fees, Swift Doc service pricing, and SLA turnaround limits.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="bg-gradient-to-r from-[#C5A059] to-[#D4AF37] hover:from-[#b49049] hover:to-[#c39e26] text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0 self-start sm:self-auto transform hover:-translate-y-0.5"
        >
          <Plus className="size-3.5 stroke-[3]" />
          <span>Add Statutory Service</span>
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. SEARCH BAR */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search statutory services catalog..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium text-slate-800 placeholder-slate-400"
          />
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
            <p className="text-xs font-bold text-rose-600">Failed to load services catalog.</p>
            <button
              onClick={() => refetch()}
              className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
            >
              Retry Loading
            </button>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <h3 className="text-sm font-bold text-slate-800">No statutory services found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No services matched the current search filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Statutory Service</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Government Fee</th>
                  <th className="py-3 px-4">Swift Doc Fee</th>
                  <th className="py-3 px-4">Total Fee (KES)</th>
                  <th className="py-3 px-4">Statutory SLA</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredServices.map((svc) => {
                  const govFee = typeof svc.governmentFee === "number" ? svc.governmentFee : parseFloat(String(svc.governmentFee || 0));
                  const sFee = typeof svc.serviceFee === "number" ? svc.serviceFee : parseFloat(String(svc.serviceFee || 0));
                  const total = govFee + sFee;

                  return (
                    <tr key={svc.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 text-xs block group-hover:text-amber-700 transition-colors">
                          {svc.name}
                        </span>
                        {svc.description && (
                          <p className="text-[10px] text-slate-400 font-medium line-clamp-1 max-w-xs">{svc.description}</p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs font-semibold text-slate-600">
                        {svc.category?.name || "Statutory Filing"}
                      </td>
                      <td className="py-3 px-4 font-semibold text-xs text-slate-900 font-mono">
                        {formatCurrency(govFee, svc.currency)}
                      </td>
                      <td className="py-3 px-4 font-bold text-xs text-amber-700 font-mono">
                        {formatCurrency(sFee, svc.currency)}
                      </td>
                      <td className="py-3 px-4 font-extrabold text-xs text-slate-900 font-mono">
                        {formatCurrency(total, svc.currency)}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                          <Clock className="size-3 text-slate-400" />
                          {svc.slaHours || 24}h
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                          svc.active
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                            : "bg-slate-100 text-slate-500 border-slate-200"
                        }`}>
                          {svc.active ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenEdit(svc)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200"
                        >
                          <Edit3 className="size-3.5 text-slate-500" />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
                <span className="font-semibold text-slate-800">Service is Active in Catalog</span>
              </label>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
