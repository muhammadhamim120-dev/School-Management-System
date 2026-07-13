import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";
import { withTenantContext } from "@/lib/api-helpers";
import { z } from "zod";

const patchSchema = z.object({ status: z.enum(["AVAILABLE","ISSUED","LOST","DAMAGED","RESERVED"]).optional(), copyCode: z.string().optional() });

export const PATCH = withTenantContext(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const data = patchSchema.parse(await req.json());
    return ok(await prisma.bookCopy.update({ where: { id }, data }));
  } catch (e) { return handleError(e); }
});

export const DELETE = withTenantContext(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    await prisma.bookCopy.delete({ where: { id } });
    return ok({ id });
  } catch (e) { return handleError(e); }
});
