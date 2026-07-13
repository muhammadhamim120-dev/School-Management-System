import { NextRequest } from "next/server";
import { ok, fail, handleError } from "@/lib/api";
import { auth } from "@/lib/auth";
import fs from "node:fs/promises";
import path from "node:path";
import { checkRateLimit, getRateLimitHeaders, RATE_LIMITS } from "@/lib/rate-limit";
import { validateUpload, generateUniqueFilename, getUploadDir } from "@/lib/upload";

// POST multipart/form-data with a `file` field — stores the upload under
// public/uploads and returns its URL. Public read; auth required to upload.
// Works in dev and self-hosted deploys (local-disk storage). For serverless /
// large scale, swap this for an object-storage backend.
//
// Accepts documents and images used by homework attachments and written exam
// answers (PDF, Office, text, images). 10 MB cap.
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return handleError({ code: "P2025" });

    // Rate limit by user ID
    const userId = (session.user as { id?: string })?.id;
    const rateLimitResult = checkRateLimit(`upload:${userId}`, RATE_LIMITS.upload);

    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ success: false, error: "Too many uploads. Please try again later." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            ...getRateLimitHeaders(rateLimitResult),
          },
        }
      );
    }

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return fail("No file uploaded (field must be named 'file').", 400);

    // Read file content for validation
    const buffer = Buffer.from(await file.arrayBuffer());

    // Comprehensive validation (extension, magic bytes, size)
    const validation = validateUpload(file.name, buffer.buffer as ArrayBuffer, file.size);
    if (!validation.valid) {
      return fail(validation.error || "Invalid file", 400);
    }

    // Generate safe unique filename
    const safeFilename = generateUniqueFilename(file.name);
    const dir = getUploadDir();
    await fs.mkdir(dir, { recursive: true });
    const fullPath = path.join(dir, safeFilename);

    // Write file
    await fs.writeFile(fullPath, buffer);

    return ok({ url: `/uploads/${safeFilename}`, name: file.name, size: file.size });
  } catch (e) { return handleError(e); }
}
