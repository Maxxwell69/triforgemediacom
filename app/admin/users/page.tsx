import Link from "next/link";
import type { Prisma, UserRole } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserPointsTotals } from "@/lib/points";
import { backfillNetworkMemberships } from "@/lib/mnCn";
import { adjustUserPoints } from "./actions";
import UserRoleSelect from "@/components/admin/UserRoleSelect";
import BanButton from "@/components/admin/BanButton";
import UserGroupsEditor from "@/components/admin/UserGroupsEditor";
import UserTagsEditor from "@/components/admin/UserTagsEditor";
import UserBadgesEditor from "@/components/admin/UserBadgesEditor";
import AddMemberForm from "@/components/admin/AddMemberForm";
import ResendInviteButton from "@/components/admin/ResendInviteButton";
import AdminAlertsToggle from "@/components/admin/AdminAlertsToggle";
import DirectoryVisibilityToggle from "@/components/admin/DirectoryVisibilityToggle";

export const dynamic = "force-dynamic";

const statusStyles: Record<string, string> = {
  ACTIVE: "text-cyan",
  INVITED: "text-off-white/50",
  BANNED: "text-orange",
  PENDING_APPLICATION: "text-off-white/50",
};

const ROLE_FILTERS = [
  { value: null, label: "All roles" },
  { value: "STAFF", label: "Staff (Admin + Mod)" },
  { value: "ADMIN", label: "Admins" },
  { value: "MOD", label: "Mods" },
  { value: "CREATOR", label: "Creators" },
  { value: "MEMBER", label: "Members" },
] as const;

type RoleFilter = (typeof ROLE_FILTERS)[number]["value"];

