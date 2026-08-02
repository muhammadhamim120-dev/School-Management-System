import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe auth configuration.
 *
 * This file MUST NOT import Prisma, bcrypt, Zod, or any Node-only module — it is
 * bundled into the Edge middleware. The Credentials provider (which needs the
 * database and password hashing) is added separately in `@/lib/auth`, which runs
 * in the Node.js runtime. The `jwt`/`session` callbacks here are pure and safe to
 * run on the edge, so route protection in middleware sees the correct role/schoolId.
 */
export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  // Providers are injected in the Node-runtime instance (`@/lib/auth`).
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
        token.schoolId = (user as { schoolId?: string | null }).schoolId ?? null;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { schoolId?: string | null }).schoolId = token.schoolId as string | null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
