"use client";

import React from "react";
import { Timeline, type TimelineItem } from "@/components/ui/table-primitives";
import { formatDateTime } from "@/lib/utils/format";
import type { ApplicationActivity } from "@/types";

export function ApplicationTimelineView({
  activities,
  className,
}: {
  activities: ApplicationActivity[];
  className?: string;
}) {
  const items: TimelineItem[] = activities.map((act) => ({
    id: act.id,
    title: act.action.replace(/_/g, " "),
    description: act.message,
    timestamp: formatDateTime(act.createdAt),
    status: act.toStatus === "APPROVED" || act.toStatus === "CLOSED" ? "completed" : "active",
  }));

  if (items.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic">No historical activities recorded yet.</p>
    );
  }

  return <Timeline items={items} className={className} />;
}
