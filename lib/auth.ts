import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";

const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCKOUT_MS = 15 * 60 * 1000;

// Compared against on every "unknown email" / "no password set" path so a
// login attempt against a nonexistent account takes roughly the same time as
// one against a real account — avoids leaking which emails are registered
// via response-time differences.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  // Credentials provider requires JWT sessions (no database session strategy).
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });

        if (!user || !user.passwordHash) {
          await bcrypt.compare(password, DUMMY_HASH);
          return null;
        }
        if (user.status === "BANNED") return null;

        // Locked out from too many recent failed attempts — reject without
        // even checking the password, and without revealing the lockout
        // state to the caller (same generic failure as wrong credentials).
        if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
          return null;
        }

        const valid = await bcrypt.compare(password, user.passwordHash);

        if (!valid) {
          const attempts = user.failedLoginAttempts + 1;
          const lock = attempts >= MAX_FAILED_LOGIN_ATTEMPTS;
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: lock ? 0 : attempts,
              lockedUntil: lock ? new Date(Date.now() + LOGIN_LOCKOUT_MS) : user.lockedUntil,
            },
          });
          return null;
        }

        if (user.failedLoginAttempts > 0 || user.lockedUntil) {
          await prisma.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: 0, lockedUntil: null },
          });
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
        };
      },
    }),
  ],
});
