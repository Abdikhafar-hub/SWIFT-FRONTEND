import { describe, it, expect, vi, beforeEach } from "vitest";
import { toast } from "sonner";
import { notify } from "@/lib/notify";
import { parseApiError } from "@/lib/utils/error";

// Mock sonner toast functions
vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    loading: vi.fn(),
    promise: vi.fn(),
    dismiss: vi.fn(),
  }),
}));

describe("Global Notification System (notify)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("triggers notify.success with correct message and options", () => {
    notify.success("Application created successfully!", { id: "app-create" });
    expect(toast.success).toHaveBeenCalledWith("Application created successfully!", expect.objectContaining({
      id: "app-create",
    }));
  });

  it("triggers notify.info with correct message", () => {
    notify.info("Verification code sent to email.");
    expect(toast.info).toHaveBeenCalledWith("Verification code sent to email.", expect.anything());
  });

  it("triggers notify.warning with correct message", () => {
    notify.warning("Please upload a valid PDF document.");
    expect(toast.warning).toHaveBeenCalledWith("Please upload a valid PDF document.", expect.anything());
  });

  it("triggers notify.error with sanitized error message from Error object", () => {
    const error = new Error("Unique constraint failed on table Application_kraPin_key");
    notify.error(error, { title: "Filing Failed" });

    // Ensure raw database leak is sanitized
    expect(toast.error).toHaveBeenCalledWith("Filing Failed", expect.objectContaining({
      description: expect.not.stringContaining("Application_kraPin_key"),
    }));
  });

  it("triggers notify.error with structured API response error", () => {
    const apiError = {
      isAxiosError: true,
      response: {
        status: 400,
        data: {
          success: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "The password provided is incorrect.",
          },
        },
      },
    };

    notify.error(apiError);
    expect(toast.error).toHaveBeenCalledWith("Invalid Credentials", expect.objectContaining({
      description: "The password provided is incorrect.",
    }));
  });

  it("triggers notify.promise for async lifecycle tasks", async () => {
    const mockPromise = Promise.resolve("Done");
    notify.promise(mockPromise, {
      loading: "Processing payment...",
      success: "Payment confirmed!",
      error: "Payment failed.",
    });

    expect(toast.promise).toHaveBeenCalledWith(mockPromise, expect.objectContaining({
      loading: "Processing payment...",
      success: "Payment confirmed!",
    }));
  });
});
