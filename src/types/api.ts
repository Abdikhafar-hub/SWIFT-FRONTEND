/**
 * Swift Doc API Envelopes & Response Contracts
 * Strictly aligned with Backend API contract:
 * { success: true, data: T, meta?: Record<string, unknown> }
 * { success: false, error: { code: string, message: string, details?: unknown } }
 */

export interface ApiResponseSuccess<T> {
  success: true;
  data: T;
  meta?: ApiMeta;
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
  code?: string;
  [key: string]: unknown;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: ApiErrorDetail[] | Record<string, unknown>;
  stack?: string;
}

export interface ApiResponseError {
  success: false;
  error: ApiErrorPayload;
}

export type ApiResponse<T> = ApiResponseSuccess<T> | ApiResponseError;

export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  [key: string]: unknown;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  meta?: ApiMeta;
}

export interface QueryPaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  status?: string;
  [key: string]: unknown;
}
