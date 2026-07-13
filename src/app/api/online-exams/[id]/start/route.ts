import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, handleError } from "@/lib/api";
import { withTenantContext } from "@/lib/api-helpers";
import { finalizeExpiredAttempts, remainingSeconds, attemptDeadline } from "@/lib/online-exam";

// POST { studentId } — begin or resume an attempt.
// Returns the attempt id, the per-attempt deadline / remaining seconds, and the
// questions WITHOUT answer keys (correctOption / modelAnswer are stripped).
export const POST = withTenantContext(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const { studentId } = await req.json();
    if (!studentId) return fail("Student is required", 400);

    const exam = await prisma.onlineExam.findUnique({
      where: { id },
      include: { questions: { include: { question: true }, orderBy: { order: "asc" } } },
    });
    if (!exam) return handleError({ code: "P2025" });

    // Housekeeping: auto-submit any attempts whose timer expired.
    await finalizeExpiredAttempts(id);

    const now = Date.now();
    if (exam.status !== "LIVE") return fail("Exam is not live yet", 409);
    if (now < exam.startTime.getTime()) return fail("Exam has not started yet", 409);
    if (now >= exam.endTime.getTime()) return fail("Exam window has closed", 409);
    if (exam.questions.length === 0) return fail("No questions attached to this exam", 409);

    // Resume an existing attempt, or create a fresh one.
    let attempt = await prisma.examAttempt.findUnique({
      where: { examId_studentId: { examId: id, studentId } },
      include: { answers: true },
    });
    if (attempt && attempt.status !== "IN_PROGRESS") {
      return fail("You already submitted this exam", 409);
    }
    if (!attempt) {
      attempt = await prisma.examAttempt.create({
        data: {
          examId: id, studentId, status: "IN_PROGRESS",
          answers: {
            create: exam.questions.map((q) => ({ questionLinkId: q.id })),
          },
        },
        include: { answers: true },
      });
    }

    // Strip answer keys before sending to the client.
    const safeQuestions = exam.questions.map((link, i) => ({
      index: i + 1,
      questionLinkId: link.id,
      type: link.question.type,
      text: link.question.text,
      options: link.question.type === "MCQ" ? (link.question.options as string[] | null) ?? [] : undefined,
      marks: link.marks,
    }));

    const existing = Object.fromEntries(attempt.answers.map((a) => [a.questionLinkId, a]));
    const answersState = exam.questions.map((link) => ({
      questionLinkId: link.id,
      selectedOption: existing[link.id]?.selectedOption ?? null,
      writtenAnswer: existing[link.id]?.writtenAnswer ?? null,
      attachmentUrl: existing[link.id]?.attachmentUrl ?? null,
    }));

    const deadline = attemptDeadline(attempt.startedAt, exam);
    return ok({
      attemptId: attempt.id,
      status: attempt.status,
      startedAt: attempt.startedAt,
      deadline,
      remainingSeconds: remainingSeconds(attempt.startedAt, exam),
      durationMinutes: exam.durationMinutes,
      totalMarks: exam.totalMarks,
      shuffleQuestions: exam.shuffleQuestions,
      questions: safeQuestions,
      answers: answersState,
    });
  } catch (e) { return handleError(e); }
});
