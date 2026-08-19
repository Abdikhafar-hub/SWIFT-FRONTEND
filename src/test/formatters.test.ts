import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatKenyanPhone,
  formatFileSize,
} from "@/lib/utils/format";

describe("Formatting Utilities", () => {
  it("formats Kenyan Shillings (KES) correctly", () => {
    expect(formatCurrency(10650)).toBe("KES 10,650.00");
    expect(formatCurrency(0)).toBe("KES 0.00");
    expect(formatCurrency(1500000, "KES", false)).toBe("KES 1,500,000");
  });

  it("normalizes and formats Kenyan phone numbers to E.164 and display", () => {
    expect(formatKenyanPhone("0712345678")).toBe("+254 712 345 678");
    expect(formatKenyanPhone("254712345678")).toBe("+254 712 345 678");
    expect(formatKenyanPhone("+254712345678")).toBe("+254 712 345 678");
    expect(formatKenyanPhone("0112345678")).toBe("+254 112 345 678");
  });

  it("formats file sizes correctly", () => {
    expect(formatFileSize(500)).toBe("500 Bytes");
    expect(formatFileSize(1024)).toBe("1 KB");
    expect(formatFileSize(1024 * 1024 * 5)).toBe("5 MB");
  });
});
