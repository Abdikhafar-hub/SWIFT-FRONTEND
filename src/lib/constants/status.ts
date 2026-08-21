/**
 * Swift Doc Status Configurations & Presentation Metadata
 * Centralizes labels, descriptions, and semantic visual treatments for all backend lifecycle states.
 */

import type {
  ApplicationStatus,
  ApplicationPriority,
  SlaStatus,
  RequirementStatus,
  DocumentStatus,
  PaymentStatus,
  GovernmentStatus,
  ClientActionStatus,
} from "@/types";

export type StatusTone = "neutral" | "info" | "warning" | "success" | "danger" | "gold";

export interface StatusMeta {
  label: string;
  description: string;
  tone: StatusTone;
  iconName: string;
}

export const APPLICATION_STATUS_CONFIG: Record<ApplicationStatus, StatusMeta> = {
  NEW: {
    label: "New Application",
    description: "Application initialized and awaiting initial qualification.",
    tone: "neutral",
    iconName: "FilePlus",
  },
  QUALIFICATION: {
    label: "Under Qualification",
    description: "Service requirements and eligibility checks are being verified.",
    tone: "info",
    iconName: "FileSearch",
  },
  REQUIREMENTS_PENDING: {
    label: "Requirements Pending",
    description: "Awaiting mandatory documents or information from the client.",
    tone: "warning",
    iconName: "AlertCircle",
  },
  DOCUMENT_REVIEW: {
    label: "Document Review",
    description: "Submitted client documents are currently undergoing verification.",
    tone: "info",
    iconName: "FileCheck",
  },
  READY_FOR_SUBMISSION: {
    label: "Ready for Submission",
    description: "All requirements and payments are verified; queued for agency filing.",
    tone: "gold",
    iconName: "CheckCircle2",
  },
  SUBMITTED: {
    label: "Submitted to Government",
    description: "Application has been formally submitted to the relevant state agency.",
    tone: "info",
    iconName: "Send",
  },
  GOVERNMENT_PROCESSING: {
    label: "Government Processing",
    description: "Application is actively progressing through state agency processing.",
    tone: "info",
    iconName: "Building2",
  },
  ADDITIONAL_INFORMATION_REQUIRED: {
    label: "Action Required",
    description: "The government department has requested additional clarification.",
    tone: "danger",
    iconName: "AlertTriangle",
  },
  APPROVED: {
    label: "Approved by Agency",
    description: "The official government entity has approved the registration/service.",
    tone: "success",
    iconName: "BadgeCheck",
  },
  DOCUMENT_RECEIVED: {
    label: "Document Received",
    description: "Official certificate or output document received from the registry.",
    tone: "info",
    iconName: "Inbox",
  },
  QUALITY_CHECK: {
    label: "Quality Check",
    description: "Internal compliance review verifying certificate accuracy.",
    tone: "gold",
    iconName: "ShieldCheck",
  },
  READY_FOR_DELIVERY: {
    label: "Ready for Dispatch",
    description: "Output documents ready for physical dispatch or digital download.",
    tone: "gold",
    iconName: "Package",
  },
  DELIVERED: {
    label: "Delivered",
    description: "All official documents have been successfully delivered to the client.",
    tone: "success",
    iconName: "Truck",
  },
  CLOSED: {
    label: "Closed & Completed",
    description: "Application lifecycle is completely fulfilled and archived.",
    tone: "success",
    iconName: "CheckCircle",
  },
  ON_HOLD: {
    label: "On Hold",
    description: "Application is temporarily paused pending external dependencies.",
    tone: "warning",
    iconName: "PauseCircle",
  },
  CANCELLED: {
    label: "Cancelled",
    description: "Application has been formally cancelled.",
    tone: "danger",
    iconName: "XCircle",
  },
};

export const REQUIREMENT_STATUS_CONFIG: Record<RequirementStatus, StatusMeta> = {
  PENDING: {
    label: "Pending Submission",
    description: "Document or information has not yet been submitted.",
    tone: "neutral",
    iconName: "Clock",
  },
  SUBMITTED: {
    label: "Submitted",
    description: "Submitted by client, queued for administrative review.",
    tone: "info",
    iconName: "Upload",
  },
  UNDER_REVIEW: {
    label: "Under Review",
    description: "Being inspected by an administrative compliance specialist.",
    tone: "info",
    iconName: "Search",
  },
  APPROVED: {
    label: "Verified & Approved",
    description: "Requirement is verified and fully satisfied.",
    tone: "success",
    iconName: "CheckCircle2",
  },
  REJECTED: {
    label: "Rejected",
    description: "Requirement did not meet compliance standards.",
    tone: "danger",
    iconName: "XCircle",
  },
  CORRECTION_REQUIRED: {
    label: "Correction Required",
    description: "Please resubmit with the requested corrections.",
    tone: "warning",
    iconName: "AlertTriangle",
  },
};

