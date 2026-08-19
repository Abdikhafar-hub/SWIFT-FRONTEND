/**
 * Swift Doc Application Requirements Domain Types
 */

import type { UserRole } from "./auth";
import type { Document } from "./document";

export type RequirementType =
  | "DOCUMENT"
  | "TEXT"
  | "NUMBER"
  | "DATE"
  | "BOOLEAN"
  | "SELECT"
  | "MULTI_SELECT";

export type RequirementStatus =
  | "PENDING"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "CORRECTION_REQUIRED";

export interface RequirementReviewHistory {
  id: string;
  applicationRequirementId: string;
  actorId?: string | null;
  actorRole?: UserRole | null;
  action: string;
  previousValue?: unknown;
  newValue?: unknown;
  status: RequirementStatus;
  reason?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface ApplicationRequirement {
  id: string;
  applicationId: string;
  serviceRequirementId?: string | null;
  code: string;
  name: string;
  description?: string | null;
  type: RequirementType;
  required: boolean;
  displayOrder: number;
  isSatisfied: boolean;
  status: RequirementStatus;
  valueText?: string | null;
  valueNumber?: number | string | null;
  valueDate?: string | null;
  valueBoolean?: boolean | null;
  valueJson?: unknown;
  rejectionReason?: string | null;
  reviewNotes?: string | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  reviewedById?: string | null;
  satisfiedAt?: string | null;
  satisfiedById?: string | null;
  verifiedAt?: string | null;
  verifiedById?: string | null;
  notes?: string | null;
  requirementKey?: string;
  documentName?: string;
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  uploadedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  documents?: Document[];
  reviewHistory?: RequirementReviewHistory[];
}

export interface SubmitRequirementPayload {
  valueText?: string;
  valueNumber?: number;
  valueDate?: string;
  valueBoolean?: boolean;
  valueJson?: unknown;
  documentId?: string;
}

export interface ReviewRequirementPayload {
  action?: "APPROVE" | "REJECT" | "REQUEST_CORRECTION";
  status?: RequirementStatus;
  reason?: string;
  rejectionReason?: string;
  reviewNotes?: string;
  notes?: string;
}
