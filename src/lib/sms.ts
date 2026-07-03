// SMS helpers: template rendering, category labels, OTP generation.

export type SmsCategory = "GENERAL" | "ATTENDANCE" | "FEE_REMINDER" | "RESULT" | "HOLIDAY" | "EMERGENCY" | "ADMISSION" | "OTP";

export const SMS_CATEGORIES: SmsCategory[] = [
  "GENERAL", "ATTENDANCE", "FEE_REMINDER", "RESULT", "HOLIDAY", "EMERGENCY", "ADMISSION", "OTP",
];

/** Replace {placeholders} in a template body with values. Unknown keys are left blank. */
export function renderTemplate(body: string, vars: Record<string, string | number | null | undefined>): string {
  return body.replace(/\{(\w+)\}/g, (_, key: string) => {
    const v = vars[key];
    return v === null || v === undefined ? "" : String(v);
  });
}

/** Extract the {placeholder} names used in a template body. */
export function templateVars(body: string): string[] {
  const set = new Set<string>();
  for (const m of body.matchAll(/\{(\w+)\}/g)) set.add(m[1]);
  return [...set];
}

/** Generate a numeric OTP of the given length (default 6). */
export function generateOtp(length = 6): string {
  let s = "";
  for (let i = 0; i < length; i++) s += Math.floor(Math.random() * 10);
  return s;
}

/** GSM-7 SMS segment count estimate (160 chars per single, 153 for concatenated). */
export function smsSegments(text: string): number {
  const len = text.length;
  if (len === 0) return 0;
  if (len <= 160) return 1;
  return Math.ceil(len / 153);
}

/** Max retry attempts for the retry queue. */
export const MAX_SMS_ATTEMPTS = 3;
