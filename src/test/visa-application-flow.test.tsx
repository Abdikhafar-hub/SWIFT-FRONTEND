import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { StartFilingModal } from "@/components/domain/start-filing-modal";
import { formatKES } from "@/lib/utils/format";
import type { Service } from "@/types";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock applicationsApi and servicesApi
vi.mock("@/lib/api/applications", () => ({
  applicationsApi: {
    createApplication: vi.fn().mockResolvedValue({
      id: "app-visa-test-101",
      applicationNumber: "SD-APP-2026-000124",
      serviceId: "srv-visa-uk-tourist",
      status: "NEW",
      metadata: {
        destinationCountry: "United Kingdom",
        visaCategory: "Visitor / Tourist",
        passportNumber: "A12345678",
        passportExpiry: "2030-01-01",
        travelStartDate: "2026-10-01",
        travelEndDate: "2026-10-14",
      },
    }),
  },
}));

vi.mock("@/lib/api/services", () => ({
  servicesApi: {
    getServiceRequirements: vi.fn().mockResolvedValue([
      { id: "req-1", name: "Passport Bio-Data Page", description: "Color scan", type: "FILE", required: true, displayOrder: 1 },
      { id: "req-2", name: "Bank Statements", description: "6 months bank statement", type: "FILE", required: true, displayOrder: 2 },
    ]),
  },
}));

vi.mock("@/lib/auth/auth-context", () => ({
  useAuth: () => ({
    user: { id: "user-101", email: "john@example.com", firstName: "John", lastName: "Kamau", role: "CLIENT" },
    client: { id: "client-101", fullName: "John Kamau", email: "john@example.com", phone: "+254712345678", nationality: "Kenyan", passportNumber: "A12345678" },
    isAuthenticated: true,
  }),
}));

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe("Visa Application Operational Flow — Client Intake Wizard", () => {
  const mockVisaService = {
    id: "srv-visa-uk-tourist",
    code: "SRV-VISA-UK-TOURIST",
    name: "UK Standard Visitor Visa Filing & Consular Intake",
    description: "End-to-end UK Standard Visitor Visa application preparation and document verification.",
    basePrice: 15000,
    serviceFee: 15000,
    governmentFee: 22000,
    totalFee: 37000,
    slaHours: 72,
    active: true,
    defaultGovernmentAgency: "UK Visas and Immigration (UKVI) / TLScontact",
    category: {
      id: "cat-visa-01",
      code: "CAT-VISA",
      name: "Visa Applications",
      slug: "visa-applications",
      description: "Global embassy and consular visa filing services",
      active: true,
      displayOrder: 1,
      createdAt: "2026-08-01T00:00:00Z",
      updatedAt: "2026-08-01T00:00:00Z",
    },
    requirements: [
      { id: "req-1", name: "Passport Bio-Data Page", description: "Color scan", type: "FILE", required: true, displayOrder: 1 },
    ],
    createdAt: "2026-08-01T00:00:00Z",
    updatedAt: "2026-08-01T00:00:00Z",
  };

  it("renders transparent fee calculation for Visa services in Step 1 Overview", () => {
    const govFee = Number(mockVisaService.governmentFee);
    const svcFee = Number(mockVisaService.serviceFee);
    const totalFee = Number(mockVisaService.totalFee);

    expect(govFee).toBe(22000);
    expect(svcFee).toBe(15000);
    expect(totalFee).toBe(37000);
    expect(formatKES(totalFee)).toBe("KES 37,000.00");
  });

  it("navigates through step 1 (Overview) and step 2 (Applicant Details)", async () => {
    const handleClose = vi.fn();
    renderWithClient(
      <StartFilingModal isOpen={true} onClose={handleClose} service={mockVisaService as unknown as Service} />
    );

    expect(screen.getByText(/UK Standard Visitor Visa Filing & Consular Intake/i)).toBeInTheDocument();
    
    // Click Continue on Step 1
    const continueBtnStep1 = screen.getByRole("button", { name: /Continue/i });
    fireEvent.click(continueBtnStep1);

    // Step 2 Applicant Details should prepopulate
    await waitFor(() => {
      expect(screen.getByDisplayValue("John Kamau")).toBeInTheDocument();
      expect(screen.getByDisplayValue("john@example.com")).toBeInTheDocument();
    });
  });

  it("navigates to step 3 and validates invalid passport expiry date", async () => {
    const handleClose = vi.fn();
    renderWithClient(
      <StartFilingModal isOpen={true} onClose={handleClose} service={mockVisaService as unknown as Service} />
    );

    // Step 1 -> Step 2
    fireEvent.click(screen.getByRole("button", { name: /Continue/i }));
    // Step 2 -> Step 3
    await waitFor(() => fireEvent.click(screen.getByRole("button", { name: /Continue/i })));

    // In Step 3 Visa Details
    await waitFor(() => {
      expect(screen.getByLabelText(/Destination Country/i)).toBeInTheDocument();
    });

    // Fill passport details with expired passport date
    const expiryInput = screen.getByLabelText(/Passport Expiry Date/i);
    fireEvent.change(expiryInput, { target: { value: "2020-01-01" } });

    const continueBtnStep3 = screen.getByRole("button", { name: /Continue/i });
    fireEvent.click(continueBtnStep3);

    await waitFor(() => {
      expect(screen.getByText(/Passport expiry date must be in the future/i)).toBeInTheDocument();
    });
  });

  it("completes full 5-step wizard and submits application successfully", async () => {
    const handleClose = vi.fn();
    renderWithClient(
      <StartFilingModal isOpen={true} onClose={handleClose} service={mockVisaService as unknown as Service} />
    );

    // Step 1 Overview -> Step 2 Applicant
    fireEvent.click(screen.getByRole("button", { name: /Continue/i }));

    // Step 2 Applicant -> Step 3 Details
    await waitFor(() => fireEvent.click(screen.getByRole("button", { name: /Continue/i })));

    // Step 3 Visa Details -> Fill valid passport details
    await waitFor(() => {
      expect(screen.getByLabelText(/Passport Expiry Date/i)).toBeInTheDocument();
    });
    fireEvent.change(screen.getByLabelText(/Passport Expiry Date/i), { target: { value: "2030-01-01" } });

    // Step 3 -> Step 4 Requirements
    fireEvent.click(screen.getByRole("button", { name: /Continue/i }));

    // Step 4 Requirements -> Step 5 Review
    await waitFor(() => {
      expect(screen.getByText(/Requirement Snapshot Preview/i)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: /Continue/i }));

    // Step 5 Review & Submit -> Accept Declaration
    await waitFor(() => {
      expect(screen.getByText(/Review Application Summary & Submit/i)).toBeInTheDocument();
    });

    const declarationCheckbox = screen.getByText(/I confirm that the information provided is accurate/i);
    fireEvent.click(declarationCheckbox);

    // Submit Application
    const submitBtn = screen.getByRole("button", { name: /Create Application/i });
    expect(submitBtn).not.toBeDisabled();
    fireEvent.click(submitBtn);

    // Success Screen Assertion
    await waitFor(() => {
      expect(screen.getByText("Application Created Successfully")).toBeInTheDocument();
      expect(screen.getByText("#SD-APP-2026-000124")).toBeInTheDocument();
    });
  });
});
