import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js config: no Prisma adapter, no bcrypt, no DB calls.
 * Used by middleware.ts (which runs on the Edge runtime). The full config
 * in lib/auth.ts extends this with the Credentials provider + Prisma adapter
 * and is used everywhere else (API routes, server components/actions).
 */
export const authConfig = {
  // Required behind reverse proxies (Railway, Vercel, Docker, etc.) where the
  // incoming Host header won't exactly match AUTH_URL/NEXTAUTH_URL — otherwise
  // Auth.js rejects every request with an UntrustedHost error.
  trustHost: true,
  pages: {
    signIn: "/signin",
  },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.status = user.status;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.status = token.status;
      return session;
    },
  },
} satisfies NextAuthConfig;
