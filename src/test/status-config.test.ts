import { describe, it, expect } from "vitest";
import {
  APPLICATION_STATUS_CONFIG,
  REQUIREMENT_STATUS_CONFIG,
  DOCUMENT_STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
  SLA_STATUS_CONFIG,
} from "@/lib/constants/status";
import type { ApplicationStatus } from "@/types";

describe("Status Configuration & Backend Synchronization", () => {
  const ALL_16_STATUSES: ApplicationStatus[] = [
    "NEW",
    "QUALIFICATION",
    "REQUIREMENTS_PENDING",
    "DOCUMENT_REVIEW",
    "READY_FOR_SUBMISSION",
    "SUBMITTED",
    "GOVERNMENT_PROCESSING",
    "ADDITIONAL_INFORMATION_REQUIRED",
    "APPROVED",
    "DOCUMENT_RECEIVED",
    "QUALITY_CHECK",
    "READY_FOR_DELIVERY",
    "DELIVERED",
    "CLOSED",
    "ON_HOLD",
    "CANCELLED",
  ];

  it("contains valid configuration for all 16 application lifecycle states", () => {
    ALL_16_STATUSES.forEach((status) => {
      const config = APPLICATION_STATUS_CONFIG[status];
      expect(config).toBeDefined();
      expect(config.label).toBeTruthy();
      expect(config.tone).toBeTruthy();
      expect(config.description).toBeTruthy();
    });
  });

  it("properly maps requirement statuses", () => {
    expect(REQUIREMENT_STATUS_CONFIG.PENDING.tone).toBe("neutral");
    expect(REQUIREMENT_STATUS_CONFIG.APPROVED.tone).toBe("success");
    expect(REQUIREMENT_STATUS_CONFIG.REJECTED.tone).toBe("danger");
  });

  it("properly maps SLA health statuses", () => {
    expect(SLA_STATUS_CONFIG.ON_TRACK.tone).toBe("success");
    expect(SLA_STATUS_CONFIG.AT_RISK.tone).toBe("warning");
    expect(SLA_STATUS_CONFIG.OVERDUE.tone).toBe("danger");
    expect(SLA_STATUS_CONFIG.COMPLETED.tone).toBe("success");
  });
});
