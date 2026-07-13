import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, handleError } from "@/lib/api";
import { withTenantContext } from "@/lib/api-helpers";
import { gradeAttempt, recomputeRanking, attemptPercentage, attemptGrade } from "@/lib/online-exam";

// POST { attemptId, auto? } — submit (or auto-submit) an attempt.
// Auto-grades every MCQ, persists the score, recomputes ranking, and returns
// the result summary with per-question correctness now revealed.
export const POST = withTenantContext(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const { attemptId, auto } = await req.json();
    if (!attemptId) return fail("attemptId is required", 400);

    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: { exam: { select: { id: true, totalMarks: true, negativeMark: true } } },
    });
    if (!attempt || attempt.exam.id !== id) return fail("Attempt not found for this exam", 404);

    // If already submitted, just return the existing result (idempotent).
    if (attempt.status !== "IN_PROGRESS") {
      return ok(await resultSummary(attemptId, attempt.exam.totalMarks));
    }

    // Freeze the attempt, then auto-grade MCQ answers.
    await prisma.examAttempt.update({
      where: { id: attemptId },
      data: { status: auto ? "AUTO_SUBMITTED" : "SUBMITTED", submittedAt: new Date() },
    });
    const score = await gradeAttempt(attemptId);
    await recomputeRanking(id);

    return ok(await resultSummary(attemptId, attempt.exam.totalMarks, score));
  } catch (e) { return handleError(e); }
});

// Build the result payload revealed after submission.
async function resultSummary(attemptId: string, totalMarks: number, score?: number) {
  const att = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    include: {
      answers: {
        include: {
          questionLink: { include: { question: { select: { type: true, text: true, options: true, correctOption: true } } } },
        },
      },
    },
  });
  if (!att) return fail("Attempt not found", 404);
  const finalScore = score ?? att.score;
  const mcq = att.answers.filter((a) => a.questionLink.question.type === "MCQ");
  const correct = mcq.filter((a) => a.isCorrect === true).length;
  const wrong = mcq.filter((a) => a.selectedOption != null && a.isCorrect === false).length;
  const unanswered = mcq.filter((a) => a.selectedOption == null).length;
  const pendingGrade = att.answers.some((a) => a.questionLink.question.type === "WRITTEN" && a.gradedAt == null);
  return {
    attemptId: att.id,
    status: att.status,
    score: finalScore,
    totalMarks,
    percentage: attemptPercentage(finalScore, totalMarks),
    grade: attemptGrade(finalScore, totalMarks),
    rank: att.rank,
    correct, wrong, unanswered,
    pendingGrade,
    submittedAt: att.submittedAt,
    answers: att.answers.map((a) => ({
      questionLinkId: a.questionLinkId,
      type: a.questionLink.question.type,
      text: a.questionLink.question.text,
      selectedOption: a.selectedOption,
      correctOption: a.questionLink.question.correctOption,
      options: a.questionLink.question.options,
      writtenAnswer: a.writtenAnswer,
      awardedMarks: a.awardedMarks,
      isCorrect: a.isCorrect,
      gradedAt: a.gradedAt,
    })),
  };
}
