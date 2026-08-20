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

// Mock applicationsApi
vi.mock("@/lib/api/applications", () => ({
  applicationsApi: {
    createApplication: vi.fn().mockResolvedValue({
      id: "app-visa-test-101",
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

describe("Visa Application Operational Flow — Client Intake & Catalog", () => {
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
    requirements: [],
    createdAt: "2026-08-01T00:00:00Z",
    updatedAt: "2026-08-01T00:00:00Z",
  };

  it("renders transparent fee calculation for Visa services", () => {
    const govFee = Number(mockVisaService.governmentFee);
    const svcFee = Number(mockVisaService.serviceFee);
    const totalFee = Number(mockVisaService.totalFee);

    expect(govFee).toBe(22000);
    expect(svcFee).toBe(15000);
    expect(totalFee).toBe(37000);
    expect(formatKES(totalFee)).toBe("KES 37,000.00");
  });

  it("pre-fills destination country and visa category in intake modal", async () => {
    const handleClose = vi.fn();
    renderWithClient(
      <StartFilingModal isOpen={true} onClose={handleClose} service={mockVisaService as unknown as Service} />
    );

    expect(screen.getByText("Initiate Visa Application Dossier")).toBeInTheDocument();
    expect(screen.getByDisplayValue("United Kingdom")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Visitor / Tourist")).toBeInTheDocument();
  });

  it("validates invalid passport expiry date (must be in future)", async () => {
    const handleClose = vi.fn();
    renderWithClient(
      <StartFilingModal isOpen={true} onClose={handleClose} service={mockVisaService as unknown as Service} />
    );

    // Enter expired passport date
    const expiryInput = screen.getByLabelText(/Passport Expiry Date/i);
    fireEvent.change(expiryInput, { target: { value: "2020-01-01" } });

    const submitBtn = screen.getByRole("button", { name: /Create Visa Application Dossier/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Passport expiry date must be in the future/i)).toBeInTheDocument();
    });
  });

  it("validates return date prior to travel start date", async () => {
    const handleClose = vi.fn();
    renderWithClient(
      <StartFilingModal isOpen={true} onClose={handleClose} service={mockVisaService as unknown as Service} />
    );

    const startInput = screen.getByLabelText(/Intended Travel Start Date/i);
    const endInput = screen.getByLabelText(/Intended Return Date/i);

    fireEvent.change(startInput, { target: { value: "2026-10-15" } });
    fireEvent.change(endInput, { target: { value: "2026-10-01" } });

    const submitBtn = screen.getByRole("button", { name: /Create Visa Application Dossier/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Return date must be on or after travel start date/i)).toBeInTheDocument();
    });
  });
});
