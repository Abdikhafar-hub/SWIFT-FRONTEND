"use client";

import React from "react";
import { Clock, AlertTriangle, CheckCircle2, PauseCircle, Timer } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SlaBadge } from "./status-badges";
import { formatDateTime } from "@/lib/utils/format";
import type { ApplicationSlaEvent, SlaStatus } from "@/types";

interface SlaTimelineViewProps {
  slaStatus: SlaStatus;
  startedAt?: string | null;
  dueAt?: string | null;
  completedAt?: string | null;
  pausedAt?: string | null;
  totalPausedDurationMinutes?: number;
  slaEvents?: ApplicationSlaEvent[];
  slaHours?: number;
  className?: string;
}

export function SlaTimelineView({
  slaStatus,
  startedAt,
  dueAt,
  completedAt,
  pausedAt,
  totalPausedDurationMinutes = 0,
  slaEvents = [],
  slaHours,
  className,
}: SlaTimelineViewProps) {
  const isPaused = Boolean(pausedAt) || slaStatus === "PAUSED";
  
  // Calculate display metrics
  const startedDate = startedAt ? new Date(startedAt) : null;
  const dueDate = dueAt ? new Date(dueAt) : null;
  const now = new Date();
  
  let remainingHours: number | null = null;
  if (dueDate && slaStatus !== "COMPLETED") {
    const diffMs = dueDate.getTime() - now.getTime();
    remainingHours = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
  }

  return (
    <div className={`space-y-6 ${className || ""}`}>
      {/* SLA Metric Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-muted/30 border-muted">
          <CardContent className="p-4 space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              SLA Operational State
            </p>
            <div className="flex items-center gap-2 pt-1">
              <SlaBadge status={isPaused ? "PAUSED" : slaStatus} />
              {isPaused && (
                <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                  <PauseCircle className="w-3.5 h-3.5" /> Paused
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/30 border-muted">
          <CardContent className="p-4 space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Target Commitment
            </p>
            <p className="text-lg font-bold text-slate-900 flex items-center gap-1.5 pt-0.5">
              <Timer className="w-4 h-4 text-slate-500" />
              {slaHours ? `${slaHours} Hours` : "72 Hours"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-muted/30 border-muted">
          <CardContent className="p-4 space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Target Completion Date
            </p>
            <p className="text-sm font-semibold text-slate-900 flex items-center gap-1.5 pt-1">
              <Clock className="w-4 h-4 text-slate-500" />
              {dueAt ? formatDateTime(dueAt) : "Calculated upon filing"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-muted/30 border-muted">
          <CardContent className="p-4 space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Client Pause Credit
            </p>
            <p className="text-sm font-semibold text-slate-900 flex items-center gap-1.5 pt-1">
              <PauseCircle className="w-4 h-4 text-amber-500" />
              {totalPausedDurationMinutes > 0
                ? `${Math.round(totalPausedDurationMinutes / 60)} hrs (${totalPausedDurationMinutes} mins)`
                : "No pause applied"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Paused Notice Banner */}
      {isPaused && (
        <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-start gap-3">
          <PauseCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-amber-950">
              SLA Clock Is Currently Paused
            </p>
            <p className="text-xs text-amber-800">
              The statutory processing clock is paused while awaiting client action or government external processing. Once the required item is resolved, SLA countdown will resume automatically.
            </p>
          </div>
        </div>
      )}

      {/* SLA History Timeline */}
      <Card>
        <CardHeader className="pb-3 border-b border-border/50">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            SLA Operational Timeline & Event Log
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {slaEvents.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-2">
              Standard processing timeline active. Detailed SLA state transitions will be recorded as processing progresses.
            </p>
          ) : (
            <div className="relative border-l border-slate-200 ml-3 space-y-6 py-2">
              {slaEvents.map((evt) => (
                <div key={evt.id} className="relative pl-6">
                  <span
                    className={`absolute -left-2 top-1 w-4 h-4 rounded-full border-2 border-white ${
                      evt.category === "CLIENT_WAITING"
                        ? "bg-amber-500"
                        : evt.category === "GOVERNMENT_WAITING"
                        ? "bg-blue-500"
                        : "bg-emerald-500"
                    }`}
                  />
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <p className="text-xs font-semibold text-slate-900">
                      {evt.eventType.replace(/_/g, " ")} ({evt.category.replace(/_/g, " ")})
                    </p>
                    <span className="text-[11px] text-muted-foreground">
                      {formatDateTime(evt.startedAt)}
                    </span>
                  </div>
                  {evt.reason && (
                    <p className="text-xs text-slate-600 mt-1">{evt.reason}</p>
                  )}
                  {evt.durationMinutes > 0 && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Duration: {evt.durationMinutes} minutes
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
