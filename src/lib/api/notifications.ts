/**
 * Swift Doc Notifications API Endpoints
 */

import { apiClient } from "./client";
import type {
  ApiResponse,
  Notification,
  NotificationPreference,
  UpdateNotificationPreferencePayload,
} from "@/types";

export const notificationsApi = {
  /**
   * Fetch current user's notifications
   */
  async getNotifications(): Promise<Notification[]> {
    const res = await apiClient.get<ApiResponse<Notification[]>>("/notifications");
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch notifications");
    }
    return res.data.data;
  },

  /**
   * Mark a single notification as read
   */
  async markAsRead(id: string): Promise<Notification> {
    const res = await apiClient.patch<ApiResponse<Notification>>(`/notifications/${id}/read`);
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to mark notification as read");
    }
    return res.data.data;
  },


  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<{ count: number }> {
    const res = await apiClient.post<ApiResponse<{ count: number }>>("/notifications/read-all");
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to mark all notifications as read");
    }
    return res.data.data;
  },

  /**
   * Fetch notification preferences
   */
  async getPreferences(): Promise<NotificationPreference> {
    const res = await apiClient.get<ApiResponse<NotificationPreference>>(
      "/notifications/preferences"
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch preferences");
    }
    return res.data.data;
  },

  /**
   * Update notification preferences
   */
  async updatePreferences(
    payload: UpdateNotificationPreferencePayload
  ): Promise<NotificationPreference> {
    const res = await apiClient.patch<ApiResponse<NotificationPreference>>(
      "/notifications/preferences",
      payload
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to update preferences");
    }
    return res.data.data;
  },
};
