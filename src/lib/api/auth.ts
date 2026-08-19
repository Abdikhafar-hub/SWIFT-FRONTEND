/**
 * Swift Doc Authentication API Endpoints
 */

import { apiClient, tokenStorage } from "./client";
import type {
  ApiResponse,
  LoginPayload,
  LoginResponseData,
  RegisterPayload,
  RegisterResponseData,
  RefreshResponseData,
  User,
  ClientProfile,
  PasswordResetRequestPayload,
  PasswordResetConfirmPayload,
} from "@/types";

export const authApi = {
  /**
   * Authenticates user via email and password
   */
  async login(payload: LoginPayload): Promise<LoginResponseData> {
    const res = await apiClient.post<ApiResponse<LoginResponseData>>("/auth/login", payload);
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Login failed");
    }
    const { tokens, user, client } = res.data.data;
    tokenStorage.setAccessToken(tokens.accessToken);
    if (tokens.refreshToken) {
      tokenStorage.setRefreshToken(tokens.refreshToken);
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("swift_doc_user", JSON.stringify(user));
      if (client) {
        localStorage.setItem("swift_doc_client", JSON.stringify(client));
      }
    }
    return res.data.data;
  },

  /**
   * Registers a new client account
   */
  async register(payload: RegisterPayload): Promise<RegisterResponseData> {
    const res = await apiClient.post<ApiResponse<RegisterResponseData>>("/auth/register", payload);
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Registration failed");
    }
    const { tokens, user, client } = res.data.data;
    tokenStorage.setAccessToken(tokens.accessToken);
    if (tokens.refreshToken) {
      tokenStorage.setRefreshToken(tokens.refreshToken);
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("swift_doc_user", JSON.stringify(user));
      localStorage.setItem("swift_doc_client", JSON.stringify(client));
    }
    return res.data.data;
  },

  /**
   * Fetches current authenticated user session
   */
  async getMe(): Promise<{ user: User; client: ClientProfile | null }> {
    const res = await apiClient.get<ApiResponse<any>>("/auth/me");
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to fetch user session");
    }
    const data = res.data.data;
    if (data.user) {
      return { user: data.user, client: data.client ?? null };
    }
    // Normalized root structure from backend /auth/me
    const user: User = {
      id: data.id,
      email: data.email,
      role: data.role,
      isActive: data.isActive ?? true,
      isEmailVerified: data.isEmailVerified ?? false,
      lastLoginAt: data.lastLoginAt ?? null,
      organizationId: data.organization?.id ?? data.organizationId ?? "",
      createdAt: data.createdAt,
    };
    const client: ClientProfile | null = data.clientProfile || data.client || null;
    return { user, client };
  },

  /**
   * Refreshes access token
   */
  async refresh(refreshToken: string): Promise<RefreshResponseData> {
    const res = await apiClient.post<ApiResponse<RefreshResponseData>>("/auth/refresh", {
      refreshToken,
    });
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Token refresh failed");
    }
    return res.data.data;
  },

  /**
   * Logs out user and revokes active session
   */
  async logout(): Promise<void> {
    try {
      const refreshToken = tokenStorage.getRefreshToken();
      if (refreshToken) {
        await apiClient.post("/auth/logout", { refreshToken });
      }
    } catch {
      // Best-effort logout
    } finally {
      tokenStorage.clearTokens();
    }
  },

  /**
   * Request password reset instructions
   */
  async forgotPassword(payload: PasswordResetRequestPayload): Promise<{ message: string }> {
    const res = await apiClient.post<ApiResponse<{ message: string }>>(
      "/auth/forgot-password",
      payload
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Password reset request failed");
    }
    return res.data.data;
  },

  /**
   * Confirm password reset with token
   */
  async resetPassword(payload: PasswordResetConfirmPayload): Promise<{ message: string }> {
    const res = await apiClient.post<ApiResponse<{ message: string }>>(
      "/auth/reset-password",
      payload
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Password reset confirmation failed");
    }
    return res.data.data;
  },

  /**
   * Change current authenticated password
   */
  async changePassword(payload: { currentPassword: string; newPassword: string }): Promise<{ message: string }> {
    const res = await apiClient.post<ApiResponse<{ message: string }>>(
      "/auth/change-password",
      payload
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Password update failed");
    }
    return res.data.data;
  },

  /**
   * Verify email address with 6-digit OTP code
   */
  async verifyOtp(code: string): Promise<{ success: boolean; isEmailVerified: boolean; message: string }> {
    const res = await apiClient.post<ApiResponse<{ success: boolean; isEmailVerified: boolean; message: string }>>(
      "/auth/verify-otp",
      { code }
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Email verification failed");
    }
    return res.data.data;
  },

  /**
   * Resend verification OTP code
   */
  async resendOtp(): Promise<{ success: boolean; message: string; mockOtp?: string }> {
    const res = await apiClient.post<ApiResponse<{ success: boolean; message: string; mockOtp?: string }>>(
      "/auth/resend-otp",
      {}
    );
    if (!res.data.success) {
      throw new Error(res.data.error.message || "Failed to resend verification code");
    }
    return res.data.data;
  },
};

