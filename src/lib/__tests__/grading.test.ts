import { describe, it, expect } from "vitest";
import {
  GRADE_BANDS,
  bandForPercentage,
  gradeForPercentage,
  pointForPercentage,
  pointForGrade,
  isFail,
  computeGpa,
  formatGpa,
} from "../grading";

describe("Grading Utilities", () => {
  describe("bandForPercentage", () => {
    it("returns A+ for 100%", () => {
      const band = bandForPercentage(100);
      expect(band.grade).toBe("A+");
      expect(band.point).toBe(5.0);
    });

    it("returns A+ for 80%", () => {
      const band = bandForPercentage(80);
      expect(band.grade).toBe("A+");
    });

    it("returns A for 75%", () => {
      const band = bandForPercentage(75);
      expect(band.grade).toBe("A");
      expect(band.point).toBe(4.0);
    });

    it("returns A- for 65%", () => {
      const band = bandForPercentage(65);
      expect(band.grade).toBe("A-");
      expect(band.point).toBe(3.5);
    });

    it("returns B for 55%", () => {
      const band = bandForPercentage(55);
      expect(band.grade).toBe("B");
      expect(band.point).toBe(3.0);
    });

    it("returns C for 45%", () => {
      const band = bandForPercentage(45);
      expect(band.grade).toBe("C");
      expect(band.point).toBe(2.0);
    });

    it("returns D for 35%", () => {
      const band = bandForPercentage(35);
      expect(band.grade).toBe("D");
      expect(band.point).toBe(1.0);
    });

    it("returns F for 0%", () => {
      const band = bandForPercentage(0);
      expect(band.grade).toBe("F");
      expect(band.point).toBe(0.0);
    });

    it("clamps negative values to 0", () => {
      const band = bandForPercentage(-10);
      expect(band.grade).toBe("F");
    });

    it("clamps values above 100 to 100", () => {
      const band = bandForPercentage(150);
      expect(band.grade).toBe("A+");
    });

    it("handles NaN as 0", () => {
      const band = bandForPercentage(NaN);
      expect(band.grade).toBe("F");
    });
  });

  describe("gradeForPercentage", () => {
    it("returns correct letter grades", () => {
      expect(gradeForPercentage(90)).toBe("A+");
      expect(gradeForPercentage(75)).toBe("A");
      expect(gradeForPercentage(65)).toBe("A-");
      expect(gradeForPercentage(55)).toBe("B");
      expect(gradeForPercentage(45)).toBe("C");
      expect(gradeForPercentage(35)).toBe("D");
      expect(gradeForPercentage(20)).toBe("F");
    });
  });

  describe("pointForPercentage", () => {
    it("returns correct grade points", () => {
      expect(pointForPercentage(90)).toBe(5.0);
      expect(pointForPercentage(75)).toBe(4.0);
      expect(pointForPercentage(65)).toBe(3.5);
      expect(pointForPercentage(55)).toBe(3.0);
      expect(pointForPercentage(45)).toBe(2.0);
      expect(pointForPercentage(35)).toBe(1.0);
      expect(pointForPercentage(20)).toBe(0.0);
    });
  });

  describe("pointForGrade", () => {
    it("returns correct points for letter grades", () => {
      expect(pointForGrade("A+")).toBe(5.0);
      expect(pointForGrade("A")).toBe(4.0);
      expect(pointForGrade("A-")).toBe(3.5);
      expect(pointForGrade("B")).toBe(3.0);
      expect(pointForGrade("C")).toBe(2.0);
      expect(pointForGrade("D")).toBe(1.0);
      expect(pointForGrade("F")).toBe(0.0);
    });

    it("returns 0 for unknown grade", () => {
      expect(pointForGrade("X")).toBe(0);
      expect(pointForGrade("")).toBe(0);
    });
  });

  describe("isFail", () => {
    it("returns true for F grade", () => {
      expect(isFail("F")).toBe(true);
    });

    it("returns false for passing grades", () => {
      expect(isFail("A+")).toBe(false);
      expect(isFail("A")).toBe(false);
      expect(isFail("A-")).toBe(false);
      expect(isFail("B")).toBe(false);
      expect(isFail("C")).toBe(false);
      expect(isFail("D")).toBe(false);
    });
  });

  describe("computeGpa", () => {
    it("computes GPA for all A+ subjects", () => {
      const subjects = [
        { percentage: 90, countsTowardGpa: true },
        { percentage: 95, countsTowardGpa: true },
        { percentage: 85, countsTowardGpa: true },
      ];
      const result = computeGpa(subjects);
      expect(result.gpa).toBe(5.0);
      expect(result.overallGrade).toBe("A+");
      expect(result.failed).toBe(false);
      expect(result.subjectCount).toBe(3);
    });

    it("computes GPA for mixed grades", () => {
      const subjects = [
        { percentage: 90, countsTowardGpa: true }, // A+ = 5.0
        { percentage: 75, countsTowardGpa: true }, // A = 4.0
        { percentage: 55, countsTowardGpa: true }, // B = 3.0
      ];
      const result = computeGpa(subjects);
      // Average: (5.0 + 4.0 + 3.0) / 3 = 4.0
      expect(result.gpa).toBe(4.0);
      expect(result.overallGrade).toBe("A");
      expect(result.failed).toBe(false);
    });

    it("returns F if any subject fails", () => {
      const subjects = [
        { percentage: 90, countsTowardGpa: true },
        { percentage: 20, countsTowardGpa: true }, // F = 0.0
        { percentage: 75, countsTowardGpa: true },
      ];
      const result = computeGpa(subjects);
      expect(result.gpa).toBe(0);
      expect(result.overallGrade).toBe("F");
      expect(result.failed).toBe(true);
    });

    it("excludes non-GPA-counting subjects", () => {
      const subjects = [
        { percentage: 90, countsTowardGpa: true }, // A+ = 5.0
        { percentage: 20, countsTowardGpa: false }, // Excluded
        { percentage: 75, countsTowardGpa: true }, // A = 4.0
      ];
      const result = computeGpa(subjects);
      // Average: (5.0 + 4.0) / 2 = 4.5
      expect(result.gpa).toBe(4.5);
      expect(result.failed).toBe(false);
      expect(result.subjectCount).toBe(2);
    });

    it("handles empty subjects array", () => {
      const result = computeGpa([]);
      expect(result.gpa).toBe(0);
      expect(result.overallGrade).toBe("F");
      expect(result.failed).toBe(true);
      expect(result.subjectCount).toBe(0);
    });

    it("handles all non-GPA-counting subjects", () => {
      const subjects = [
        { percentage: 90, countsTowardGpa: false },
        { percentage: 75, countsTowardGpa: false },
      ];
      const result = computeGpa(subjects);
      expect(result.gpa).toBe(0);
      expect(result.failed).toBe(true);
      expect(result.subjectCount).toBe(0);
    });

    it("caps GPA at 5.0", () => {
      const subjects = [
        { percentage: 100, countsTowardGpa: true },
        { percentage: 100, countsTowardGpa: true },
      ];
      const result = computeGpa(subjects);
      expect(result.gpa).toBe(5.0);
    });
  });

  describe("formatGpa", () => {
    it("formats GPA to two decimal places", () => {
      expect(formatGpa(4.5)).toBe("4.50");
      expect(formatGpa(5)).toBe("5.00");
      expect(formatGpa(3.333)).toBe("3.33");
    });

    it("handles zero", () => {
      expect(formatGpa(0)).toBe("0.00");
    });
  });

  describe("GRADE_BANDS", () => {
    it("has 7 grade bands", () => {
      expect(GRADE_BANDS).toHaveLength(7);
    });

    it("is ordered from highest to lowest", () => {
      for (let i = 0; i < GRADE_BANDS.length - 1; i++) {
        expect(GRADE_BANDS[i].min).toBeGreaterThan(GRADE_BANDS[i + 1].min);
      }
    });
  });
});
