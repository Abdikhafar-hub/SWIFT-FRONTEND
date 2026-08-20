/**
 * Swift Doc Application Domain Types
 * Central operational entity of the platform
 */

import type { User, UserRole, ClientProfile } from "./auth";
import type { Service } from "./service";
import type { ApplicationRequirement } from "./requirement";
import type { Document } from "./document";
import type { Payment } from "./payment";
import type { GovernmentApplication } from "./government";
import type { ClientAction } from "./client-action";
import type { ApplicationDelivery } from "./audit";

export type ApplicationStatus =
  | "NEW"
  | "QUALIFICATION"
  | "REQUIREMENTS_PENDING"
  | "DOCUMENT_REVIEW"
  | "READY_FOR_SUBMISSION"
  | "SUBMITTED"
  | "GOVERNMENT_PROCESSING"
  | "ADDITIONAL_INFORMATION_REQUIRED"
  | "APPROVED"
  | "DOCUMENT_RECEIVED"
  | "QUALITY_CHECK"
  | "READY_FOR_DELIVERY"
  | "DELIVERED"
  | "CLOSED"
  | "ON_HOLD"
  | "CANCELLED";

export type ApplicationPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export type SlaStatus = "ON_TRACK" | "AT_RISK" | "OVERDUE" | "COMPLETED" | "PAUSED";

export type NoteVisibility = "INTERNAL" | "CLIENT_VISIBLE";

export interface ApplicationActivity {
  id: string;
  applicationId: string;
  actorId?: string | null;
  actorRole?: UserRole | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  fromStatus?: string | null;
  toStatus?: string | null;
  message: string;
  metadata?: Record<string, unknown> | null;
  visibility: NoteVisibility;
  createdAt: string;
}

export interface ApplicationNote {
  id: string;
  applicationId: string;
  authorId: string;
  visibility: NoteVisibility;
  content: string;
  createdAt: string;
  updatedAt?: string;
  author?: User;
}

export interface ApplicationMessageAttachment {
  id: string;
  messageId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
}

export interface ApplicationMessage {
  id: string;
  organizationId?: string;
  applicationId: string;
  senderId: string;
  senderRole: UserRole;
  visibility: NoteVisibility;
  message: string;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
  sender?: User;
  attachments?: ApplicationMessageAttachment[];
}

