// Online examination core logic: deadlines, auto-grading, ranking.
//
// Reuses the national grading engine (src/lib/grading.ts) for letter grades so
// online-exam results are consistent with offline exam marksheets.

import { prisma } from "@/lib/prisma";
import { gradeForPercentage } from "@/lib/grading";

/** Per-attempt hard deadline = min(exam end, attempt start + duration). */
export function attemptDeadline(startedAt: Date, exam: { endTime: Date; durationMinutes: number }): Date {
  const byDuration = new Date(startedAt.getTime() + exam.durationMinutes * 60_000);
  return byDuration < exam.endTime ? byDuration : exam.endTime;
}

/** Remaining seconds for an in-progress attempt (never negative). */
export function remainingSeconds(startedAt: Date, exam: { endTime: Date; durationMinutes: number }): number {
  const dl = attemptDeadline(startedAt, exam);
  return Math.max(0, Math.floor((dl.getTime() - Date.now()) / 1000));
}

/**
 * Auto-grade the MCQ answers of an attempt and write the score.
 *  - correct  -> +questionLink.marks
 *  - wrong    -> -exam.negativeMark (per wrong MCQ)
 *  - unanswered-> 0
 * Written answers are left at 0 with gradedAt=null for teacher review.
 * Returns the computed score.
 */
export async function gradeAttempt(attemptId: string): Promise<number> {
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    include: {
      exam: { select: { negativeMark: true } },
      answers: { include: { questionLink: { include: { question: true } } } },
    },
  });
  if (!attempt) return 0;

  let score = 0;
  const answersToUpdate: Array<{ id: string; awardedMarks: number; isCorrect: boolean; gradedAt: Date }> = [];

  for (const ans of attempt.answers) {
    const q = ans.questionLink.question;
    if (q.type === "MCQ") {
      const correct = ans.selectedOption != null && ans.selectedOption === q.correctOption;
      const awarded = correct
        ? ans.questionLink.marks
        : ans.selectedOption == null
          ? 0
          : -Math.abs(attempt.exam.negativeMark);
      score += awarded;
      answersToUpdate.push({
        id: ans.id,
        awardedMarks: awarded,
        isCorrect: correct,
        gradedAt: new Date(),
      });
    }
    // Written: leave for manual grading, but keep awardedMarks as-is (default 0).
  }

  // Batch update all answers in a single transaction
  if (answersToUpdate.length > 0) {
    await prisma.$transaction(
      answersToUpdate.map((ans) =>
        prisma.examAnswer.update({
          where: { id: ans.id },
          data: { awardedMarks: ans.awardedMarks, isCorrect: ans.isCorrect, gradedAt: ans.gradedAt },
        })
      )
    );
  }

  // Clamp the final score at 0 — a negative total is not meaningful for ranking/grading.
  const finalScore = Math.max(0, Math.round(score * 100) / 100);
  await prisma.examAttempt.update({ where: { id: attemptId }, data: { score: finalScore } });
  return finalScore;
}

/**
 * Finalize (auto-submit) every in-progress attempt whose deadline has passed.
 * Called on start/answer/submit/ranking so a student who never clicks submit
 * still gets an auto-submitted, auto-graded attempt when the timer expires.
 */
export async function finalizeExpiredAttempts(examId: string): Promise<number> {
  const exam = await prisma.onlineExam.findUnique({ where: { id: examId }, select: { endTime: true, durationMinutes: true } });
  if (!exam) return 0;
  const active = await prisma.examAttempt.findMany({
    where: { examId, status: "IN_PROGRESS" },
    select: { id: true, startedAt: true },
  });
  const now = Date.now();
  const expired = active.filter((a) => now >= attemptDeadline(a.startedAt, exam).getTime());
  if (expired.length === 0) return 0;

  // Batch update all expired attempts to AUTO_SUBMITTED
  const now_date = new Date();
  await prisma.$transaction(
    expired.map((a) =>
      prisma.examAttempt.update({
        where: { id: a.id },
        data: { status: "AUTO_SUBMITTED", submittedAt: now_date },
      })
    )
  );

  // Grade each attempt (these need individual processing due to answer grading)
  for (const a of expired) {
    await gradeAttempt(a.id);
  }

  await recomputeRanking(examId);
  return expired.length;
}

/**
 * Rank all submitted/auto-submitted attempts for an exam by score desc and
 * persist the rank. Ties share the higher position (standard competition
 * ranking). In-progress attempts are excluded from ranking.
 */
export async function recomputeRanking(examId: string): Promise<void> {
  const attempts = await prisma.examAttempt.findMany({
    where: { examId, status: { in: ["SUBMITTED", "AUTO_SUBMITTED", "TIMED_OUT"] } },
    orderBy: { score: "desc" },
    select: { id: true, score: true },
  });

  // Calculate ranks first
  const rankUpdates: Array<{ id: string; rank: number }> = [];
  let rank = 0;
  let prevScore: number | null = null;
  let position = 0;

  for (const a of attempts) {
    position++;
    if (prevScore === null || a.score !== prevScore) rank = position;
    rankUpdates.push({ id: a.id, rank });
    prevScore = a.score;
  }

  // Batch update all ranks in a single transaction
  if (rankUpdates.length > 0) {
    await prisma.$transaction(
      rankUpdates.map((update) =>
        prisma.examAttempt.update({
          where: { id: update.id },
          data: { rank: update.rank },
        })
      )
    );
  }
}

/** Percentage score for grading (0–100), clamped. */
export function attemptPercentage(score: number, totalMarks: number): number {
  if (!totalMarks) return 0;
  return Math.max(0, Math.min(100, (score / totalMarks) * 100));
}

/** Letter grade for an attempt using the national grading engine. */
export function attemptGrade(score: number, totalMarks: number): string {
  return gradeForPercentage(attemptPercentage(score, totalMarks));
}
