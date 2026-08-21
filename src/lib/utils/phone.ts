/**
 * Normalizes and validates a Kenyan Safaricom/mobile phone number into standard format (2547XXXXXXXX or 2541XXXXXXXX).
 */
export function normalizeKenyanPhone(phone: string): string {
  if (!phone || typeof phone !== "string") {
    return "";
  }

  let cleaned = phone.trim().replace(/[\s\-\(\)]/g, "");

  if (cleaned.startsWith("+")) {
    cleaned = cleaned.substring(1);
  }

  if (!/^\d+$/.test(cleaned)) {
    return cleaned; // return cleaned as-is for validation error checking
  }

  if (cleaned.length === 10 && cleaned.startsWith("0")) {
    cleaned = `254${cleaned.substring(1)}`;
  } else if (cleaned.length === 9 && (cleaned.startsWith("7") || cleaned.startsWith("1"))) {
    cleaned = `254${cleaned}`;
  }

  return cleaned;
}

export function isValidKenyanPhone(phone: string): boolean {
  const normalized = normalizeKenyanPhone(phone);
  return (
    normalized.length === 12 &&
    (normalized.startsWith("2547") || normalized.startsWith("2541"))
  );
}