export const DOCUMENT_STATUS_CONFIG: Record<DocumentStatus, StatusMeta> = {
  UPLOADED: {
    label: "Uploaded",
    description: "File uploaded and stored securely in Cloudinary.",
    tone: "neutral",
    iconName: "File",
  },
  PENDING_REVIEW: {
    label: "Pending Review",
    description: "Awaiting compliance verification by Swift Doc.",
    tone: "info",
    iconName: "Clock",
  },
  APPROVED: {
    label: "Verified",
    description: "Document meets all legal and regulatory standards.",
    tone: "success",
    iconName: "CheckCheck",
  },
  REJECTED: {
    label: "Rejected",
    description: "Document illegible, expired, or invalid.",
    tone: "danger",
    iconName: "FileWarning",
  },
  REPLACED: {
    label: "Replaced",
    description: "Superceded by a newer document version.",
    tone: "neutral",
    iconName: "History",
  },
  ARCHIVED: {
    label: "Archived",
    description: "Archived file record.",
    tone: "neutral",
    iconName: "Archive",
  },
};

export const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, StatusMeta> = {
  PENDING: {
    label: "Payment Pending",
    description: "Invoice issued, awaiting settlement.",
    tone: "warning",
    iconName: "CreditCard",
  },
  PROCESSING: {
    label: "Processing",
    description: "Payment transaction in transit (M-Pesa STK prompt sent).",
    tone: "info",
    iconName: "Loader2",
  },
  COMPLETED: {
    label: "Paid in Full",
    description: "Full invoice amount settled and receipt generated.",
    tone: "success",
    iconName: "CheckCircle2",
  },
  FAILED: {
    label: "Payment Failed",
    description: "M-Pesa transaction was cancelled or declined.",
    tone: "danger",
    iconName: "AlertCircle",
  },
  CANCELLED: {
    label: "Cancelled",
    description: "Invoice cancelled.",
    tone: "neutral",
    iconName: "Ban",
  },
  REFUNDED: {
    label: "Refunded",
    description: "Full payment refunded to client.",
    tone: "info",
    iconName: "RotateCcw",
  },
  PARTIALLY_REFUNDED: {
    label: "Partially Refunded",
    description: "Partial refund issued.",
    tone: "info",
    iconName: "RotateCcw",
  },
  DRAFT: {
    label: "Draft",
    description: "Invoice in draft state.",
    tone: "neutral",
    iconName: "FileEdit",
  },
  ISSUED: {
    label: "Issued",
    description: "Invoice formally issued to client.",
    tone: "warning",
    iconName: "FileText",
  },
  PAYMENT_UNDER_REVIEW: {
    label: "Payment Under Review",
    description: "Client payment proof uploaded, pending administrative verification.",
    tone: "info",
    iconName: "Clock",
  },
  PARTIALLY_PAID: {
    label: "Partially Paid",
    description: "Partial payment received, balance outstanding.",
    tone: "gold",
    iconName: "PieChart",
  },
  PAID: {
    label: "Settled",
    description: "Settled.",
    tone: "success",
    iconName: "CheckCheck",
  },
  OVERDUE: {
    label: "Overdue",
    description: "Payment is past the designated due date.",
    tone: "danger",
    iconName: "ClockAlert",
  },
  VOID: {
    label: "Void",
    description: "Invoice voided.",
    tone: "neutral",
    iconName: "X",
  },
  REVERSED: {
    label: "Reversed",
    description: "Transaction has been reversed and balance restored.",
    tone: "danger",
    iconName: "RotateCcw",
  },
};

