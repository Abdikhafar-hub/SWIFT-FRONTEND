import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AdminManualSlaModal } from "@/components/domain/admin/admin-manual-sla-modal";
import { AdminSlaModal } from "@/components/domain/admin/admin-sla-modal";
import { AdminEditSlaModal } from "@/components/domain/admin/admin-edit-sla-modal";
import { AdminSlaDetailDrawer } from "@/components/domain/admin/admin-sla-detail-drawer";
import { adminApi } from "@/lib/api/admin";

// Mock adminApi
vi.mock("@/lib/api/admin", () => ({
  adminApi: {
    getApplications: vi.fn().mockResolvedValue({
      items: [
        {
          id: "app-1",
          applicationNumber: "SD-2026-001",
          client: { fullName: "Jane Doe Business Director" },
          service: { name: "Company Incorporation" },
          status: "IN_PROCESSING",
          dueAt: "2026-08-25T12:00:00Z",
        },
      ],
      pagination: { total: 1, page: 1, limit: 15, totalPages: 1 },
    }),
    createManualSlaEntry: vi.fn().mockResolvedValue({ id: "app-1", slaStatus: "ON_TRACK" }),
    pauseSla: vi.fn().mockResolvedValue({ id: "app-1", slaStatus: "PAUSED" }),
    resumeSla: vi.fn().mockResolvedValue({ id: "app-1", slaStatus: "ON_TRACK" }),
    updateSlaRecord: vi.fn().mockResolvedValue({ id: "app-1", priority: "HIGH" }),
    getSlaDetail: vi.fn().mockResolvedValue({
      applicationId: "app-1",
      applicationNumber: "SD-2026-001",
      slaStatus: "ON_TRACK",
      isPaused: false,
      startedAt: "2026-08-20T10:00:00Z",
      dueAt: "2026-08-25T10:00:00Z",
      slaTargetHours: 48,
      activeProcessingHours: 12,
      internalPausedHours: 0,
      totalElapsedHours: 12,
      events: [
        {
          id: "evt-1",
          eventType: "STARTED",
          category: "SLA_INITIATION",
          reason: "Initial submission",
          startedAt: "2026-08-20T10:00:00Z",
          durationMinutes: 0,
        },
      ],
    }),
    recalculateSla: vi.fn().mockResolvedValue({ id: "app-1", slaStatus: "ON_TRACK" }),
    completeSla: vi.fn().mockResolvedValue({ id: "app-1", slaStatus: "COMPLETED" }),
  },
}));

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
}

