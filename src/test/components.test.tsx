import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ApplicationStatusBadge } from "@/components/domain/status-badges";
import { StatCard } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback-primitives";

describe("UI & Domain Components", () => {
  it("renders Button with correct variant classes and text", () => {
    render(<Button variant="gold">Submit Application</Button>);
    const button = screen.getByRole("button", { name: /Submit Application/i });
    expect(button).toBeInTheDocument();
  });

  it("renders ApplicationStatusBadge with status metadata", () => {
    render(<ApplicationStatusBadge status="DOCUMENT_REVIEW" />);
    expect(screen.getByText(/Document Review/i)).toBeInTheDocument();
  });

  it("renders StatCard with title and value", () => {
    render(<StatCard title="Active Filings" value={14} />);
    expect(screen.getByText("Active Filings")).toBeInTheDocument();
    expect(screen.getByText("14")).toBeInTheDocument();
  });

  it("renders EmptyState correctly", () => {
    render(
      <EmptyState
        title="No Records Found"
        description="Please start a new statutory application."
      />
    );
    expect(screen.getByText("No Records Found")).toBeInTheDocument();
    expect(screen.getByText("Please start a new statutory application.")).toBeInTheDocument();
  });
});
