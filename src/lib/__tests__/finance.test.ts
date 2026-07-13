import { describe, it, expect } from "vitest";
import {
  computeInvoiceTotals,
  deriveInvoiceStatus,
  applyConcession,
  nextInvoiceNo,
} from "../finance";

describe("Finance Utilities", () => {
  describe("computeInvoiceTotals", () => {
    it("calculates totals for single item", () => {
      const items = [{ amount: 1000 }];
      const result = computeInvoiceTotals(items);
      expect(result).toEqual({
        subtotal: 1000,
        discountTotal: 0,
        total: 1000,
      });
    });

    it("calculates totals for multiple items", () => {
      const items = [
        { amount: 1000, discount: 100 },
        { amount: 500, discount: 50 },
      ];
      const result = computeInvoiceTotals(items);
      expect(result).toEqual({
        subtotal: 1500,
        discountTotal: 150,
        total: 1350,
      });
    });

    it("handles empty items array", () => {
      const result = computeInvoiceTotals([]);
      expect(result).toEqual({
        subtotal: 0,
        discountTotal: 0,
        total: 0,
      });
    });

    it("ensures total is never negative", () => {
      const items = [{ amount: 100, discount: 200 }];
      const result = computeInvoiceTotals(items);
      expect(result.total).toBe(0);
    });

    it("handles items with undefined discount", () => {
      const items = [{ amount: 500 }, { amount: 300, discount: undefined }];
      const result = computeInvoiceTotals(items);
      expect(result).toEqual({
        subtotal: 800,
        discountTotal: 0,
        total: 800,
      });
    });

    it("handles items with zero amount", () => {
      const items = [{ amount: 0, discount: 0 }];
      const result = computeInvoiceTotals(items);
      expect(result).toEqual({
        subtotal: 0,
        discountTotal: 0,
        total: 0,
      });
    });
  });

  describe("deriveInvoiceStatus", () => {
    it("returns CANCELLED if current status is CANCELLED", () => {
      const result = deriveInvoiceStatus({
        total: 1000,
        paidTotal: 0,
        dueDate: "2025-01-01",
        current: "CANCELLED",
      });
      expect(result).toBe("CANCELLED");
    });

    it("returns PAID when fully paid", () => {
      const result = deriveInvoiceStatus({
        total: 1000,
        paidTotal: 1000,
        dueDate: "2025-12-31",
      });
      expect(result).toBe("PAID");
    });

    it("returns PAID when overpaid", () => {
      const result = deriveInvoiceStatus({
        total: 1000,
        paidTotal: 1500,
        dueDate: "2025-12-31",
      });
      expect(result).toBe("PAID");
    });

    it("returns PARTIAL when partially paid", () => {
      const result = deriveInvoiceStatus({
        total: 1000,
        paidTotal: 500,
        dueDate: "2025-12-31",
      });
      expect(result).toBe("PARTIAL");
    });

    it("returns OVERDUE when unpaid and past due date", () => {
      const result = deriveInvoiceStatus({
        total: 1000,
        paidTotal: 0,
        dueDate: "2020-01-01", // Past date
      });
      expect(result).toBe("OVERDUE");
    });

    it("returns ISSUED when unpaid and not past due date", () => {
      const result = deriveInvoiceStatus({
        total: 1000,
        paidTotal: 0,
        dueDate: "2099-12-31", // Future date
      });
      expect(result).toBe("ISSUED");
    });

    it("handles zero total", () => {
      const result = deriveInvoiceStatus({
        total: 0,
        paidTotal: 0,
        dueDate: "2099-12-31",
      });
      expect(result).toBe("ISSUED");
    });
  });

  describe("applyConcession", () => {
    it("applies percentage concession", () => {
      const result = applyConcession(1000, { mode: "PERCENTAGE", value: 10 });
      expect(result).toBe(100);
    });

    it("applies fixed concession", () => {
      const result = applyConcession(1000, { mode: "FIXED", value: 200 });
      expect(result).toBe(200);
    });

    it("caps percentage concession at base amount", () => {
      const result = applyConcession(100, { mode: "PERCENTAGE", value: 150 });
      expect(result).toBe(100);
    });

    it("caps fixed concession at base amount", () => {
      const result = applyConcession(100, { mode: "FIXED", value: 200 });
      expect(result).toBe(100);
    });

    it("handles zero base amount", () => {
      const result = applyConcession(0, { mode: "PERCENTAGE", value: 10 });
      expect(result).toBe(0);
    });

    it("handles zero concession value", () => {
      const result = applyConcession(1000, { mode: "PERCENTAGE", value: 0 });
      expect(result).toBe(0);
    });
  });

  describe("nextInvoiceNo", () => {
    it("generates invoice number with sequence", () => {
      const result = nextInvoiceNo(1, 2025);
      expect(result).toBe("INV-2025-000001");
    });

    it("pads sequence to 6 digits", () => {
      const result = nextInvoiceNo(42, 2025);
      expect(result).toBe("INV-2025-000042");
    });

    it("uses current year by default", () => {
      const currentYear = new Date().getFullYear();
      const result = nextInvoiceNo(1);
      expect(result).toContain(`INV-${currentYear}-`);
    });

    it("handles large sequence numbers", () => {
      const result = nextInvoiceNo(999999, 2025);
      expect(result).toBe("INV-2025-999999");
    });
  });
});
