/**
 * Swift Doc Government Operations & Submission Management Types
 * Comprehensive Statutory Lifecycle (eCitizen, BRS, KRA, TIMS, Immigration, DCI, MFA)
 */

import type { User } from "./auth";

export type GovernmentStatus =
  | "NOT_STARTED"
  | "PREPARING"
  | "READY_TO_SUBMIT"
  | "READY_FOR_SUBMISSION"
  | "SUBMISSION_IN_PROGRESS"
  | "SUBMITTED"
  | "ACKNOWLEDGED"
  | "PAYMENT_REQUIRED"
  | "PAYMENT_PENDING"
  | "UNDER_PROCESSING"
  | "QUERY_RAISED"
  | "ADDITIONAL_INFORMATION_REQUIRED"
  | "CORRECTION_REQUIRED"
  | "APPOINTMENT_REQUIRED"
  | "INTERVIEW_REQUIRED"
  | "BIOMETRICS_REQUIRED"
  | "ON_HOLD"
  | "APPROVED"
  | "REJECTED"
  | "CERTIFICATE_READY"
  | "READY_FOR_COLLECTION"
  | "COLLECTED"
  | "CLOSED"
  | "WITHDRAWN"
  | "CANCELLED"
  | "UNKNOWN";

export type GovernmentSubmissionChannel =
  | "ONLINE_PORTAL"
  | "PHYSICAL_OFFICE"
  | "EMAIL"
  | "COURIER"
  | "MANUAL_COUNTER"
  | "THIRD_PARTY";

export type GovernmentQueryType =
  | "MISSING_DOCUMENT"
  | "INCORRECT_INFORMATION"
  | "PAYMENT_ISSUE"
  | "IDENTITY_VERIFICATION"
  | "ADDITIONAL_INFORMATION"
  | "CORRECTION_REQUIRED"
  | "APPOINTMENT_REQUIRED"
  | "TECHNICAL_PORTAL_ISSUE"
  | "OTHER";

export type GovernmentQuerySeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type GovernmentPaymentStatus =
  | "NOT_REQUIRED"
  | "REQUIRED"
  | "AWAITING_PAYMENT"
  | "PAID"
  | "FAILED"
  | "REFUNDED";

export type GovernmentAppointmentType =
  | "BIOMETRICS"
  | "PASSPORT_COLLECTION"
  | "VISA_INTERVIEW"
  | "GOVERNMENT_OFFICE_VISIT"
  | "DOCUMENT_COLLECTION"
  | "IDENTITY_VERIFICATION"
  | "OTHER";

export type GovernmentAppointmentStatus =
  | "SCHEDULED"
  | "ATTENDED"
  | "MISSED"
  | "RESCHEDULED"
  | "CANCELLED";

export type GovernmentFollowUpMethod =
  | "PORTAL"
  | "EMAIL"
  | "PHONE_CALL"
  | "PHYSICAL_VISIT"
  | "SMS"
  | "OFFICIAL_LETTER"
  | "CLIENT_COMMUNICATION"
  | "OTHER";

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

export interface GovernmentQuery {
  id: string;
  governmentApplicationId: string;
  queryType: GovernmentQueryType;
  severity: GovernmentQuerySeverity;
  referenceNumber?: string | null;
  receivedAt: string;
  responseDeadline?: string | null;
  description: string;
  internalNotes?: string | null;
  isResolved: boolean;
  resolvedAt?: string | null;
  resolvedById?: string | null;
  resolutionNotes?: string | null;
  clientActionId?: string | null;
  createdById?: string | null;
  createdAt: string;
  updatedAt: string;
  clientAction?: any;
  resolvedBy?: Partial<User> | null;
  createdBy?: Partial<User> | null;
}

export interface GovernmentAppointment {
  id: string;
  governmentApplicationId: string;
  appointmentType: GovernmentAppointmentType;
  authorityName: string;
  scheduledAt: string;
  location?: string | null;
  referenceNumber?: string | null;
  officerContact?: string | null;
  status: GovernmentAppointmentStatus;
  clientInstructions?: string | null;
  requiredDocuments: string[];
  isClientVisible: boolean;
  createdById?: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: Partial<User> | null;
}

