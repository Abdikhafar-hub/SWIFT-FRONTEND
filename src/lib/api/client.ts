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
let currentSessionId: string | null = null;
let authGeneration = 1;
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
    const data = event.data;
    if (!data) return;

    if (data.type === "LOGOUT" || data.type === "SESSION_EXPIRED") {
      // Check if message is for an older session generation
      if (data.generation && data.generation < authGeneration) {
        if (process.env.NODE_ENV !== "production") {
          console.debug(`[AUTH_DEBUG] STALE_SESSION_EVENT_IGNORED: Cross-tab logout generation ${data.generation} < current ${authGeneration}`);
        }
        return;
      }

      if (data.sessionId && currentSessionId && data.sessionId !== currentSessionId) {
        if (process.env.NODE_ENV !== "production") {
          console.debug(`[AUTH_DEBUG] STALE_SESSION_EVENT_IGNORED: Cross-tab logout for session ${data.sessionId} mismatch with current ${currentSessionId}`);
        }
        return;
      }

      if (process.env.NODE_ENV !== "production") {
        console.debug(`[AUTH_DEBUG] CROSS_TAB_LOGOUT_RECEIVED: Invalidating session generation ${authGeneration}`);
      }
      inMemoryAccessToken = null;
      currentSessionId = null;
      authGeneration++;
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
  getSessionId: (): string | null => {
    return currentSessionId;
  },
  getGeneration: (): number => {
    return authGeneration;
  },
  setAccessToken: (token: string | null, sessionId?: string): void => {
    if (token) {
      authGeneration++;
      inMemoryAccessToken = token;
      if (sessionId) {
        currentSessionId = sessionId;
      }
      // Reset any stale refresh lock or queue when new token is set
      isRefreshing = false;
      processQueue(new Error("Session generation updated"), null);
      if (process.env.NODE_ENV !== "production") {
        console.debug(`[AUTH_DEBUG] SESSION_CREATED: Active generation is now ${authGeneration}`);
      }
    } else {
      inMemoryAccessToken = null;
      currentSessionId = null;
    }
  },
  clearTokens: (
    reason: "LOGOUT" | "SESSION_EXPIRED" = "LOGOUT",
    forSessionId?: string,
    forGeneration?: number
  ): void => {
    // Guard against stale callers
    if (forGeneration && forGeneration !== authGeneration) {
      if (process.env.NODE_ENV !== "production") {
        console.debug(`[AUTH_DEBUG] STALE_SESSION_EVENT_IGNORED: Suppressed clearTokens for generation ${forGeneration} (Current: ${authGeneration})`);
      }
      return;
    }
    if (forSessionId && currentSessionId && forSessionId !== currentSessionId) {
      if (process.env.NODE_ENV !== "production") {
        console.debug(`[AUTH_DEBUG] STALE_SESSION_EVENT_IGNORED: Suppressed clearTokens for session ${forSessionId} (Current: ${currentSessionId})`);
      }
      return;
    }

    const previousSessionId = currentSessionId;
    const previousGen = authGeneration;

    inMemoryAccessToken = null;
    currentSessionId = null;
    authGeneration++;
    isRefreshing = false;
    processQueue(new Error("Auth tokens cleared"), null);

    if (process.env.NODE_ENV !== "production") {
      console.debug(`[AUTH_DEBUG] AUTH_STATE_CLEARED: Reason=${reason}, PreviousGen=${previousGen}, NewGen=${authGeneration}`);
    }

    if (authChannel) {
      try {
        authChannel.postMessage({
          type: reason,
          sessionId: previousSessionId,
          generation: previousGen,
        });
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

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  _authGeneration?: number;
  _sessionId?: string;
}

// Request Interceptor: Attach JWT Token and session generation metadata
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const customConfig = config as CustomAxiosRequestConfig;
    customConfig._authGeneration = tokenStorage.getGeneration();
    customConfig._sessionId = tokenStorage.getSessionId() || undefined;

    const token = tokenStorage.getAccessToken();
    if (token && customConfig.headers) {
      customConfig.headers.Authorization = `Bearer ${token}`;
    }
    return customConfig;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 & Token Refresh Queue with generation guards
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;

    // If request has no config or is missing, reject
    if (!originalRequest) {
      return Promise.reject(error);
    }

    // STALE SESSION GUARD: Check if request was dispatched under a previous auth generation
    const requestGen = originalRequest._authGeneration;
    const currentGen = tokenStorage.getGeneration();
    if (requestGen && requestGen !== currentGen) {
      if (process.env.NODE_ENV !== "production") {
        console.debug(
          `[AUTH_DEBUG] STALE_SESSION_EVENT_IGNORED: 401 response from request generation ${requestGen} ignored because current generation is ${currentGen}`
        );
      }
      return Promise.reject(error);
    }

    // If 401 Unauthorized and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If the failed request was the refresh endpoint itself or login, clear tokens (matching current generation) and reject
      if (
        originalRequest.url?.includes("/auth/refresh") ||
        originalRequest.url?.includes("/auth/login")
      ) {
        tokenStorage.clearTokens("SESSION_EXPIRED", originalRequest._sessionId, requestGen);
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

      if (process.env.NODE_ENV !== "production") {
        console.debug(`[AUTH_DEBUG] REFRESH_START: Gen=${currentGen}`);
      }

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

          if (process.env.NODE_ENV !== "production") {
            console.debug(`[AUTH_DEBUG] REFRESH_SUCCESS: Gen=${currentGen}`);
          }

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
        if (process.env.NODE_ENV !== "production") {
          console.debug(`[AUTH_DEBUG] REFRESH_FAILURE: Gen=${currentGen}`);
        }
        processQueue(refreshErr, null);
        tokenStorage.clearTokens("SESSION_EXPIRED", originalRequest._sessionId, requestGen);
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
