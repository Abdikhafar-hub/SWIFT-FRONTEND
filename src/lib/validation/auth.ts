/**
 * Swift Doc Zod Authentication Schemas
 */

import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  fullName: z
    .string()
    .min(1, "Full name is required")
    .min(3, "Full name must be at least 3 characters"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  phone: z
    .string()
    .min(1, "Kenyan phone number is required")
    .regex(
      /^(?:254|\+254|0)?(7|1)\d{8}$/,
      "Please enter a valid Kenyan phone number (e.g. 0712345678 or 0112345678)"
    ),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  clientType: z.enum(["INDIVIDUAL", "BUSINESS", "ORGANIZATION"]).default("INDIVIDUAL"),
  businessName: z.string().optional(),
  nationalId: z.string().optional(),
  passportNumber: z.string().optional(),
  kraPin: z
    .string()
    .regex(/^[A-Z]\d{9}[A-Z]$/, "KRA PIN must follow format A000000000X (e.g. P051234567Z)")
    .optional()
    .or(z.literal("")),
});

export type RegisterFormData = z.infer<typeof registerSchema>;

/**
 * Step 1: Account Identity Creation Schema
 */
export const accountIdentitySchema = z
  .object({
    firstName: z
      .string()
      .min(1, "First name is required")
      .min(2, "First name must be at least 2 characters"),
    lastName: z
      .string()
      .min(1, "Last name is required")
      .min(2, "Last name must be at least 2 characters"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email address"),
    phone: z
      .string()
      .min(1, "Kenyan phone number is required")
      .regex(
        /^(?:254|\+254|0)?(7|1)\d{8}$/,
        "Please enter a valid Kenyan phone number (e.g. 0712345678)"
      ),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type AccountIdentityFormData = z.infer<typeof accountIdentitySchema>;

/**
 * Step 2: OTP Verification Schema
 */
export const otpVerificationSchema = z.object({
  code: z
    .string()
    .min(4, "Please enter the verification code")
    .max(8, "Verification code is invalid"),
});

export type OtpVerificationFormData = z.infer<typeof otpVerificationSchema>;

/**
 * Step 3: Statutory Profile Schema (Individual vs Company/Org)
 */
export const clientProfileStepSchema = z.object({
  clientType: z.enum(["INDIVIDUAL", "BUSINESS", "ORGANIZATION"]).default("INDIVIDUAL"),
  // Individual specific
  nationalId: z.string().optional(),
  passportNumber: z.string().optional(),
  // Company / Org specific
  businessName: z.string().optional(),
  registrationNumber: z.string().optional(),
  businessEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  businessPhone: z.string().optional(),
  // Shared
  kraPin: z
    .string()
    .regex(/^[A-Z]\d{9}[A-Z]$/, "KRA PIN must follow format A000000000X (e.g. P051234567Z)")
    .optional()
    .or(z.literal("")),
  address: z.string().optional(),
  county: z.string().optional(),
  city: z.string().optional(),
  preferredChannel: z.enum(["EMAIL", "SMS", "IN_APP", "WHATSAPP"]).default("EMAIL"),
});

export type ClientProfileStepFormData = z.infer<typeof clientProfileStepSchema>;

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
