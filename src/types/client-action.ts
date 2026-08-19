/**
 * Swift Doc Client Action Domain Types
 * Urgent actionable requests requiring client attention
 */

import type { User } from "./auth";
import type { ApplicationPriority } from "./application";

export type ClientActionType =
  | "UPLOAD_DOCUMENT"
  | "REPLACE_DOCUMENT"
  | "PROVIDE_INFORMATION"
  | "CONFIRM_INFORMATION"
  | "MAKE_PAYMENT"
  | "APPROVE_DECLARATION"
  | "SIGN_DECLARATION"
  | "OTHER";

export type ClientActionStatus = "OPEN" | "COMPLETED" | "EXPIRED" | "CANCELLED";

export interface ClientAction {
  id: string;
  organizationId?: string;
  applicationId: string;
  requirementId?: string | null;
  type: ClientActionType;
  title: string;
  description: string;
  priority: ApplicationPriority;
  dueAt?: string | null;
  status: ClientActionStatus;
  createdById?: string | null;
  completedAt?: string | null;
  completedById?: string | null;
  completionNotes?: string | null;
  responsePayload?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;

  actionType?: string;
  isUrgent?: boolean;
  resolvedAt?: string | null;
  application?: any;
  requirement?: any;
  createdBy?: User | null;
  completedBy?: User | null;
  createdByAdmin?: User | null;
}

export interface CompleteClientActionPayload {
  completionNotes?: string;
  responsePayload?: Record<string, unknown>;
}
