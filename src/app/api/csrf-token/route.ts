import { NextRequest } from "next/server";
import { ok, handleError } from "@/lib/api";
import { generateCsrfToken, createSignedCsrfToken, setCsrfCookie, CSRF_CONFIG } from "@/lib/csrf";

// GET /api/csrf-token - Generate and return a CSRF token
// The token is also set as a cookie for double-submit validation
export async function GET(_req: NextRequest) {
  try {
    const token = generateCsrfToken();
    const signedToken = createSignedCsrfToken(token);

    const response = new Response(
      JSON.stringify({ success: true, token: signedToken }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": setCsrfCookie(signedToken),
        },
      }
    );

    return response;
  } catch (e) {
    return handleError(e);
  }
}
