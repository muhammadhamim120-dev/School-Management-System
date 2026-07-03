import crypto from "crypto";

// Signed session token for the Parent Portal. Issued after a parent verifies a
// student via studentId + phone/DOB. Read-mostly; sensitive writes (leave,
// messages) re-check the token maps to the target student.

const TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

function secret(): string {
  return process.env.AUTH_SECRET || "dev-insecure-secret-change-me";
}

export function signPortalToken(studentId: string): string {
  const exp = Date.now() + TTL_MS;
  const payload = `${studentId}.${exp}`;
  const sig = crypto.createHmac("sha256", secret()).update(payload).digest("hex");
  return Buffer.from(`${payload}.${sig}`).toString("base64url");
}

export function verifyPortalToken(token: string | null | undefined): { ok: true; studentId: string } | { ok: false } {
  if (!token) return { ok: false };
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const [studentId, expStr, sig] = decoded.split(".");
    if (!studentId || !expStr || !sig) return { ok: false };
    const expected = crypto.createHmac("sha256", secret()).update(`${studentId}.${expStr}`).digest("hex");
    const a = Buffer.from(sig), b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return { ok: false };
    if (Date.now() > Number(expStr)) return { ok: false };
    return { ok: true, studentId };
  } catch {
    return { ok: false };
  }
}
