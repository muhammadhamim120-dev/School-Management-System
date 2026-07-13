import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";
import { withTenantContext } from "@/lib/api-helpers";
import { attemptPercentage, attemptGrade } from "@/lib/online-exam";

// GET — a single attempt with all answers, for teacher review / grading of
// written questions. Reveals the answer keys (correctOption / modelAnswer).
export const GET = withTenantContext(async (_req: NextRequest, { params }: { params: Promise<{ id: string; attemptId: string }> }) => {
  try {
    const { id, attemptId } = await params;
    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        student: { include: { class: true, section: true } },
        exam: { select: { id: true, totalMarks: true, negativeMark: true, passMark: true } },
        answers: {
          orderBy: { questionLink: { order: "asc" } },
          include: { questionLink: { include: { question: true } } },
        },
      },
    });
    if (!attempt || attempt.exam.id !== id) return handleError({ code: "P2025" });

    return ok({
      attemptId: attempt.id,
      status: attempt.status,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      rank: attempt.rank,
      score: attempt.score,
      totalMarks: attempt.exam.totalMarks,
      percentage: attemptPercentage(attempt.score, attempt.exam.totalMarks),
      grade: attemptGrade(attempt.score, attempt.exam.totalMarks),
      negativeMark: attempt.exam.negativeMark,
      student: {
        id: attempt.student.id,
        name: attempt.student.fullName,
        studentId: attempt.student.studentId,
        className: attempt.student.class?.name ?? null,
      },
      answers: attempt.answers.map((a) => ({
        answerId: a.id,
        questionLinkId: a.questionLinkId,
        type: a.questionLink.question.type,
        text: a.questionLink.question.text,
        options: a.questionLink.question.options as string[] | null,
        correctOption: a.questionLink.question.correctOption,
        modelAnswer: a.questionLink.question.modelAnswer,
        maxMarks: a.questionLink.marks,
        selectedOption: a.selectedOption,
        writtenAnswer: a.writtenAnswer,
        attachmentUrl: a.attachmentUrl,
        awardedMarks: a.awardedMarks,
        isCorrect: a.isCorrect,
        gradedAt: a.gradedAt,
      })),
    });
  } catch (e) { return handleError(e); }
});
