/**
 * Swift Doc Notification Domain Types
 * Unified model for IN_APP, EMAIL, and SMS notifications
 */

export type NotificationChannel = "IN_APP" | "EMAIL" | "SMS";

export type NotificationStatus =
  | "PENDING"
  | "SENT"
  | "DELIVERED"
  | "FAILED"
  | "READ";

export interface Notification {
  id: string;
  organizationId?: string;
  userId: string;
  clientId?: string | null;
  applicationId?: string | null;
  channel: NotificationChannel;
  type: string;
  title: string;
  message: string;
  status: NotificationStatus;
  attempts?: number;
  lastError?: string | null;
  templateKey?: string | null;
  readAt?: string | null;
  sentAt?: string | null;
  deliveredAt?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface NotificationPreference {
  id: string;
  userId: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;
  marketingEnabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateNotificationPreferencePayload {
  emailEnabled?: boolean;
  smsEnabled?: boolean;
  inAppEnabled?: boolean;
  marketingEnabled?: boolean;
}
