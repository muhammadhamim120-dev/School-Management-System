// Email service abstraction — env-var driven, no hardcoded credentials.
//
// Uses SMTP via nodemailer when EMAIL_HOST is configured; otherwise it is a
// no-op that reports notConfigured (so callers can degrade gracefully). This
// mirrors the SMS/payment service pattern.

export type EmailInput = { to: string; subject: string; html: string; text?: string };
export type EmailResult = { ok: boolean; error?: string };

const REQUIRED = ["EMAIL_HOST", "EMAIL_USER", "EMAIL_PASSWORD", "EMAIL_FROM"];

export function emailConfigured(): boolean {
  return REQUIRED.every((k) => !!(process.env[k] && process.env[k]!.trim()));
}

export async function sendEmail(input: EmailInput): Promise<EmailResult> {
  if (!emailConfigured()) {
    return { ok: false, error: "Email not configured (set EMAIL_HOST, EMAIL_USER, EMAIL_PASSWORD, EMAIL_FROM)." };
  }
  try {
    // Lazy import so the app doesn't require nodemailer unless email is used.
    // Cast through unknown: nodemailer is an optional runtime dependency.
    const mod = (await import("nodemailer" as string)) as unknown as {
      default: { createTransport: (opts: unknown) => { sendMail: (m: unknown) => Promise<unknown> } };
    };
    const nodemailer = mod.default;
    const transport = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT ?? 587),
      secure: (process.env.EMAIL_SECURE ?? "false") === "true",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD },
    });
    await transport.sendMail({
      from: process.env.EMAIL_FROM,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text ?? input.html.replace(/<[^>]+>/g, " "),
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
