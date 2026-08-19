/**
 * Swift Doc Zod Document & Storage Schemas
 */

import { z } from "zod";

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const documentUploadSchema = z.object({
  title: z.string().min(1, "Document title is required"),
  documentType: z.string().min(1, "Document category is required"),
  file: z
    .custom<File>((val) => val instanceof File, "Please choose a file to upload")
    .refine((file) => file.size <= MAX_FILE_SIZE, "File size must not exceed 15MB")
    .refine(
      (file) => ALLOWED_MIME_TYPES.includes(file.type),
      "Only PDF, JPEG, PNG, and Word documents are permitted"
    ),
});

export const documentReviewSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  reviewNotes: z.string().optional(),
  rejectionReason: z.string().optional(),
});
