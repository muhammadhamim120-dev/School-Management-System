import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";
import { auth } from "@/lib/auth";
import { z } from "zod";

const settingSchema = z.object({
  schoolName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  logo: z.string().optional().or(z.literal("")).transform((v) => (v === "" ? undefined : v)),
  academicYear: z.string().optional(),
});

async function getOrCreate() {
  let setting = await prisma.setting.findFirst();
  if (!setting) setting = await prisma.setting.create({ data: {} });
  return setting;
}

export async function GET() {
  try {
    return ok(await getOrCreate());
  } catch (e) { return handleError(e); }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth(); if (!session) return handleError({ code: "P2025" });
    const data = settingSchema.parse(await req.json());
    const current = await getOrCreate();
    return ok(await prisma.setting.update({ where: { id: current.id }, data }));
  } catch (e) { return handleError(e); }
}