const ROLE_SORT: Record<UserRole, number> = {
  ADMIN: 0,
  MOD: 1,
  CREATOR: 2,
  MEMBER: 3,
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams?: { track?: string; q?: string; role?: string };
}) {
  const session = await auth();
  const currentUserId = session!.user.id;
  const trackFilter =
    searchParams?.track === "CN" || searchParams?.track === "MN"
      ? searchParams.track
      : null;
  const roleParam = (searchParams?.role || "").toUpperCase();
  const roleFilter: RoleFilter =
    roleParam === "STAFF" ||
    roleParam === "ADMIN" ||
    roleParam === "MOD" ||
    roleParam === "CREATOR" ||
    roleParam === "MEMBER"
      ? roleParam
      : null;
  const q = (searchParams?.q || "").trim();
  const qBare = q.replace(/^@/, "");

  await backfillNetworkMemberships();

  const where: Prisma.UserWhereInput = {
    status: { in: ["ACTIVE", "INVITED", "BANNED"] },
  };

  if (roleFilter === "STAFF") {
    where.role = { in: ["ADMIN", "MOD"] };
  } else if (roleFilter) {
    where.role = roleFilter;
  }

  if (trackFilter) {
    // Keep staff visible on CN/MN tabs — they usually aren't tagged CN/MN
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
      {
        OR: [
          { tags: { some: { tag: { name: trackFilter } } } },
          { groupMemberships: { some: { group: { name: trackFilter } } } },
          { application: { is: { answers: { path: ["track"], equals: trackFilter } } } },
          { role: { in: ["ADMIN", "MOD"] } },
        ],
      },
    ];
  }

  if (q) {
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
      {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { profile: { username: { contains: qBare, mode: "insensitive" } } },
          {
            tiktokStatsSnapshot: {
              OR: [
                { uniqueId: { contains: qBare, mode: "insensitive" } },
                { nickname: { contains: q, mode: "insensitive" } },
              ],
            },
          },
          {
            tiktokConnection: {
              displayName: { contains: q, mode: "insensitive" },
            },
          },
          {
            application: {
              answers: { path: ["handle"], string_contains: qBare },
            },
          },
          {
            application: {
              answers: { path: ["handle"], string_contains: q },
            },
          },
        ],
      },
    ];
  }

  const [usersRaw, allGroups, allTags, allBadges] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        groupMemberships: { include: { group: true } },
        tags: { select: { tagId: true } },
        userBadges: { select: { badgeId: true } },
        application: { select: { answers: true } },
        tiktokStatsSnapshot: { select: { uniqueId: true } },
        profile: { select: { socialLinks: true, username: true } },
      },
    }),
    prisma.group.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, color: true } }),
    prisma.tag.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, color: true } }),
    prisma.badge.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, icon: true } }),
  ]);

  // Staff (admins/mods) first so their profiles aren't buried under the roster
  const users = [...usersRaw].sort((a, b) => {
    const roleDiff = ROLE_SORT[a.role] - ROLE_SORT[b.role];
    if (roleDiff !== 0) return roleDiff;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const pointsTotals = await getUserPointsTotals(users.map((u) => u.id));

  function listHref(opts: {
    track?: "CN" | "MN" | null;
    role?: RoleFilter;
    includeQ?: boolean;
  }) {
    const params = new URLSearchParams();
    const track = opts.track === undefined ? trackFilter : opts.track;
    const role = opts.role === undefined ? roleFilter : opts.role;
    if (track) params.set("track", track);
    if (role) params.set("role", role);
    if (opts.includeQ !== false && q) params.set("q", q);
    const qs = params.toString();
    return qs ? `/admin/users?${qs}` : "/admin/users";
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="font-display text-5xl tracking-wide">
        USER <span className="text-gradient">MANAGEMENT</span>
      </h1>
      <p className="mt-2 font-body text-off-white/60">
        {users.length} account{users.length === 1 ? "" : "s"}
        {roleFilter === "STAFF"
          ? " · staff"
          : roleFilter
            ? ` · ${roleFilter.toLowerCase()}s`
            : ""}
        {trackFilter ? ` · ${trackFilter}` : ""}
        {q ? ` matching “${q}”` : ""}
      </p>

      <form
        action="/admin/users"
        method="get"
        className="mt-5 flex flex-wrap items-center gap-2"
      >
        {trackFilter && <input type="hidden" name="track" value={trackFilter} />}
        {roleFilter && <input type="hidden" name="role" value={roleFilter} />}
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search name, email, @handle…"
          className="min-w-[220px] flex-1 rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/35 outline-none transition focus:border-cyan/60"
        />
        <button
          type="submit"
          className="rounded-lg border border-cyan/40 px-4 py-2 font-body text-xs font-semibold text-cyan transition hover:bg-cyan/10"
        >
          Search
        </button>
        {q && (
          <Link
            href={listHref({ includeQ: false })}
            className="rounded-lg border border-off-white/15 px-3 py-2 font-body text-xs text-off-white/50 transition hover:border-off-white/30 hover:text-off-white/80"
          >
            Clear
          </Link>
        )}
      </form>

      <div className="mt-5 flex flex-wrap gap-2">
        {ROLE_FILTERS.map((opt) => {
          const active = roleFilter === opt.value;
          return (
            <Link
              key={opt.label}
              href={listHref({ role: opt.value })}
              className={`rounded-full border px-3 py-1.5 font-body text-xs font-semibold transition ${
                active
                  ? "border-cyan bg-cyan/20 text-cyan"
                  : "border-off-white/15 text-off-white/50 hover:border-off-white/30 hover:text-off-white/80"
              }`}
            >
              {opt.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {(
          [
            { track: null, label: "All tracks" },
            { track: "CN" as const, label: "Creator Network (CN)" },
            { track: "MN" as const, label: "Media Network (MN)" },
          ] as const
        ).map((opt) => {
          const active = trackFilter === opt.track;
          return (
            <Link
              key={opt.label}
              href={listHref({ track: opt.track })}
              className={`rounded-full border px-3 py-1.5 font-body text-xs font-semibold transition ${
                active
                  ? "border-orange bg-orange/20 text-orange"
                  : "border-off-white/15 text-off-white/50 hover:border-off-white/30 hover:text-off-white/80"
              }`}
            >
              {opt.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-8">
        <AddMemberForm />
      </div>

      <div className="mt-10 flex flex-col gap-2">
        {users.length === 0 && (
          <p className="glass rounded-xl p-8 text-center font-body text-sm text-off-white/50">
            No accounts match these filters. Try{" "}
            <Link href="/admin/users?role=STAFF" className="text-cyan hover:underline">
              Staff (Admin + Mod)
            </Link>{" "}
            or clear search.
          </p>
        )}
        {users.map((user) => {
          const isSelf = user.id === currentUserId;
          const isBanned = user.status === "BANNED";
          const groups = user.groupMemberships.map((m) => m.group);
          const tagIds = user.tags.map((t) => t.tagId);
          const badgeIds = user.userBadges.map((b) => b.badgeId);
          const applyHandle =
            typeof (user.application?.answers as { handle?: unknown } | null)?.handle ===
            "string"
              ? String((user.application!.answers as { handle: string }).handle).trim()
              : "";
          const signupHandle = applyHandle
            ? applyHandle.startsWith("@")
              ? applyHandle
              : `@${applyHandle.replace(/^@/, "")}`
            : user.tiktokStatsSnapshot?.uniqueId
              ? `@${user.tiktokStatsSnapshot.uniqueId}`
              : null;

          return (
            <div
              key={user.id}
              className={`glass flex flex-col gap-3 rounded-xl p-4 ${
                user.role === "ADMIN" || user.role === "MOD"
                  ? "border border-cyan/25"
                  : ""
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="truncate font-body font-medium text-off-white transition hover:text-cyan hover:underline"
                  >
                    {user.name || "Unnamed"}
                    {isSelf && <span className="ml-2 text-xs text-off-white/40">(you)</span>}
                    {(user.role === "ADMIN" || user.role === "MOD") && (
                      <span className="ml-2 rounded border border-cyan/40 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan">
                        {user.role}
                      </span>
                    )}
                  </Link>
                  <p className="truncate font-body text-sm text-off-white/50">{user.email}</p>
                  {signupHandle && (
                    <p className="truncate font-body text-xs text-cyan/80">
                      Signup handle · {signupHandle}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <span
                    className={`font-body text-xs font-semibold uppercase tracking-wide ${
                      statusStyles[user.status] || "text-off-white/50"
                    }`}
                  >
                    {user.status}
                  </span>
                  {user.status === "INVITED" && <ResendInviteButton userId={user.id} />}
                  {user.role === "ADMIN" && (
                    <AdminAlertsToggle userId={user.id} receivesAlerts={user.receivesAdminAlerts} />
                  )}
                  <DirectoryVisibilityToggle userId={user.id} hidden={user.hiddenFromDirectory} />
                  <UserRoleSelect userId={user.id} currentRole={user.role} disabled={isSelf} />
                  <BanButton userId={user.id} banned={isBanned} disabled={isSelf} />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-off-white/10 pt-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  {groups.length === 0 && (
                    <span className="font-body text-xs text-off-white/30">No groups</span>
                  )}
                  {groups.map((g) => (
                    <span
                      key={g.id}
                      className="rounded-full border px-2 py-0.5 font-body text-xs"
                      style={{ borderColor: `${g.color}66`, color: g.color }}
                    >
                      {g.name}
                    </span>
                  ))}
                  <UserGroupsEditor
                    userId={user.id}
                    allGroups={allGroups}
                    memberGroupIds={groups.map((g) => g.id)}
                  />
                  <UserTagsEditor userId={user.id} allTags={allTags} memberTagIds={tagIds} />
                  <UserBadgesEditor userId={user.id} allBadges={allBadges} memberBadgeIds={badgeIds} />
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-body text-sm text-off-white/70">
                    {pointsTotals[user.id] ?? 0} pts
                  </span>
                  <form action={adjustUserPoints} className="flex items-center gap-1.5">
                    <input type="hidden" name="userId" value={user.id} />
                    <input
                      type="number"
                      name="amount"
                      placeholder="±XP"
                      required
                      className="w-16 rounded-lg border border-off-white/15 bg-off-white/5 px-2 py-1 font-body text-xs text-off-white outline-none transition focus:border-cyan/60"
                    />
                    <input
                      type="text"
                      name="note"
                      placeholder="Note (optional)"
                      maxLength={280}
                      className="w-36 rounded-lg border border-off-white/15 bg-off-white/5 px-2 py-1 font-body text-xs text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60"
                    />
                    <button
                      type="submit"
                      className="rounded-lg border border-cyan/40 px-2.5 py-1 font-body text-xs font-semibold text-cyan transition hover:bg-cyan/10"
                    >
                      Apply
                    </button>
                  </form>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
