import { NextRequest } from "next/server";
import { ok, fail, handleError } from "@/lib/api";
import { requireAdmin } from "@/lib/api-auth";
import { withTenantContext } from "@/lib/api-helpers";
import { validateCsrf } from "@/lib/csrf";
import { z } from "zod";
import { upgradeTier, getSubscription, canUpgrade } from "@/lib/subscription";
import type { PlanTier } from "@prisma/client";

const schema = z.object({ tier: z.enum(["FREE", "STARTER", "PROFESSIONAL", "ENTERPRISE"]) });

export const POST = withTenantContext(async (req: NextRequest) => {
  try {
    const csrfError = validateCsrf(req);
    if (csrfError) return csrfError;

    const auth = await requireAdmin();
    if (!auth.authenticated) return auth.error;

    const { tier } = schema.parse(await req.json());
    const current = await getSubscription();
    const currentTier = (current?.tier ?? "FREE") as PlanTier;

    if (tier === currentTier) return fail("Already on this plan");
    if (!canUpgrade(currentTier, tier)) return fail("Can only upgrade to a higher tier");

    const updated = await upgradeTier(tier);
    return ok(updated);
  } catch (e) {
    return handleError(e);
  }
});
