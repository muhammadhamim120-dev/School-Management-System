import crypto from "crypto";

// CSRF protection for state-changing API routes
// Uses double-submit cookie pattern for simplicity
// For production, consider using SameSite cookies with strict validation

const CSRF_SECRET = process.env.CSRF_SECRET || process.env.AUTH_SECRET;
const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = "csrf-token";
const CSRF_HEADER_NAME = "x-csrf-token";

/**
 * Generate a CSRF token
 */
export function generateCsrfToken(): string {
  if (!CSRF_SECRET) {
    throw new Error("CSRF_SECRET or AUTH_SECRET environment variable is required");
  }
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString("hex");
}

/**
 * Create a signed CSRF token that can be verified
 */
export function createSignedCsrfToken(token: string): string {
  if (!CSRF_SECRET) {
    throw new Error("CSRF_SECRET or AUTH_SECRET environment variable is required");
  }
  const signature = crypto
    .createHmac("sha256", CSRF_SECRET)
    .update(token)
    .digest("hex");
  return `${token}.${signature}`;
}

/**
 * Verify a signed CSRF token
 */
export function verifySignedCsrfToken(signedToken: string): boolean {
  if (!CSRF_SECRET) {
    throw new Error("CSRF_SECRET or AUTH_SECRET environment variable is required");
  }

  const parts = signedToken.split(".");
  if (parts.length !== 2) return false;

  const [token, signature] = parts;
  const expectedSignature = crypto
    .createHmac("sha256", CSRF_SECRET)
    .update(token)
    .digest("hex");

  // Use timing-safe comparison to prevent timing attacks
  const a = Buffer.from(signature, "hex");
  const b = Buffer.from(expectedSignature, "hex");

  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Extract CSRF token from request headers
 */
export function getCsrfTokenFromHeaders(request: Request): string | null {
  return request.headers.get(CSRF_HEADER_NAME);
}

/**
 * Extract CSRF token from request cookies
 */
export function getCsrfTokenFromCookies(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split("=");
    if (key && value) {
      acc[key.trim()] = value.trim();
    }
    return acc;
  }, {} as Record<string, string>);

  return cookies[CSRF_COOKIE_NAME] || null;
}

/**
 * Validate CSRF token from request
 * Checks that the token in header matches the token in cookie
 */
export function validateCsrfToken(request: Request): boolean {
  const headerToken = getCsrfTokenFromHeaders(request);
  const cookieToken = getCsrfTokenFromCookies(request);

  if (!headerToken || !cookieToken) return false;

  // Tokens must match (double-submit pattern)
  return headerToken === cookieToken;
}

/**
 * CSRF protection configuration
 */
export const CSRF_CONFIG = {
  cookieName: CSRF_COOKIE_NAME,
  headerName: CSRF_HEADER_NAME,
  secure: process.env.NODE_ENV === "production",
  httpOnly: false, // Must be readable by JavaScript
  sameSite: "strict" as const,
  path: "/",
};

/**
 * Set CSRF cookie in response headers
 */
export function setCsrfCookie(token: string): string {
  return `${CSRF_CONFIG.cookieName}=${token}; Path=${CSRF_CONFIG.path}; SameSite=${CSRF_CONFIG.sameSite}; ${CSRF_CONFIG.secure ? "Secure;" : ""} Max-Age=3600`;
}

/**
 * Routes that require CSRF protection (state-changing methods)
 */
export const CSRF_PROTECTED_ROUTES = [
  "/api/students",
  "/api/teachers",
  "/api/parents",
  "/api/classes",
  "/api/subjects",
  "/api/attendance",
  "/api/homework",
  "/api/exams",
  "/api/online-exams",
  "/api/results",
  "/api/fees",
  "/api/invoices",
  "/api/payments",
  "/api/books",
  "/api/loans",
  "/api/vehicles",
  "/api/hostel-rooms",
  "/api/sms-messages",
  "/api/notices",
  "/api/events",
  "/api/settings",
  "/api/campuses",
];

/**
 * Check if a route requires CSRF protection
 */
export function requiresCsrfProtection(pathname: string, method: string): boolean {
  // Only protect state-changing methods
  if (!["POST", "PATCH", "DELETE", "PUT"].includes(method)) {
    return false;
  }

  return CSRF_PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Validate CSRF token from request and return error response if invalid
 * Use this in API route handlers: if (const error = validateCsrf(request)) return error;
 */
export function validateCsrf(request: Request): Response | null {
  if (!validateCsrfToken(request)) {
    return new Response(
      JSON.stringify({ success: false, error: "Invalid CSRF token" }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
  return null;
}