export interface GovernmentPayment {
  id: string;
  governmentApplicationId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentReference?: string | null;
  paymentDate?: string | null;
  receiptNumber?: string | null;
  paidById?: string | null;
  receiptDocumentUrl?: string | null;
  status: GovernmentPaymentStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  paidBy?: Partial<User> | null;
}

export interface GovernmentEvidence {
  id: string;
  governmentApplicationId: string;
  documentName: string;
  documentType: string;
  fileUrl: string;
  uploadedById?: string | null;
  uploadedAt: string;
  visibility: string;
  uploadedBy?: Partial<User> | null;
}

export interface GovernmentFollowUp {
  id: string;
  governmentApplicationId: string;
  attemptedAt: string;
  method: GovernmentFollowUpMethod;
  contactPerson?: string | null;
  officeContacted?: string | null;
  outcome?: string | null;
  notes?: string | null;
  nextFollowUpDate?: string | null;
  performedById?: string | null;
  createdAt: string;
  performedBy?: Partial<User> | null;
}

export interface GovernmentApplication {
  id: string;
  applicationId: string;
  platform: string;
  governmentAgency: string;
  governmentService?: string | null;
  department?: string | null;
  submissionChannel: GovernmentSubmissionChannel;
  externalReference: string;
  trackingNumber?: string | null;
  receiptNumber?: string | null;
  officerContact?: string | null;
  portalUrl?: string | null;
  submittedAt?: string | null;
  submittedByAdminId?: string | null;
  primaryOfficerId?: string | null;
  secondaryOfficerId?: string | null;
  supervisorId?: string | null;
  team?: string | null;
  status: GovernmentStatus;
  statusDescription?: string | null;
  lastCheckedAt?: string | null;
  expectedTurnaroundDays?: number | null;
  expectedResponseDate?: string | null;
  nextFollowUpDate?: string | null;
  followUpFrequencyDays: number;
  lastFollowUpDate?: string | null;
  followUpOwnerId?: string | null;
  approvalDate?: string | null;
  completionDate?: string | null;
  completedAt?: string | null;
  rejectionReason?: string | null;
  rejectedAt?: string | null;
  additionalInformationRequired: boolean;
  additionalInformationRequestedAt?: string | null;
  additionalInformationDeadline?: string | null;
  isSlaPaused: boolean;
  slaPauseReason?: string | null;
  statutoryPaymentStatus: GovernmentPaymentStatus;
  statutoryFeeAmount: number;
  evidenceDocumentUrl?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;

  application?: any;
  submittedByAdmin?: Partial<User> | null;
  primaryOfficer?: Partial<User> | null;
  secondaryOfficer?: Partial<User> | null;
  supervisor?: Partial<User> | null;
  followUpOwner?: Partial<User> | null;
  references?: GovernmentReference[];
  statusHistory?: GovernmentStatusHistory[];
  queries?: GovernmentQuery[];
  appointments?: GovernmentAppointment[];
  payments?: GovernmentPayment[];
  evidenceDocs?: GovernmentEvidence[];
  followUps?: GovernmentFollowUp[];
  _count?: {
    queries: number;
    appointments: number;
    payments: number;
    evidenceDocs: number;
    followUps: number;
  };
}

export interface GovernmentDashboardKpis {
  totalActive: number;
  readyForSubmission: number;
  awaitingResponse: number;
  queryRequired: number;
  paymentRequired: number;
  appointmentsScheduled: number;
  approvedReady: number;
  overdueSlaRisk: number;
}

export interface ReadyApplicationItem {
  id: string;
  applicationNumber: string;
  status: string;
  client: { id: string; fullName: string; email: string; phone?: string | null };
  service: { id: string; name: string; code: string; category?: string | null };
  assignedAdmin?: Partial<User> | null;
  latestGovApp?: GovernmentApplication | null;
  readiness: {
    ready: boolean;
    blockers: string[];
    warnings: string[];
    checklist: Array<{ key: string; label: string; status: "PASSED" | "FAILED" | "WARNING" }>;
    score: number;
  };
}

export interface UpdateGovernmentStatusPayload {
  status: GovernmentStatus;
  externalReference?: string;
  trackingNumber?: string;
  statusDescription?: string;
  notes?: string;
  remarks?: string;
  rejectionReason?: string;
  evidenceDocumentUrl?: string;
  portalUrl?: string;
  approvalDate?: string;
  completionDate?: string;
  expectedCompletionAt?: string;
  followUpDate?: string;
  source?: string;
}
