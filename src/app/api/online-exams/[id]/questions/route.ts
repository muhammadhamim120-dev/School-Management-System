import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, handleError } from "@/lib/api";
import { attachExamQuestionsSchema } from "@/lib/validations";
import { withTenantContext } from "@/lib/api-helpers";

// POST — attach a set of bank questions to the exam (idempotent upsert with
// per-question marks). `order` is derived from the current max.
export const POST = withTenantContext(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const { items } = attachExamQuestionsSchema.parse(await req.json());
    const exam = await prisma.onlineExam.findUnique({ where: { id }, select: { _count: { select: { questions: true } } } });
    if (!exam) return handleError({ code: "P2025" });
    let order = exam._count.questions;
    const created_rows = [];
    for (const it of items) {
      const row = await prisma.onlineExamQuestion.upsert({
        where: { examId_questionId: { examId: id, questionId: it.questionId } },
        update: { marks: it.marks },
        create: { examId: id, questionId: it.questionId, marks: it.marks, order: order++ },
        include: { question: true },
      });
      created_rows.push(row);
    }
    return created({ attached: created_rows.length, items: created_rows });
  } catch (e) { return handleError(e); }
});

// DELETE — detach a question via ?questionId=. Recomputing order is cosmetic.
export const DELETE = withTenantContext(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const questionId = req.nextUrl.searchParams.get("questionId");
    if (!questionId) return handleError({ code: "P2025" });
    await prisma.onlineExamQuestion.delete({ where: { examId_questionId: { examId: id, questionId } } });
    return ok({ detached: true });
  } catch (e) { return handleError(e); }
});
