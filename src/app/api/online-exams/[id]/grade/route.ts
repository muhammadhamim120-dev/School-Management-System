import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, handleError } from "@/lib/api";
import { withTenantContext } from "@/lib/api-helpers";
import { recomputeRanking, attemptPercentage, attemptGrade } from "@/lib/online-exam";
import { z } from "zod";

const gradeBatchSchema = z.object({
  grades: z.array(z.object({ answerId: z.string().min(1), awardedMarks: z.coerce.number().min(0) })).min(1),
});

// POST { grades: [{ answerId, awardedMarks }] } — teacher grades written
// answers. Recomputes the attempt score (sum of all answers) and the exam
// ranking afterwards.
export const POST = withTenantContext(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const { grades } = gradeBatchSchema.parse(await req.json());

    // Apply each grade and capture the attempt id from the first row.
    let attemptId: string | null = null;
    for (const g of grades) {
      const ans = await prisma.examAnswer.findUnique({
        where: { id: g.answerId },
        include: { questionLink: { select: { examId: true, marks: true } }, attempt: { select: { examId: true } } },
      });
      if (!ans) continue;
      if (ans.questionLink.examId !== id) return fail("Answer does not belong to this exam", 400);
      const clamped = Math.min(g.awardedMarks, ans.questionLink.marks);
      await prisma.examAnswer.update({
        where: { id: g.answerId },
        data: { awardedMarks: clamped, isCorrect: clamped >= ans.questionLink.marks, gradedAt: new Date() },
      });
      attemptId = ans.attemptId;
    }
    if (!attemptId) return fail("No gradable answers found", 400);

    // Recompute the attempt score as the sum of all its answer marks.
    const all = await prisma.examAnswer.findMany({ where: { attemptId }, select: { awardedMarks: true } });
    const score = Math.max(0, Math.round(all.reduce((s, a) => s + a.awardedMarks, 0) * 100) / 100);
    await prisma.examAttempt.update({ where: { id: attemptId }, data: { score } });

    const exam = await prisma.onlineExam.findUnique({ where: { id }, select: { totalMarks: true } });
    const totalMarks = exam?.totalMarks ?? 100;
    await recomputeRanking(id);

    return ok({
      attemptId, score,
      percentage: attemptPercentage(score, totalMarks),
      grade: attemptGrade(score, totalMarks),
    });
  } catch (e) { return handleError(e); }
});
