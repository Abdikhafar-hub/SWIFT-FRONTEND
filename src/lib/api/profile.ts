/**
 * Swift Doc Client Profile API Client
 */

import { apiClient } from "./client";
import type {
  ApiResponse,
  ClientProfile,
  UpdateClientProfilePayload,
} from "@/types";

export const profileApi = {
  /**
   * Fetch authenticated client profile
   */
  async getProfile(): Promise<ClientProfile> {
    const res = await apiClient.get<ApiResponse<ClientProfile>>("/client/profile");
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch profile");
    }
    return res.data.data;
  },

  /**
   * Update authenticated client profile
   */
  async updateProfile(payload: UpdateClientProfilePayload): Promise<ClientProfile> {
    const res = await apiClient.patch<ApiResponse<ClientProfile>>("/client/profile", payload);
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to update profile");
    }
    // Update local cache if available
    if (typeof window !== "undefined") {
      localStorage.setItem("swift_doc_client", JSON.stringify(res.data.data));
    }
    return res.data.data;
  },

  /**
   * Upload client profile avatar image
   */
  async uploadProfileImage(payload: { fileName: string; mimeType: string; base64Data: string }): Promise<{ avatarUrl: string }> {
    const res = await apiClient.post<ApiResponse<{ avatarUrl: string }>>("/client/profile/profile-image", payload);
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to upload profile image");
    }
    return res.data.data;
  },

  /**
   * Remove client profile avatar image
   */
  async deleteProfileImage(): Promise<void> {
    const res = await apiClient.delete<ApiResponse<{ success: boolean }>>("/client/profile/profile-image");
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to remove profile image");
    }
  },
};
