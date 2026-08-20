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
    const res = await apiClient.get<ApiResponse<any>>("/services", {
      params: { categoryId },
    });
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch services");
    }
    const rawData = res.data.data;
    if (Array.isArray(rawData)) {
      const allServices: Service[] = [];
      for (const item of rawData) {
        if (item.services && Array.isArray(item.services)) {
          for (const s of item.services) {
            allServices.push({
              ...s,
              category: {
                id: item.id,
                code: item.code,
                slug: item.slug,
                name: item.name,
                description: item.description,
              },
              categoryId: s.categoryId || item.id,
            });
          }
        } else if (item.id && item.name && (item.code || item.slug || item.categoryId)) {
          allServices.push(item);
        }
      }
      return allServices;
    }
    return [];
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