describe("Admin SLA Operations & Management Console", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  describe("AdminManualSlaModal Component", () => {
    it("renders manual entry form, application selector, and creates entry", async () => {
      const handleClose = vi.fn();
      const handleSuccess = vi.fn();

      render(
        <QueryClientProvider client={queryClient}>
          <AdminManualSlaModal isOpen={true} onClose={handleClose} onSuccess={handleSuccess} />
        </QueryClientProvider>
      );

      expect(screen.getByText(/Create Manual SLA Operational Entry/i)).toBeInTheDocument();

      // Wait for application options to populate in DOM
      await screen.findByText(/SD-2026-001/i);

      // Select target application from select dropdowns
      const comboboxes = screen.getAllByRole("combobox");
      fireEvent.change(comboboxes[0], { target: { value: "app-1" } });

      // Provide audit justification
      const reasonInput = screen.getByPlaceholderText(/Provide explicit operational context/i);
      fireEvent.change(reasonInput, { target: { value: "Manual legacy migration for client contract" } });


      // Click initialize button
      const submitBtn = screen.getByRole("button", { name: /Initialize SLA Entry/i });
      expect(submitBtn).not.toBeDisabled();
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(adminApi.createManualSlaEntry).toHaveBeenCalledWith(
          expect.objectContaining({
            applicationId: "app-1",
            slaType: "STANDARD",
            durationValue: 48,
            durationUnit: "HOURS",
            reason: "Manual legacy migration for client contract",
          })
        );
        expect(handleClose).toHaveBeenCalled();
        expect(handleSuccess).toHaveBeenCalled();
      });
    });
  });

  describe("AdminSlaModal Component", () => {
    it("submits SLA pause with statutory justification category", async () => {
      const handleClose = vi.fn();
      const handleSuccess = vi.fn();

      render(
        <QueryClientProvider client={queryClient}>
          <AdminSlaModal
            applicationId="app-1"
            applicationNumber="SD-2026-001"
            isOpen={true}
            mode="PAUSE"
            onClose={handleClose}
            onSuccess={handleSuccess}
          />
        </QueryClientProvider>
      );

      expect(screen.getByText(/Pause Statutory SLA Clock/i)).toBeInTheDocument();

      const pauseBtn = screen.getByRole("button", { name: /Confirm SLA Pause/i });
      fireEvent.click(pauseBtn);

      await waitFor(() => {
        expect(adminApi.pauseSla).toHaveBeenCalledWith(
          "app-1",
          expect.objectContaining({
            reason: expect.stringContaining("Awaiting Client Document"),
          })
        );
        expect(handleClose).toHaveBeenCalled();
        expect(handleSuccess).toHaveBeenCalled();
      });
    });

    it("submits SLA resumption notes", async () => {
      const handleClose = vi.fn();
      const handleSuccess = vi.fn();

      render(
        <QueryClientProvider client={queryClient}>
          <AdminSlaModal
            applicationId="app-1"
            applicationNumber="SD-2026-001"
            isOpen={true}
            mode="RESUME"
            onClose={handleClose}
            onSuccess={handleSuccess}
          />
        </QueryClientProvider>
      );

      expect(screen.getByText(/Resume Statutory SLA Clock/i)).toBeInTheDocument();

      const resumeBtn = screen.getByRole("button", { name: /Resume SLA Clock/i });
      fireEvent.click(resumeBtn);

      await waitFor(() => {
        expect(adminApi.resumeSla).toHaveBeenCalledWith(
          "app-1",
          expect.objectContaining({
            reason: expect.any(String),
          })
        );
        expect(handleClose).toHaveBeenCalled();
        expect(handleSuccess).toHaveBeenCalled();
      });
    });
  });

  describe("AdminEditSlaModal Component", () => {
    it("updates priority tier and due date with audit reason", async () => {
      const handleClose = vi.fn();
      const handleSuccess = vi.fn();

      render(
        <QueryClientProvider client={queryClient}>
          <AdminEditSlaModal
            record={{ id: "app-1", applicationNumber: "SD-2026-001", priority: "NORMAL", dueAt: "2026-08-25T12:00:00Z" }}
            isOpen={true}
            onClose={handleClose}
            onSuccess={handleSuccess}
          />
        </QueryClientProvider>
      );

      expect(screen.getByText(/Modify SLA Parameters/i)).toBeInTheDocument();

      const comboboxes = screen.getAllByRole("combobox");
      fireEvent.change(comboboxes[0], { target: { value: "HIGH" } });

      const reasonArea = screen.getByPlaceholderText(/Explain why the SLA parameters or due date were altered/i);
      fireEvent.change(reasonArea, { target: { value: "Upgraded due to VIP client request" } });

      const saveBtn = screen.getByRole("button", { name: /Save SLA Parameters/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(adminApi.updateSlaRecord).toHaveBeenCalledWith(
          "app-1",
          expect.objectContaining({
            priority: "HIGH",
            reason: "Upgraded due to VIP client request",
          })
        );
        expect(handleClose).toHaveBeenCalled();
        expect(handleSuccess).toHaveBeenCalled();
      });
    });
  });

  describe("AdminSlaDetailDrawer Component", () => {
    it("fetches and renders SLA breakdown KPIs and event timeline", async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <AdminSlaDetailDrawer
            applicationId="app-1"
            isOpen={true}
            onClose={vi.fn()}
            onOpenPauseModal={vi.fn()}
            onOpenEditModal={vi.fn()}
          />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(adminApi.getSlaDetail).toHaveBeenCalledWith("app-1");
        expect(screen.getByText(/SLA Dossier Details • #SD-2026-001/i)).toBeInTheDocument();
        expect(screen.getByText(/48h/i)).toBeInTheDocument();
        expect(screen.getByText(/Statutory SLA Audit Timeline/i)).toBeInTheDocument();
        expect(screen.getByText(/SLA_INITIATION/i)).toBeInTheDocument();
      });
    });
  });
});
