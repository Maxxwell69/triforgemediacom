import type { NextAuthConfig } from "next-auth";
import { isCustomDomainCandidate, resolveHubHost } from "@/lib/hub/host";

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
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    redirect({ url, baseUrl }) {
      if (url.startsWith("/") && !url.startsWith("//")) {
        return `${baseUrl}${url}`;
      }
      try {
        const dest = new URL(url, baseUrl);
        if (dest.origin === baseUrl) return dest.toString();
        if (resolveHubHost(dest.hostname).kind === "client") return dest.toString();
        if (isCustomDomainCandidate(dest.hostname)) return dest.toString();
      } catch {
        // Fall through to AUTH_URL.
      }
      return baseUrl;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.status = user.status;
      }
      return token;
    },
    session({ session, token }) {
      if (!session.user) return session;
      if (token.id) session.user.id = token.id as string;
      if (token.role) session.user.role = token.role as typeof session.user.role;
      if (token.status) session.user.status = token.status as typeof session.user.status;
      return session;
    },
  },
} satisfies NextAuthConfig;
