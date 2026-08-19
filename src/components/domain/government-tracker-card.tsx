"use client";

import React, { useState } from "react";
import {
  Building2,
  Copy,
  Check,
  Clock,
  Calendar,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  History,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { GovernmentStatusBadge } from "./status-badges";
import { Button } from "@/components/ui/button";
import type { GovernmentApplication, GovernmentStatus } from "@/types";

interface GovernmentTrackerCardProps {
  governmentApp: GovernmentApplication;
  className?: string;
}

const MILESTONES: { status: GovernmentStatus; label: string; desc: string }[] = [
  {
    status: "PREPARING",
    label: "Dossier Preparation",
    desc: "Application packaged & verified for statutory filing",
  },
  {
    status: "SUBMITTED",
    label: "Official Submission",
    desc: "Transmitted to government registry portal",
  },
  {
    status: "UNDER_PROCESSING",
    label: "Registry Adjudication",
    desc: "Registrar / Officer reviewing filing",
  },
  {
    status: "APPROVED",
    label: "Statutory Approval",
    desc: "Certificate or clearance officially granted",
  },
];

function getMilestoneIndex(status: GovernmentStatus): number {
  switch (status) {
    case "NOT_STARTED":
      return 0;
    case "PREPARING":
    case "READY_TO_SUBMIT":
      return 1;
    case "SUBMITTED":
    case "ACKNOWLEDGED":
      return 2;
    case "UNDER_PROCESSING":
    case "RESUBMITTED":
    case "ACTION_REQUIRED":
    case "ADDITIONAL_INFORMATION_REQUIRED":
      return 3;
    case "APPROVED":
    case "COMPLETED":
      return 4;
    case "REJECTED":
    case "CANCELLED":
      return 3;
    default:
      return 1;
  }
}

export function GovernmentTrackerCard({ governmentApp, className }: GovernmentTrackerCardProps) {
  const [copied, setCopied] = useState(false);
  const [showFullHistory, setShowFullHistory] = useState(false);

  const activeIndex = getMilestoneIndex(governmentApp.status);

  const copyTracking = () => {
    const code = governmentApp.trackingNumber || governmentApp.externalReference || "";
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isCompleted = governmentApp.status === "APPROVED" || governmentApp.status === "COMPLETED";
  const isRejected = governmentApp.status === "REJECTED";

  return (
    <div
      className={cn(
        "rounded-sm border border-border bg-card p-5 sm:p-6 shadow-xs space-y-6",
        className
      )}
    >
      {/* Header Agency Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/70">
        <div className="flex items-center gap-3.5">
          <div className="flex size-11 items-center justify-center rounded-xs bg-gold/15 text-gold border border-gold/30">
            <Building2 className="size-6" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h3 className="font-display text-base font-bold text-foreground">
                {governmentApp.governmentAgency || governmentApp.platform || "Statutory Agency"}
              </h3>
              <GovernmentStatusBadge status={governmentApp.status} size="sm" />
            </div>
            <span className="text-xs text-muted-foreground">
              Portal: {governmentApp.platform} &bull; Service: {governmentApp.governmentService || "Statutory Registration"}
            </span>
          </div>
        </div>

        {/* External Reference Number */}
        {(governmentApp.externalReference || governmentApp.trackingNumber) && (
          <div className="flex items-center gap-2 self-start sm:self-auto rounded-xs border border-border bg-muted/30 px-3 py-1.5">
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Official Tracking #
              </span>
              <span className="font-mono text-xs font-bold text-foreground">
                {governmentApp.trackingNumber || governmentApp.externalReference}
              </span>
            </div>
            <button
              onClick={copyTracking}
              className="p-1 rounded-xs hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Copy Reference"
              aria-label="Copy tracking code"
            >
              {copied ? (
                <Check className="size-3.5 text-emerald-500" />
              ) : (
                <Copy className="size-3.5" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Visual Step Progress Milestones */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
          <span>STATUTORY SUBMISSION PROGRESS</span>
          <span>{Math.min(100, Math.round((activeIndex / 4) * 100))}% COMPLETED</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-4 relative">
          {MILESTONES.map((milestone, idx) => {
            const stepNum = idx + 1;
            const isPassed = activeIndex >= stepNum;
            const isCurrent = activeIndex === stepNum - 1;

            return (
              <div
                key={milestone.status}
                className={cn(
                  "relative flex flex-col p-3 rounded-xs border transition-all duration-150",
                  isPassed
                    ? "border-emerald-500/40 bg-emerald-50/20 dark:bg-emerald-950/10"
                    : isCurrent
                    ? "border-gold bg-gold/5 shadow-xs"
                    : "border-border/60 bg-muted/10 opacity-70"
                )}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={cn(
                      "flex size-5 items-center justify-center rounded-full text-[10px] font-bold",
                      isPassed
                        ? "bg-emerald-500 text-white"
                        : isCurrent
                        ? "bg-gold text-ink"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {isPassed ? <Check className="size-3" /> : stepNum}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Step 0{stepNum}
                  </span>
                </div>
                <span className="text-xs font-bold text-foreground truncate">
                  {milestone.label}
                </span>
                <span className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                  {milestone.desc}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Agency Details & Status Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <div className="flex items-start gap-3 rounded-xs border border-border/80 bg-muted/20 p-3">
          <Clock className="size-4 text-gold mt-0.5 shrink-0" />
          <div className="flex flex-col text-xs">
            <span className="font-bold text-foreground">Official Submission Date</span>
            <span className="text-muted-foreground mt-0.5">
              {governmentApp.submittedAt
                ? new Date(governmentApp.submittedAt).toLocaleDateString("en-KE", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "Awaiting Dispatch"}
            </span>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xs border border-border/80 bg-muted/20 p-3">
          <Calendar className="size-4 text-gold mt-0.5 shrink-0" />
          <div className="flex flex-col text-xs">
            <span className="font-bold text-foreground">Expected Completion ETA</span>
            <span className="text-muted-foreground mt-0.5">
              {governmentApp.expectedCompletionAt
                ? new Date(governmentApp.expectedCompletionAt).toLocaleDateString("en-KE", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "Standard Statutory SLA (2-5 Days)"}
            </span>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xs border border-border/80 bg-muted/20 p-3">
          <ShieldCheck className="size-4 text-emerald-500 mt-0.5 shrink-0" />
          <div className="flex flex-col text-xs">
            <span className="font-bold text-foreground">Registry Verification</span>
            <span className="text-muted-foreground mt-0.5">
              {isCompleted ? "Verified & Granted" : "In Registry Channel"}
            </span>
          </div>
        </div>
      </div>

      {/* Official Status Description Banner */}
      {governmentApp.statusDescription && (
        <div className="rounded-xs border border-gold/30 bg-gold/10 p-3.5 text-xs text-foreground flex items-start gap-2.5">
          <ShieldCheck className="size-4 text-gold mt-0.5 shrink-0" />
          <div className="flex flex-col gap-0.5">
            <span className="font-bold text-gold-dark dark:text-gold">
              Government Filing Status Update:
            </span>
            <span className="text-muted-foreground leading-relaxed">
              {governmentApp.statusDescription}
            </span>
          </div>
        </div>
      )}

      {/* Rejection Alert */}
      {isRejected && governmentApp.rejectionReason && (
        <div className="rounded-xs border border-destructive/40 bg-destructive/10 p-3.5 text-xs text-destructive flex items-start gap-2.5">
          <AlertTriangle className="size-4 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5">
            <span className="font-bold">Agency Query / Rejection Reason:</span>
            <span>{governmentApp.rejectionReason}</span>
          </div>
        </div>
      )}

      {/* Evidence Document / Official Portal Link */}
      {(governmentApp.evidenceDocumentUrl || governmentApp.portalUrl) && (
        <div className="flex flex-wrap items-center gap-3 pt-2">
          {governmentApp.evidenceDocumentUrl && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-xs font-semibold"
              onClick={() => window.open(governmentApp.evidenceDocumentUrl!, "_blank")}
            >
              <ExternalLink className="size-3.5" />
              <span>View Official Filing Slip</span>
            </Button>
          )}
          {governmentApp.portalUrl && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => window.open(governmentApp.portalUrl!, "_blank")}
            >
              <ExternalLink className="size-3.5" />
              <span>Open Agency Portal</span>
            </Button>
          )}
        </div>
      )}

      {/* Expandable Status History */}
      {governmentApp.statusHistory && governmentApp.statusHistory.length > 0 && (
        <div className="border-t border-border/70 pt-4 space-y-3">
          <button
            type="button"
            onClick={() => setShowFullHistory(!showFullHistory)}
            className="flex items-center gap-2 text-xs font-bold text-foreground hover:text-gold transition-colors"
          >
            <History className="size-3.5 text-gold" />
            <span>Government Status History ({governmentApp.statusHistory.length})</span>
            <span className="text-[10px] text-muted-foreground font-normal">
              {showFullHistory ? "Hide timeline" : "Show timeline"}
            </span>
          </button>

          {showFullHistory && (
            <div className="space-y-3 pl-4 border-l-2 border-border/60 mt-2 max-h-60 overflow-y-auto">
              {governmentApp.statusHistory.map((history) => (
                <div key={history.id} className="relative text-xs space-y-1">
                  <div className="flex items-center gap-2">
                    <GovernmentStatusBadge status={history.toStatus} size="sm" />
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(history.createdAt).toLocaleString("en-KE")}
                    </span>
                  </div>
                  {history.statusDescription && (
                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                      {history.statusDescription}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
