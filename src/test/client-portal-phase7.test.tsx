import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SlaTimelineView } from "@/components/domain/sla-timeline-view";
import { DeliveryStatusView } from "@/components/domain/delivery-status-view";
import { RequirementSubmissionCard } from "@/components/domain/requirement-submission-card";
import { GovernmentTrackerCard } from "@/components/domain/government-tracker-card";
import type {
  ApplicationRequirement,
  GovernmentApplication,
  ApplicationDelivery,
  ApplicationSlaEvent,
} from "@/types";

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

describe("Phase 7 Client Portal E2E Integration Test Suite", () => {
  describe("1. SlaTimelineView Component", () => {
    it("renders SLA operational status, pause credits, and target deadlines", () => {
      const mockSlaEvents: ApplicationSlaEvent[] = [
        {
          id: "event-1",
          applicationId: "app-701",
          category: "CLIENT_WAITING",
          eventType: "PAUSED",
          startedAt: "2026-08-15T09:00:00Z",
          endedAt: "2026-08-15T15:00:00Z",
          durationMinutes: 360,
          reason: "Awaiting Client Tax Certificate Upload",
          createdAt: "2026-08-15T09:00:00Z",
        },
      ];

      render(
        <SlaTimelineView
          slaStatus="ON_TRACK"
          startedAt="2026-08-14T08:00:00Z"
          dueAt="2026-08-18T17:00:00Z"
          totalPausedDurationMinutes={360}
          slaEvents={mockSlaEvents}
          slaHours={48}
        />
      );

      expect(screen.getByText(/SLA Operational Timeline/i)).toBeInTheDocument();
      expect(screen.getByText(/SLA Operational State/i)).toBeInTheDocument();
      expect(screen.getByText(/SLA on Track/i)).toBeInTheDocument();
      expect(screen.getByText(/Target Commitment/i)).toBeInTheDocument();
      expect(screen.getByText(/48 Hours/i)).toBeInTheDocument();
      expect(screen.getByText(/Client Pause Credit/i)).toBeInTheDocument();
      expect(screen.getByText(/6 hrs/i)).toBeInTheDocument();
      expect(screen.getByText(/Awaiting Client Tax Certificate Upload/i)).toBeInTheDocument();
    });

    it("handles paused state correctly", () => {
      render(
        <SlaTimelineView
          slaStatus="PAUSED"
          startedAt="2026-08-14T08:00:00Z"
          pausedAt="2026-08-16T10:00:00Z"
          dueAt="2026-08-18T17:00:00Z"
          totalPausedDurationMinutes={120}
        />
      );

      expect(screen.getByText(/SLA Clock Is Currently Paused/i)).toBeInTheDocument();
    });
  });

  describe("2. DeliveryStatusView Component", () => {
    it("renders physical courier dispatch details with waybill tracking", () => {
      const mockDeliveries: ApplicationDelivery[] = [
        {
          id: "del-101",
          applicationId: "app-701",
          deliveryMethod: "COURIER",
          carrier: "Fargo Courier",
          trackingNumber: "FARGO-KE-99201",
          recipientName: "John Doe",
          recipientPhone: "0712345678",
          physicalAddress: "Kenyatta Avenue, Corner House 4th Floor",
          dispatchedAt: "2026-08-16T11:00:00Z",
          confirmationStatus: "DISPATCHED",
          status: "IN_TRANSIT",
          createdAt: "2026-08-16T10:00:00Z",
        },
      ];

      render(<DeliveryStatusView deliveries={mockDeliveries} status="READY_FOR_DELIVERY" />);

      expect(screen.getByText(/Dispatch Reference/i)).toBeInTheDocument();
      expect(screen.getByText(/Fargo Courier/i)).toBeInTheDocument();
      expect(screen.getByText(/FARGO-KE-99201/i)).toBeInTheDocument();
      expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
      expect(screen.getByText(/0712345678/i)).toBeInTheDocument();
      expect(screen.getByText(/Corner House 4th Floor/i)).toBeInTheDocument();
      expect(screen.getAllByText(/DISPATCHED/i).length).toBeGreaterThan(0);
    });

    it("renders digital download notification when method is DIGITAL_DOWNLOAD", () => {
      const digitalDeliveries: ApplicationDelivery[] = [
        {
          id: "del-102",
          applicationId: "app-701",
          deliveryMethod: "DIGITAL_DOWNLOAD",
          recipientName: "Jane Smith",
          recipientPhone: "0712345678",
          status: "DELIVERED",
          createdAt: "2026-08-16T10:00:00Z",
        },
      ];

      render(<DeliveryStatusView deliveries={digitalDeliveries} deliveredAt="2026-08-16T12:00:00Z" status="DELIVERED" />);

      expect(screen.getByText(/DIGITAL_DOWNLOAD/i)).toBeInTheDocument();
      expect(screen.getByText(/Jane Smith/i)).toBeInTheDocument();
    });
  });

  describe("3. RequirementSubmissionCard Component", () => {
    it("renders requirement with DATE type and validation inputs", () => {
      const dateReq: ApplicationRequirement = {
        id: "req-date-1",
        applicationId: "app-701",
        code: "TRAVEL_DATE",
        name: "Intended Travel Date",
        type: "DATE",
        description: "Please specify the exact date of arrival in Schengen zone.",
        required: true,
        displayOrder: 1,
        isSatisfied: false,
        status: "PENDING",
        createdAt: "2026-08-15T00:00:00Z",
      };

      const queryClient = createQueryClient();

      render(
        <QueryClientProvider client={queryClient}>
          <RequirementSubmissionCard applicationId="app-701" requirement={dateReq} />
        </QueryClientProvider>
      );

      expect(screen.getByText("Intended Travel Date")).toBeInTheDocument();
      expect(screen.getByText(/exact date of arrival/i)).toBeInTheDocument();
      expect(screen.getByText(/Mandatory/i)).toBeInTheDocument();
    });

    it("renders REJECTED requirement with rejection reason feedback", () => {
      const rejectedReq: ApplicationRequirement = {
        id: "req-rej-1",
        applicationId: "app-701",
        code: "BANK_STATEMENT",
        name: "Certified Bank Statement",
        type: "DOCUMENT",
        description: "6 months stamped bank statement.",
        required: true,
        displayOrder: 2,
        isSatisfied: false,
        status: "REJECTED",
        rejectionReason: "Statement submitted is older than 30 days. Please upload current 6-month statement.",
        createdAt: "2026-08-15T00:00:00Z",
      };

      const queryClient = createQueryClient();

      render(
        <QueryClientProvider client={queryClient}>
          <RequirementSubmissionCard applicationId="app-701" requirement={rejectedReq} />
        </QueryClientProvider>
      );

      expect(screen.getByText(/Compliance Officer Action Note/i)).toBeInTheDocument();
      expect(screen.getByText(/older than 30 days/i)).toBeInTheDocument();
    });
  });

  describe("4. GovernmentTrackerCard Component", () => {
    it("renders government application tracking and complete status history timeline", () => {
      const mockGovApp: GovernmentApplication = {
        id: "gov-701",
        applicationId: "app-701",
        platform: "ECITIZEN",
        governmentAgency: "Department of Immigration Services",
        governmentService: "Passport Renewal & Verification",
        status: "UNDER_PROCESSING",
        additionalInformationRequired: false,
        trackingNumber: "IMMI-PASSPORT-2026-7781",
        externalReference: "IMMI-PASSPORT-2026-7781",
        submittedAt: "2026-08-12T10:00:00Z",
        expectedCompletionAt: "2026-08-19T17:00:00Z",
        statusDescription: "Filing assigned to Senior Adjudication Officer.",
        createdAt: "2026-08-12T10:00:00Z",
        updatedAt: "2026-08-14T14:00:00Z",
        statusHistory: [
          {
            id: "sh-1",
            governmentApplicationId: "gov-701",
            fromStatus: "PREPARING",
            toStatus: "SUBMITTED",
            source: "ECITIZEN",
            statusDescription: "Transmitted to Immigration Portal",
            createdAt: "2026-08-12T10:00:00Z",
          },
          {
            id: "sh-2",
            governmentApplicationId: "gov-701",
            fromStatus: "SUBMITTED",
            toStatus: "UNDER_PROCESSING",
            source: "ECITIZEN",
            statusDescription: "Assigned to Adjudication Team",
            createdAt: "2026-08-14T14:00:00Z",
          },
        ],
      };

      render(<GovernmentTrackerCard governmentApp={mockGovApp} />);

      expect(screen.getByText("Department of Immigration Services")).toBeInTheDocument();
      expect(screen.getByText("IMMI-PASSPORT-2026-7781")).toBeInTheDocument();
      expect(screen.getByText(/Filing assigned to Senior Adjudication Officer/i)).toBeInTheDocument();

      const historyButton = screen.getByText(/Government Status History \(2\)/i);
      expect(historyButton).toBeInTheDocument();
      fireEvent.click(historyButton);

      expect(screen.getByText("Transmitted to Immigration Portal")).toBeInTheDocument();
      expect(screen.getByText("Assigned to Adjudication Team")).toBeInTheDocument();
    });
  });
});
