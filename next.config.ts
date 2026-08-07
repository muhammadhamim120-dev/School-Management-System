import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // blob: is required for the Vapi/Krisp noise-cancellation AudioWorklet
      // (loaded from a blob: URL). Without it the worklet is blocked and the
      // microphone audio track never initialises — the assistant can't hear you.
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' blob: https://cdn.jsdelivr.net https://*.daily.co",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https://images.unsplash.com https://ui-avatars.com https://i.pravatar.cc",
      "font-src 'self' https://fonts.gstatic.com",
      // Vapi AI voice widget uses WebRTC via Vapi + Daily.co (mic worklet/models too)
      "connect-src 'self' blob: https://api.openai.com https://api.vapi.ai wss://api.vapi.ai https://*.vapi.ai wss://*.vapi.ai https://*.daily.co wss://*.daily.co",
      "media-src 'self' blob: https://*.daily.co",
      "worker-src 'self' blob: https://*.daily.co",
      "child-src 'self' blob:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    // microphone=(self): required for the Vapi AI voice widget (same-origin only).
    value: "camera=(), microphone=(self), geolocation=(), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "ui-avatars.com" },
      { protocol: "https", hostname: "i.pravatar.cc" },
    ],
  },
  headers: async () => [
    {
      source: "/(.*)",
      headers: securityHeaders,
    },
  ],
};

export default nextConfig;
