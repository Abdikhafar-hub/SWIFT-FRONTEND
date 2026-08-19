/**
 * Swift Doc Centralized Error Parser & User-Facing Mapper
 * Maps backend errors into clear, institutional, helpful user messages.
 * Never leaks Prisma stack traces, database details, or raw JWT strings.
 */

import { AxiosError } from "axios";
import type { ApiResponseError, ApiErrorPayload } from "@/types";

export interface ParsedApiError {
  code: string;
  title: string;
  message: string;
  statusCode?: number;
  fieldErrors?: Record<string, string>;
  isNetworkError?: boolean;
  isAuthError?: boolean;
}

const ERROR_CODE_MAP: Record<string, { title: string; message: string }> = {
  DUPLICATE_RESOURCE: {
    title: "Already Registered",
    message: "A record with these credentials (email, phone, KRA PIN or National ID) already exists.",
  },
  INVALID_CREDENTIALS: {
    title: "Invalid Credentials",
    message: "The email address or password provided is incorrect. Please check and try again.",
  },
  ACCOUNT_LOCKED: {
    title: "Account Temporarily Locked",
    message: "Too many failed attempts. For security reasons, please wait 15 minutes before retrying.",
  },
  UNAUTHORIZED: {
    title: "Authentication Required",
    message: "Your session has expired or is invalid. Please log in again.",
  },
  FORBIDDEN: {
    title: "Access Restricted",
    message: "You do not have administrative clearance to access this operational resource.",
  },
  NOT_FOUND: {
    title: "Record Not Found",
    message: "The requested application, document, or service could not be located.",
  },
  VALIDATION_ERROR: {
    title: "Validation Error",
    message: "Please review the highlighted fields and ensure all required information is provided.",
  },
  RATE_LIMIT_EXCEEDED: {
    title: "Too Many Requests",
    message: "High request volume detected. Please pause for a few moments before trying again.",
  },
  GOVERNMENT_PORTAL_TIMEOUT: {
    title: "Government Portal Delay",
    message: "The external statutory registry is currently experiencing high latency. Your submission is safely queued.",
  },
  INTERNAL_ERROR: {
    title: "Service Error",
    message: "An unexpected system error occurred. Our operations team has been notified.",
  },
};

export function parseApiError(error: unknown): ParsedApiError {
  // 1. Axios Error or Mocked Axios Error Handling
  if (
    error instanceof AxiosError ||
    (typeof error === "object" && error !== null && ("response" in error || "isAxiosError" in error))
  ) {
    const errObj = error as {
      code?: string;
      message?: string;
      response?: {
        status?: number;
        data?: ApiResponseError | ApiErrorPayload;
      };
    };
    const status = errObj.response?.status;
    const responseData = errObj.response?.data;

    // Extract backend error payload if present
    const isObjectResponse = typeof responseData === "object" && responseData !== null;
    const backendError: ApiErrorPayload | undefined =
      isObjectResponse && "error" in responseData
        ? responseData.error
        : isObjectResponse && "code" in responseData
          ? (responseData as ApiErrorPayload)
          : undefined;

    if (backendError?.code && ERROR_CODE_MAP[backendError.code]) {
      const mapped = ERROR_CODE_MAP[backendError.code]!;
      const fieldErrors = extractFieldErrors(backendError.details);

      return {
        code: backendError.code,
        title: mapped.title,
        message: backendError.message || mapped.message,
        statusCode: status,
        fieldErrors,
        isAuthError: status === 401,
      };
    }

    if (backendError?.code) {
      return {
        code: backendError.code,
        title: "API Error",
        message: backendError.message || "An error occurred during request processing.",
        statusCode: status,
        fieldErrors: extractFieldErrors(backendError.details),
      };
    }

    // HTTP Status Code Fallbacks
    switch (status) {
      case 400:
        return {
          code: "BAD_REQUEST",
          title: "Invalid Request",
          message: backendError?.message || "The request could not be understood by the server.",
          statusCode: 400,
          fieldErrors: extractFieldErrors(backendError?.details),
        };
      case 401:
        return {
          code: "UNAUTHORIZED",
          title: "Session Expired",
          message: "Your session has expired. Please sign in again to continue.",
          statusCode: 401,
          isAuthError: true,
        };
      case 403:
        return {
          code: "FORBIDDEN",
          title: "Access Denied",
          message: "You do not have permission to view or perform actions on this resource.",
          statusCode: 403,
        };
      case 404:
        return {
          code: "NOT_FOUND",
          title: "Not Found",
          message: backendError?.message || "The requested item was not found.",
          statusCode: 404,
        };
      case 409:
        return {
          code: "CONFLICT",
          title: "Resource Conflict",
          message: backendError?.message || "This record already exists in our system.",
          statusCode: 409,
        };
      case 422:
        return {
          code: "UNPROCESSABLE_ENTITY",
          title: "Validation Error",
          message: backendError?.message || "Please check the form for invalid inputs.",
          statusCode: 422,
          fieldErrors: extractFieldErrors(backendError?.details),
        };
      case 429:
        return {
          code: "RATE_LIMITED",
          title: "Rate Limit Exceeded",
          message: "Too many requests. Please wait a moment before trying again.",
          statusCode: 429,
        };
      case 500:
      case 502:
      case 503:
        return {
          code: "SERVER_ERROR",
          title: "System Unavailable",
          message: "Swift Doc services are momentarily unavailable. Please try again shortly.",
          statusCode: status,
        };
      default:
        if (errObj.code === "ECONNABORTED" || (errObj.message && String(errObj.message).toLowerCase().includes("timeout"))) {
          return {
            code: "TIMEOUT",
            title: "Request Timeout",
            message: "The server took too long to respond. Please verify your connection.",
            isNetworkError: true,
          };
        }
        if (!errObj.response) {
          return {
            code: "NETWORK_ERROR",
            title: "Network Connection Issue",
            message: "Unable to connect to Swift Doc servers. Please check your internet connection.",
            isNetworkError: true,
          };
        }
    }
  }

  // 2. Generic JavaScript Error
  if (error instanceof Error) {
    if (error.message.toLowerCase().includes("network")) {
      return {
        code: "NETWORK_ERROR",
        title: "Network Connection Issue",
        message: "Unable to connect to Swift Doc servers. Please check your internet connection.",
        isNetworkError: true,
      };
    }
    return {
      code: "CLIENT_ERROR",
      title: "Application Error",
      message: error.message || "An unexpected error occurred. Please try again.",
    };
  }

  // 3. Fallback
  return {
    code: "UNKNOWN",
    title: "Unexpected Error",
    message: "An unknown error occurred. Please refresh the page.",
  };
}

function extractFieldErrors(details: unknown): Record<string, string> | undefined {
  if (!details) return undefined;

  if (Array.isArray(details)) {
    const errors: Record<string, string> = {};
    for (const item of details) {
      if (typeof item === "object" && item !== null && "field" in item && "message" in item) {
        errors[String(item.field)] = String(item.message);
      }
    }
    return Object.keys(errors).length > 0 ? errors : undefined;
  }

  return undefined;
}
