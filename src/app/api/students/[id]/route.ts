import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";
import { studentSchema } from "@/lib/validations";
import { auth } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const student = await prisma.student.findUnique({
      where: { id },
      include: { class: true, section: true, parent: true, attendance: true, results: true, fees: true },
    });
    if (!student) return handleError({ code: "P2025" });
    return ok(student);
  } catch (e) {
    return handleError(e);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return handleError({ code: "P2025" });
    const { id } = await params;
    const body = await req.json();
    const data = studentSchema.partial().parse(body);
    const student = await prisma.student.update({ where: { id }, data });
    return ok(student);
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return handleError({ code: "P2025" });
    const { id } = await params;
    await prisma.student.delete({ where: { id } });
    return ok({ id });
  } catch (e) {
    return handleError(e);
  }
}
