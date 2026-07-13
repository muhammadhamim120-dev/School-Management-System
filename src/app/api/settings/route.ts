import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";
import { requireAdmin } from "@/lib/api-auth";
import { validateCsrf } from "@/lib/csrf";
import { z } from "zod";
import { tenantWhere } from "@/lib/tenant";
import { withTenantContext } from "@/lib/api-helpers";
import { getRequiredTenantId } from "@/lib/tenant-context";

const settingSchema = z.object({
  schoolName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  logo: z.string().optional().or(z.literal("")).transform((v) => (v === "" ? undefined : v)),
  academicYear: z.string().optional(),
});

async function getOrCreate() {
  const schoolId = getRequiredTenantId();
  let setting = await prisma.setting.findFirst({ where: tenantWhere({}) });
  if (!setting) setting = await prisma.setting.create({ data: { schoolId } });
  return setting;
}

export const GET = withTenantContext(async () => {
  try {
    return ok(await getOrCreate());
  } catch (e) { return handleError(e); }
});

export const PATCH = withTenantContext(async (req: NextRequest) => {
  try {
    // CSRF protection
    const csrfError = validateCsrf(req);
    if (csrfError) return csrfError;

    const auth = await requireAdmin();
    if (!auth.authenticated) return auth.error;

    const data = settingSchema.parse(await req.json());
    const current = await getOrCreate();
    return ok(await prisma.setting.update({ where: { id: current.id }, data }));
  } catch (e) { return handleError(e); }
});
