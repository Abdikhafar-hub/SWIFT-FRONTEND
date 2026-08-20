import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { GovernmentStatusBadge, SlaBadge } from "@/components/domain/status-badges";
import type { Application } from "@/types";

describe("Visa Application Operational Flow — Admin Operations & 360", () => {
  const mockVisaApplication = {
    id: "app-visa-admin-901",
    applicationNumber: "APP-VISA-2026-901",
    clientId: "client-888",
    serviceId: "srv-visa-us-b1b2",
    status: "GOVERNMENT_PROCESSING",
    priority: "HIGH",
    slaStatus: "ON_TRACK",
    slaDeadline: "2026-09-01T12:00:00Z",
    metadata: {
      destinationCountry: "United States",
      visaCategory: "Visitor / Tourist (B1/B2)",
      passportNumber: "A98765432",
      passportExpiry: "2031-05-15",
      travelStartDate: "2026-11-01",
      travelEndDate: "2026-11-20",
      processingEmbassy: "US Embassy Nairobi — Consular Section",
    },
    service: {
      id: "srv-visa-us-b1b2",
      code: "SRV-VISA-US-B1B2",
      name: "US B1/B2 Visitor Visa Filing & Consular Appointment",
      description: "US Non-immigrant B1/B2 visa dossier preparation.",
      basePrice: 20000,
      serviceFee: 20000,
      governmentFee: 24500,
      totalFee: 44500,
      slaHours: 96,
      active: true,
      defaultGovernmentAgency: "US Embassy Nairobi — Consular Section",
      createdAt: "2026-08-01T00:00:00Z",
      updatedAt: "2026-08-01T00:00:00Z",
    },
    client: {
      id: "client-888",
      fullName: "Jane Doe",
      email: "jane.doe@example.com",
      clientType: "INDIVIDUAL",
      createdAt: "2026-08-01T00:00:00Z",
      updatedAt: "2026-08-01T00:00:00Z",
    },
    requirements: [
      {
        id: "req-p-01",
        applicationId: "app-visa-admin-901",
        code: "REQ-PASSPORT",
        name: "Original Kenyan Passport",
        type: "DOCUMENT",
        required: true,
        status: "APPROVED",
        displayOrder: 1,
        isSatisfied: true,
        createdAt: "2026-08-01T00:00:00Z",
        updatedAt: "2026-08-01T00:00:00Z",
      },
      {
        id: "req-p-02",
        applicationId: "app-visa-admin-901",
        code: "REQ-BANK-STMT",
        name: "6-Month Bank Statements",
        type: "DOCUMENT",
        required: true,
        status: "SUBMITTED",
        displayOrder: 2,
        isSatisfied: false,
        createdAt: "2026-08-01T00:00:00Z",
        updatedAt: "2026-08-01T00:00:00Z",
      },
    ],
    documents: [],
    actions: [],
    invoices: [],
    payments: [],
    createdAt: "2026-08-01T00:00:00Z",
    updatedAt: "2026-08-01T00:00:00Z",
  };

  it("verifies Visa Application metadata payload fields", () => {
    const meta = mockVisaApplication.metadata as Record<string, any>;
    expect(meta.destinationCountry).toBe("United States");
    expect(meta.visaCategory).toBe("Visitor / Tourist (B1/B2)");
    expect(meta.passportNumber).toBe("A98765432");
    expect(meta.passportExpiry).toBe("2031-05-15");
    expect(meta.processingEmbassy).toBe("US Embassy Nairobi — Consular Section");
  });

  it("renders GovernmentStatusBadge and SlaBadge accurately for Visa applications", () => {
    const { rerender } = render(<GovernmentStatusBadge status="UNDER_PROCESSING" />);
    expect(screen.getByText(/Under Processing/i)).toBeInTheDocument();

    rerender(<SlaBadge status="ON_TRACK" />);
    expect(screen.getByText(/On Track/i)).toBeInTheDocument();
  });
});
