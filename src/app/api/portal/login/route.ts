import { NextRequest } from "next/server";
import { z } from "zod";
import { ok, fail, handleError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { signPortalToken } from "@/lib/portal-token";

// PUBLIC. Parent logs in with student ID + (phone OR date of birth).
const schema = z.object({
  studentId: z.string().min(1),
  phone: z.string().optional(),
  dob: z.string().optional(),
}).refine((d) => !!d.phone || !!d.dob, { message: "Provide phone or date of birth." });

export async function POST(req: NextRequest) {
  try {
    let raw: unknown;
    try { raw = await req.json(); } catch { return fail("Invalid request body.", 400); }
    const { studentId, phone, dob } = schema.parse(raw);

    const student = await prisma.student.findUnique({ where: { studentId }, include: { class: true, section: true, parent: true } });
    if (!student) return fail("No matching student found.", 404);

    let phoneOk = false;
    if (phone && student.phone) {
      const a = student.phone.replace(/\D/g, ""), b = phone.replace(/\D/g, "");
      if (b.length >= 4) { const tail = b.slice(-Math.min(b.length, 8)); phoneOk = a.endsWith(tail) || b.endsWith(a.slice(-Math.min(a.length, 8))) || a === b; }
    }
    let dobOk = false;
    if (dob && student.dateOfBirth) {
      const s = new Date(student.dateOfBirth); const sd = `${s.getUTCFullYear()}-${String(s.getUTCMonth() + 1).padStart(2, "0")}-${String(s.getUTCDate()).padStart(2, "0")}`;
      const i = new Date(dob); const id = `${i.getUTCFullYear()}-${String(i.getUTCMonth() + 1).padStart(2, "0")}-${String(i.getUTCDate()).padStart(2, "0")}`;
      dobOk = sd === id;
    }
    if (!phoneOk && !dobOk) return fail("Verification failed. Check the phone number or date of birth.", 401);

    return ok({
      token: signPortalToken(student.id),
      student: {
        id: student.id, name: student.fullName, studentId: student.studentId, photo: student.photo,
        class: student.class?.name ?? null, section: student.section?.name ?? null,
        guardian: student.parent?.fullName ?? null,
      },
    });
  } catch (e) { return handleError(e); }
}
