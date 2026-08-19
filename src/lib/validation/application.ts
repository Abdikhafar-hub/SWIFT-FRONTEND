/**
 * Swift Doc Zod Application & Requirement Schemas
 */

import { z } from "zod";

export const createApplicationSchema = z.object({
  serviceId: z.string().min(1, "Please select a service"),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  initialNotes: z.string().optional(),
});

export type CreateApplicationFormData = z.infer<typeof createApplicationSchema>;

export const transitionStatusSchema = z.object({
  toStatus: z.string().min(1, "Target status is required"),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

export const messageSchema = z.object({
  message: z.string().min(1, "Message cannot be empty").max(2000, "Message is too long"),
});
