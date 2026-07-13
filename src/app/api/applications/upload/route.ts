import { NextRequest } from "next/server";
import { ok, fail, handleError } from "@/lib/api";
import { withTenantContext } from "@/lib/api-helpers";
import fs from "node:fs/promises";
import path from "node:path";

// POST multipart/form-data with a `file` field — stores the upload under
// public/uploads and returns its URL. Public read; auth required to upload.
// Works in dev and self-hosted deploys (local-disk storage). For serverless /
// large scale, swap this for an object-storage backend.
export const POST = withTenantContext(async (req: NextRequest) => {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return fail("No file uploaded (field must be named 'file').", 400);

    // 5 MB cap + extension allow-list for admission documents.
    if (file.size > 5 * 1024 * 1024) return fail("File too large (5 MB max).", 413);
    const allowed = /\.(pdf|jpe?g|png|webp)$/i;
    if (!allowed.test(file.name)) return fail("Unsupported file type. Use PDF, JPG, PNG, or WEBP.", 400);

    const dir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(dir, { recursive: true });
    const safe = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-]/g, "_")}`;
    const fullPath = path.join(dir, safe);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(fullPath, buffer);

    return ok({ url: `/uploads/${safe}`, name: file.name, size: file.size });
  } catch (e) { return handleError(e); }
});
