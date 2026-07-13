import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, handleError } from "@/lib/api";
import { bookCopySchema } from "@/lib/validations";
import { tenantWhere } from "@/lib/tenant";
import { withTenantContext } from "@/lib/api-helpers";
import { getRequiredTenantId } from "@/lib/tenant-context";

export const GET = withTenantContext(async (req: NextRequest) => {
  try {
    const bookId = req.nextUrl.searchParams.get("bookId")?.trim();
    const where = tenantWhere(bookId ? { bookId } : {});
    const items = await prisma.bookCopy.findMany({ where, orderBy: { copyCode: "asc" }, include: { book: true } });
    return ok({ items, total: items.length, page: 1, limit: items.length, totalPages: 1 });
  } catch (e) { return handleError(e); }
});

export const POST = withTenantContext(async (req: NextRequest) => {
  try {
    const data = bookCopySchema.parse(await req.json());
    return created(await prisma.bookCopy.create({ data: { ...data, schoolId: getRequiredTenantId() } }));
  } catch (e) { return handleError(e); }
});
