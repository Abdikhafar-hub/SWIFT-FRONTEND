/**
 * Swift Doc Admin Operations API Client
 * Complete interface to Phase 5 Backend Operations Command Center
 */

import { apiClient } from "./client";
import type {
  ApiResponse,
  PaginatedResult,
  QueryPaginationParams,
  Application,
  ApplicationNote,
  ApplicationRequirement,
  ApplicationReadinessReport,
  ApplicationDelivery,
  CreateAdminApplicationPayload,
  TransitionStatusPayload,
  AssignAdminPayload,
  UnassignAdminPayload,
  CloseApplicationPayload,
  ReviewRequirementPayload,
  PauseSlaPayload,
  ResumeSlaPayload,
  CreateApplicationNotePayload,
  AdminDashboardOverview,
  ClientProfile,
  Service,
  Document,
  Payment,
  PaymentTransaction,
  Receipt,
  Refund,
  ReconciliationRecord,
  GovernmentApplication,
  UpdateGovernmentStatusPayload,
  ClientAction,
  AuditLog,
  AuditSummaryMetrics,
  QualityCheck,
  QCResult,
  QualityCheckChecklist,
  CreateInvoicePayload,
  UpdateDraftInvoicePayload,
  IssueInvoicePayload,
  CancelInvoicePayload,
  FinancialAdjustmentPayload,
  FinancialSummaryData,
  FinancialCollectionsData,
  OutstandingInvoice,
  OutstandingInvoicesQuery,
  ReverseTransactionPayload,
  RequestRefundPayload,
  ApproveRefundPayload,
  RejectRefundPayload,
  IngestStatementPayload,
  ManualResolvePayload,
  RecordManualPaymentPayload,
  ApplicationPriority,
} from "@/types";

export interface CreateAdminClientPayload {
  email: string;
  fullName: string;
  phone: string;
  clientType?: "INDIVIDUAL" | "BUSINESS";
  kraPin?: string;
  idNumber?: string;
  businessName?: string;
  businessRegistrationNumber?: string;
  address?: string;
  notes?: string;
}

export interface CreateServicePayload {
  name: string;
  slug?: string;
  description?: string;
  categoryId?: string;
  governmentFee?: number;
  serviceFee: number;
  currency?: string;
  slaHours?: number;
  active?: boolean;
  requirements?: Array<{
    name: string;
    description?: string;
    type: "DOCUMENT" | "TEXT" | "NUMBER" | "DATE" | "BOOLEAN";
    isRequired?: boolean;
    order?: number;
  }>;
}

