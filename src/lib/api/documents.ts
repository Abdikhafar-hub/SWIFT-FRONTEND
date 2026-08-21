/**
 * Swift Doc Documents & Cloudinary Storage API Client
 */

import { apiClient } from "./client";
import type {
  ApiResponse,
  PaginatedResult,
  QueryPaginationParams,
  Document,
  UploadDocumentPayload,
  ReviewDocumentPayload,
} from "@/types";

export interface DownloadUrlResponse {
  downloadUrl: string;
  fileName: string;
  mimeType: string;
  expiresAt: string;
}

/**
 * Helper to convert browser File object to Base64 string
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Strip base64 prefix if present (e.g. data:image/png;base64,...)
      const base64Data = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64Data);
    };
    reader.onerror = (error) => reject(error);
  });
}

export const documentsApi = {
  /**
   * Fetch documents with filtering (clientId, applicationId, status)
   */
  async getDocuments(
    params?: QueryPaginationParams & {
      clientId?: string;
      applicationId?: string;
      status?: string;
      isExpired?: string;
    }
  ): Promise<PaginatedResult<Document>> {
    const res = await apiClient.get<ApiResponse<PaginatedResult<Document>>>("/documents", {
      params,
    });
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch documents");
    }
    return res.data.data;
  },

  /**
   * Fetch document by ID with version history
   */
  async getDocumentById(id: string): Promise<Document> {
    const res = await apiClient.get<ApiResponse<Document>>(`/documents/${id}`);
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch document");
    }
    return res.data.data;
  },

  /**
   * Upload a document (converts File to base64 payload to match backend schema)
   */
  async uploadDocument(
    payload: UploadDocumentPayload,
    onUploadProgress?: (progress: number) => void
  ): Promise<Document> {
    let base64Data = payload.base64Data;
    let fileName = payload.fileName || (payload.file ? payload.file.name : "document.pdf");
    let mimeType = payload.mimeType || (payload.file ? payload.file.type : "application/pdf");

    if (payload.file && !base64Data) {
      if (onUploadProgress) onUploadProgress(20);
      base64Data = await fileToBase64(payload.file);
      fileName = payload.file.name;
      mimeType = payload.file.type || "application/octet-stream";
    }

    if (!base64Data) {
      throw new Error("File or base64 data is required for document upload");
    }

    if (onUploadProgress) onUploadProgress(60);

    const body = {
      clientId: payload.clientId || undefined,
      applicationId: payload.applicationId || undefined,
      applicationRequirementId: payload.applicationRequirementId || undefined,
      documentType: payload.documentType,
      title: payload.title,
      fileName,
      mimeType,
      base64Data,
      expiresAt: payload.expiresAt || undefined,
      documentNumber: payload.documentNumber || undefined,
      issuingAuthority: payload.issuingAuthority || undefined,
      issuedAt: payload.issuedAt || undefined,
    };

    const res = await apiClient.post<ApiResponse<Document>>("/documents", body);

    if (onUploadProgress) onUploadProgress(100);

    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to upload document");
    }
    return res.data.data;
  },

  /**
   * Get secure download URL for a document
   */
  async getDownloadUrl(id: string): Promise<DownloadUrlResponse> {
    const res = await apiClient.get<ApiResponse<DownloadUrlResponse>>(`/documents/${id}/download`);
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to get download URL");
    }
    return res.data.data;
  },

  /**
   * Review a document (Admin verification: APPROVED / REJECTED)
   */
  async reviewDocument(id: string, payload: ReviewDocumentPayload): Promise<Document> {
    const res = await apiClient.patch<ApiResponse<Document>>(`/documents/${id}/review`, {
      status: payload.status,
      reviewNotes: payload.reviewNotes || payload.rejectionReason || undefined,
      requestReplacement: payload.requestReplacement ?? (payload.status === "REJECTED"),
      replacementDeadline: payload.replacementDeadline,
    });
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to submit document review");
    }
    return res.data.data;
  },

  /**
   * Update document metadata
   */
  async updateMetadata(
    id: string,
    payload: {
      title?: string;
      expiresAt?: string | null;
      documentNumber?: string | null;
      issuingAuthority?: string | null;
      issuedAt?: string | null;
      isArchived?: boolean;
    }
  ): Promise<Document> {
    const res = await apiClient.patch<ApiResponse<Document>>(`/documents/${id}/metadata`, payload);
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to update document metadata");
    }
    return res.data.data;
  },
};
