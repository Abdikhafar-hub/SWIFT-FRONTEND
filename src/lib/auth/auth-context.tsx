"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import { tokenStorage, subscribeAuthChange } from "@/lib/api/client";
import { useSessionTimer } from "@/hooks/use-session-timer";
import { SessionTimeoutModal } from "@/components/auth/session-timeout-modal";
import type {
  User,
  ClientProfile,
  UserRole,
  LoginPayload,
  RegisterPayload,
} from "@/types";

export interface AuthContextType {
  user: User | null;
  client: ClientProfile | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isClient: boolean;
  isAdmin: boolean;
  login: (payload: LoginPayload) => Promise<{ user: User; client: ClientProfile | null; role: UserRole }>;
  register: (payload: RegisterPayload) => Promise<{ user: User; client: ClientProfile | null; role: UserRole }>;
  logout: (reason?: string) => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [client, setClient] = useState<ClientProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(async (reason?: string) => {
    if (process.env.NODE_ENV !== "production") {
      console.debug(`[AUTH_DEBUG] LOGOUT_START: Reason=${reason || "user_initiated"}`);
    }
    setIsLoading(true);
    const activeGen = tokenStorage.getGeneration();
    const activeSession = tokenStorage.getSessionId();
    try {
      await authApi.logout();
    } finally {
      tokenStorage.clearTokens(
        reason === "expired" ? "SESSION_EXPIRED" : "LOGOUT",
        activeSession || undefined,
        activeGen
      );
      setUser(null);
      setClient(null);
      setIsLoading(false);
      if (process.env.NODE_ENV !== "production") {
        console.debug(`[AUTH_DEBUG] LOGOUT_SUCCESS: Auth state reset`);
      }
      if (typeof window !== "undefined") {
        if (reason === "expired") {
          router.push("/login?reason=expired");
        } else {
          router.push("/login");
        }
      }
    }
  }, [router]);

  const initSession = useCallback(async () => {
    try {
      if (process.env.NODE_ENV !== "production") {
        console.debug("[AUTH_DEBUG] REFRESH_START: Initializing session from HttpOnly cookie");
      }
      // 1. Silent token refresh via HttpOnly cookie
      await authApi.refresh();

      // 2. Fetch authenticated profile
      const data = await authApi.getMe();
      setUser(data.user);
      setClient(data.client);
      if (process.env.NODE_ENV !== "production") {
        console.debug(`[AUTH_DEBUG] SESSION_CREATED: InitSession success for user ${data.user.email}`);
      }
    } catch {
      // Session expired, unauthenticated, or no cookie present
      const currentGen = tokenStorage.getGeneration();
      tokenStorage.clearTokens("SESSION_EXPIRED", undefined, currentGen);
      setUser(null);
      setClient(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initSession();

    // Subscribe to forced logouts from 401 refresh interceptors or multi-tab broadcast
    const unsubscribe = subscribeAuthChange((isLoggedOut) => {
      if (isLoggedOut) {
        setUser(null);
        setClient(null);
      }
    });

    return () => unsubscribe();
  }, [initSession]);

  const login = async (payload: LoginPayload) => {
    if (process.env.NODE_ENV !== "production") {
      console.debug(`[AUTH_DEBUG] AUTH_LOGIN_START: Email=${payload.email}`);
    }
    setIsLoading(true);
    try {
      const data = await authApi.login(payload);
      setUser(data.user);
      setClient(data.client);
      if (process.env.NODE_ENV !== "production") {
        console.debug(`[AUTH_DEBUG] AUTH_LOGIN_SUCCESS: Role=${data.user.role}`);
      }
      return { user: data.user, client: data.client, role: data.user.role };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload) => {
    setIsLoading(true);
    try {
      const data = await authApi.register(payload);
      setUser(data.user);
      setClient(data.client);
      return { user: data.user, client: data.client, role: data.user.role };
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSession = async () => {
    await initSession();
  };

  const role = user?.role ?? null;
  const isAuthenticated = Boolean(user && tokenStorage.getAccessToken());
  const isClient = role === "CLIENT";
  const isAdmin = role === "ADMIN";

  // Client-side 5-minute inactivity session timer & 30-second warning modal
  const { showWarningModal, countdownSeconds, staySignedIn } = useSessionTimer({
    isAuthenticated,
    onLogout: (reason) => logout(reason),
  });

  const value: AuthContextType = {
    user,
    client,
    role,
    isAuthenticated,
    isLoading,
    isClient,
    isAdmin,
    login,
    register,
    logout,
    refreshSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <SessionTimeoutModal
        isOpen={showWarningModal}
        countdownSeconds={countdownSeconds}
        onStaySignedIn={staySignedIn}
        onLogout={() => logout("user_initiated")}
      />
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
