"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Clock,
  Pause,
  Play,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  X,
  FileText,
  Calendar,
  User,
  Shield,
  Layers,
  Edit,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminApi } from "@/lib/api/admin";

interface AdminSlaDetailDrawerProps {
  applicationId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenPauseModal: (appId: string, appNum?: string, mode?: "PAUSE" | "RESUME") => void;
  onOpenEditModal: (app: any) => void;
}

export function AdminSlaDetailDrawer({
  applicationId,
  isOpen,
  onClose,
  onOpenPauseModal,
  onOpenEditModal,
}: AdminSlaDetailDrawerProps) {
  const queryClient = useQueryClient();

  const { data: detailData, isLoading, error } = useQuery({
    queryKey: ["admin-sla-detail", applicationId],
    queryFn: () => (applicationId ? adminApi.getSlaDetail(applicationId) : null),
    enabled: Boolean(isOpen && applicationId),
  });

  const recalculateMutation = useMutation({
    mutationFn: () => adminApi.recalculateSla(applicationId!, { reason: "Manual recalculation from detail drawer" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-sla-detail", applicationId] });
      queryClient.invalidateQueries({ queryKey: ["admin-sla-records"] });
      queryClient.invalidateQueries({ queryKey: ["admin-sla-metrics"] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: () => adminApi.completeSla(applicationId!, { reason: "Marked SLA completed from detail drawer" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-sla-detail", applicationId] });
      queryClient.invalidateQueries({ queryKey: ["admin-sla-records"] });
      queryClient.invalidateQueries({ queryKey: ["admin-sla-metrics"] });
    },
  });

  if (!isOpen || !applicationId) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end transition-opacity">
      <div className="w-full max-w-xl bg-card border-l border-border h-full shadow-2xl flex flex-col text-xs overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-gold" />
              <h3 className="font-bold text-foreground text-sm">
                SLA Dossier Details • #{detailData?.applicationNumber || applicationId.slice(0, 8)}
              </h3>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Comprehensive SLA breakdown, event timeline, pause metrics, and parameters audit.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground space-y-2">
              <RotateCw className="size-6 animate-spin mx-auto text-gold" />
              <p>Loading SLA dossier metrics...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xs bg-destructive/10 border border-destructive/30 text-destructive font-semibold">
              {(error as Error).message || "Failed to load SLA details"}
            </div>
          ) : detailData ? (
            <>
              {/* Summary KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                <div className="rounded-xs border border-border bg-muted/20 p-2.5 text-center">
                  <span className="text-[10px] text-muted-foreground uppercase font-medium">Target Standard</span>
                  <p className="text-sm font-bold text-foreground mt-0.5">{detailData.slaTargetHours || 48}h</p>
                </div>
                <div className="rounded-xs border border-border bg-muted/20 p-2.5 text-center">
                  <span className="text-[10px] text-muted-foreground uppercase font-medium">Active Processing</span>
                  <p className="text-sm font-bold text-foreground mt-0.5">{detailData.activeProcessingHours || 0}h</p>
                </div>
                <div className="rounded-xs border border-border bg-muted/20 p-2.5 text-center">
                  <span className="text-[10px] text-muted-foreground uppercase font-medium">Paused Duration</span>
                  <p className="text-sm font-bold text-amber-500 mt-0.5">{detailData.internalPausedHours || 0}h</p>
                </div>
                <div className="rounded-xs border border-border bg-muted/20 p-2.5 text-center">
                  <span className="text-[10px] text-muted-foreground uppercase font-medium">Total Elapsed</span>
                  <p className="text-sm font-bold text-foreground mt-0.5">{detailData.totalElapsedHours || 0}h</p>
                </div>
              </div>

              {/* SLA Details Card */}
              <div className="rounded-xs border border-border bg-muted/10 p-3 space-y-2">
                <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="size-3.5 text-gold" /> SLA Configuration
                </h4>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-muted-foreground">SLA State:</span>{" "}
                    <span className="font-semibold uppercase text-foreground">{detailData.slaStatus}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Clock Status:</span>{" "}
                    <span className={detailData.isPaused ? "font-bold text-amber-500" : "font-semibold text-emerald-500"}>
                      {detailData.isPaused ? "PAUSED" : "ACTIVE Countdown"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Started Date:</span>{" "}
                    <span>{new Date(detailData.startedAt).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Target Due Date:</span>{" "}
                    <span className="font-semibold text-gold">{detailData.dueAt ? new Date(detailData.dueAt).toLocaleString() : "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons Toolbar */}
              <div className="flex flex-wrap items-center gap-2 pt-1 pb-1">
                {detailData.isPaused ? (
                  <Button
                    variant="gold"
                    size="sm"
                    leftIcon={<Play className="size-3.5" />}
                    onClick={() => onOpenPauseModal(detailData.applicationId, detailData.applicationNumber, "RESUME")}
                  >
                    Resume SLA
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-amber-500/40 text-amber-500 hover:bg-amber-500/10"
                    leftIcon={<Pause className="size-3.5" />}
                    onClick={() => onOpenPauseModal(detailData.applicationId, detailData.applicationNumber, "PAUSE")}
                  >
                    Pause SLA
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Edit className="size-3.5" />}
                  onClick={() => onOpenEditModal(detailData)}
                >
                  Edit Parameters
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<RotateCw className={`size-3.5 ${recalculateMutation.isPending ? "animate-spin" : ""}`} />}
                  isLoading={recalculateMutation.isPending}
                  onClick={() => recalculateMutation.mutate()}
                >
                  Recalculate
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-emerald-500 hover:bg-emerald-500/10 ml-auto"
                  leftIcon={<CheckCircle2 className="size-3.5" />}
                  isLoading={completeMutation.isPending}
                  onClick={() => completeMutation.mutate()}
                >
                  Mark Complete
                </Button>
              </div>

              {/* SLA Event Timeline */}
              <div className="space-y-3 border-t border-border pt-3">
                <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <History className="size-3.5 text-gold" /> Statutory SLA Audit Timeline
                </h4>

                {!detailData.events || detailData.events.length === 0 ? (
                  <p className="text-muted-foreground italic py-3 text-center">No SLA timeline events recorded yet.</p>
                ) : (
                  <div className="space-y-2.5">
                    {detailData.events.map((evt: any) => (
                      <div key={evt.id} className="rounded-xs border border-border p-2.5 bg-muted/5 flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground text-xs uppercase tracking-wide">
                              {evt.eventType}
                            </span>
                            <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-xs font-mono text-muted-foreground">
                              {evt.category}
                            </span>
                          </div>
                          {evt.reason && <p className="text-muted-foreground text-[11px]">{evt.reason}</p>}
                        </div>
                        <div className="text-right text-[10px] text-muted-foreground whitespace-nowrap">
                          {new Date(evt.startedAt).toLocaleString()}
                          {evt.durationMinutes > 0 && (
                            <div className="text-amber-500 font-mono mt-0.5">{evt.durationMinutes} mins</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
