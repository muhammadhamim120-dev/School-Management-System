// Bangladesh national grading system (NCTB / education board standard).
//
// Letter grade, grade point, and GPA computation. This is the single source of
// truth for grading across the app (results entry, marksheets, transcripts,
// report cards, tabulation sheets).
//
// Standard mark-range → grade mapping:
//   80–100  A+  5.00
//   70–79   A   4.00
//   60–69   A-  3.50
//   50–59   B   3.00
//   40–49   C   2.00
//   33–39   D   1.00
//   0–32    F   0.00 (fail)

export type LetterGrade = "A+" | "A" | "A-" | "B" | "C" | "D" | "F";

export type GradeBand = {
  grade: LetterGrade;
  point: number;
  min: number; // inclusive lower bound of percentage
  label: string; // human label used on documents
};

export const GRADE_BANDS: GradeBand[] = [
  { grade: "A+", point: 5.0, min: 80, label: "Outstanding" },
  { grade: "A", point: 4.0, min: 70, label: "Excellent" },
  { grade: "A-", point: 3.5, min: 60, label: "Very Good" },
  { grade: "B", point: 3.0, min: 50, label: "Good" },
  { grade: "C", point: 2.0, min: 40, label: "Fair" },
  { grade: "D", point: 1.0, min: 33, label: "Pass" },
  { grade: "F", point: 0.0, min: 0, label: "Fail" },
];

/** Clamp a raw percentage into 0–100. */
function clampPct(pct: number): number {
  if (Number.isNaN(pct)) return 0;
  return Math.max(0, Math.min(100, pct));
}

/** Resolve the grade band for a given percentage (0–100). */
export function bandForPercentage(pct: number): GradeBand {
  const p = clampPct(pct);
  // GRADE_BANDS is ordered high→low; first band whose min is <= p wins.
  return GRADE_BANDS.find((b) => p >= b.min) ?? GRADE_BANDS[GRADE_BANDS.length - 1];
}

/** Letter grade for a percentage. */
export function gradeForPercentage(pct: number): LetterGrade {
  return bandForPercentage(pct).grade;
}

/** Grade point (0.00–5.00) for a percentage. */
export function pointForPercentage(pct: number): number {
  return bandForPercentage(pct).point;
}

/** Grade point for an already-assigned letter grade. */
export function pointForGrade(grade: string): number {
  return GRADE_BANDS.find((b) => b.grade === grade)?.point ?? 0;
}

export function isFail(grade: string): boolean {
  return grade === "F";
}

export type SubjectResult = {
  /** Percentage 0–100 for the subject (already computed from marks/total). */
  percentage: number;
  /** Optional: whether this subject is counted toward GPA (electives may not be). */
  countsTowardGpa?: boolean;
};

export type GpaSummary = {
  gpa: number; // 0.00–5.00, two decimals
  overallGrade: LetterGrade; // grade corresponding to the GPA (or F if any fail)
  failed: boolean;
  subjectCount: number;
};

/**
 * Compute GPA the Bangladesh way:
 *  - If the student fails ANY GPA-counting subject, overall result is F / GPA 0.00.
 *  - Otherwise GPA is the average of subject grade points, capped at 5.00.
 */
export function computeGpa(subjects: SubjectResult[]): GpaSummary {
  const counted = subjects.filter((s) => s.countsTowardGpa !== false);
  if (counted.length === 0) {
    return { gpa: 0, overallGrade: "F", failed: true, subjectCount: 0 };
  }

  const points = counted.map((s) => pointForPercentage(s.percentage));
  const anyFail = points.some((p) => p === 0);

  if (anyFail) {
    return { gpa: 0, overallGrade: "F", failed: true, subjectCount: counted.length };
  }

  const raw = points.reduce((sum, p) => sum + p, 0) / counted.length;
  const gpa = Math.min(5.0, Math.round(raw * 100) / 100);

  // Map GPA back to a representative letter grade for the summary line.
  const overallGrade =
    gpa >= 5.0 ? "A+" :
    gpa >= 4.0 ? "A" :
    gpa >= 3.5 ? "A-" :
    gpa >= 3.0 ? "B" :
    gpa >= 2.0 ? "C" :
    gpa >= 1.0 ? "D" : "F";

  return { gpa, overallGrade, failed: false, subjectCount: counted.length };
}

/** Format a GPA to the conventional two-decimal string (e.g. "4.83"). */
export function formatGpa(gpa: number): string {
  return gpa.toFixed(2);
}
