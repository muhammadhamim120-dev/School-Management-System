import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, handleError } from "@/lib/api";
import { withTenantContext } from "@/lib/api-helpers";
import { attemptDeadline } from "@/lib/online-exam";
import { z } from "zod";

const saveAnswerSchema = z.object({
  attemptId: z.string().min(1),
  questionLinkId: z.string().min(1),
  selectedOption: z.coerce.number().int().min(0).optional(),
  writtenAnswer: z.string().optional(),
  attachmentUrl: z.string().optional(),
});

// POST — autosave a single answer during an attempt. Idempotent per
// (attempt, question). Refuses writes after the per-attempt deadline.
export const POST = withTenantContext(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const data = saveAnswerSchema.parse(await req.json());

    const att = await prisma.examAttempt.findUnique({
      where: { id: data.attemptId },
      include: { exam: { select: { id: true, endTime: true, durationMinutes: true } } },
    });
    if (!att || att.exam.id !== id) return fail("Attempt not found for this exam", 404);
    if (att.status !== "IN_PROGRESS") return fail("Attempt is not in progress", 409);
    if (Date.now() >= attemptDeadline(att.startedAt, att.exam).getTime()) return fail("Time is up", 409);

    // Verify the question link belongs to the same exam.
    const link = await prisma.onlineExamQuestion.findUnique({ where: { id: data.questionLinkId }, select: { examId: true } });
    if (!link || link.examId !== id) return fail("Question not part of this exam", 400);

    await prisma.examAnswer.upsert({
      where: { attemptId_questionLinkId: { attemptId: data.attemptId, questionLinkId: data.questionLinkId } },
      update: {
        selectedOption: data.selectedOption,
        writtenAnswer: data.writtenAnswer,
        attachmentUrl: data.attachmentUrl,
      },
      create: {
        attemptId: data.attemptId,
        questionLinkId: data.questionLinkId,
        selectedOption: data.selectedOption,
        writtenAnswer: data.writtenAnswer,
        attachmentUrl: data.attachmentUrl,
      },
    });
    return ok({ saved: true });
  } catch (e) { return handleError(e); }
});
