import { describe, it, expect } from "vitest";
import { scoreRisk } from "../risk";

describe("Risk Scoring Utilities", () => {
  describe("scoreRisk", () => {
    it("returns LOW risk for perfect student", () => {
      const result = scoreRisk({
        attendanceRate: 100,
        duesAmount: 0,
        avgResult: 100,
      });
      expect(result.score).toBe(0);
      expect(result.level).toBe("LOW");
      expect(result.factors).toContain("No significant risk factors");
    });

    it("returns HIGH risk for worst student", () => {
      const result = scoreRisk({
        attendanceRate: 0,
        duesAmount: 50000,
        avgResult: 0,
      });
      expect(result.score).toBeGreaterThanOrEqual(60);
      expect(result.level).toBe("HIGH");
      expect(result.factors).toContain("Low attendance (0%)");
      expect(result.factors).toContain("Outstanding dues");
      expect(result.factors).toContain("Below-average results (0%)");
    });

    it("returns MEDIUM risk for average student", () => {
      const result = scoreRisk({
        attendanceRate: 75,
        duesAmount: 5000,
        avgResult: 60,
      });
      expect(result.score).toBeGreaterThanOrEqual(35);
      expect(result.score).toBeLessThan(60);
      expect(result.level).toBe("MEDIUM");
    });

    it("handles null attendance rate", () => {
      const result = scoreRisk({
        attendanceRate: null,
        duesAmount: 0,
        avgResult: 100,
      });
      expect(result.score).toBe(0);
      expect(result.level).toBe("LOW");
    });

    it("handles null avgResult", () => {
      const result = scoreRisk({
        attendanceRate: 100,
        duesAmount: 0,
        avgResult: null,
      });
      expect(result.score).toBe(0);
      expect(result.level).toBe("LOW");
    });

    it("factors include low attendance when below 70%", () => {
      const result = scoreRisk({
        attendanceRate: 65,
        duesAmount: 0,
        avgResult: 100,
      });
      expect(result.factors).toContain("Low attendance (65%)");
    });

    it("factors do not include low attendance when 70% or above", () => {
      const result = scoreRisk({
        attendanceRate: 70,
        duesAmount: 0,
        avgResult: 100,
      });
      expect(result.factors).not.toContain(expect.stringContaining("Low attendance"));
    });

    it("factors include outstanding dues when dues > 0", () => {
      const result = scoreRisk({
        attendanceRate: 100,
        duesAmount: 1000,
        avgResult: 100,
      });
      expect(result.factors).toContain("Outstanding dues");
    });

    it("factors do not include outstanding dues when dues = 0", () => {
      const result = scoreRisk({
        attendanceRate: 100,
        duesAmount: 0,
        avgResult: 100,
      });
      expect(result.factors).not.toContain("Outstanding dues");
    });

    it("factors include below-average results when avg < 50%", () => {
      const result = scoreRisk({
        attendanceRate: 100,
        duesAmount: 0,
        avgResult: 45,
      });
      expect(result.factors).toContain("Below-average results (45%)");
    });

    it("factors do not include below-average results when avg >= 50%", () => {
      const result = scoreRisk({
        attendanceRate: 100,
        duesAmount: 0,
        avgResult: 50,
      });
      expect(result.factors).not.toContain(expect.stringContaining("Below-average"));
    });

    it("score is capped at 100", () => {
      const result = scoreRisk({
        attendanceRate: 0,
        duesAmount: 100000,
        avgResult: 0,
      });
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it("score is at least 0", () => {
      const result = scoreRisk({
        attendanceRate: 100,
        duesAmount: 0,
        avgResult: 100,
      });
      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it("attendance weight is 45%", () => {
      // Only attendance at 0% (max risk = 100)
      // Score should be 100 * 0.45 = 45
      const result = scoreRisk({
        attendanceRate: 0,
        duesAmount: 0,
        avgResult: 100,
      });
      expect(result.score).toBe(45);
    });

    it("dues weight is 30%", () => {
      // Only dues at ceiling (max risk = 100)
      // Score should be 100 * 0.30 = 30
      const result = scoreRisk({
        attendanceRate: 100,
        duesAmount: 10000,
        avgResult: 100,
      });
      expect(result.score).toBe(30);
    });

    it("results weight is 25%", () => {
      // Only results at 0% (max risk = 100)
      // Score should be 100 * 0.25 = 25
      const result = scoreRisk({
        attendanceRate: 100,
        duesAmount: 0,
        avgResult: 0,
      });
      expect(result.score).toBe(25);
    });
  });
});
