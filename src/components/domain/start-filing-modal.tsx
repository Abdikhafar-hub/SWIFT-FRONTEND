"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Clock,
  ShieldCheck,
  ArrowRight,
  X,
  AlertCircle,
  Sparkles,
  Check,
} from "lucide-react";
import { applicationsApi } from "@/lib/api/applications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatKES } from "@/lib/utils/format";
import type { Service } from "@/types";

interface StartFilingModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service | null;
}

export function StartFilingModal({ isOpen, onClose, service }: StartFilingModalProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [notesSummary, setNotesSummary] = useState("");
  const [proposedName1, setProposedName1] = useState("");
  const [proposedName2, setProposedName2] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isBusinessIncorporation =
    service?.category?.slug === "business-registration" ||
    service?.code?.toLowerCase().includes("incorporation") ||
    service?.name?.toLowerCase().includes("company") ||
    service?.name?.toLowerCase().includes("business");

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!service) throw new Error("No statutory service selected");
      setErrorMessage(null);

      const metadata: Record<string, unknown> = {};
      if (proposedName1) metadata.proposedName1 = proposedName1.trim();
      if (proposedName2) metadata.proposedName2 = proposedName2.trim();

      const newApp = await applicationsApi.createApplication({
        serviceId: service.id,
        notesSummary: notesSummary.trim() || undefined,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      });

      return newApp;
    },
    onSuccess: (newApp) => {
      queryClient.invalidateQueries({ queryKey: ["client-applications"] });
      queryClient.invalidateQueries({ queryKey: ["client-dashboard-overview"] });
      onClose();
      router.push(`/client/applications/${newApp.id}`);
    },
    onError: (err: any) => {
      setErrorMessage(err.message || "Failed to initiate filing application.");
    },
  });

  if (!isOpen || !service) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-sm border border-border bg-card shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/70 px-6 py-4 bg-muted/40">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-xs bg-gold/20 text-gold-dark dark:text-gold font-bold">
              <Sparkles className="size-4" />
            </div>
            <div>
              <h3 className="font-display text-sm font-bold text-foreground">
                Initiate Statutory Filing
              </h3>
              <p className="text-[10px] text-muted-foreground">
                Official Kenya Registry Application
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Close modal"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Service Summary Highlight Box */}
          <div className="rounded-xs border border-gold/30 bg-gold/5 p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gold-dark dark:text-gold">
                  {service.category?.name || "Statutory Service"}
                </span>
                <h4 className="font-display text-base font-bold text-foreground">
                  {service.name}
                </h4>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  Total Filing Fee
                </span>
                <span className="font-mono text-base font-extrabold text-foreground">
                  {formatKES(
                    service.totalFee ||
                      service.basePrice ||
                      Number(service.governmentFee || 0) + Number(service.serviceFee || 0)
                  )}
                </span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed pt-1">
              {service.description}
            </p>

            <div className="flex items-center gap-4 pt-2 border-t border-gold/20 text-xs text-muted-foreground font-semibold">
              <span className="flex items-center gap-1.5">
                <Clock className="size-3.5 text-gold" />
                Est. SLA: {service.slaHours ? `${service.slaHours} Hours` : "2-4 Business Days"}
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-emerald-500" />
                Official Registrar Submission
              </span>
            </div>
          </div>

          {/* Business Name Proposals (if incorporation) */}
          {isBusinessIncorporation && (
            <div className="space-y-3 rounded-xs border border-border bg-muted/20 p-3.5">
              <span className="block text-xs font-bold text-foreground">
                Proposed Company / Business Names (Order of Preference)
              </span>
              <div className="space-y-2">
                <Input
                  value={proposedName1}
                  onChange={(e) => setProposedName1(e.target.value)}
                  placeholder="Primary Choice (e.g. Acme East Africa Limited)"
                  className="text-xs"
                />
                <Input
                  value={proposedName2}
                  onChange={(e) => setProposedName2(e.target.value)}
                  placeholder="Alternative Choice (Optional)"
                  className="text-xs"
                />
              </div>
            </div>
          )}

          {/* Initial Client Notes */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-foreground">
              Initial Instructions or Specific Requirements (Optional)
            </label>
            <textarea
              value={notesSummary}
              onChange={(e) => setNotesSummary(e.target.value)}
              placeholder="Provide any specific details for our compliance officers..."
              rows={3}
              className="w-full rounded-xs border border-input bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>

          {errorMessage && (
            <div className="flex items-start gap-2 rounded-xs border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={createMutation.isPending}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => createMutation.mutate()}
              isLoading={createMutation.isPending}
              className="bg-gold hover:bg-gold-light text-ink font-bold text-xs gap-1.5 shadow-xs"
            >
              <span>Create Application Dossier</span>
              <ArrowRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
