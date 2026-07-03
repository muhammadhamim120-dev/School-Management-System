import { NextRequest } from "next/server";
import { z } from "zod";
import { ok, fail, handleError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { signPayToken } from "@/lib/pay-token";

// PUBLIC (no session). Verifies identity via studentId + (phone OR date of birth)
// before returning any fee data, so invoices are not enumerable by ID alone.
const schema = z.object({
  studentId: z.string().min(1),
  phone: z.string().optional(),
  dob: z.string().optional(),
}).refine((d) => !!d.phone || !!d.dob, { message: "Provide phone or date of birth." });

export async function POST(req: NextRequest) {
  try {
    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      return fail("Invalid request body. Expected JSON.", 400);
    }
    const { studentId, phone, dob } = schema.parse(raw);
    const student = await prisma.student.findUnique({
      where: { studentId },
      include: { class: true, section: true },
    });
    if (!student) return fail("No matching student found. Check the details and try again.", 404);

    // Verify the second factor.
    // Phone: compare digits-only; match when the stored number ends with the
    // user's input (last 4+ digits) OR vice-versa. Tolerant of +880 / 0 prefixes.
    let phoneOk = false;
    if (phone && student.phone) {
      const a = student.phone.replace(/\D/g, "");
      const b = phone.replace(/\D/g, "");
      if (b.length >= 4) {
        const tail = b.slice(-Math.min(b.length, 8));
        phoneOk = a.endsWith(tail) || b.endsWith(a.slice(-Math.min(a.length, 8))) || a === b;
      }
    }
    // DOB: compare calendar dates in UTC (input type=date submits YYYY-MM-DD).
    let dobOk = false;
    if (dob && student.dateOfBirth) {
      const stored = new Date(student.dateOfBirth);
      const storedDay = `${stored.getUTCFullYear()}-${String(stored.getUTCMonth() + 1).padStart(2, "0")}-${String(stored.getUTCDate()).padStart(2, "0")}`;
      const input = new Date(dob);
      const inputDay = `${input.getUTCFullYear()}-${String(input.getUTCMonth() + 1).padStart(2, "0")}-${String(input.getUTCDate()).padStart(2, "0")}`;
      dobOk = storedDay === inputDay;
    }
    if (!phoneOk && !dobOk) return fail("Verification failed. Check the phone number or date of birth.", 401);

    const invoices = await prisma.invoice.findMany({
      where: { studentId: student.id, status: { in: ["ISSUED", "PARTIAL", "OVERDUE"] } },
      include: { items: { include: { category: true } } },
      orderBy: { dueDate: "asc" },
    });
    const outstanding = invoices
      .map((i: { total: number; paidTotal: number }) => Math.max(0, i.total - i.paidTotal))
      .reduce((s: number, n: number) => s + n, 0);

    return ok({
      token: signPayToken(student.id),
      student: {
        name: student.fullName, studentId: student.studentId,
        class: student.class?.name ?? null, section: student.section?.name ?? null,
      },
      invoices: invoices.map((i: {
        id: string; invoiceNo: string; total: number; paidTotal: number; status: string; dueDate: Date; period: string | null;
        items: { description: string; amount: number; discount: number; category?: { name: string; type: string } | null }[];
      }) => ({
        id: i.id, invoiceNo: i.invoiceNo, total: i.total, paidTotal: i.paidTotal,
        due: Math.max(0, i.total - i.paidTotal), status: i.status, dueDate: i.dueDate, period: i.period,
        items: i.items.map((it) => ({ description: it.description, amount: it.amount, discount: it.discount, category: it.category?.name ?? null, type: it.category?.type ?? "OTHER" })),
      })),
      outstanding,
    });
  } catch (e) { return handleError(e); }
}
