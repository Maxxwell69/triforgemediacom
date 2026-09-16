import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { authConfig } from "@/lib/auth.config";
import { getRequestHubContext } from "@/lib/hub/requestPrisma";
import { getControlPrisma } from "@/lib/hub/tenantPrisma";
import { activateHubMembership } from "@/lib/hub/membership";
import { joinClientHubAsFan } from "@/lib/hub/joinAsFan";
import { ensureStaffHubMembership, isPlatformHubStaff } from "@/lib/hub/staffAccess";

class PlatformInviteRequired extends CredentialsSignin {
  code = "platform_invite_required";
}

const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCKOUT_MS = 15 * 60 * 1000;

// Compared against on every "unknown email" / "no password set" path so a
// login attempt against a nonexistent account takes roughly the same time as
// one against a real account — avoids leaking which emails are registered
// via response-time differences.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(getControlPrisma()),
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

        const ctx = await getRequestHubContext();
        if (ctx.kind === "unknown-client" || ctx.kind === "client-unprovisioned") {
          return null;
        }
        const isClientHub = ctx.kind === "client";
        const control = getControlPrisma();

        const user = await control.user.findUnique({
          where: { email: email.toLowerCase() },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            status: true,
            passwordHash: true,
            failedLoginAttempts: true,
            lockedUntil: true,
            lastLoginAt: true,
            platformAccess: true,
          },
        });

        if (!user || !user.passwordHash) {
          await bcrypt.compare(password, DUMMY_HASH);
          return null;
        }
        if (user.status === "BANNED") return null;

        if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
          return null;
        }

        const valid = await bcrypt.compare(password, user.passwordHash);

        if (!valid) {
          const attempts = user.failedLoginAttempts + 1;
          const lock = attempts >= MAX_FAILED_LOGIN_ATTEMPTS;
          await control.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: lock ? 0 : attempts,
              lockedUntil: lock ? new Date(Date.now() + LOGIN_LOCKOUT_MS) : user.lockedUntil,
            },
          });
          return null;
        }

        let role = user.role;
        let status = user.status;

        if (isClientHub && ctx.hub) {
          if (isPlatformHubStaff(user)) {
            const staffResult = await ensureStaffHubMembership({
              userId: user.id,
              clientHubId: ctx.hub.id,
            });
            if (staffResult === "banned") return null;
          }
          let membership = await control.hubMembership.findUnique({
            where: {
              userId_clientHubId: { userId: user.id, clientHubId: ctx.hub.id },
            },
          });
          if (membership?.status === "BANNED") {
            return null;
          }
          if (!membership) {
            if (!ctx.hub.tenantDbName) return null;
            const joined = await joinClientHubAsFan({
              userId: user.id,
              clientHubId: ctx.hub.id,
              tenantDbName: ctx.hub.tenantDbName,
            });
            if (joined === "banned") return null;
            membership = await control.hubMembership.findUnique({
              where: {
                userId_clientHubId: { userId: user.id, clientHubId: ctx.hub.id },
              },
            });
          }
          if (!membership || membership.status === "BANNED") {
            return null;
          }
          if (membership.status === "INVITED") {
            await activateHubMembership(membership.id);
          }
          role = membership.role;
          status = "ACTIVE";
        } else if (!user.platformAccess) {
          throw new PlatformInviteRequired();
        }

        const now = new Date();
        const wasFirstLogin = !user.lastLoginAt;
        await control.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: 0,
            lockedUntil: null,
            lastLoginAt: now,
            lastSeenAt: now,
          },
        });

        if (wasFirstLogin) {
          void control.user
            .update({ where: { id: user.id }, data: { firstLoginAt: now } })
            .catch((err) => console.error("firstLoginAt update skipped:", err));
          if (!isClientHub) {
            void import("@/lib/campaigns/engine")
              .then(({ fireCampaignEventSafe }) => {
                fireCampaignEventSafe({ type: "FIRST_LOGIN", userId: user.id });
              })
              .catch((err) => console.error("first-login campaign skipped:", err));
            void import("@/lib/onboarding/engine")
              .then(({ ensureOnboardingProgress }) => ensureOnboardingProgress(user.id))
              .catch((err) => console.error("first-login onboarding skipped:", err));
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role,
          status,
        };
      },
    }),
  ],
});
