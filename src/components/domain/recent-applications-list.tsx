"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, FileText } from "lucide-react";
import { ApplicationStatusBadge } from "./status-badges";
import { formatDate } from "@/lib/utils/format";
import type { Application } from "@/types";

export function RecentApplicationsList({
  applications,
  baseHref = "/client/applications",
}: {
  applications: Application[];
  baseHref?: string;
}) {
  if (applications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-border rounded-xs">
        <FileText className="size-8 text-muted-foreground/60 mb-2" />
        <p className="text-sm font-semibold text-foreground">No active applications</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Start a new statutory application to begin tracking.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/60 rounded-xs border border-border bg-card">
      {applications.map((app) => (
        <Link
          key={app.id}
          href={`${baseHref}/${app.id}`}
          className="flex items-center justify-between p-4 transition-colors hover:bg-muted/40 group"
        >
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xs bg-muted text-muted-foreground group-hover:bg-gold/15 group-hover:text-gold transition-colors">
              <FileText className="size-4" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-display text-sm font-bold text-foreground">
                  {app.service?.name || "Statutory Application"}
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  #{app.applicationNumber}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                Initiated on {formatDate(app.createdAt)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ApplicationStatusBadge status={app.status} size="sm" />
            <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
          </div>
        </Link>
      ))}
    </div>
  );
}
