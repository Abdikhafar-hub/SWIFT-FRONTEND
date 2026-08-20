/**
 * Swift Doc Production API Client
 * - Base Axios configuration
 * - Automatic Authorization Header attachment
 * - Concurrent 401 Auto-Refresh Queue with token rotation
 * - Response unwrapping & typed error forwarding
 */

import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from "axios";
import { APP_CONFIG } from "@/lib/constants/config";
import type { ApiResponse, RefreshResponseData } from "@/types";

let inMemoryAccessToken: string | null = null;
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

// Multi-Tab Synchronization Channel
const AUTH_BROADCAST_CHANNEL = "swiftdoc_auth_channel";
let authChannel: BroadcastChannel | null = null;

if (typeof window !== "undefined" && "BroadcastChannel" in window) {
  authChannel = new BroadcastChannel(AUTH_BROADCAST_CHANNEL);
  authChannel.onmessage = (event) => {
    if (event.data?.type === "LOGOUT" || event.data?.type === "SESSION_EXPIRED") {
      inMemoryAccessToken = null;
      notifyAuthChange(true);
    }
  };
}

// Event listener for auth logout
type AuthListener = (isLoggedOut: boolean) => void;
const authListeners = new Set<AuthListener>();

export function subscribeAuthChange(listener: AuthListener): () => void {
  authListeners.add(listener);
  return () => authListeners.delete(listener);
}

function notifyAuthChange(isLoggedOut: boolean): void {
  authListeners.forEach((listener) => listener(isLoggedOut));
}

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export const tokenStorage = {
  getAccessToken: (): string | null => {
    return inMemoryAccessToken;
  },
  setAccessToken: (token: string | null): void => {
    inMemoryAccessToken = token;
  },
  clearTokens: (reason: "LOGOUT" | "SESSION_EXPIRED" = "LOGOUT"): void => {
    inMemoryAccessToken = null;
    if (authChannel) {
      try {
        authChannel.postMessage({ type: reason });
      } catch {
        // Fallback silently if channel is closed
      }
    }
    notifyAuthChange(true);
  },
};

export const apiClient: AxiosInstance = axios.create({
  baseURL: APP_CONFIG.apiBaseUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 30000,
});

// Request Interceptor: Attach JWT Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStorage.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 & Token Refresh Queue
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If 401 Unauthorized and not already retrying
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // If the failed request was the refresh endpoint itself or login, clear tokens and reject
      if (
        originalRequest.url?.includes("/auth/refresh") ||
        originalRequest.url?.includes("/auth/login")
      ) {
        tokenStorage.clearTokens("SESSION_EXPIRED");
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue the concurrent request until refresh finishes
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await axios.post<ApiResponse<RefreshResponseData>>(
          `${APP_CONFIG.apiBaseUrl}/auth/refresh`,
          {},
          {
            withCredentials: true,
            headers: { "Content-Type": "application/json" },
          }
        );

        if (refreshResponse.data && refreshResponse.data.success) {
          const { tokens } = refreshResponse.data.data;
          tokenStorage.setAccessToken(tokens.accessToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
          }

          processQueue(null, tokens.accessToken);
          return apiClient(originalRequest);
        } else {
          throw new Error("Token refresh returned unsuccessful response");
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        tokenStorage.clearTokens("SESSION_EXPIRED");
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
