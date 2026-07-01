import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function ok<T>(data: T, init?: number) {
  return NextResponse.json({ success: true, data }, { status: init ?? 200 });
}

export function created<T>(data: T) {
  return NextResponse.json({ success: true, data }, { status: 201 });
}

export function fail(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ success: false, error: message, details }, { status });
}

export function handleError(error: unknown) {
  if (error instanceof ZodError) {
    return fail("Validation failed", 422, error.flatten().fieldErrors);
  }
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code: string }).code;
    if (code === "P2002") return fail("A record with this unique value already exists", 409);
    if (code === "P2025") return fail("Record not found", 404);
  }
  console.error("[API_ERROR]", error);
  return fail("Internal server error", 500);
}

export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 10));
  const search = searchParams.get("search")?.trim() || "";
  return { page, limit, search, skip: (page - 1) * limit };
}
