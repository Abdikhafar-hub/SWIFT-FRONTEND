/**
 * Swift Doc Document & Cloudinary Storage Domain Types
 */

import type { User } from "./auth";

export type DocumentStatus =
  | "UPLOADED"
  | "PENDING_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "REPLACED"
  | "ARCHIVED";

export interface DocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  storageProvider: "CLOUDINARY" | "MOCK";
  storageKey: string;
  secureUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileExtension: string;
  checksum?: string | null;
  uploadedById?: string | null;
  reviewedById?: string | null;
  reviewedAt?: string | null;
  reviewNotes?: string | null;
  createdAt: string;
  uploadedBy?: User | null;
  reviewedBy?: User | null;
}

export interface Document {
  id: string;
  organizationId?: string;
  clientId: string;
  applicationId?: string | null;
  applicationRequirementId?: string | null;
  documentType: string;
  title: string;
  currentVersionId?: string | null;
  status: DocumentStatus;
  isArchived: boolean;
  expiresAt?: string | null;
  isExpired: boolean;
  documentNumber?: string | null;
  issuingAuthority?: string | null;
  issuedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  reviewNotes?: string | null;
  rejectionReason?: string | null;
  client?: any;
  application?: any;
  requirement?: any;
  versions?: DocumentVersion[];
  currentVersion?: DocumentVersion;
}

export interface UploadDocumentPayload {
  clientId?: string;
  applicationId?: string;
  applicationRequirementId?: string;
  documentType: string;
  title: string;
  fileName?: string;
  mimeType?: string;
  base64Data?: string;
  file?: File;
  expiresAt?: string | null;
  documentNumber?: string | null;
  issuingAuthority?: string | null;
  issuedAt?: string | null;
}


export interface ReviewDocumentPayload {
  status: "APPROVED" | "REJECTED";
  reviewNotes?: string;
  rejectionReason?: string;
  requestReplacement?: boolean;
  replacementDeadline?: string;
}
