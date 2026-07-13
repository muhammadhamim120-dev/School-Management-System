import "vitest/globals";
import "@testing-library/jest-dom";

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Next.js Link (without JSX)
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => {
    return { type: "a", props: { href, ...props, children } };
  },
}));

// Mock next-auth
vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
  useSession: () => ({
    data: null,
    status: "unauthenticated",
  }),
  SessionProvider: ({ children }: any) => children,
}));

// Mock environment variables
process.env.AUTH_SECRET = "test-secret-for-testing-only";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";

// Suppress console.error in tests (optional)
// globalThis.console.error = vi.fn();
