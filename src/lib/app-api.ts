// Shared helpers for the /api/app/* mobile surface.
//
// Mobile auth reuses the portal's HMAC-signed Bearer tokens (see portal-token.ts)
// — a parent obtains one via POST /api/portal/login (studentId + phone/DOB) and
// sends it as `Authorization: Bearer <token>`. Every app endpoint verifies it.
//
// Offline sync: list endpoints accept `?since=<ISO8601>` and return only records
// updated after that timestamp; the client stores the response's `serverTime`
// and passes it as the next `since`. The /api/app/sync endpoint fans this out
// across all entities in a single round-trip.

import { NextRequest } from "next/server";
import { verifyPortalToken } from "@/lib/portal-token";

export type AuthOk = { ok: true; studentId: string };
export type AuthFail = { ok: false; status: number };

/** Read + verify the Bearer token. Returns the studentId on success. */
export function requireAppAuth(req: NextRequest): AuthOk | AuthFail {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const v = verifyPortalToken(token);
  return v.ok ? { ok: true, studentId: v.studentId } : { ok: false, status: 401 };
}

/** Parse the optional `?since=<ISO>` delta cursor. Returns null when absent/invalid. */
export function sinceParam(req: NextRequest): Date | null {
  const s = req.nextUrl.searchParams.get("since");
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Current ISO timestamp, attached to every response as the next sync cursor. */
export function serverTime(): string {
  return new Date().toISOString();
}
