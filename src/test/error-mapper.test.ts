import { describe, it, expect } from "vitest";
import { parseApiError } from "@/lib/utils/error";

describe("Error Mapper Utility", () => {
  it("parses structured API errors correctly", () => {
    const apiError = {
      isAxiosError: true,
      response: {
        status: 400,
        data: {
          success: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "The email or password provided is incorrect. Please check and try again.",
          },
        },
      },
    };

    const parsed = parseApiError(apiError);
    expect(parsed.code).toBe("INVALID_CREDENTIALS");
    expect(parsed.message).toBe("The email or password provided is incorrect. Please check and try again.");
  });

  it("handles network connectivity errors gracefully", () => {
    const networkError = new Error("Network Error");

    const parsed = parseApiError(networkError);
    expect(parsed.code).toBe("NETWORK_ERROR");
    expect(parsed.message).toContain("Unable to connect");
  });

  it("safely handles raw HTML 404 or string error responses without throwing TypeError", () => {
    const htmlResponseError = {
      isAxiosError: true,
      response: {
        status: 404,
        data: "<!DOCTYPE html><html><body>404 Not Found</body></html>",
      },
    };

    const parsed = parseApiError(htmlResponseError);
    expect(parsed.code).toBe("NOT_FOUND");
    expect(parsed.statusCode).toBe(404);
  });
});
