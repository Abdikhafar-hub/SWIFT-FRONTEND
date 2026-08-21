import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AdminStartQcModal } from "@/components/domain/admin/admin-start-qc-modal";
import { AdminQcModal } from "@/components/domain/admin/admin-qc-modal";
import { adminApi } from "@/lib/api/admin";

// Mock router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  useParams: () => ({ id: "app-qc-1" }),
}));

// Mock adminApi
vi.mock("@/lib/api/admin", () => ({
  adminApi: {
    getQcMetrics: vi.fn().mockResolvedValue({
      pendingInspection: 5,
      certifiedPasses: 12,
      returnedFlagged: 2,
      totalMonitored: 19,
    }),
    getQcQueue: vi.fn().mockResolvedValue({
      items: [
        {
          id: "app-qc-1",
          applicationNumber: "SD-QC-2026-001",
          client: { fullName: "Kenya Enterprises Ltd", email: "info@kenyaent.co.ke" },
          service: { name: "CR12 Official Search" },
          status: "QUALITY_CHECK",
          priority: "HIGH",
          createdAt: "2026-08-20T10:00:00Z",
          progress: { totalRequirements: 3, satisfied: 2, failed: 0, pending: 1 },
        },
      ],
      pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
    }),
    getQcEligibleApplications: vi.fn().mockResolvedValue([
      {
        id: "cand-1",
        applicationNumber: "SD-2026-888",
        client: { fullName: "Safari Holdings" },
        service: { name: "Business Permit Registration" },
        status: "DOCUMENT_RECEIVED",
        priority: "NORMAL",
        eligible: true,
      },
      {
        id: "cand-2",
        applicationNumber: "SD-2026-999",
        client: { fullName: "Incomplete Filing Co" },
        service: { name: "Tax Compliance Certificate" },
        status: "NEW",
        priority: "LOW",
        eligible: false,
        ineligibilityReason: "2 required documents missing or unverified",
      },
    ]),
    startQcInspection: vi.fn().mockResolvedValue({
      applicationId: "cand-1",
      status: "QUALITY_CHECK",
    }),
    performQualityCheck: vi.fn().mockResolvedValue({
      id: "qc-rec-1",
      result: "PASSED",
    }),
    getQcWorkspace: vi.fn().mockResolvedValue({
      application: {
        id: "app-qc-1",
        applicationNumber: "SD-QC-2026-001",
        client: { fullName: "Kenya Enterprises Ltd", email: "info@kenyaent.co.ke" },
        service: { name: "CR12 Official Search" },
        status: "QUALITY_CHECK",
        priority: "HIGH",
        createdAt: "2026-08-20T10:00:00Z",
        requirements: [],
        documents: [],
        qualityChecks: [],
        clientActions: [],
      },
      readiness: {
        ready: true,
        satisfiedRequiredRequirements: 3,
        requiredRequirements: 3,
        isPaymentComplete: true,
      },
      slaTimeline: null,
    }),
    reviewQcItem: vi.fn().mockResolvedValue({ requirementId: "req-1", action: "PASS" }),
    submitQcDecision: vi.fn().mockResolvedValue({ status: "READY_FOR_DELIVERY", result: "PASSED" }),
  },
}));

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
}

describe("Quality Control Operations Center", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  it("renders AdminStartQcModal and loads eligible application candidates", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AdminStartQcModal isOpen={true} onClose={() => {}} />
      </QueryClientProvider>
    );

    expect(screen.getByText("Start Quality Control Inspection")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("#SD-2026-888")).toBeInTheDocument();
      expect(screen.getByText("#SD-2026-999")).toBeInTheDocument();
    });

    expect(screen.getByText("Eligible")).toBeInTheDocument();
    expect(screen.getByText("Ineligible")).toBeInTheDocument();
  });

  it("handles candidate selection and launches inspection", async () => {
    const onSuccess = vi.fn();
    render(
      <QueryClientProvider client={queryClient}>
        <AdminStartQcModal isOpen={true} onClose={() => {}} onSuccess={onSuccess} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("#SD-2026-888")).toBeInTheDocument();
    });

    // Select eligible candidate
    fireEvent.click(screen.getByText("#SD-2026-888"));

    const submitBtn = screen.getByRole("button", { name: /launch qc workspace/i });
    expect(submitBtn).toBeEnabled();

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(adminApi.startQcInspection).toHaveBeenCalledWith({
        applicationId: "cand-1",
        priority: "NORMAL",
        notes: undefined,
      });
    });
  });

  it("prevents starting inspection when an ineligible candidate is selected", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AdminStartQcModal isOpen={true} onClose={() => {}} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("#SD-2026-999")).toBeInTheDocument();
    });

    // Select ineligible candidate
    fireEvent.click(screen.getByText("#SD-2026-999"));

    expect(screen.getByText(/2 required documents missing or unverified/i)).toBeInTheDocument();

    const submitBtn = screen.getByRole("button", { name: /launch qc workspace/i });
    expect(submitBtn).toBeDisabled();
  });

  it("executes formal QC sign-off via AdminQcModal", async () => {
    const onSuccess = vi.fn();
    render(
      <QueryClientProvider client={queryClient}>
        <AdminQcModal
          isOpen={true}
          onClose={() => {}}
          applicationId="app-qc-1"
          applicationNumber="SD-QC-2026-001"
          onSuccess={onSuccess}
        />
      </QueryClientProvider>
    );

    expect(screen.getByText("Statutory Quality Control (QC) Audit")).toBeInTheDocument();

    const certifyBtn = screen.getByRole("button", { name: /certify quality check/i });
    fireEvent.click(certifyBtn);

    await waitFor(() => {
      expect(adminApi.performQualityCheck).toHaveBeenCalledWith("app-qc-1", expect.objectContaining({
        result: "PASSED",
      }));
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
