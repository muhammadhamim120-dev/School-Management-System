import crypto from "crypto";

// Short-lived signed token proving a student's fees were verified via
// studentId + phone/DOB at lookup time. Prevents unauthenticated enumeration
// of another student's invoices at the initiate step.

const TTL_MS = 30 * 60 * 1000; // 30 minutes

function secret(): string {
  return process.env.AUTH_SECRET || "dev-insecure-secret-change-me";
}

export function signPayToken(studentId: string): string {
  const exp = Date.now() + TTL_MS;
  const payload = `${studentId}.${exp}`;
  const sig = crypto.createHmac("sha256", secret()).update(payload).digest("hex");
  return Buffer.from(`${payload}.${sig}`).toString("base64url");
}

export function verifyPayToken(token: string): { ok: true; studentId: string } | { ok: false } {
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
