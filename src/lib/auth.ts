import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { loginSchema } from "@/lib/validations";
import { authConfig } from "@/lib/auth.config";

/**
 * Full auth instance (Node.js runtime).
 *
 * Extends the edge-safe `authConfig` with the Credentials provider, whose
 * `authorize` uses Prisma + bcrypt. This module is imported by server
 * components, route handlers and API routes — never by middleware.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {}, schoolSlug: {} },
      authorize: async (credentials) => {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { email, password, schoolSlug } = parsed.data;

        // Resolve organization from slug if provided
        let schoolId: string | null = null;
        if (schoolSlug) {
          const org = await prisma.organization.findUnique({ where: { slug: schoolSlug } });
          if (!org || org.status === "SUSPENDED") return null;
          schoolId = org.id;
        }

        // Find user by email (and schoolId if provided)
        const user = schoolId
          ? await prisma.user.findFirst({ where: { email, schoolId } })
          : await prisma.user.findFirst({ where: { email, schoolId: null } });

        if (!user) return null;

        const valid = await verifyPassword(password, user.password);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          image: user.image,
          schoolId: user.schoolId,
        };
      },
    }),
  ],
});
