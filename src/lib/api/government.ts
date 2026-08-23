/**
 * Swift Doc Government Registry Operations API Endpoints
 */

import { apiClient } from "./client";
import type {
  ApiResponse,
  GovernmentApplication,
  GovernmentDashboardKpis,
  ReadyApplicationItem,
  GovernmentQuery,
  GovernmentPayment,
  GovernmentAppointment,
  GovernmentEvidence,
  GovernmentFollowUp,
  GovernmentStatusHistory,
  GovernmentReference,
  UpdateGovernmentStatusPayload,
} from "@/types";

export const governmentApi = {
  /**
   * Get Live KPI Aggregates for Admin Dashboard
   */
  async getDashboardKpis(): Promise<GovernmentDashboardKpis> {
    const res = await apiClient.get<ApiResponse<GovernmentDashboardKpis>>("/admin/government/kpis");
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch government KPIs");
    }
    return res.data.data;
  },

  /**
   * Get Applications Evaluated for Government Readiness
   */
  async getReadyApplications(search?: string): Promise<ReadyApplicationItem[]> {
    const res = await apiClient.get<ApiResponse<ReadyApplicationItem[]>>("/admin/government/ready-applications", {
      params: { search },
    });
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch ready applications");
    }
    return res.data.data;
  },

  /**
   * Get Paginated & Filtered Government Queue Records
   */
  async getQueue(params: Record<string, any>): Promise<{
    items: GovernmentApplication[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const res = await apiClient.get<ApiResponse<GovernmentApplication[]>>("/admin/government/queue", {
      params,
    });
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch government queue");
    }
    return {
      items: res.data.data,
      pagination: (res.data as any).pagination || { page: 1, limit: 20, total: res.data.data.length, totalPages: 1 },
    };
  },

  /**
   * Get Complete 360° Dossier View of a Government Submission
   */
  async getSubmissionDossier(id: string): Promise<{
    govApp: GovernmentApplication;
    readinessReport: {
      ready: boolean;
      blockers: string[];
      warnings: string[];
      checklist: Array<{ key: string; label: string; status: "PASSED" | "FAILED" | "WARNING" }>;
      score: number;
    };
  }> {
    const res = await apiClient.get<
      ApiResponse<{
        govApp: GovernmentApplication;
        readinessReport: any;
      }>
    >(`/admin/government/submissions/${id}`);
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch government dossier");
    }
    return res.data.data;
  },

  /**
   * Register a New Government Submission (Step 1-3 Wizard)
   */
  async createSubmission(payload: any): Promise<GovernmentApplication> {
    const res = await apiClient.post<ApiResponse<GovernmentApplication>>(
      "/admin/government/submissions",
      payload
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to create government submission");
    }
    return res.data.data;
  },

  /**
   * Update Government Status & Lifecycle State Machine
   */
  async updateStatus(id: string, payload: UpdateGovernmentStatusPayload): Promise<GovernmentApplication> {
    const res = await apiClient.patch<ApiResponse<GovernmentApplication>>(
      `/admin/government/submissions/${id}/status`,
      payload
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to update government status");
    }
    return res.data.data;
  },

  /**
   * Record Government Query & Auto-Generate Client Action
   */
  async recordQuery(id: string, payload: any): Promise<GovernmentQuery> {
    const res = await apiClient.post<ApiResponse<GovernmentQuery>>(
      `/admin/government/submissions/${id}/query`,
      payload
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to record government query");
    }
    return res.data.data;
  },

  /**
   * Record Statutory Government Fee Payment
   */
  async recordPayment(id: string, payload: any): Promise<GovernmentPayment> {
    const res = await apiClient.post<ApiResponse<GovernmentPayment>>(
      `/admin/government/submissions/${id}/payment`,
      payload
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to record statutory payment");
    }
    return res.data.data;
  },

  /**
   * Schedule Appointment / Biometrics / Interview
   */
  async scheduleAppointment(id: string, payload: any): Promise<GovernmentAppointment> {
    const res = await apiClient.post<ApiResponse<GovernmentAppointment>>(
      `/admin/government/submissions/${id}/appointment`,
      payload
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to schedule appointment");
    }
    return res.data.data;
  },

  /**
   * Record Registry Follow-up / Chasing Attempt
   */
  async recordFollowUp(id: string, payload: any): Promise<GovernmentFollowUp> {
    const res = await apiClient.post<ApiResponse<GovernmentFollowUp>>(
      `/admin/government/submissions/${id}/follow-up`,
      payload
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to record follow-up");
    }
    return res.data.data;
  },

  /**
   * Record External Registry Update
   */
  async recordExternalUpdate(id: string, payload: any): Promise<GovernmentApplication> {
    const res = await apiClient.post<ApiResponse<GovernmentApplication>>(
      `/admin/government/submissions/${id}/external-update`,
      payload
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to record external update");
    }
    return res.data.data;
  },

  /**
   * Upload Dossier Evidence Document
   */
  async uploadEvidence(id: string, payload: any): Promise<GovernmentEvidence> {
    const res = await apiClient.post<ApiResponse<GovernmentEvidence>>(
      `/admin/government/submissions/${id}/evidence`,
      payload
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to upload evidence");
    }
    return res.data.data;
  },

  /**
   * Assign Government Case Officers & Team
   */
  async assignCase(id: string, payload: any): Promise<GovernmentApplication> {
    const res = await apiClient.post<ApiResponse<GovernmentApplication>>(
      `/admin/government/submissions/${id}/assign`,
      payload
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to assign case officers");
    }
    return res.data.data;
  },

  /**
   * Add Supplementary Government Reference
   */
  async addReference(id: string, payload: any): Promise<GovernmentReference> {
    const res = await apiClient.post<ApiResponse<GovernmentReference>>(
      `/admin/government-applications/${id}/references`,
      payload
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to add reference");
    }
    return res.data.data;
  },

  /**
   * Delete Government Reference
   */
  async removeReference(id: string, refId: string): Promise<void> {
    const res = await apiClient.delete<ApiResponse<void>>(`/admin/government-applications/${id}/references/${refId}`);
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to delete reference");
    }
  },

  /**
   * Get Status Audit History
   */
  async getStatusHistory(id: string): Promise<GovernmentStatusHistory[]> {
    const res = await apiClient.get<ApiResponse<GovernmentStatusHistory[]>>(`/admin/government-applications/${id}/history`);
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch status history");
    }
    return res.data.data;
  },

  /**
   * Fetch government filing records for an application (Client View)
   */
  async getByApplicationId(applicationId: string): Promise<GovernmentApplication[]> {
    const res = await apiClient.get<ApiResponse<GovernmentApplication[]>>(`/applications/${applicationId}/government-tracking`);
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch government records");
    }
    return res.data.data;
  },
};
