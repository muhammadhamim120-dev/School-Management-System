import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isLate, attendanceDay } from "../attendance";

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    setting: {
      findFirst: vi.fn(),
    },
  },
}));

describe("Attendance Utilities", () => {
  describe("isLate", () => {
    it("returns true when current time is after deadline", () => {
      const now = new Date("2025-01-15T08:45:00"); // 8:45 AM
      const result = isLate(now, "08:30", 10);
      expect(result).toBe(true);
    });

    it("returns false when current time is before deadline", () => {
      const now = new Date("2025-01-15T08:35:00"); // 8:35 AM
      const result = isLate(now, "08:30", 10);
      expect(result).toBe(false);
    });

    it("returns false when current time is exactly at deadline", () => {
      const now = new Date("2025-01-15T08:40:00"); // 8:40 AM (8:30 + 10 min)
      const result = isLate(now, "08:30", 10);
      expect(result).toBe(false);
    });

    it("returns true when past grace period", () => {
      const now = new Date("2025-01-15T08:41:00"); // 8:41 AM
      const result = isLate(now, "08:30", 10);
      expect(result).toBe(true);
    });

    it("handles zero grace minutes", () => {
      const now = new Date("2025-01-15T08:31:00");
      const result = isLate(now, "08:30", 0);
      expect(result).toBe(true);
    });

    it("handles negative grace minutes as zero", () => {
      const now = new Date("2025-01-15T08:31:00");
      const result = isLate(now, "08:30", -5);
      expect(result).toBe(true);
    });

    it("returns false for invalid time format", () => {
      const now = new Date("2025-01-15T08:45:00");
      const result = isLate(now, "invalid", 10);
      expect(result).toBe(false);
    });

    it("handles afternoon start time", () => {
      const now = new Date("2025-01-15T13:15:00"); // 1:15 PM
      const result = isLate(now, "13:00", 10);
      expect(result).toBe(true);
    });
  });

  describe("attendanceDay", () => {
    it("returns date with time set to midnight", () => {
      const date = new Date("2025-01-15T14:30:45.123");
      const result = attendanceDay(date);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });

    it("preserves the date", () => {
      const date = new Date("2025-01-15T14:30:45");
      const result = attendanceDay(date);
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(0); // January
      expect(result.getDate()).toBe(15);
    });

    it("uses current date when no argument provided", () => {
      const result = attendanceDay();
      const now = new Date();
      expect(result.getFullYear()).toBe(now.getFullYear());
      expect(result.getMonth()).toBe(now.getMonth());
      expect(result.getDate()).toBe(now.getDate());
    });

    it("does not modify the original date", () => {
      const date = new Date("2025-01-15T14:30:45");
      attendanceDay(date);
      expect(date.getHours()).toBe(14);
    });
  });
});
