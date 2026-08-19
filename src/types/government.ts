/**
 * Swift Doc Government Application & Submission Tracking Types
 * eCitizen, BRS, iTax, TIMS, Immigration, DCI, MFA
 */

import type { User } from "./auth";

export type GovernmentStatus =
  | "NOT_STARTED"
  | "PREPARING"
  | "READY_TO_SUBMIT"
  | "SUBMITTED"
  | "UNDER_PROCESSING"
  | "IN_REVIEW"
  | "ACTION_REQUIRED"
  | "ADDITIONAL_INFORMATION_REQUIRED"
  | "QUERY_RAISED"
  | "ACKNOWLEDGED"
  | "RESUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "COMPLETED"
  | "CANCELLED"
  | "UNKNOWN";

export interface GovernmentReference {
  id: string;
  governmentApplicationId: string;
  referenceType: string;
  referenceValue: string;
  issuingPlatform?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface GovernmentStatusHistory {
  id: string;
  governmentApplicationId: string;
  fromStatus?: GovernmentStatus | null;
  toStatus: GovernmentStatus;
  statusDescription?: string | null;
  notes?: string | null;
  changedById?: string | null;
  source: string;
  externalReference?: string | null;
  createdAt: string;
}

export interface GovernmentApplication {
  id: string;
  applicationId: string;
  platform: string;
  governmentAgency: string;
  governmentService?: string | null;
  externalReference?: string | null;
  trackingNumber?: string | null;
  submittedAt?: string | null;
  submittedByAdminId?: string | null;
  status: GovernmentStatus;
  statusDescription?: string | null;
  lastCheckedAt?: string | null;
  nextFollowUpDate?: string | null;
  followUpDate?: string | null;
  expectedCompletionAt?: string | null;
  approvalDate?: string | null;
  completionDate?: string | null;
  completedAt?: string | null;
  rejectionReason?: string | null;
  rejectedAt?: string | null;
  additionalInformationRequired: boolean;
  additionalInformationRequestedAt?: string | null;
  additionalInformationDeadline?: string | null;
  portalUrl?: string | null;
  evidenceDocumentUrl?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
  agencyName?: string | null;
  referenceNumber?: string | null;
  createdAt: string;
  updatedAt: string;

  application?: any;
  submittedByAdmin?: User | null;
  references?: GovernmentReference[];
  statusHistory?: GovernmentStatusHistory[];
}

export interface UpdateGovernmentStatusPayload {
  status: GovernmentStatus;
  externalReference?: string;
  trackingNumber?: string;
  statusDescription?: string;
  notes?: string;
  remarks?: string;
  queryDetails?: string;
  queryResponse?: string;
  nextFollowUpDate?: string;
  followUpDate?: string;
  evidenceDocumentUrl?: string;
}
