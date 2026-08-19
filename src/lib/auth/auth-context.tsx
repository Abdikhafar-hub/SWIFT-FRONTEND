"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authApi } from "@/lib/api/auth";
import { tokenStorage, subscribeAuthChange } from "@/lib/api/client";
import { APP_CONFIG } from "@/lib/constants/config";
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
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [client, setClient] = useState<ClientProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const initSession = useCallback(async () => {
    try {
      const token = tokenStorage.getAccessToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      // Check cached localStorage first for fast hydration
      if (typeof window !== "undefined") {
        const cachedUser = localStorage.getItem(APP_CONFIG.userStorageKey);
        const cachedClient = localStorage.getItem(APP_CONFIG.clientStorageKey);
        if (cachedUser) {
          try {
            setUser(JSON.parse(cachedUser));
          } catch {
            // parse error fallback
          }
        }
        if (cachedClient) {
          try {
            setClient(JSON.parse(cachedClient));
          } catch {
            // parse error fallback
          }
        }
      }

      // Revalidate with backend /auth/me
      const data = await authApi.getMe();
      setUser(data.user);
      setClient(data.client);
    } catch {
      // Session expired or invalid
      tokenStorage.clearTokens();
      setUser(null);
      setClient(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initSession();

    // Subscribe to forced logouts from 401 refresh interceptors
    const unsubscribe = subscribeAuthChange((isLoggedOut) => {
      if (isLoggedOut) {
        setUser(null);
        setClient(null);
      }
    });

    return () => unsubscribe();
  }, [initSession]);

  const login = async (payload: LoginPayload) => {
    setIsLoading(true);
    try {
      const data = await authApi.login(payload);
      setUser(data.user);
      setClient(data.client);
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

  const logout = async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setClient(null);
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
