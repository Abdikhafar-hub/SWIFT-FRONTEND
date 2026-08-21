import { apiClient } from "./client";
import type {
  ApiResponse,
  User,
  NotificationPreferences,
  UpdateAdminProfilePayload,
  UploadProfileImagePayload,
  ChangePasswordPayload,
  RequestEmailChangePayload,
  VerifyEmailChangePayload,
} from "@/types";

export const adminAccountApi = {
  /**
   * Fetch admin user profile details
   */
  async getProfile(): Promise<User> {
    const res = await apiClient.get<ApiResponse<User>>("/admin/account/profile");
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch admin profile");
    }
    return res.data.data;
  },

  /**
   * Update non-sensitive profile fields
   */
  async updateProfile(payload: UpdateAdminProfilePayload): Promise<User> {
    const res = await apiClient.patch<ApiResponse<User>>("/admin/account/profile", payload);
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to update profile");
    }
    return res.data.data;
  },

  /**
   * Upload profile image
   */
  async uploadProfileImage(payload: UploadProfileImagePayload): Promise<{ user: User; avatarUrl: string }> {
    const res = await apiClient.post<ApiResponse<{ user: User; avatarUrl: string }>>(
      "/admin/account/profile-image",
      payload
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to upload profile image");
    }
    return res.data.data;
  },

  /**
   * Remove current profile image
   */
  async deleteProfileImage(): Promise<User> {
    const res = await apiClient.delete<ApiResponse<User>>("/admin/account/profile-image");
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to remove profile image");
    }
    return res.data.data;
  },

  /**
   * Change admin password
   */
  async changePassword(payload: ChangePasswordPayload): Promise<{ message: string }> {
    const res = await apiClient.post<ApiResponse<{ message: string }>>(
      "/admin/account/change-password",
      payload
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to change password");
    }
    return res.data.data;
  },

  /**
   * Request email change (triggers 6-digit OTP to new email)
   */
  async requestEmailChange(payload: RequestEmailChangePayload): Promise<{
    message: string;
    pendingEmail: string;
    expiresAt: string;
  }> {
    const res = await apiClient.post<
      ApiResponse<{ message: string; pendingEmail: string; expiresAt: string }>
    >("/admin/account/request-email-change", payload);
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to request email change");
    }
    return res.data.data;
  },

  /**
   * Confirm email change using 6-digit OTP
   */
  async verifyEmailChange(payload: VerifyEmailChangePayload): Promise<{ message: string; user: User }> {
    const res = await apiClient.post<ApiResponse<{ message: string; user: User }>>(
      "/admin/account/verify-email-change",
      payload
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to verify email code");
    }
    return res.data.data;
  },

  /**
   * Fetch notification preferences
   */
  async getNotificationPreferences(): Promise<NotificationPreferences> {
    const res = await apiClient.get<ApiResponse<NotificationPreferences>>(
      "/admin/account/notification-preferences"
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch notification preferences");
    }
    return res.data.data;
  },

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(
    payload: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    const res = await apiClient.patch<ApiResponse<NotificationPreferences>>(
      "/admin/account/notification-preferences",
      payload
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to update notification preferences");
    }
    return res.data.data;
  },
};
