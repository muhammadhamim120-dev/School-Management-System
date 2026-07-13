import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";
import { requireSuperAdmin } from "@/lib/api-auth";

export const GET = async (req: NextRequest) => {
  try {
    const auth = await requireSuperAdmin();
    if (!auth.authenticated) return auth.error;

    // Global settings stored as a single Setting record with null schoolId
    let settings = await prisma.setting.findFirst({ where: { schoolId: null } });

    if (!settings) {
      settings = await prisma.setting.create({
        data: {
          schoolName: "EduPlatform",
          email: "support@eduplatform.com",
          phone: "+880 1700-000000",
          address: "Dhaka, Bangladesh",
          academicYear: "2025-2026",
        },
      });
    }

    return ok(settings);
  } catch (e) {
    return handleError(e);
  }
};

export const PATCH = async (req: NextRequest) => {
  try {
    const auth = await requireSuperAdmin();
    if (!auth.authenticated) return auth.error;

    const body = await req.json();

    let settings = await prisma.setting.findFirst({ where: { schoolId: null } });

    if (!settings) {
      settings = await prisma.setting.create({ data: { schoolName: "EduPlatform" } });
    }

    const updated = await prisma.setting.update({
      where: { id: settings.id },
      data: {
        ...(body.schoolName !== undefined && { schoolName: body.schoolName }),
        ...(body.email !== undefined && { email: body.email }),
        ...(body.phone !== undefined && { phone: body.phone }),
        ...(body.address !== undefined && { address: body.address }),
        ...(body.academicYear !== undefined && { academicYear: body.academicYear }),
        ...(body.logo !== undefined && { logo: body.logo }),
        ...(body.principalName !== undefined && { principalName: body.principalName }),
        ...(body.theme !== undefined && { theme: body.theme }),
        ...(body.customCss !== undefined && { customCss: body.customCss }),
      },
    });

    return ok(updated);
  } catch (e) {
    return handleError(e);
  }
};
