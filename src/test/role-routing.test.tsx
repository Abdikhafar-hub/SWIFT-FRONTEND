import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { AuthGuard } from "@/lib/auth/auth-guard";
import { useAuth } from "@/lib/auth/auth-context";

// Mock next/navigation
const mockPush = vi.fn();
const mockReplace = vi.fn();
let mockPathname = "/client";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  usePathname: () => mockPathname,
  useSearchParams: () => new URLSearchParams(),
}));

// Mock useAuth
vi.mock("@/lib/auth/auth-context", () => ({
  useAuth: vi.fn(),
}));

describe("Role-Based Routing and AuthGuard Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("AuthGuard Role Enforcement", () => {
    it("renders children when authenticated ADMIN accesses an ADMIN-allowed route", () => {
      (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        user: { id: "admin-1", email: "admin@swiftdoc.co.ke", role: "ADMIN" },
        role: "ADMIN",
        isAuthenticated: true,
        isLoading: false,
      });

      render(
        <AuthGuard allowedRoles={["ADMIN"]}>
          <div data-testid="admin-content">Admin Command Center Content</div>
        </AuthGuard>
      );

      expect(screen.getByTestId("admin-content")).toBeInTheDocument();
      expect(mockReplace).not.toHaveBeenCalled();
    });

    it("redirects ADMIN to /admin when trying to access a CLIENT-only route", async () => {
      mockPathname = "/client";
      (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        user: { id: "admin-1", email: "admin@swiftdoc.co.ke", role: "ADMIN" },
        role: "ADMIN",
        isAuthenticated: true,
        isLoading: false,
      });

      render(
        <AuthGuard allowedRoles={["CLIENT"]}>
          <div data-testid="client-content">Client Portal Content</div>
        </AuthGuard>
      );

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith("/admin");
      });
      expect(screen.queryByTestId("client-content")).not.toBeInTheDocument();
    });

    it("renders children when authenticated CLIENT accesses a CLIENT-allowed route", () => {
      mockPathname = "/client";
      (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        user: { id: "client-1", email: "client@example.com", role: "CLIENT" },
        role: "CLIENT",
        isAuthenticated: true,
        isLoading: false,
      });

      render(
        <AuthGuard allowedRoles={["CLIENT"]}>
          <div data-testid="client-content">Client Portal Content</div>
        </AuthGuard>
      );

      expect(screen.getByTestId("client-content")).toBeInTheDocument();
      expect(mockReplace).not.toHaveBeenCalled();
    });

    it("redirects CLIENT to /unauthorized when trying to access an ADMIN-only route", async () => {
      mockPathname = "/admin";
      (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        user: { id: "client-1", email: "client@example.com", role: "CLIENT" },
        role: "CLIENT",
        isAuthenticated: true,
        isLoading: false,
      });

      render(
        <AuthGuard allowedRoles={["ADMIN"]}>
          <div data-testid="admin-content">Admin Content</div>
        </AuthGuard>
      );

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith("/unauthorized");
      });
      expect(screen.queryByTestId("admin-content")).not.toBeInTheDocument();
    });

    it("redirects unauthenticated users to /login with encoded redirect path", async () => {
      mockPathname = "/admin/applications";
      (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        user: null,
        role: null,
        isAuthenticated: false,
        isLoading: false,
      });

      render(
        <AuthGuard allowedRoles={["ADMIN"]}>
          <div data-testid="admin-content">Admin Content</div>
        </AuthGuard>
      );

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith("/login?redirect=%2Fadmin%2Fapplications");
      });
    });

    it("shows loading state while verifying credentials", () => {
      (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        user: null,
        role: null,
        isAuthenticated: false,
        isLoading: true,
      });

      render(
        <AuthGuard allowedRoles={["ADMIN"]}>
          <div data-testid="admin-content">Admin Content</div>
        </AuthGuard>
      );

      expect(screen.getByText(/Verifying Credentials.../i)).toBeInTheDocument();
      expect(screen.queryByTestId("admin-content")).not.toBeInTheDocument();
    });
  });
});