export const GOVERNMENT_STATUS_CONFIG: Record<GovernmentStatus, StatusMeta> = {
  NOT_STARTED: {
    label: "Not Started",
    description: "Government submission queue not yet initiated.",
    tone: "neutral",
    iconName: "Clock",
  },
  PREPARING: {
    label: "Preparing Dossier",
    description: "Compiling forms and agency attachments.",
    tone: "info",
    iconName: "FileStack",
  },
  READY_TO_SUBMIT: {
    label: "Ready to Submit",
    description: "Dossier complete and ready for portal filing.",
    tone: "gold",
    iconName: "CheckCircle",
  },
  SUBMITTED: {
    label: "Submitted",
    description: "Filed with government platform (eCitizen/BRS/iTax).",
    tone: "info",
    iconName: "Send",
  },
  UNDER_PROCESSING: {
    label: "Under Processing",
    description: "State agency officers reviewing the application.",
    tone: "info",
    iconName: "Building",
  },
  ACTION_REQUIRED: {
    label: "Agency Action Required",
    description: "Registry officer flagged a requirement or query.",
    tone: "danger",
    iconName: "AlertTriangle",
  },
  ADDITIONAL_INFORMATION_REQUIRED: {
    label: "Clarification Needed",
    description: "State agency requested supplemental documentation.",
    tone: "danger",
    iconName: "HelpCircle",
  },
  ACKNOWLEDGED: {
    label: "Acknowledged by Registry",
    description: "Government officer acknowledged receipt.",
    tone: "info",
    iconName: "FileCheck",
  },
  RESUBMITTED: {
    label: "Resubmitted",
    description: "Corrected files submitted back to government portal.",
    tone: "gold",
    iconName: "RefreshCw",
  },
  APPROVED: {
    label: "Government Approved",
    description: "Official statutory approval granted.",
    tone: "success",
    iconName: "BadgeCheck",
  },
  REJECTED: {
    label: "Government Rejected",
    description: "Application was rejected by the state authority.",
    tone: "danger",
    iconName: "XCircle",
  },
  COMPLETED: {
    label: "Government Completed",
    description: "Statutory processing concluded.",
    tone: "success",
    iconName: "CheckCheck",
  },
  CANCELLED: {
    label: "Cancelled",
    description: "Government submission cancelled.",
    tone: "neutral",
    iconName: "Ban",
  },
  IN_REVIEW: {
    label: "Under Processing",
    description: "State agency officers reviewing the application.",
    tone: "info",
    iconName: "Building",
  },
  QUERY_RAISED: {
    label: "Registry Query Raised",
    description: "Registry officer flagged a requirement or query.",
    tone: "danger",
    iconName: "AlertTriangle",
  },
  UNKNOWN: {
    label: "Status Pending",
    description: "Status query pending verification.",
    tone: "neutral",
    iconName: "HelpCircle",
  },
};

export const SLA_STATUS_CONFIG: Record<SlaStatus, StatusMeta> = {
  ON_TRACK: {
    label: "SLA on Track",
    description: "Operational delivery is well within agreed SLA window.",
    tone: "success",
    iconName: "Clock",
  },
  AT_RISK: {
    label: "SLA at Risk",
    description: "Deadline is approaching soon (< 25% SLA time remaining).",
    tone: "warning",
    iconName: "AlertCircle",
  },
  OVERDUE: {
    label: "SLA Overdue",
    description: "Processing has exceeded the promised service SLA window.",
    tone: "danger",
    iconName: "AlertTriangle",
  },
  COMPLETED: {
    label: "SLA Met",
    description: "Completed within SLA parameters.",
    tone: "success",
    iconName: "CheckCircle",
  },
  PAUSED: {
    label: "SLA Paused",
    description: "Statutory SLA clock temporarily suspended with compliance justification.",
    tone: "warning",
    iconName: "PauseCircle",
  },
};

export const PRIORITY_CONFIG: Record<ApplicationPriority, StatusMeta> = {
  LOW: {
    label: "Low Priority",
    description: "Non-urgent routine processing.",
    tone: "neutral",
    iconName: "ArrowDown",
  },
  NORMAL: {
    label: "Normal",
    description: "Standard turnaround workflow.",
    tone: "info",
    iconName: "Minus",
  },
  HIGH: {
    label: "High Priority",
    description: "Expedited operational workflow.",
    tone: "warning",
    iconName: "ArrowUp",
  },
  URGENT: {
    label: "Urgent Expedited",
    description: "Immediate administrative action required.",
    tone: "danger",
    iconName: "Flame",
  },
};

export const CLIENT_ACTION_STATUS_CONFIG: Record<ClientActionStatus, StatusMeta> = {
  OPEN: {
    label: "Action Required",
    description: "Your attention is needed to continue processing.",
    tone: "warning",
    iconName: "AlertCircle",
  },
  COMPLETED: {
    label: "Completed",
    description: "Action has been fulfilled.",
    tone: "success",
    iconName: "CheckCircle2",
  },
  EXPIRED: {
    label: "Expired",
    description: "Action request exceeded window.",
    tone: "neutral",
    iconName: "Clock",
  },
  CANCELLED: {
    label: "Cancelled",
    description: "Action was cancelled.",
    tone: "neutral",
    iconName: "Ban",
  },
};