export const adminApi = {
  // =========================================================================
  // 1. EXECUTIVE DASHBOARD & STATS
  // =========================================================================

  /**
   * Fetch complete administrative operational command overview
   */
  async getDashboardOverview(): Promise<AdminDashboardOverview> {
    const res = await apiClient.get<ApiResponse<AdminDashboardOverview>>("/admin/dashboard/overview");
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch admin overview");
    }
    return res.data.data;
  },

  /**
   * Legacy alias for dashboard stats
   */
  async getDashboardStats(): Promise<AdminDashboardOverview> {
    return this.getDashboardOverview();
  },

  // =========================================================================
  // 2. APPLICATIONS & WORK QUEUE
  // =========================================================================

  /**
   * List admin applications with extensive filters
   */
  async getApplications(
    params?: QueryPaginationParams & {
      status?: string;
      priority?: string;
      slaStatus?: string;
      serviceId?: string;
      clientId?: string;
      assignedAdminId?: string;
      search?: string;
    }
  ): Promise<PaginatedResult<Application>> {
    const res = await apiClient.get<ApiResponse<PaginatedResult<Application>>>("/admin/applications", {
      params,
    });
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch applications");
    }
    return res.data.data;
  },

  /**
   * Comprehensive operational work queue with queue bucket filtering
   */
  async getWorkQueue(
    params?: QueryPaginationParams & {
      status?: string;
      assignedAdminId?: string;
      serviceId?: string;
      priority?: string;
      slaStatus?: string;
      needsAttention?: string;
      overdue?: string;
      search?: string;
    }
  ): Promise<PaginatedResult<Application>> {
    const res = await apiClient.get<any>(
      "/admin/applications/work-queue",
      { params }
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch work queue");
    }
    const rawData = res.data.data;
    const items = Array.isArray(rawData) ? rawData : (rawData?.items || []);
    return {
      items,
      pagination: res.data.pagination || rawData?.pagination,
      buckets: res.data.buckets || rawData?.buckets,
    } as any;
  },

  /**
   * Fetch single application dossier by ID
   */
  async getApplicationById(id: string): Promise<Application> {
    const res = await apiClient.get<ApiResponse<Application>>(`/admin/applications/${id}`);
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch application dossier");
    }
    return res.data.data;
  },

  /**
   * Get dynamic readiness evaluation report for an application
   */
  async getApplicationReadiness(id: string): Promise<ApplicationReadinessReport> {
    const res = await apiClient.get<ApiResponse<ApplicationReadinessReport>>(
      `/admin/applications/${id}/readiness`
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch application readiness");
    }
    return res.data.data;
  },

  /**
   * Create an application on behalf of a client
   */
  async createAdminApplication(payload: CreateAdminApplicationPayload): Promise<Application> {
    const res = await apiClient.post<ApiResponse<Application>>("/admin/applications", payload);
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to create application");
    }
    return res.data.data;
  },

  /**
   * Transition application state in the lifecycle state machine
   */
  async transitionStatus(id: string, payload: TransitionStatusPayload): Promise<Application> {
    const res = await apiClient.patch<ApiResponse<Application>>(`/admin/applications/${id}/status`, {
      status: payload.toStatus,
      reason: payload.reason,
      notifyClient: true,
    });
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to transition application status");
    }
    return res.data.data;
  },

  /**
   * Update application priority
   */
  async updatePriority(id: string, payload: { priority: ApplicationPriority; reason?: string }): Promise<Application> {
    const res = await apiClient.patch<ApiResponse<Application>>(`/admin/applications/${id}/priority`, payload);
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to update priority");
    }
    return res.data.data;
  },

  /**
   * Assign an administrative officer to the application
   */
  async assignAdmin(id: string, payload: AssignAdminPayload): Promise<Application> {
    const res = await apiClient.patch<ApiResponse<Application>>(`/admin/applications/${id}/assign`, {
      assignedAdminId: payload.adminId,
      reason: payload.reason,
    });
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to assign application");
    }
    return res.data.data;
  },

  /**
   * Unassign an administrative officer
   */
  async unassignAdmin(id: string, payload?: UnassignAdminPayload): Promise<Application> {
    const res = await apiClient.patch<ApiResponse<Application>>(`/admin/applications/${id}/unassign`, payload || {});
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to unassign application");
    }
    return res.data.data;
  },

  /**
   * Close / complete an application dossier
   */
  async closeApplication(id: string, payload: CloseApplicationPayload): Promise<Application> {
    const res = await apiClient.post<ApiResponse<Application>>(`/admin/applications/${id}/close`, payload);
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to close application");
    }
    return res.data.data;
  },

  /**
   * Add an internal or client-visible note to an application
   */
  async addNote(id: string, payload: CreateApplicationNotePayload): Promise<ApplicationNote> {
    const res = await apiClient.post<ApiResponse<ApplicationNote>>(`/admin/applications/${id}/notes`, payload);
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to add application note");
    }
    return res.data.data;
  },

  /**
   * Forensic review of a statutory requirement (Approve, Reject, Request Correction)
   */
  async reviewRequirement(
    applicationId: string,
    requirementId: string,
    payload: ReviewRequirementPayload
  ): Promise<ApplicationRequirement> {
    const res = await apiClient.patch<ApiResponse<ApplicationRequirement>>(
      `/admin/applications/${applicationId}/requirements/${requirementId}/review`,
      payload
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to review requirement");
    }
    return res.data.data;
  },

  /**
   * Fetch review history for a requirement
   */
  async getRequirementHistory(applicationId: string, requirementId: string): Promise<any[]> {
    const res = await apiClient.get<ApiResponse<any[]>>(
      `/admin/applications/${applicationId}/requirements/${requirementId}/history`
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch requirement history");
    }
    return res.data.data;
  },

  // =========================================================================
  // 3. QUALITY CONTROL (QC)
  // =========================================================================

  /**
   * Get quality check status and history for an application
   */
  async getQualityStatus(applicationId: string): Promise<any> {
    const res = await apiClient.get<ApiResponse<any>>(`/admin/quality/applications/${applicationId}/status`);
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch quality status");
    }
    return res.data.data;
  },

  /**
   * Perform formal statutory quality check
   */
  async performQualityCheck(
    applicationId: string,
    payload: {
      result: QCResult;
      checklist?: QualityCheckChecklist;
      notes?: string;
      failedReason?: string;
    }
  ): Promise<QualityCheck> {
    const res = await apiClient.post<ApiResponse<QualityCheck>>(
      `/admin/quality/applications/${applicationId}`,
      payload
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to record quality check");
    }
    return res.data.data;
  },

  /**
   * Submit a quality check review (alias)
   */
  async submitQualityCheck(payload: {
    applicationId: string;
    result: QCResult;
    checklist?: QualityCheckChecklist;
    notes?: string;
    failedReason?: string;
  }): Promise<QualityCheck> {
    return this.performQualityCheck(payload.applicationId, payload);
  },

  // =========================================================================
  // 4. GOVERNMENT AGENCY OPERATIONS TRACKING
  // =========================================================================

  /**
   * Fetch government submissions queue
   */
  async getGovernmentQueue(params?: QueryPaginationParams & { status?: string; agency?: string }): Promise<PaginatedResult<GovernmentApplication>> {
    const res = await apiClient.get<ApiResponse<PaginatedResult<GovernmentApplication>>>(
      "/admin/government-applications/queue",
      { params }
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch government queue");
    }
    return res.data.data;
  },

  /**
   * Register a new government submission for an application
   */
  async createGovernmentRecord(
    applicationId: string,
    payload: {
      platform: string;
      governmentAgency: string;
      governmentService?: string;
      externalReference?: string;
      status?: string;
      portalUrl?: string;
      notes?: string;
    }
  ): Promise<GovernmentApplication> {
    const res = await apiClient.post<ApiResponse<GovernmentApplication>>(
      `/admin/applications/${applicationId}/government`,
      payload
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to create government record");
    }
    return res.data.data;
  },

  /**
   * Update statutory agency status
   */
  async updateGovernmentStatus(
    govAppId: string,
    payload: UpdateGovernmentStatusPayload | {
      status: string;
      externalReference?: string;
      trackingNumber?: string;
      statusDescription?: string;
      notes?: string;
      remarks?: string;
      queryDetails?: string;
      queryResponse?: string;
      nextFollowUpDate?: string;
      followUpDate?: string;
      evidenceDocumentUrl?: string;
    }
  ): Promise<GovernmentApplication> {
    const res = await apiClient.patch<ApiResponse<GovernmentApplication>>(
      `/admin/government-applications/${govAppId}/status`,
      {
        ...payload,
        notes: payload.notes || payload.remarks || payload.queryDetails,
        nextFollowUpDate: payload.nextFollowUpDate || payload.followUpDate,
      }
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to update government status");
    }
    return res.data.data;
  },

  /**
   * Record government approval and official certificate
   */
  async recordGovernmentApproval(
    govAppId: string,
    payload: {
      approvalNumber?: string;
      registrationNumber?: string;
      approvalDate?: string;
      evidenceDocumentUrl?: string;
      documentUrl?: string;
      notes?: string;
    }
  ): Promise<GovernmentApplication> {
    const res = await apiClient.post<ApiResponse<GovernmentApplication>>(
      `/admin/government-applications/${govAppId}/approve`,
      {
        ...payload,
        approvalNumber: payload.approvalNumber || payload.registrationNumber,
        evidenceDocumentUrl: payload.evidenceDocumentUrl || payload.documentUrl,
      }
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to record government approval");
    }
    return res.data.data;
  },

  /**
   * Request additional information from client on government query
   */
  async requestGovernmentInfo(
    govAppId: string,
    payload: {
      reason: string;
      requestedItems: string[];
      deadline?: string;
    }
  ): Promise<GovernmentApplication> {
    const res = await apiClient.post<ApiResponse<GovernmentApplication>>(
      `/admin/government-applications/${govAppId}/request-info`,
      payload
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to request additional information");
    }
    return res.data.data;
  },

  /**
   * Resubmit application to government agency
   */
  async resubmitGovernment(
    govAppId: string,
    payload: { trackingNumber?: string; notes?: string }
  ): Promise<GovernmentApplication> {
    const res = await apiClient.post<ApiResponse<GovernmentApplication>>(
      `/admin/government-applications/${govAppId}/resubmit`,
      payload
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to resubmit government application");
    }
    return res.data.data;
  },

  /**
   * Schedule official government follow-up date
   */
  async scheduleGovernmentFollowUp(
    govAppId: string,
    payload: { followUpDate: string; notes?: string }
  ): Promise<any> {
    const res = await apiClient.post<ApiResponse<any>>(
      `/admin/government-applications/${govAppId}/schedule-followup`,
      payload
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to schedule follow-up");
    }
    return res.data.data;
  },

  /**
   * Add external reference to government filing
   */
  async addGovernmentReference(
    govAppId: string,
    payload: { referenceType: string; referenceValue: string; issuingPlatform?: string; notes?: string }
  ): Promise<any> {
    const res = await apiClient.post<ApiResponse<any>>(
      `/admin/government-applications/${govAppId}/references`,
      payload
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to add reference");
    }
    return res.data.data;
  },

  /**
   * Delete external reference from government filing
   */
  async removeGovernmentReference(govAppId: string, refId: string): Promise<any> {
    const res = await apiClient.delete<ApiResponse<any>>(
      `/admin/government-applications/${govAppId}/references/${refId}`
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to delete reference");
    }
    return res.data.data;
  },

  /**
   * Fetch government status history
   */
  async getGovernmentStatusHistory(govAppId: string): Promise<any[]> {
    const res = await apiClient.get<ApiResponse<any[]>>(
      `/admin/government-applications/${govAppId}/history`
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch government history");
    }
    return res.data.data;
  },

  // =========================================================================
  // 5. CLIENT ACTIONS (DISPATCH)
  // =========================================================================

  /**
   * Create an urgent action item for a client on an application
   */
  async createClientAction(
    applicationId: string,
    payload: {
      actionType: string;
      title: string;
      description: string;
      instructions?: string;
      priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
      deadline?: string;
    }
  ): Promise<ClientAction> {
    const res = await apiClient.post<ApiResponse<ClientAction>>(
      `/admin/applications/${applicationId}/actions`,
      payload
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to create client action");
    }
    return res.data.data;
  },

  /**
   * Cancel an action item
   */
  async cancelClientAction(actionId: string, payload?: { reason?: string }): Promise<ClientAction> {
    const res = await apiClient.post<ApiResponse<ClientAction>>(
      `/admin/actions/${actionId}/cancel`,
      payload || {}
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to cancel client action");
    }
    return res.data.data;
  },

  // =========================================================================
  // 6. SLA MANAGEMENT & PAUSE/RESUME
  // =========================================================================

  /**
   * Fetch overall SLA health metrics
   */
  async getSlaMetrics(): Promise<any> {
    const res = await apiClient.get<ApiResponse<any>>("/admin/sla/metrics");
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch SLA metrics");
    }
    return res.data.data;
  },

  /**
   * Trigger SLA status update sweep across all active applications
   */
  async triggerSlaSweep(): Promise<any> {
    const res = await apiClient.post<ApiResponse<any>>("/admin/sla/sweep");
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to trigger SLA sweep");
    }
    return res.data.data;
  },

  /**
   * Pause SLA on an application with statutory justification
   */
  async pauseSla(applicationId: string, payload: PauseSlaPayload): Promise<any> {
    const res = await apiClient.post<ApiResponse<any>>(
      `/admin/applications/${applicationId}/sla/pause`,
      payload
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to pause SLA");
    }
    return res.data.data;
  },

  /**
   * Resume SLA on an application
   */
  async resumeSla(applicationId: string, payload?: ResumeSlaPayload): Promise<any> {
    const res = await apiClient.post<ApiResponse<any>>(
      `/admin/applications/${applicationId}/sla/resume`,
      payload || {}
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to resume SLA");
    }
    return res.data.data;
  },

  // =========================================================================
  // 7. DELIVERY & FULFILLMENT OPERATIONS
  // =========================================================================

  /**
   * Fetch all deliveries with pagination, search, and summary metrics
   */
  async getDeliveries(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    carrier?: string;
  }): Promise<{
    items: ApplicationDelivery[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
    summaryMetrics: {
      awaitingDispatchCount: number;
      inTransitCount: number;
      fulfilledCount: number;
      totalDispatched: number;
    };
  }> {
    const res = await apiClient.get<ApiResponse<{
      items: ApplicationDelivery[];
      pagination: any;
      summaryMetrics: any;
    }>>("/admin/delivery", { params });
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch deliveries");
    }
    return res.data.data;
  },

  /**
   * Lodge a new delivery record
   */
  async lodgeDelivery(payload: any): Promise<ApplicationDelivery> {
    const res = await apiClient.post<ApiResponse<ApplicationDelivery>>("/admin/delivery", payload);
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to lodge delivery");
    }
    return res.data.data;
  },

  /**
   * Dispatch document delivery to client
   */
  async dispatchDelivery(
    applicationId: string,
    payload: {
      deliveryMethod: "DIGITAL" | "PHYSICAL" | "BOTH";
      recipientName: string;
      recipientPhone: string;
      recipientEmail?: string;
      physicalAddress?: string;
      carrier?: string;
      trackingNumber?: string;
      notes?: string;
    }
  ): Promise<ApplicationDelivery> {
    const res = await apiClient.post<ApiResponse<ApplicationDelivery>>(
      `/admin/delivery/applications/${applicationId}`,
      payload
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to dispatch delivery");
    }
    return res.data.data;
  },

  /**
   * Transition delivery state to DISPATCHED
   */
  async dispatchDeliveryAction(
    deliveryId: string,
    payload: {
      dispatchDate?: string;
      carrier?: string;
      trackingNumber?: string;
      handoverReference?: string;
      notes?: string;
    }
  ): Promise<ApplicationDelivery> {
    const res = await apiClient.patch<ApiResponse<ApplicationDelivery>>(
      `/admin/delivery/${deliveryId}/dispatch`,
      payload
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to dispatch delivery");
    }
    return res.data.data;
  },

  /**
   * Confirm document delivery fulfillment
   */
  async confirmDelivery(
    deliveryId: string,
    payload: {
      deliveredAt?: string;
      receivedBy?: string;
      recipientPhone?: string;
      notes?: string;
      proofDocumentUrl?: string;
    }
  ): Promise<ApplicationDelivery> {
    const res = await apiClient.patch<ApiResponse<ApplicationDelivery>>(
      `/admin/delivery/${deliveryId}/confirm`,
      payload
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to confirm delivery");
    }
    return res.data.data;
  },

  /**
   * Report failed delivery attempt
   */
  async reportFailedDelivery(
    deliveryId: string,
    payload: {
      failureReason: string;
      notes?: string;
      nextAction?: string;
    }
  ): Promise<ApplicationDelivery> {
    const res = await apiClient.patch<ApiResponse<ApplicationDelivery>>(
      `/admin/delivery/${deliveryId}/fail`,
      payload
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to report delivery failure");
    }
    return res.data.data;
  },

  /**
   * Fetch single delivery details
   */
  async getDeliveryById(deliveryId: string): Promise<ApplicationDelivery> {
    const res = await apiClient.get<ApiResponse<ApplicationDelivery>>(`/admin/delivery/${deliveryId}`);
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch delivery record");
    }
    return res.data.data;
  },


  // =========================================================================
  // 8. CLIENT REGISTRY & 360 PROFILES
  // =========================================================================
  // 8. CLIENT PROFILES & REGISTRATION INTAKE DIRECTORY
  // =========================================================================

  /**
   * Fetch unreviewed client registrations intake queue
   */
  async getRegistrations(
    params?: QueryPaginationParams & {
      search?: string;
      clientType?: string;
      isDuplicateFlagged?: boolean;
      isReviewed?: boolean;
    }
  ): Promise<PaginatedResult<ClientProfile>> {
    const res = await apiClient.get<ApiResponse<ClientProfile[]>>("/admin/registrations", {
      params,
    });
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch registrations");
    }
    const apiMeta = (res.data as any).meta;
    return {
      items: res.data.data,
      pagination: {
        page: apiMeta?.page ?? 1,
        limit: apiMeta?.limit ?? 20,
        total: apiMeta?.total ?? res.data.data?.length ?? 0,
        totalPages: apiMeta?.totalPages ?? 1,
        hasNextPage: apiMeta?.hasNextPage ?? false,
        hasPreviousPage: apiMeta?.hasPrevPage ?? false,
      },
    };
  },

  /**
   * Fetch single registration review dossier
   */
  async getRegistrationById(id: string): Promise<ClientProfile> {
    const res = await apiClient.get<ApiResponse<ClientProfile>>(`/admin/registrations/${id}`);
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch registration dossier");
    }
    return res.data.data;
  },

  /**
   * Review and approve/vet a client registration
   */
  async reviewRegistration(
    id: string,
    payload: { reviewNotes?: string; isDuplicateFlagged?: boolean; duplicateReason?: string | null }
  ): Promise<ClientProfile> {
    const res = await apiClient.post<ApiResponse<ClientProfile>>(`/admin/registrations/${id}/review`, payload);
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to review registration");
    }
    return res.data.data;
  },

  /**
   * Fetch client profiles directory with search and pagination
   */
  async getClients(
    params?: QueryPaginationParams & {
      search?: string;
      clientType?: string;
      isReviewed?: boolean;
      isDuplicateFlagged?: boolean;
    }
  ): Promise<PaginatedResult<ClientProfile>> {
    const res = await apiClient.get<ApiResponse<ClientProfile[]>>("/admin/clients", {
      params,
    });
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch clients");
    }
    const apiMeta = (res.data as any).meta;
    return {
      items: res.data.data,
      pagination: {
        page: apiMeta?.page ?? 1,
        limit: apiMeta?.limit ?? 20,
        total: apiMeta?.total ?? res.data.data?.length ?? 0,
        totalPages: apiMeta?.totalPages ?? 1,
        hasNextPage: apiMeta?.hasNextPage ?? false,
        hasPreviousPage: apiMeta?.hasPrevPage ?? false,
      },
    };
  },

  /**
   * Fetch single client details with 360 records
   */
  async getClientById(id: string): Promise<ClientProfile & { applications?: Application[]; documents?: Document[]; invoices?: Payment[]; transactions?: PaymentTransaction[] }> {
    const res = await apiClient.get<ApiResponse<any>>(`/admin/clients/${id}`);
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch client profile");
    }
    return res.data.data;
  },

  /**
   * Create a new client entity directly
   */
  async createClient(payload: CreateAdminClientPayload): Promise<ClientProfile> {
    const res = await apiClient.post<ApiResponse<ClientProfile>>("/admin/clients", payload);
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to create client");
    }
    return res.data.data;
  },

  // =========================================================================
  // 9. SERVICE CATALOG MANAGEMENT
  // =========================================================================

  /**
   * Fetch all statutory services configured in system
   */
  async getServices(): Promise<Service[]> {
    const res = await apiClient.get<ApiResponse<Service[]>>("/admin/services");
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch services");
    }
    return res.data.data;
  },

  /**
   * Create a new statutory service with requirements & fees
   */
  async createService(payload: CreateServicePayload): Promise<Service> {
    const res = await apiClient.post<ApiResponse<Service>>("/admin/services", payload);
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to create service");
    }
    return res.data.data;
  },

  /**
   * Update statutory service parameters
   */
  async updateService(id: string, payload: Partial<CreateServicePayload>): Promise<Service> {
    const res = await apiClient.patch<ApiResponse<Service>>(`/admin/services/${id}`, payload);
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to update service");
    }
    return res.data.data;
  },

  // =========================================================================
  // 10. FINANCIAL COMMERCIAL OPERATIONS & INVOICES
  // =========================================================================

  /**
   * Fetch executive financial KPIs summary
   */
  async getFinancialSummary(params?: { fromDate?: string; toDate?: string }): Promise<FinancialSummaryData> {
    const res = await apiClient.get<ApiResponse<FinancialSummaryData>>("/admin/financial/summary", { params });
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch financial summary");
    }
    return res.data.data;
  },

  /**
   * Fetch collections analytics by payment method
   */
  async getFinancialCollections(params?: { fromDate?: string; toDate?: string }): Promise<FinancialCollectionsData> {
    const res = await apiClient.get<ApiResponse<FinancialCollectionsData>>("/admin/financial/collections", { params });
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch collections");
    }
    return res.data.data;
  },

  /**
   * Fetch outstanding invoices with aging bucket calculations
   */
  async getOutstandingInvoices(params?: OutstandingInvoicesQuery): Promise<PaginatedResult<OutstandingInvoice>> {
    const res = await apiClient.get<ApiResponse<PaginatedResult<OutstandingInvoice>>>("/admin/financial/outstanding", { params });
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch outstanding invoices");
    }
    return res.data.data;
  },

  /**
   * Fetch overdue invoices requiring action
   */
  async getOverdueInvoices(params?: QueryPaginationParams): Promise<PaginatedResult<Payment>> {
    const res = await apiClient.get<ApiResponse<PaginatedResult<Payment>>>("/admin/financial/overdue", { params });
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch overdue invoices");
    }
    return res.data.data;
  },

  /**
   * List all invoices across organization
   */
  async getInvoices(
    params?: QueryPaginationParams & {
      clientId?: string;
      applicationId?: string;
      status?: string;
      isOverdue?: boolean;
      search?: string;
    }
  ): Promise<PaginatedResult<Payment>> {
    const res = await apiClient.get<ApiResponse<PaginatedResult<Payment>>>("/admin/invoices", { params });
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch invoices");
    }
    return res.data.data;
  },

  /**
   * Fetch single invoice with line items, transactions, and receipts
   */
  async getInvoiceById(id: string): Promise<Payment> {
    const res = await apiClient.get<ApiResponse<Payment>>(`/admin/invoices/${id}`);
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch invoice details");
    }
    return res.data.data;
  },

  /**
   * Create custom invoice
   */
  async createInvoice(payload: CreateInvoicePayload): Promise<Payment> {
    const res = await apiClient.post<ApiResponse<Payment>>("/admin/invoices", payload);
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to create invoice");
    }
    return res.data.data;
  },

  /**
   * Update draft invoice
   */
  async updateDraftInvoice(id: string, payload: UpdateDraftInvoicePayload): Promise<Payment> {
    const res = await apiClient.patch<ApiResponse<Payment>>(`/admin/invoices/${id}`, payload);
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to update draft invoice");
    }
    return res.data.data;
  },

  /**
   * Issue draft invoice to client
   */
  async issueInvoice(id: string, payload?: IssueInvoicePayload): Promise<Payment> {
    const res = await apiClient.post<ApiResponse<Payment>>(`/admin/invoices/${id}/issue`, payload || {});
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to issue invoice");
    }
    return res.data.data;
  },

  /**
   * Cancel an invoice with required reason
   */
  async cancelInvoice(id: string, payload: CancelInvoicePayload): Promise<Payment> {
    const res = await apiClient.post<ApiResponse<Payment>>(`/admin/invoices/${id}/cancel`, payload);
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to cancel invoice");
    }
    return res.data.data;
  },

  /**
   * Void an invoice (alias to cancelInvoice)
   */
  async voidInvoice(id: string, payload: CancelInvoicePayload): Promise<Payment> {
    return this.cancelInvoice(id, payload);
  },

  /**
   * Apply financial adjustment (waiver, penalty, discount)
   */
  async applyFinancialAdjustment(id: string, payload: FinancialAdjustmentPayload): Promise<Payment> {
    const res = await apiClient.post<ApiResponse<Payment>>(`/admin/invoices/${id}/adjust`, payload);
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to apply adjustment");
    }
    return res.data.data;
  },

  /**
   * List payment transactions
   */
  async getTransactions(
    params?: QueryPaginationParams & { status?: string; search?: string }
  ): Promise<PaginatedResult<PaymentTransaction>> {
    const res = await apiClient.get<ApiResponse<PaginatedResult<PaymentTransaction>>>("/admin/payments", {
      params,
    });
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch transactions");
    }
    return res.data.data;
  },

  /**
   * Get single transaction by ID
   */
  async getTransactionById(id: string): Promise<PaymentTransaction> {
    const res = await apiClient.get<ApiResponse<PaymentTransaction>>(`/admin/payments/transactions/${id}`);
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch transaction");
    }
    return res.data.data;
  },

  /**
   * Record manual payment (Bank transfer / Cash / Card)
   */
  async recordManualPayment(payload: RecordManualPaymentPayload): Promise<PaymentTransaction> {
    const res = await apiClient.post<ApiResponse<PaymentTransaction>>("/admin/payments/record", payload);
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to record manual payment");
    }
    return res.data.data;
  },

  /**
   * Reverse payment transaction
   */
  async reverseTransaction(id: string, payload: { reason: string }): Promise<PaymentTransaction> {
    const res = await apiClient.post<ApiResponse<PaymentTransaction>>(`/admin/payments/transactions/${id}/reverse`, payload);
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to reverse transaction");
    }
    return res.data.data;
  },

  /**
   * List all statutory receipts
   */
  async getReceipts(params?: QueryPaginationParams): Promise<PaginatedResult<Receipt> | Receipt[]> {
    const res = await apiClient.get<ApiResponse<any>>("/admin/receipts", { params });
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch receipts");
    }
    return res.data.data?.items || res.data.data || [];
  },

  /**
   * Fetch single receipt
   */
  async getReceiptById(id: string): Promise<Receipt> {
    const res = await apiClient.get<ApiResponse<Receipt>>(`/admin/receipts/${id}`);
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch receipt");
    }
    return res.data.data;
  },

  /**
   * List refunds
   */
  async getRefunds(params?: QueryPaginationParams & { status?: string }): Promise<PaginatedResult<Refund> | Refund[]> {
    const res = await apiClient.get<ApiResponse<any>>("/admin/refunds", { params });
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch refunds");
    }
    return res.data.data?.items || res.data.data || [];
  },

  /**
   * Get single refund by ID
   */
  async getRefundById(id: string): Promise<Refund> {
    const res = await apiClient.get<ApiResponse<Refund>>(`/admin/refunds/${id}`);
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch refund");
    }
    return res.data.data;
  },

  /**
   * Request a refund
   */
  async requestRefund(payload: {
    paymentId: string;
    transactionId: string;
    amount: number;
    reason: string;
  }): Promise<Refund> {
    const res = await apiClient.post<ApiResponse<Refund>>("/admin/refunds", payload);
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to request refund");
    }
    return res.data.data;
  },

  /**
   * Approve a refund
   */
  async approveRefund(id: string, payload?: { notes?: string }): Promise<Refund> {
    const res = await apiClient.post<ApiResponse<Refund>>(`/admin/refunds/${id}/approve`, payload || {});
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to approve refund");
    }
    return res.data.data;
  },

  /**
   * Reject a refund
   */
  async rejectRefund(id: string, payload: { reason: string }): Promise<Refund> {
    const res = await apiClient.post<ApiResponse<Refund>>(`/admin/refunds/${id}/reject`, payload);
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to reject refund");
    }
    return res.data.data;
  },

  // =========================================================================
  // 11. RECONCILIATION ENGINE
  // =========================================================================

  /**
   * List reconciliation records
   */
  async getReconciliationRecords(
    params?: QueryPaginationParams & { status?: string; provider?: string; search?: string }
  ): Promise<PaginatedResult<ReconciliationRecord>> {
    const res = await apiClient.get<ApiResponse<PaginatedResult<ReconciliationRecord>>>(
      "/admin/reconciliation",
      { params }
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch reconciliation records");
    }
    return res.data.data;
  },

  /**
   * Fetch single reconciliation record
   */
  async getReconciliationRecordById(id: string): Promise<ReconciliationRecord> {
    const res = await apiClient.get<ApiResponse<ReconciliationRecord>>(`/admin/reconciliation/${id}`);
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch reconciliation record");
    }
    return res.data.data;
  },

  /**
   * Ingest statement entry
   */
  async ingestStatementEntry(payload: IngestStatementPayload): Promise<ReconciliationRecord> {
    const res = await apiClient.post<ApiResponse<ReconciliationRecord>>(
      "/admin/reconciliation/statement",
      payload
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to ingest statement entry");
    }
    return res.data.data;
  },

  /**
   * Run automated reconciliation matching engine
   */
  async runReconciliationEngine(): Promise<any> {
    const res = await apiClient.post<ApiResponse<any>>("/admin/reconciliation/engine/run");
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to run reconciliation engine");
    }
    return res.data.data;
  },

  /**
   * Manually resolve unmatched reconciliation record
   */
  async manualResolveReconciliation(id: string, payload: ManualResolvePayload): Promise<ReconciliationRecord> {
    const res = await apiClient.post<ApiResponse<ReconciliationRecord>>(
      `/admin/reconciliation/${id}/resolve`,
      payload
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to resolve reconciliation record");
    }
    return res.data.data;
  },

  // =========================================================================
  // 12. AUDIT TRAIL & DOCUMENT SWEEPS
  // =========================================================================

  /**
   * Fetch immutable audit logs
   */
  async getAuditLogs(
    params?: QueryPaginationParams & {
      search?: string;
      actorId?: string;
      actorEmail?: string;
      role?: string;
      action?: string;
      category?: string;
      entityType?: string;
      resource?: string;
      entityId?: string;
      resourceId?: string;
      status?: string;
      from?: string;
      to?: string;
    }
  ): Promise<PaginatedResult<AuditLog> & { summaryMetrics?: AuditSummaryMetrics }> {
    const res = await apiClient.get<any>("/admin/audit-trail", {
      params,
    });
    if (!res.data.success) {
      throw new Error(res.data.error?.message || "Failed to fetch audit logs");
    }
    if (Array.isArray(res.data.data)) {
      const metaObj = res.data.meta || { total: res.data.data.length, page: 1, limit: 25, totalPages: 1 };
      const totalPages = metaObj.totalPages || 1;
      return {
        items: res.data.data,
        meta: metaObj,
        pagination: {
          page: metaObj.page,
          limit: metaObj.limit,
          total: metaObj.total,
          totalPages,
          hasNextPage: metaObj.page < totalPages,
          hasPreviousPage: metaObj.page > 1,
        },
        summaryMetrics: res.data.summaryMetrics,
      };
    }
    const dataObj = res.data.data;
    if (dataObj && !dataObj.pagination && dataObj.meta) {
      const totalPages = dataObj.meta.totalPages || 1;
      dataObj.pagination = {
        page: dataObj.meta.page,
        limit: dataObj.meta.limit,
        total: dataObj.meta.total,
        totalPages,
        hasNextPage: dataObj.meta.page < totalPages,
        hasPreviousPage: dataObj.meta.page > 1,
      };
    }
    return dataObj;
  },

  /**
   * Fetch audit summary metrics
   */
  async getAuditSummary(): Promise<AuditSummaryMetrics> {
    const res = await apiClient.get<ApiResponse<AuditSummaryMetrics>>("/admin/audit-trail/summary");
    if (!res.data.success) {
      throw new Error(res.data.error?.message || "Failed to fetch audit summary metrics");
    }
    return res.data.data;
  },

  /**
   * Trigger document expiry sweep across organization
   */
  async triggerExpiryCheck(): Promise<any> {
    const res = await apiClient.post<ApiResponse<any>>("/admin/documents/check-expiring");
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to trigger document expiry sweep");
    }
    return res.data.data;
  },

  /**
   * Fetch messages on an application
   */
  async getApplicationMessages(applicationId: string): Promise<any[]> {
    const res = await apiClient.get<ApiResponse<any[]>>(`/admin/applications/${applicationId}/messages`);
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch messages");
    }
    return res.data.data;
  },

  /**
   * Send administrative message on application
   */
  async sendApplicationMessage(applicationId: string, payload: { message: string }): Promise<any> {
    const res = await apiClient.post<ApiResponse<any>>(`/admin/applications/${applicationId}/messages`, payload);
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to send message");
    }
    return res.data.data;
  },

  /**
   * Helper to resolve reconciliation record
   */
  async resolveReconciliationRecord(
    id: string,
    payload: { resolutionStatus: string; resolvedTransactionId?: string; notes?: string }
  ): Promise<any> {
    return this.manualResolveReconciliation(id, {
      status: payload.resolutionStatus as any,
      transactionId: payload.resolvedTransactionId,
      matchedTransactionId: payload.resolvedTransactionId,
      notes: payload.notes,
    });
  },
};
