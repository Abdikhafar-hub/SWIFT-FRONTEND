/**
 * Swift Doc Immutable Audit Log & Ops Domain Types
 * Strictly available to ADMIN roles only
 */

import type { UserRole, User } from "./auth";

export interface AuditLog {
  id: string;
  organizationId?: string;
  actorId?: string | null;
  actorName?: string | null;
  actorEmail?: string | null;
  actorRole?: UserRole | null;
  action: string;
  actionCategory?: string | null;
  description?: string | null;
  resource?: string | null;
  resourceId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  entityReference?: string | null;
  previousValue?: Record<string, unknown> | unknown | null;
  newValue?: Record<string, unknown> | unknown | null;
  status?: "SUCCESS" | "FAILURE" | "WARNING" | "INFO" | string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface AuditSummaryMetrics {
  totalEvents: number;
  eventsToday: number;
  successCount: number;
  failureCount: number;
  activeUsersToday: number;
  loginEventsToday: number;
}

export type QCResult = "PASSED" | "FAILED";

export interface QualityCheckChecklist {
  clientMatch?: boolean;
  documentsLegible?: boolean;
  correctService?: boolean;
  requiredPagesPresent?: boolean;
  govDocVerified?: boolean;
  [key: string]: boolean | undefined;
}

export interface QualityCheck {
  id: string;
  organizationId?: string;
  applicationId: string;
  reviewerId: string;
  result: QCResult;
  status?: string;
  verifiedAt?: string;
  checklist?: QualityCheckChecklist | null;
  notes?: string | null;
  failedReason?: string | null;
  createdAt: string;
  reviewer?: User;
  reviewerName?: string;
  application?: any;
}

export type DeliveryMethod = "DIGITAL" | "PHYSICAL" | "BOTH";

export interface ApplicationDelivery {
  id: string;
  organizationId?: string;
  applicationId: string;
  deliveryMethod: DeliveryMethod | string;
  recipientName: string;
  recipientPhone: string;
  recipientEmail?: string | null;
  physicalAddress?: string | null;
  deliveryAddress?: string | null;
  dispatchReference?: string | null;
  trackingNumber?: string | null;
  carrier?: string | null;
  courierName?: string | null;
  deliveredAt?: string | null;
  dispatchedAt?: string | null;
  deliveredById?: string | null;
  confirmationStatus?: "PENDING" | "DISPATCHED" | "CONFIRMED";
  status?: string;
  proofDocumentUrl?: string | null;
  evidenceUrl?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt?: string;
  deliveredBy?: User | null;
  application?: any;
}
