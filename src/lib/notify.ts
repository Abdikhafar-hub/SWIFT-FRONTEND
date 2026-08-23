/**
 * Swift Doc Global Notification Service
 * Unified production-grade toast abstraction built on top of Sonner.
 * Ensures consistent visual feedback, accessible ARIA attributes,
 * robust deduplication, and automatic API error sanitization across the platform.
 */

import { toast, type ExternalToast } from "sonner";
import { parseApiError } from "@/lib/utils/error";

export interface NotifyOptions extends ExternalToast {
  /** Optional custom title header for multi-line notifications */
  title?: string;
  /** Unique key to prevent duplicate notifications from spamming */
  id?: string;
}

/**
 * Standardized notification wrapper for Swift Doc.
 * Use this interface exclusively rather than calling raw toast libraries directly.
 */
export const notify = {
  /**
   * Display a success notification for completed operations.
   */
  success(message: string, options?: NotifyOptions): string | number {
    const { title, ...toastOptions } = options || {};
    if (title) {
      return toast.success(title, {
        description: message,
        ...toastOptions,
      });
    }
    return toast.success(message, toastOptions);
  },

  /**
   * Display an error notification. Accepts a string message or an error object
   * (Axios error, Error, API payload) which is automatically parsed and sanitized.
   */
  error(errorOrMessage: unknown, options?: NotifyOptions): string | number {
    const { title, ...toastOptions } = options || {};

    if (typeof errorOrMessage === "string") {
      if (title) {
        return toast.error(title, {
          description: errorOrMessage,
          ...toastOptions,
        });
      }
      return toast.error(errorOrMessage, toastOptions);
    }

    // Process unknown/Error object through parseApiError utility
    const parsed = parseApiError(errorOrMessage);
    const displayTitle = title || parsed.title || "Action Failed";
    const displayMessage = parsed.message || "An unexpected error occurred. Please try again.";

    return toast.error(displayTitle, {
      description: displayMessage,
      ...toastOptions,
    });
  },

  /**
   * Display a warning notification for non-fatal operational attention.
   */
  warning(message: string, options?: NotifyOptions): string | number {
    const { title, ...toastOptions } = options || {};
    if (title) {
      return toast.warning(title, {
        description: message,
        ...toastOptions,
      });
    }
    return toast.warning(message, toastOptions);
  },

  /**
   * Display an informative event notification.
   */
  info(message: string, options?: NotifyOptions): string | number {
    const { title, ...toastOptions } = options || {};
    if (title) {
      return toast.info(title, {
        description: message,
        ...toastOptions,
      });
    }
    return toast.info(message, toastOptions);
  },

  /**
   * Display a loading state notification for ongoing async operations.
   */
  loading(message: string, options?: NotifyOptions): string | number {
    const { title, ...toastOptions } = options || {};
    if (title) {
      return toast.loading(title, {
        description: message,
        ...toastOptions,
      });
    }
    return toast.loading(message, toastOptions);
  },

  /**
   * Wrap an asynchronous promise lifecycle (loading -> success or error).
   */
  promise<T>(
    promise: Promise<T> | (() => Promise<T>),
    msgs: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((err: unknown) => string);
    },
    options?: NotifyOptions
  ) {
    return toast.promise(promise, {
      loading: msgs.loading,
      success: msgs.success,
      error: (err) => {
        if (typeof msgs.error === "function") {
          return msgs.error(err);
        }
        if (msgs.error) return msgs.error;
        const parsed = parseApiError(err);
        return parsed.message;
      },
      ...options,
    });
  },

  /**
   * Dismiss an active toast by ID, or clear all active toasts if no ID is passed.
   */
  dismiss(id?: string | number): void {
    toast.dismiss(id);
  },
};
