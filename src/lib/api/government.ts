/**
 * Swift Doc Government Tracking API Endpoints
 */

import { apiClient } from "./client";
import type {
  ApiResponse,
  GovernmentApplication,
  UpdateGovernmentStatusPayload,
} from "@/types";

export const governmentApi = {
  /**
   * Fetch government filing records for an application
   */
  async getByApplicationId(applicationId: string): Promise<GovernmentApplication[]> {
    const res = await apiClient.get<ApiResponse<GovernmentApplication[]>>(
      `/applications/${applicationId}/government`
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch government records");
    }
    return res.data.data;
  },

  /**
   * Update statutory agency status (Admin operations)
   */
  async updateStatus(
    id: string,
    payload: UpdateGovernmentStatusPayload
  ): Promise<GovernmentApplication> {
    const res = await apiClient.patch<ApiResponse<GovernmentApplication>>(
      `/government/${id}/status`,
      payload
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to update government status");
    }
    return res.data.data;
  },
};