export interface ApplicationSlaEvent {
  id: string;
  applicationId: string;
  eventType: string;
  category: "INTERNAL" | "CLIENT_WAITING" | "GOVERNMENT_WAITING";
  startedAt: string;
  endedAt?: string | null;
  durationMinutes: number;
  reason?: string | null;
  actorId?: string | null;
  actorRole?: UserRole | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface Application {
  id: string;
  organizationId?: string;
  clientId: string;
  serviceId: string;
  assignedAdminId?: string | null;
  applicationNumber: string;
  status: ApplicationStatus;
  priority: ApplicationPriority;
  slaStatus: SlaStatus;
  startedAt: string;
  dueAt?: string | null;
  slaDueAt?: string | null;
  completedAt?: string | null;
  submittedAt?: string | null;
  pausedAt?: string | null;
  totalPausedDuration: number;
  deliveredAt?: string | null;
  notesSummary?: string | null;
  totalAmount: number | string;
  paidAmount: number | string;
  dueAmount: number | string;
  currency: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;

  user?: any;
  statusHistory?: any[];
  client?: ClientProfile;
  service?: Service;
  assignedAdmin?: User | null;
  requirements?: ApplicationRequirement[];
  documents?: Document[];
  payments?: Payment[];
  governmentApps?: GovernmentApplication[];
  clientActions?: ClientAction[];
  activities?: ApplicationActivity[];
  notes?: ApplicationNote[];
  messages?: ApplicationMessage[];
  slaEvents?: ApplicationSlaEvent[];
  delivery?: ApplicationDelivery[];
  deliveries?: ApplicationDelivery[];
}

export interface ClientDashboardOverview {
  client?: {
    id: string;
    fullName: string;
    businessName?: string;
    email?: string;
  };
  summary?: {
    totalApplications: number;
    activeFilingsCount: number;
    actionItemsCount: number;
    unreadNotificationsCount: number;
    activeFilingsProgressPercent: number;
  };
  chartTimeline?: Array<{
    month: string;
    activeFilings: number;
    completed: number;
    actionItems: number;
    rejected: number;
  }>;
  recentActivity?: Array<{
    id: string;
    title: string;
    subtitle: string;
    timestamp: string;
    type: "APPROVED" | "SUBMITTED" | "PAYMENT" | "NOTICE" | "REJECTED";
  }>;
  upcomingDeadlines?: Array<{
    id: string;
    day: string;
    month: string;
    title: string;
    companyName: string;
    daysLeft: string;
    badgeColor: "AMBER" | "BLUE" | "GREEN" | "ROSE";
  }>;
  complianceHealth?: {
    scorePercent: number;
    compliantCount: number;
    pendingCount: number;
    overdueCount: number;
    attentionCount: number;
  };
  totalApplications?: number;
  unreadNotificationsCount?: number;
  activeApplications?: Array<{
    id: string;
    applicationNumber: string;
    serviceName: string;
    status: ApplicationStatus;
    slaStatus?: SlaStatus;
    dueAt?: string | null;
    progressPercent?: number;
    paidAmount?: string;
    dueAmount?: string;
    createdAt?: string;
  }>;
  recentInvoices?: Array<{
    id: string;
    invoiceNumber: string;
    totalAmount: string;
    amountPaid: string;
    amountDue?: string;
    status: string;
    createdAt: string;
  }>;
}

export interface ApplicationReadinessReport {
  ready: boolean;
  blockers: string[];
  warnings: string[];
  completedRequirements: number;
  totalRequirements: number;
  requiredRequirements: number;
  satisfiedRequiredRequirements: number;
  rejectedDocuments: number;
  pendingDocuments: number;
  approvedDocuments: number;
  outstandingAmount: string;
  paidAmount: string;
  totalAmount: string;
  isPaymentComplete: boolean;
  qualityCheckPassed: boolean;
  governmentProcessingStatus: string | null;
}


export interface CreateApplicationPayload {
  serviceId: string;
  clientId?: string;
  priority?: ApplicationPriority;
  initialNotes?: string;
  notesSummary?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateAdminApplicationPayload {
  clientId: string;
  serviceId: string;
  priority?: ApplicationPriority;
  assignedAdminId?: string | null;
  notesSummary?: string;
  metadata?: Record<string, unknown>;
}

export interface TransitionStatusPayload {
  toStatus: ApplicationStatus;
  reason?: string;
  notes?: string;
}

export interface AssignAdminPayload {
  adminId: string;
  reason?: string;
  notes?: string;
}

export interface UnassignAdminPayload {
  reason?: string;
}

export interface CloseApplicationPayload {
  reason: string;
  completionNotes?: string;
}

export interface PauseSlaPayload {
  reason: "WAITING_ON_CLIENT" | "WAITING_ON_GOVERNMENT" | "SYSTEM_DELAY" | "FORCE_MAJEURE" | "OTHER" | string;
  notes?: string;
  pausedUntil?: string;
}

export interface ResumeSlaPayload {
  reason?: string;
  notes?: string;
}

export interface CreateApplicationNotePayload {
  content: string;
  visibility?: NoteVisibility;
}

export interface AdminDashboardOverview {
  summary: {
    totalApplications: number;
    totalClients?: number;
    activeApplications: number;
    statusCounts: Record<string, number>;
  };
  queues: {
    newRegistrations?: number;
    unassigned: number;
    overdue: number;
    dueSoon: number;
    qualityCheck: number;
    awaitingGovernment: number;
  };
  financials: {
    totalInvoiced: string;
    totalCollected: string;
    totalOutstanding: string;
  };
  sla: {
    totalTracked: number;
    onTrackCount: number;
    atRiskCount: number;
    overdueCount: number;
    breachRate: number;
    averageCompletionHours: number;
  };
  governmentAgencyStats: Array<{
    agency: string;
    count: number;
  }>;
  recentActivities: Array<{
    id: string;
    applicationNumber: string;
    clientName: string;
    action: string;
    createdAt: string;
  }>;
}


