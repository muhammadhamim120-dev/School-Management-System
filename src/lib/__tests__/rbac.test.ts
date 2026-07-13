import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the auth module before importing rbac
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

import { isAdmin, isTeacherOrAdmin, requiresAdmin } from "../rbac";

describe("RBAC Utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("isAdmin", () => {
    it("returns true for ADMIN role", () => {
      expect(isAdmin("ADMIN")).toBe(true);
    });

    it("returns false for TEACHER role", () => {
      expect(isAdmin("TEACHER")).toBe(false);
    });

    it("returns false for STAFF role", () => {
      expect(isAdmin("STAFF")).toBe(false);
    });

    it("returns false for undefined role", () => {
      expect(isAdmin(undefined)).toBe(false);
    });
  });

  describe("isTeacherOrAdmin", () => {
    it("returns true for ADMIN role", () => {
      expect(isTeacherOrAdmin("ADMIN")).toBe(true);
    });

    it("returns true for TEACHER role", () => {
      expect(isTeacherOrAdmin("TEACHER")).toBe(true);
    });

    it("returns false for STAFF role", () => {
      expect(isTeacherOrAdmin("STAFF")).toBe(false);
    });

    it("returns false for undefined role", () => {
      expect(isTeacherOrAdmin(undefined)).toBe(false);
    });
  });

  describe("requiresAdmin", () => {
    it("returns true for settings route", () => {
      expect(requiresAdmin("/dashboard/settings")).toBe(true);
    });

    it("returns true for finance route", () => {
      expect(requiresAdmin("/dashboard/finance")).toBe(true);
    });

    it("returns true for payments route", () => {
      expect(requiresAdmin("/dashboard/payments")).toBe(true);
    });

    it("returns true for academic route", () => {
      expect(requiresAdmin("/dashboard/academic")).toBe(true);
    });

    it("returns false for students route", () => {
      expect(requiresAdmin("/dashboard/students")).toBe(false);
    });

    it("returns false for teachers route", () => {
      expect(requiresAdmin("/dashboard/teachers")).toBe(false);
    });

    it("returns false for dashboard home", () => {
      expect(requiresAdmin("/dashboard")).toBe(false);
    });
  });
});
