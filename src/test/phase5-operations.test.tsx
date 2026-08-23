import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ClientActionCard } from "@/components/domain/client-action-card";
import { GovernmentTrackerCard } from "@/components/domain/government-tracker-card";
import { GovernmentStatusBadge, SlaBadge } from "@/components/domain/status-badges";
import type { ClientAction, GovernmentApplication, SlaStatus, GovernmentStatus } from "@/types";

describe("Phase 5 Operational Hardening & Governance", () => {
  describe("Client Action Center Component", () => {
    it("renders UPLOAD_DOCUMENT action item with urgent call to action", () => {
      const mockAction: ClientAction = {
        id: "act-101",
        applicationId: "app-202",
        type: "UPLOAD_DOCUMENT",
        priority: "HIGH",
        title: "Certified National ID Copy Required",
        description: "Please upload a clear scanned color copy of your Kenyan National ID (front and back).",
        status: "OPEN",
        dueAt: "2026-09-01T12:00:00Z",
        createdAt: "2026-08-11T10:00:00Z",
        updatedAt: "2026-08-11T10:00:00Z",
      };

      const handleActionClick = vi.fn();
      render(<ClientActionCard action={mockAction} onActionClick={handleActionClick} />);

      expect(screen.getByText("Certified National ID Copy Required")).toBeInTheDocument();
      expect(screen.getByText(/scanned color copy/i)).toBeInTheDocument();
      expect(screen.getByText(/Urgent Attention Required/i)).toBeInTheDocument();

      const button = screen.getByRole("button", { name: /Upload Document/i });
      expect(button).toBeInTheDocument();

      fireEvent.click(button);
      expect(handleActionClick).toHaveBeenCalledWith(mockAction);
    });

    it("renders MAKE_PAYMENT action item with M-Pesa call to action", () => {
      const paymentAction: ClientAction = {
        id: "act-102",
        applicationId: "app-202",
        type: "MAKE_PAYMENT",
        priority: "URGENT",
        title: "Statutory Stamp Duty & Registry Fee Outstanding",
        description: "Settle KES 10,000 statutory filing fees to initiate eCitizen transmission.",
        status: "OPEN",
        createdAt: "2026-08-11T10:00:00Z",
        updatedAt: "2026-08-11T10:00:00Z",
      };

      render(<ClientActionCard action={paymentAction} />);
      expect(screen.getByText(/Statutory Stamp Duty/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Pay via M-Pesa/i })).toBeInTheDocument();
    });
  });

  describe("Government Tracking & Registry Lifecycle", () => {
    it("renders government application tracking with milestones and official tracking code", () => {
      const mockGovApp: GovernmentApplication = {
        id: "gov-001",
        applicationId: "app-501",
        platform: "BRS",
        governmentAgency: "Business Registration Service (BRS)",
        governmentService: "Private Limited Company Incorporation",
        status: "SUBMITTED",
        additionalInformationRequired: false,
        trackingNumber: "BRS-INC-2026-88912",
        externalReference: "BRS-INC-2026-88912",
        submittedAt: "2026-08-10T14:30:00Z",
        submissionChannel: "ONLINE_PORTAL",
        followUpFrequencyDays: 3,
        isSlaPaused: false,
        statutoryPaymentStatus: "PAID",
        statutoryFeeAmount: 10500,
        expectedResponseDate: "2026-08-14T17:00:00Z",
        statusDescription: "Dossier under formal adjudication by Registrar of Companies.",
        createdAt: "2026-08-10T14:00:00Z",
        updatedAt: "2026-08-10T14:30:00Z",
        statusHistory: [
          {
            id: "hist-1",
            governmentApplicationId: "gov-001",
            fromStatus: "PREPARING",
            toStatus: "SUBMITTED",
            source: "ECITIZEN",
            statusDescription: "Transmitted to BRS online system",
            createdAt: "2026-08-10T14:30:00Z",
          },
        ],
      };

      render(<GovernmentTrackerCard governmentApp={mockGovApp} />);

      expect(screen.getByText("Business Registration Service (BRS)")).toBeInTheDocument();
      expect(screen.getByText("BRS-INC-2026-88912")).toBeInTheDocument();
      expect(screen.getByText(/STATUTORY SUBMISSION PROGRESS/i)).toBeInTheDocument();
      expect(screen.getByText("Dossier under formal adjudication by Registrar of Companies.")).toBeInTheDocument();
    });

    it("verifies GovernmentStatusBadge styling for multiple statuses", () => {
      const { rerender } = render(<GovernmentStatusBadge status="APPROVED" />);
      expect(screen.getByText(/Approved/i)).toBeInTheDocument();

      rerender(<GovernmentStatusBadge status="UNDER_PROCESSING" />);
      expect(screen.getByText(/Under Processing/i)).toBeInTheDocument();

      rerender(<GovernmentStatusBadge status="SUBMITTED" />);
      expect(screen.getByText(/Submitted/i)).toBeInTheDocument();

      rerender(<GovernmentStatusBadge status="REJECTED" />);
      expect(screen.getByText(/Rejected/i)).toBeInTheDocument();
    });
  });

  describe("SLA Compliance Status Badges", () => {
    it("renders SlaBadge for ON_TRACK, AT_RISK, OVERDUE, and COMPLETED", () => {
      const { rerender } = render(<SlaBadge status="ON_TRACK" />);
      expect(screen.getByText(/On Track/i)).toBeInTheDocument();

      rerender(<SlaBadge status="AT_RISK" />);
      expect(screen.getByText(/At Risk/i)).toBeInTheDocument();

      rerender(<SlaBadge status="OVERDUE" />);
      expect(screen.getByText(/Overdue/i)).toBeInTheDocument();

      rerender(<SlaBadge status="COMPLETED" />);
      expect(screen.getByText(/Met/i)).toBeInTheDocument();
    });
  });
});
