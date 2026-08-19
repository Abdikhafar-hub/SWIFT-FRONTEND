/**
 * Swift Doc Service Catalog API Endpoints
 */

import { apiClient } from "./client";
import type { ApiResponse, Service, ServiceCategory, ServiceRequirement } from "@/types";

export const servicesApi = {
  /**
   * Fetch all active service categories
   */
  async getCategories(): Promise<ServiceCategory[]> {
    const res = await apiClient.get<ApiResponse<ServiceCategory[]>>("/services/categories");
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch service categories");
    }
    return res.data.data;
  },

  /**
   * Fetch all services with optional category filtering
   */
  async getServices(categoryId?: string): Promise<Service[]> {
    const res = await apiClient.get<ApiResponse<Service[]>>("/services", {
      params: { categoryId },
    });
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch services");
    }
    return res.data.data;
  },

  /**
   * Fetch a single service by slug or ID with its mandatory requirements
   */
  async getServiceBySlugOrId(slugOrId: string): Promise<Service> {
    const res = await apiClient.get<ApiResponse<Service>>(`/services/${slugOrId}`);
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch service details");
    }
    return res.data.data;
  },

  /**
   * Fetch requirements for a service
   */
  async getServiceRequirements(serviceId: string): Promise<ServiceRequirement[]> {
    const res = await apiClient.get<ApiResponse<ServiceRequirement[]>>(
      `/services/${serviceId}/requirements`
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch service requirements");
    }
    return res.data.data;
  },
};
