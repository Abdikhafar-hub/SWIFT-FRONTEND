/**
 * Swift Doc Applications & Client Lifecycle API Client
 */

import { apiClient } from "./client";
import type {
  ApiResponse,
  PaginatedResult,
  QueryPaginationParams,
  Application,
  CreateApplicationPayload,
  TransitionStatusPayload,
  AssignAdminPayload,
  ApplicationActivity,
  ApplicationMessage,
  ApplicationRequirement,
  SubmitRequirementPayload,
  ClientAction,
  CompleteClientActionPayload,
  ClientDashboardOverview,
  ApplicationReadinessReport,
  ApplicationDelivery,
  GovernmentApplication,
  RequirementReviewHistory,
} from "@/types";

export const applicationsApi = {
  /**
   * Fetch authenticated client portal executive dashboard overview
   */
  async getClientDashboardOverview(): Promise<ClientDashboardOverview> {
    const res = await apiClient.get<ApiResponse<ClientDashboardOverview>>("/client/dashboard/overview");
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch client dashboard overview");
    }
    return res.data.data;
  },

  /**
   * List client applications with filtering, sorting, and pagination
   */
  async getApplications(params?: QueryPaginationParams): Promise<PaginatedResult<Application>> {
    const res = await apiClient.get<ApiResponse<PaginatedResult<Application>>>("/client/applications", {
      params,
    });
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch applications");
    }
    return res.data.data;
  },

  /**
   * Fetch a single application by ID with related requirements, documents, payments, and tracking
   */
  async getApplicationById(id: string): Promise<Application> {
    const res = await apiClient.get<ApiResponse<Application>>(`/client/applications/${id}`);
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch application details");
    }
    return res.data.data;
  },

  /**
   * Initiate / create a new statutory application
   */
  async createApplication(payload: CreateApplicationPayload): Promise<Application> {
    const res = await apiClient.post<ApiResponse<Application>>("/client/applications", {
      serviceId: payload.serviceId,
      notesSummary: payload.notesSummary || payload.initialNotes,
      metadata: payload.metadata,
    });
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to create application");
    }
    return res.data.data;
  },

  /**
   * Get dynamic readiness evaluation report for an application
   */
  async getApplicationReadiness(id: string): Promise<ApplicationReadinessReport> {
    const res = await apiClient.get<ApiResponse<ApplicationReadinessReport>>(
      `/client/applications/${id}/readiness`
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch application readiness");
    }
    return res.data.data;
  },

  /**
   * Submit or update a specific requirement for an application
   */
  async submitRequirement(
    applicationId: string,
    requirementId: string,
    payload: SubmitRequirementPayload
  ): Promise<ApplicationRequirement> {
    const res = await apiClient.post<ApiResponse<ApplicationRequirement>>(
      `/client/applications/${applicationId}/requirements/${requirementId}`,
      payload
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to submit requirement");
    }
    return res.data.data;
  },

  /**
   * Fetch requirement submission and review history
   */
  async getRequirementHistory(
    applicationId: string,
    requirementId: string
  ): Promise<RequirementReviewHistory[]> {
    const res = await apiClient.get<ApiResponse<RequirementReviewHistory[]>>(
      `/client/applications/${applicationId}/requirements/${requirementId}/history`
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch requirement history");
    }
    return res.data.data;
  },

  /**
   * Get activity timeline for an application
   */
  async getTimeline(applicationId: string): Promise<ApplicationActivity[]> {
    const res = await apiClient.get<ApiResponse<ApplicationActivity[]>>(
      `/client/applications/${applicationId}/timeline`
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch application timeline");
    }
    return res.data.data;
  },

  /**
   * Get SLA timeline and breakdown for an application
   */
  async getSlaTimeline(applicationId: string): Promise<any> {
    const res = await apiClient.get<ApiResponse<any>>(
      `/applications/${applicationId}/sla-timeline`
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch SLA timeline");
    }
    return res.data.data;
  },

  /**
   * Fetch direct client-to-officer messages for an application
   */
  async getMessages(applicationId: string): Promise<ApplicationMessage[]> {
    const res = await apiClient.get<ApiResponse<ApplicationMessage[]>>(
      `/client/applications/${applicationId}/messages`
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch messages");
    }
    return res.data.data;
  },

  /**
   * Send a message to compliance officer on an application
   */
  async sendMessage(applicationId: string, message: string): Promise<ApplicationMessage> {
    const res = await apiClient.post<ApiResponse<ApplicationMessage>>(
      `/client/applications/${applicationId}/messages`,
      { message }
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to send message");
    }
    return res.data.data;
  },

  /**
   * Fetch delivery dispatch records and tracking for an application
   */
  async getDelivery(applicationId: string): Promise<ApplicationDelivery[]> {
    const res = await apiClient.get<ApiResponse<ApplicationDelivery[]>>(
      `/client/applications/${applicationId}/delivery`
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch delivery status");
    }
    return res.data.data;
  },

  /**
   * Fetch live government agency tracking records for an application
   */
  async getGovernmentTracking(applicationId: string): Promise<GovernmentApplication[]> {
    const res = await apiClient.get<ApiResponse<GovernmentApplication[]>>(
      `/applications/${applicationId}/government-tracking`
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch government tracking");
    }
    return res.data.data;
  },

  /**
   * Fetch all open client actions requiring attention
   */
  async getClientActions(): Promise<ClientAction[]> {
    const res = await apiClient.get<ApiResponse<ClientAction[]>>("/client/actions/open");
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch open client actions");
    }
    return res.data.data;
  },

  /**
   * Fetch actions for a specific application
   */
  async getApplicationActions(applicationId: string): Promise<ClientAction[]> {
    const res = await apiClient.get<ApiResponse<ClientAction[]>>(
      `/applications/${applicationId}/actions`
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch application actions");
    }
    return res.data.data;
  },

  /**
   * Complete an urgent client action
   */
  async completeClientAction(
    actionId: string,
    payload: CompleteClientActionPayload
  ): Promise<ClientAction> {
    const res = await apiClient.post<ApiResponse<ClientAction>>(
      `/actions/${actionId}/complete`,
      payload
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to complete action");
    }
    return res.data.data;
  },

  /**
   * Transition application status (Admin/System state machine)
   */
  async transitionStatus(id: string, payload: TransitionStatusPayload): Promise<Application> {
    const res = await apiClient.patch<ApiResponse<Application>>(
      `/admin/applications/${id}/status`,
      {
        status: payload.toStatus,
        reason: payload.reason,
        notifyClient: true,
      }
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to update application status");
    }
    return res.data.data;
  },

  /**
   * Assign an administrator to the application
   */
  async assignAdmin(id: string, payload: AssignAdminPayload): Promise<Application> {
    const res = await apiClient.patch<ApiResponse<Application>>(
      `/admin/applications/${id}/assign`,
      {
        assignedAdminId: payload.adminId,
        reason: payload.reason,
      }
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to assign administrator");
    }
    return res.data.data;
  },
};
