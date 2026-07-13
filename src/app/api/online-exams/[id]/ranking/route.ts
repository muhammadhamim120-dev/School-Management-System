import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";
import { withTenantContext } from "@/lib/api-helpers";
import { finalizeExpiredAttempts, recomputeRanking, attemptPercentage, attemptGrade } from "@/lib/online-exam";

// GET — leaderboard for an exam. Finalizes any expired in-progress attempts
// (so rankings are current), recomputes ranks, and returns attempts sorted by
// score with grade + pass/fail against the exam pass mark.
export const GET = withTenantContext(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;

    await finalizeExpiredAttempts(id);
    await recomputeRanking(id);

    const exam = await prisma.onlineExam.findUnique({ where: { id }, select: { totalMarks: true, passMark: true, title: true } });
    if (!exam) return handleError({ code: "P2025" });

    const attempts = await prisma.examAttempt.findMany({
      where: { examId: id, status: { in: ["SUBMITTED", "AUTO_SUBMITTED", "TIMED_OUT"] } },
      orderBy: [{ score: "desc" }, { submittedAt: "asc" }],
      include: { student: { include: { class: true, section: true } } },
    });

    const hasWritten = await prisma.examAnswer.count({
      where: {
        gradedAt: null,
        questionLink: { question: { type: "WRITTEN" } },
        attempt: { examId: id, status: { in: ["SUBMITTED", "AUTO_SUBMITTED"] } },
      },
    });

    const items = attempts.map((a, i) => ({
      rank: a.rank ?? i + 1,
      attemptId: a.id,
      studentId: a.studentId,
      name: a.student.fullName,
      studentCode: a.student.studentId,
      className: a.student.class?.name ?? null,
      status: a.status,
      score: a.score,
      percentage: attemptPercentage(a.score, exam.totalMarks),
      grade: attemptGrade(a.score, exam.totalMarks),
      passed: exam.passMark == null ? null : a.score >= exam.passMark,
      submittedAt: a.submittedAt,
    }));

    return ok({
      title: exam.title,
      totalMarks: exam.totalMarks,
      passMark: exam.passMark,
      pendingGrading: hasWritten,
      count: items.length,
      items,
    });
  } catch (e) { return handleError(e); }
});
