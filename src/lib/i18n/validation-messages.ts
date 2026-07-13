// Bangla translations for Zod validation messages.
//
// Strategy: validations.ts keeps English as the source of truth (so server-side
// validation and API responses stay unchanged and English keeps working). This
// map mirrors every custom message to Bangla and is applied at the *display*
// boundary (see form-field.tsx + i18n-provider.tsx). Generic Zod messages
// ("Required", "Invalid enum value", …) are covered too.
//
// To add a new validation message:
//   1. Use it in lib/validations.ts as the English `message`.
//   2. Add the same English string here with its Bangla translation.

import type { Locale } from "@/lib/format";

/**
 * English source string → Bangla translation.
 * Keys MUST match the exact strings used in lib/validations.ts.
 */
export const VALIDATION_MESSAGES_EN_TO_BN: Record<string, string> = {
  // --- Student ---
  "Student ID is required": "শিক্ষার্থী আইডি আবশ্যক",
  "Full name is required": "পুরো নাম আবশ্যক",
  "Valid date of birth required": "সঠিক জন্ম তারিখ আবশ্যক",
  "Invalid email": "সঠিক ইমেইল ঠিকানা দিন",

  // --- Teacher / Parent ---
  "Teacher ID is required": "শিক্ষক আইডি আবশ্যক",
  "Parent ID is required": "অভিভাবক আইডি আবশ্যক",

  // --- Class / Section / Subject ---
  "Class name is required": "শ্রেণির নাম আবশ্যক",
  "Section name is required": "শাখার নাম আবশ্যক",
  "Subject name is required": "বিষয়ের নাম আবশ্যক",
  "Code is required": "কোড আবশ্যক",

  // --- Academic structure ---
  "Campus name is required": "ক্যাম্পাসের নাম আবশ্যক",
  "Campus code is required": "ক্যাম্পাসের কোড আবশ্যক",
  "Session name is required": "শিক্ষাবর্ষের নাম আবশ্যক",
  "Term name is required": "টার্মের নাম আবশ্যক",
  "Session is required": "শিক্ষাবর্ষ আবশ্যক",
  "Valid start date required": "সঠিক শুরুর তারিখ আবশ্যক",
  "Valid end date required": "সঠিক শেষের তারিখ আবশ্যক",

  // --- Finance / Payments ---
  "Name is required": "নাম আবশ্যক",
  "Category is required": "ক্যাটাগরি আবশ্যক",
  "Amount must be positive": "পরিমাণ ধনাত্মক হতে হবে",
  "Amount must be greater than zero": "পরিমাণ শূন্যের চেয়ে বেশি হতে হবে",
  "Invoice is required": "ইনভয়েস আবশ্যক",
  "Student is required": "শিক্ষার্থী আবশ্যক",
  "Valid due date required": "সঠিক পরিশোধের তারিখ আবশ্যক",
  "Description is required": "বিবরণ আবশ্যক",
  "At least one line item is required": "অন্তত একটি লাইন আইটেম আবশ্যক",

  // --- Library ---
  "Title is required": "শিরোনাম আবশ্যক",
  "Title required": "শিরোনাম আবশ্যক",
  "Book is required": "বই আবশ্যক",
  "Book copy is required": "বইয়ের কপি আবশ্যক",
  "Copy code is required": "কপি কোড আবশ্যক",
  "Borrower is required": "গ্রহীতা আবশ্যক",
  "Body is required": "বিষয়বস্তু আবশ্যক",
  "Message body is required": "বার্তার বিষয়বস্তু আবশ্যক",

  // --- Transport / Hostel ---
  "Registration number is required": "রেজিস্ট্রেশন নম্বর আবশ্যক",
  "Stop name is required": "স্টপের নাম আবশ্যক",
  "Room is required": "কক্ষ আবশ্যক",
  "Room number is required": "কক্ষ নম্বর আবশ্যক",
  "Building is required": "ভবন আবশ্যক",

  // --- Admissions ---
  "Applicant name is required": "আবেদনকারীর নাম আবশ্যক",

  // --- Notice / Event / Exam ---
  "Exam name required": "পরীক্ষার নাম আবশ্যক",
  "Content required": "বিষয়বস্তু আবশ্যক",

  // --- Auth ---
  "Password must be at least 6 characters": "পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে",

  // --- Phone ---
  "Phone is required": "ফোন নম্বর আবশ্যক",

  // --- Generic Zod fallbacks (emitted by zod itself, not authored) ---
  "Required": "আবশ্যক ক্ষেত্র",
  "Invalid input": "সঠিক ইনপুট দিন",
  "Invalid enum value": "সঠিক মান নির্বাচন করুন",
  "Expected string, received nan": "সঠিক টেক্সট দিন",
  "Expected number, received nan": "সঠিক সংখ্যা দিন",
  "Expected date, received string": "সঠিক তারিখ দিন",
  "must contain at least 1 character(s)": "অন্তত ১টি অক্ষর আবশ্যক",
};

/**
 * Translate a validation/error string into the active locale.
 * - English locale: returns the string unchanged (English keeps working).
 * - Bangla locale: returns the Bangla mirror if known, else the original
 *   (so untranslated server messages fall back gracefully instead of breaking).
 */
export function translateValidationError(
  message: string | undefined | null,
  locale: Locale
): string | undefined {
  if (!message) return undefined;
  if (locale !== "bn") return message;

  // Direct exact-match lookup first (covers authored messages).
  const direct = VALIDATION_MESSAGES_EN_TO_BN[message];
  if (direct) return direct;

  // Partial fallbacks for Zod templated messages like
  // "String must contain at least 2 character(s)".
  if (message.includes("must contain at least")) {
    return message.replace(/must contain at least (\d+) character\(s\)/, (_, n) =>
      bnDigits(`অন্তত ${n}টি অক্ষর থাকতে হবে`)
    );
  }
  if (message.includes("must be at least")) {
    return message.replace(/must be at least (\d+) character\(s\)/, (_, n) =>
      bnDigits(`অন্তত ${n}টি অক্ষর থাকতে হবে`)
    );
  }

  // Unknown string — keep English so the user still sees *something* useful.
  return message;
}

/** Convert ASCII digits in a string to Bangla digits (০-৯). */
function bnDigits(input: string): string {
  const map = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return input.replace(/[0-9]/g, (d) => map[Number(d)]);
}
