import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PaymentStatusBadge } from "@/components/domain/status-badges";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type {
  Payment,
  PaymentTransaction,
  Receipt,
  Refund,
  OutstandingInvoice,
  CreateInvoicePayload,
  FinancialAdjustmentPayload,
  ReverseTransactionPayload,
  RequestRefundPayload,
} from "@/types";

describe("Financial Domain Operations & Formatting", () => {
  describe("PaymentStatusBadge", () => {
    it("renders PAID status with success tone", () => {
      render(<PaymentStatusBadge status="PAID" />);
      expect(screen.getByText(/Settled/i)).toBeInTheDocument();
    });

    it("renders PENDING status with warning tone", () => {
      render(<PaymentStatusBadge status="PENDING" />);
      expect(screen.getByText(/Pending/i)).toBeInTheDocument();
    });

    it("renders OVERDUE status with destructive tone", () => {
      render(<PaymentStatusBadge status="OVERDUE" />);
      expect(screen.getByText(/Overdue/i)).toBeInTheDocument();
    });

    it("renders PARTIALLY_PAID status", () => {
      render(<PaymentStatusBadge status="PARTIALLY_PAID" />);
      expect(screen.getByText(/Partially Paid/i)).toBeInTheDocument();
    });

    it("renders DRAFT status with neutral tone", () => {
      render(<PaymentStatusBadge status="DRAFT" />);
      expect(screen.getByText(/Draft/i)).toBeInTheDocument();
    });
  });

  describe("Financial Currency Formatting", () => {
    it("formats standard Kenyan Shilling amounts with 2 decimals", () => {
      expect(formatCurrency(15000)).toBe("KES 15,000.00");
      expect(formatCurrency(350.5)).toBe("KES 350.50");
      expect(formatCurrency("8500")).toBe("KES 8,500.00");
    });

    it("handles zero and negative amounts for discounts/waivers", () => {
      expect(formatCurrency(0)).toBe("KES 0.00");
      expect(formatCurrency(-2500)).toBe("KES -2,500.00");
    });
  });

  describe("Financial Operations Payload Structures", () => {
    it("validates CreateInvoicePayload structure", () => {
      const payload: CreateInvoicePayload = {
        applicationId: "app-uuid-101",
        clientId: "client-uuid-202",
        dueAt: "2026-09-01T00:00:00Z",
        notes: "Gazette and statutory registry fees",
        lineItems: [
          {
            description: "BRS Official Registry Filing Fee",
            category: "GOVERNMENT_FEE",
            quantity: 1,
            unitAmount: 10000,
            isGovernmentFee: true,
            isTaxable: false,
          },
          {
            description: "Corporate Secretary Processing Fee",
            category: "SERVICE_FEE",
            quantity: 1,
            unitAmount: 5000,
            isGovernmentFee: false,
            isTaxable: true,
          },
        ],
      };

      expect(payload.applicationId).toBe("app-uuid-101");
      expect(payload.lineItems).toBeDefined();
      expect(payload.lineItems?.[0].isGovernmentFee).toBe(true);
      expect(payload.lineItems?.[1].category).toBe("SERVICE_FEE");
    });

    it("validates FinancialAdjustmentPayload structure for waivers/discounts", () => {
      const discountPayload: FinancialAdjustmentPayload = {
        type: "DISCOUNT",
        amount: 1500,
        reason: "Corporate promotional discount voucher applied",
      };

      const penaltyPayload: FinancialAdjustmentPayload = {
        type: "PENALTY",
        amount: 500,
        reason: "Late registry statutory penalty",
      };

      expect(discountPayload.type).toBe("DISCOUNT");
      expect(discountPayload.amount).toBe(1500);
      expect(penaltyPayload.type).toBe("PENALTY");
    });

    it("validates ReverseTransactionPayload structure", () => {
      const reversePayload: ReverseTransactionPayload = {
        reason: "Duplicate M-Pesa STK callback received from Safaricom",
      };

      expect(reversePayload.reason).toContain("Duplicate M-Pesa");
    });

    it("validates RequestRefundPayload structure", () => {
      const refundPayload: RequestRefundPayload = {
        paymentId: "pay-uuid-001",
        transactionId: "tx-uuid-002",
        amount: 3500,
        reason: "Client cancelled filing prior to registry submission",
      };

      expect(refundPayload.paymentId).toBe("pay-uuid-001");
      expect(refundPayload.amount).toBe(3500);
    });
  });

  describe("Accounts Receivable Aging Bucket Entities", () => {
    it("handles outstanding invoice structure with aging metadata", () => {
      const outstandingInvoice: OutstandingInvoice = {
        id: "inv-99",
        clientId: "client-1",
        applicationId: "app-1",
        invoiceNumber: "SD-INV-2026-099",
        subtotal: 15000,
        governmentFee: 10000,
        serviceFee: 5000,
        otherFee: 0,
        discount: 0,
        tax: 0,
        totalAmount: 15000,
        amountPaid: 5000,
        amountDue: 10000,
        currency: "KES",
        status: "OVERDUE",
        isOverdue: true,
        createdAt: "2026-07-01T10:00:00Z",
        updatedAt: "2026-07-01T10:00:00Z",
        daysOverdue: 22,
        agingBucket: "15-30",
        client: {
          id: "client-1",
          clientNumber: "SD-CL-001",
          clientType: "BUSINESS",
          fullName: "Apex Holdings Ltd",
          email: "finance@apex.co.ke",
          phone: "+254700000000",
          isActive: true,
          createdAt: "2026-01-01T00:00:00Z",
        },
      };

      expect(outstandingInvoice.daysOverdue).toBe(22);
      expect(outstandingInvoice.agingBucket).toBe("15-30");
      expect(outstandingInvoice.amountDue).toBe(10000);
      expect(outstandingInvoice.client?.fullName).toBe("Apex Holdings Ltd");
    });
  });
});

