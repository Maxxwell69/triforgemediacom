import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getChatSettings, isTrueAdmin } from "@/lib/dmAccess";
import { getMemberDisplayName } from "@/lib/memberDisplay";
import { addDmAllowedUser, removeDmAllowedUser, updateDmAccessMode } from "./actions";

export const dynamic = "force-dynamic";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white outline-none transition focus:border-cyan/60";

export default async function AdminChatSettingsPage() {
  const session = await auth();
  if (!session?.user || !isTrueAdmin(session.user.role)) {
    redirect("/admin");
  }

  const [settings, allowlist, members] = await Promise.all([
    getChatSettings(),
    prisma.dmAllowedUser.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: { select: { platform: true } },
            tiktokConnection: { select: { displayName: true, avatarUrl: true } },
          },
        },
      },
      orderBy: { addedAt: "asc" },
    }),
    prisma.user.findMany({
      where: { status: "ACTIVE", role: { not: "ADMIN" } },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profile: { select: { platform: true } },
        tiktokConnection: { select: { displayName: true, avatarUrl: true } },
      },
      orderBy: { name: "asc" },
      take: 500,
    }),
  ]);

  const allowlistIds = new Set(allowlist.map((a) => a.userId));

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-5xl tracking-wide">
        CHAT <span className="text-gradient">SETTINGS</span>
      </h1>
      <p className="mt-2 font-body text-sm text-off-white/50">
        Control who can start direct messages. All admins can always see every DM thread.
      </p>

      <section className="glass mt-8 rounded-2xl p-6">
        <h2 className="font-display text-xl tracking-wide text-off-white/80">Who can start DMs</h2>
        <form action={updateDmAccessMode} className="mt-4 flex flex-col gap-3">
          <label className="flex items-start gap-3 rounded-lg border border-off-white/10 p-3">
            <input
              type="radio"
              name="dmAccessMode"
              value="ADMIN"
              defaultChecked={settings.dmAccessMode === "ADMIN"}
              className="mt-1"
            />
            <span>
              <span className="block font-body text-sm font-semibold text-off-white">Admins only</span>
              <span className="font-body text-xs text-off-white/45">
                Default. Only ADMIN accounts can open a new DM.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-3 rounded-lg border border-off-white/10 p-3">
            <input
              type="radio"
              name="dmAccessMode"
              value="ADMIN_AND_MOD"
              defaultChecked={settings.dmAccessMode === "ADMIN_AND_MOD"}
              className="mt-1"
            />
            <span>
              <span className="block font-body text-sm font-semibold text-off-white">
                Admins + Mods
              </span>
              <span className="font-body text-xs text-off-white/45">
                Mods can also start DMs. They only see threads they&apos;re in (admins still see
                all).
              </span>
            </span>
          </label>
          <label className="flex items-start gap-3 rounded-lg border border-off-white/10 p-3">
            <input
              type="radio"
              name="dmAccessMode"
              value="ALLOWLIST"
              defaultChecked={settings.dmAccessMode === "ALLOWLIST"}
              className="mt-1"
            />
            <span>
              <span className="block font-body text-sm font-semibold text-off-white">
                Admins + specific users
              </span>
              <span className="font-body text-xs text-off-white/45">
                Admins plus anyone on the allowlist below.
              </span>
            </span>
          </label>
          <button
            type="submit"
            className="self-start rounded-lg bg-orange px-5 py-2 font-body text-sm font-semibold text-off-white transition hover:brightness-110"
          >
            Save access mode
          </button>
        </form>
      </section>

      <section className="glass mt-6 rounded-2xl p-6">
        <h2 className="font-display text-xl tracking-wide text-off-white/80">DM allowlist</h2>
        <p className="mt-1 font-body text-xs text-off-white/45">
          Used when access mode is &ldquo;Admins + specific users.&rdquo; Saving a user here also
          switches to that mode.
        </p>

        <form action={addDmAllowedUser} className="mt-4 flex flex-wrap items-end gap-3">
          <label className="flex min-w-[220px] flex-1 flex-col gap-1 font-body text-xs text-off-white/60">
            Add member
            <select name="userId" required className={fieldClass} defaultValue="">
              <option value="" disabled>
                Select a member…
              </option>
              {members
                .filter((m) => !allowlistIds.has(m.id))
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {getMemberDisplayName(m)} ({m.role})
                  </option>
                ))}
            </select>
          </label>
          <button
            type="submit"
            className="rounded-lg border border-cyan/40 px-4 py-2 font-body text-sm font-semibold text-cyan transition hover:bg-cyan/10"
          >
            Add
          </button>
        </form>

        <div className="mt-4 flex flex-col gap-2">
          {allowlist.length === 0 ? (
            <p className="font-body text-sm text-off-white/40">No allowlisted users yet.</p>
          ) : (
            allowlist.map((row) => (
              <div
                key={row.userId}
                className="flex items-center justify-between gap-3 rounded-lg border border-off-white/10 px-3 py-2"
              >
                <div>
                  <p className="font-body text-sm text-off-white">
                    {getMemberDisplayName(row.user)}
                  </p>
                  <p className="font-body text-xs text-off-white/40">{row.user.email}</p>
                </div>
                <form action={removeDmAllowedUser}>
                  <input type="hidden" name="userId" value={row.userId} />
                  <button
                    type="submit"
                    className="font-body text-xs text-off-white/50 transition hover:text-orange"
                  >
                    Remove
                  </button>
                </form>
              </div>
            ))
          )}
        </div>
      </section>

      <p className="mt-6 font-body text-sm text-off-white/40">
        Open the member inbox at{" "}
        <Link href="/dms" className="text-cyan hover:underline">
          /dms
        </Link>
        .
      </p>
    </main>
  );
}
