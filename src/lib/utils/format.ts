/**
 * Swift Doc Kenyan Formatting Utilities
 * Standardizes currency (KES), phone numbers (+254), dates, and file sizes.
 */

import { format, formatDistanceToNow, isValid, parseISO } from "date-fns";

/**
 * Formats a monetary amount into strict Kenyan Shillings representation.
 * Example: formatCurrency(15500) -> "KES 15,500.00"
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  currency = "KES",
  includeDecimals = true
): string {
  if (amount === null || amount === undefined || amount === "") {
    return `${currency} 0.00`;
  }

  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) {
    return `${currency} 0.00`;
  }

  const formattedNum = new Intl.NumberFormat("en-KE", {
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  }).format(num);

  return `${currency} ${formattedNum}`;
}

/**
 * Convenience alias for Kenyan Shillings format.
 */
export function formatKES(amount: number | string | null | undefined): string {
  return formatCurrency(amount, "KES", true);
}

/**
 * Normalizes Kenyan phone numbers to international E.164-like standard (2547xxxxxxxx).
 * Handles:
 * "0712345678" -> "254712345678"
 * "+254712345678" -> "254712345678"
 * "712345678" -> "254712345678"
 * "0112345678" -> "254112345678"
 */
export function normalizeKenyanPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");

  if (cleaned.startsWith("254") && cleaned.length === 12) {
    return cleaned;
  }
  if (cleaned.startsWith("0") && (cleaned.length === 10 || cleaned.length === 11)) {
    return `254${cleaned.slice(1)}`;
  }
  if ((cleaned.startsWith("7") || cleaned.startsWith("1")) && cleaned.length === 9) {
    return `254${cleaned}`;
  }
  return cleaned;
}

/**
 * Formats a Kenyan phone number for display.
 * Example: "254712345678" or "0712345678" -> "+254 712 345 678"
 */
export function formatKenyanPhone(phone: string | null | undefined): string {
  if (!phone) return "—";
  const normalized = normalizeKenyanPhone(phone);

  if (normalized.startsWith("254") && normalized.length === 12) {
    const code = normalized.slice(0, 3);
    const prefix = normalized.slice(3, 6);
    const part1 = normalized.slice(6, 9);
    const part2 = normalized.slice(9, 12);
    return `+${code} ${prefix} ${part1} ${part2}`;
  }

  return phone;
}

/**
 * Formats a date cleanly (e.g. "12 Oct 2026")
 */
export function formatDate(
  dateInput: string | Date | null | undefined,
  dateFormat = "dd MMM yyyy"
): string {
  if (!dateInput) return "—";
  const date = typeof dateInput === "string" ? parseISO(dateInput) : dateInput;
  if (!isValid(date)) return "—";
  return format(date, dateFormat);
}

/**
 * Formats date and time (e.g. "12 Oct 2026, 14:30")
 */
export function formatDateTime(
  dateInput: string | Date | null | undefined,
  dateFormat = "dd MMM yyyy, HH:mm"
): string {
  if (!dateInput) return "—";
  const date = typeof dateInput === "string" ? parseISO(dateInput) : dateInput;
  if (!isValid(date)) return "—";
  return format(date, dateFormat);
}

/**
 * Formats relative time (e.g. "2 hours ago", "in 3 days")
 */
export function formatRelativeTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "—";
  const date = typeof dateInput === "string" ? parseISO(dateInput) : dateInput;
  if (!isValid(date)) return "—";
  return formatDistanceToNow(date, { addSuffix: true });
}

/**
 * Formats bytes to readable size string (e.g. "2.4 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
