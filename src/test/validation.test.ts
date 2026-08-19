import { describe, it, expect } from "vitest";
import { loginSchema, registerSchema } from "@/lib/validation/auth";

describe("Validation Schemas (Zod)", () => {
  it("validates valid login data", () => {
    const valid = { email: "user@swiftdoc.co.ke", password: "Password123" };
    expect(loginSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects invalid email on login", () => {
    const invalid = { email: "notanemail", password: "Password123" };
    expect(loginSchema.safeParse(invalid).success).toBe(false);
  });

  it("validates Kenyan phone number format on registration", () => {
    const valid = {
      fullName: "Abdikhafar Mohamed",
      email: "user@swiftdoc.co.ke",
      phone: "0712345678",
      password: "Password123!",
      clientType: "INDIVIDUAL" as const,
    };
    expect(registerSchema.safeParse(valid).success).toBe(true);

    const invalidPhone = { ...valid, phone: "12345" };
    expect(registerSchema.safeParse(invalidPhone).success).toBe(false);
  });
});
