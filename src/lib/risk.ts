// Rules-based dropout risk scoring — transparent, no external ML.
//
// Combines three signals into a 0-100 risk score (higher = more at risk):
//   • Attendance rate (weight 45): low attendance is the strongest predictor.
//   • Fee dues (weight 30): larger outstanding balances raise risk.
//   • Academic results (weight 25): lower average results raise risk.
//
// Each sub-score is 0-100; the weighted blend is mapped to LOW/MEDIUM/HIGH.
// A human-readable factor list is produced alongside for explainability.

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export type RiskInputs = {
  attendanceRate: number | null; // 0-100, or null if no data
  duesAmount: number;            // outstanding fees in currency
  avgResult: number | null;      // 0-100 average percentage, or null
};

export type RiskResult = {
  score: number;      // 0-100
  level: RiskLevel;
  factors: string[];
};

const WEIGHTS = { attendance: 0.45, dues: 0.30, results: 0.25 };
// Dues normalization ceiling: dues >= this contribute the full dues sub-score.
const DUES_CEILING = 10000;

export function scoreRisk(inputs: RiskInputs): RiskResult {
  const factors: string[] = [];

  // Attendance sub-score: fewer present days => higher risk.
  const attRate = inputs.attendanceRate ?? 100; // no data => assume fine
  const attendanceRisk = clamp(100 - attRate);
  if (attRate < 70) factors.push(`Low attendance (${Math.round(attRate)}%)`);

  // Dues sub-score: scaled up to the ceiling.
  const duesRisk = clamp((Math.max(0, inputs.duesAmount) / DUES_CEILING) * 100);
  if (inputs.duesAmount > 0) factors.push(`Outstanding dues`);

  // Results sub-score: lower average => higher risk.
  const avg = inputs.avgResult ?? 100;
  const resultsRisk = clamp(100 - avg);
  if (inputs.avgResult !== null && avg < 50) factors.push(`Below-average results (${Math.round(avg)}%)`);

  const score = Math.round(
    attendanceRisk * WEIGHTS.attendance +
    duesRisk * WEIGHTS.dues +
    resultsRisk * WEIGHTS.results
  );

  const level: RiskLevel = score >= 60 ? "HIGH" : score >= 35 ? "MEDIUM" : "LOW";
  if (factors.length === 0) factors.push("No significant risk factors");

  return { score, level, factors };
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, n));
}
