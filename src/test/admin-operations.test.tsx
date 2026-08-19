import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AdminQcModal } from "@/components/domain/admin/admin-qc-modal";
import { AdminManualPaymentModal } from "@/components/domain/admin/admin-manual-payment-modal";
import { AdminDeliveryModal } from "@/components/domain/admin/admin-delivery-modal";
import { adminApi } from "@/lib/api/admin";
import type { Application, Payment, ClientProfile } from "@/types";

// Mock adminApi
vi.mock("@/lib/api/admin", () => ({
  adminApi: {
    performQualityCheck: vi.fn().mockResolvedValue({ id: "qc-1", result: "PASSED" }),
    recordManualPayment: vi.fn().mockResolvedValue({ id: "tx-1", status: "SUCCESS" }),
    dispatchDelivery: vi.fn().mockResolvedValue({ id: "del-1", dispatchStatus: "DISPATCHED" }),
  },
}));

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
}

describe("Admin Operations & Compliance Suite", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  describe("AdminQcModal Component", () => {
    it("renders QC checklist and submits PASS verification", async () => {
      const handleClose = vi.fn();
      const handlePassed = vi.fn();

      render(
        <QueryClientProvider client={queryClient}>
          <AdminQcModal
            isOpen={true}
            onClose={handleClose}
            applicationId="app-99"
            applicationNumber="SD-2026-99"
            onPassed={handlePassed}
          />
        </QueryClientProvider>
      );

      expect(screen.getByText(/Statutory Quality Control \(QC\) Audit/i)).toBeInTheDocument();
      expect(screen.getByText(/Identity & Registry Name Match/i)).toBeInTheDocument();
      expect(screen.getByText(/Document Clarity & High-Resolution/i)).toBeInTheDocument();

      const passButton = screen.getByRole("button", { name: /Certify Quality Check \(PASS\)/i });
      expect(passButton).toBeInTheDocument();

      fireEvent.click(passButton);

      await waitFor(() => {
        expect(adminApi.performQualityCheck).toHaveBeenCalledWith(
          "app-99",
          expect.objectContaining({
            result: "PASSED",
          })
        );
        expect(handleClose).toHaveBeenCalled();
        expect(handlePassed).toHaveBeenCalled();
      });
    });

    it("switches to FAILED mode and requires justification reason", async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <AdminQcModal
            isOpen={true}
            onClose={vi.fn()}
            applicationId="app-99"
            applicationNumber="SD-2026-99"
          />
        </QueryClientProvider>
      );

      const failTab = screen.getByRole("button", { name: /Fail \/ Rejection/i });
      fireEvent.click(failTab);

      expect(screen.getByText(/Quality Check Failure Reason/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Record QC Failure \(REJECT\)/i })).toBeInTheDocument();
    });
  });

  describe("AdminManualPaymentModal Component", () => {
    it("renders invoice balance and records manual bank wire settlement", async () => {
      const mockInvoice: Payment = {
        id: "inv-100",
        organizationId: "org-1",
        clientId: "cli-1",
        applicationId: "app-100",
        invoiceNumber: "INV-2026-100",
        status: "ISSUED",
        isOverdue: false,
        subtotal: 15000,
        governmentFee: 10000,
        serviceFee: 5000,
        otherFee: 0,
        discount: 0,
        tax: 0,
        totalAmount: 15000,
        amountPaid: 0,
        amountDue: 15000,
        currency: "KES",
        issuedAt: "2026-08-11T10:00:00Z",
        createdAt: "2026-08-11T10:00:00Z",
        updatedAt: "2026-08-11T10:00:00Z",
      };

      const handleClose = vi.fn();
      const handleRecorded = vi.fn();

      render(
        <QueryClientProvider client={queryClient}>
          <AdminManualPaymentModal
            isOpen={true}
            onClose={handleClose}
            invoice={mockInvoice}
            onRecorded={handleRecorded}
          />
        </QueryClientProvider>
      );

      expect(screen.getByText(/Record Manual Statutory Settlement/i)).toBeInTheDocument();
      expect(screen.getAllByText(/KES 15,000/i).length).toBeGreaterThanOrEqual(1);

      const refInput = screen.getByPlaceholderText(/e\.g\. KCB-RTGS-9810234/i);
      fireEvent.change(refInput, { target: { value: "KCB-WIRE-889912" } });

      const submitButton = screen.getByRole("button", { name: /Record Payment Settlement/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(adminApi.recordManualPayment).toHaveBeenCalledWith(
          expect.objectContaining({
            paymentId: "inv-100",
            paymentMethod: "BANK",
            amount: 15000,
            externalReference: "KCB-WIRE-889912",
          })
        );
        expect(handleClose).toHaveBeenCalled();
        expect(handleRecorded).toHaveBeenCalled();
      });
    });
  });

  describe("AdminDeliveryModal Component", () => {
    it("dispatches physical courier delivery with tracking number", async () => {
      const mockApp: Application = {
        id: "app-200",
        organizationId: "org-1",
        clientId: "cli-2",
        serviceId: "svc-1",
        applicationNumber: "SD-2026-200",
        status: "READY_FOR_DELIVERY",
        priority: "NORMAL",
        slaStatus: "ON_TRACK",
        startedAt: "2026-08-11T10:00:00Z",
        totalPausedDuration: 0,
        totalAmount: 15000,
        paidAmount: 15000,
        dueAmount: 0,
        currency: "KES",
        createdAt: "2026-08-11T10:00:00Z",
        updatedAt: "2026-08-11T10:00:00Z",
      };

      const mockClient: ClientProfile = {
        id: "cli-2",
        organizationId: "org-1",
        userId: "usr-2",
        clientNumber: "CLI-2026-002",
        fullName: "Nairobi Logistics Director",
        email: "director@nairobilogistics.co.ke",
        phone: "+254711223344",
        clientType: "BUSINESS",
        address: "CBD Tower, 8th Floor, Nairobi",
        createdAt: "2026-08-11T10:00:00Z",
        updatedAt: "2026-08-11T10:00:00Z",
      };

      const handleClose = vi.fn();
      const handleDispatched = vi.fn();

      render(
        <QueryClientProvider client={queryClient}>
          <AdminDeliveryModal
            isOpen={true}
            onClose={handleClose}
            application={mockApp}
            client={mockClient}
            onDispatched={handleDispatched}
          />
        </QueryClientProvider>
      );

      expect(screen.getByText(/Dispatch Certificate & Statutory Delivery/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue("Nairobi Logistics Director")).toBeInTheDocument();

      const trackingInput = screen.getByPlaceholderText(/e\.g\. FRG-NBO-2026-9812/i);
      fireEvent.change(trackingInput, { target: { value: "FRG-NBO-8812" } });

      const submitButton = screen.getByRole("button", { name: /Confirm Dispatch/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(adminApi.dispatchDelivery).toHaveBeenCalledWith(
          "app-200",
          expect.objectContaining({
            deliveryMethod: "PHYSICAL",
            recipientName: "Nairobi Logistics Director",
            trackingNumber: "FRG-NBO-8812",
          })
        );
        expect(handleClose).toHaveBeenCalled();
        expect(handleDispatched).toHaveBeenCalled();
      });
    });
  });
});
