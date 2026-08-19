import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  APPLICATION_STATUS_CONFIG,
  REQUIREMENT_STATUS_CONFIG,
  DOCUMENT_STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
  GOVERNMENT_STATUS_CONFIG,
  SLA_STATUS_CONFIG,
  PRIORITY_CONFIG,
} from "@/lib/constants/status";
import type {
  ApplicationStatus,
  RequirementStatus,
  DocumentStatus,
  PaymentStatus,
  GovernmentStatus,
  SlaStatus,
  ApplicationPriority,
} from "@/types";

export function ApplicationStatusBadge({
  status,
  size = "md",
  className,
}: {
  status: ApplicationStatus;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const meta = APPLICATION_STATUS_CONFIG[status] || {
    label: status,
    tone: "neutral" as const,
  };

  return (
    <Badge tone={meta.tone} size={size} dot className={className}>
      {meta.label}
    </Badge>
  );
}

export function RequirementStatusBadge({
  status,
  size = "md",
  className,
}: {
  status: RequirementStatus;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const meta = REQUIREMENT_STATUS_CONFIG[status] || {
    label: status,
    tone: "neutral" as const,
  };

  return (
    <Badge tone={meta.tone} size={size} dot className={className}>
      {meta.label}
    </Badge>
  );
}

export function DocumentStatusBadge({
  status,
  size = "md",
  className,
}: {
  status: DocumentStatus;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const meta = DOCUMENT_STATUS_CONFIG[status] || {
    label: status,
    tone: "neutral" as const,
  };

  return (
    <Badge tone={meta.tone} size={size} dot className={className}>
      {meta.label}
    </Badge>
  );
}

export function PaymentStatusBadge({
  status,
  size = "md",
  className,
}: {
  status: PaymentStatus;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const meta = PAYMENT_STATUS_CONFIG[status] || {
    label: status,
    tone: "neutral" as const,
  };

  return (
    <Badge tone={meta.tone} size={size} dot className={className}>
      {meta.label}
    </Badge>
  );
}

export function GovernmentStatusBadge({
  status,
  size = "md",
  className,
}: {
  status: GovernmentStatus;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const meta = GOVERNMENT_STATUS_CONFIG[status] || {
    label: status,
    tone: "neutral" as const,
  };

  return (
    <Badge tone={meta.tone} size={size} dot className={className}>
      {meta.label}
    </Badge>
  );
}

export function SlaIndicator({
  status,
  size = "md",
  className,
}: {
  status: SlaStatus;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const meta = SLA_STATUS_CONFIG[status] || {
    label: status,
    tone: "neutral" as const,
  };

  return (
    <Badge tone={meta.tone} size={size} dot className={className}>
      {meta.label}
    </Badge>
  );
}

export function PriorityBadge({
  priority,
  size = "md",
  className,
}: {
  priority: ApplicationPriority;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const meta = PRIORITY_CONFIG[priority] || {
    label: priority,
    tone: "neutral" as const,
  };

  return (
    <Badge tone={meta.tone} size={size} className={className}>
      {meta.label}
    </Badge>
  );
}

export const StatusBadge = ApplicationStatusBadge;
export const SlaBadge = SlaIndicator;

