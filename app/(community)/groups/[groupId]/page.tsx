import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { canManageGroup, ensureUserInHomeGroup } from "@/lib/groups";
import { isAdminRole } from "@/lib/rbac";
import ApplyToGroupForm from "@/components/groups/ApplyToGroupForm";
import CreateGroupChannelForm from "@/components/groups/CreateGroupChannelForm";
import SyncActiveGroup from "@/components/groups/SyncActiveGroup";
import { ACTIVE_GROUP_COOKIE } from "@/lib/activeGroup";

export const dynamic = "force-dynamic";

export default async function GroupDetailPage({
  params,
}: {
  params: { groupId: string };
}) {
  const { user } = await requireProfile();
  await ensureUserInHomeGroup(user.id);
  const currentActiveId = cookies().get(ACTIVE_GROUP_COOKIE)?.value ?? null;

  const group = await prisma.group.findUnique({
    where: { id: params.groupId },
    include: {
      _count: { select: { members: true, channels: true } },
      channels: { orderBy: { createdAt: "asc" }, select: { id: true, name: true } },
      members: {
        orderBy: { addedAt: "asc" },
        take: 40,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });
  if (!group) notFound();

  const membership = group.members.find((m) => m.userId === user.id) ?? null;
  const isStaff = isAdminRole(user.role);
  // Hub admins/mods are in every group — no apply/invite needed.
  const isMember = Boolean(membership) || isStaff;
  const canManage = await canManageGroup(user.id, user.role, group.id);

  const pendingApp =
    !membership && !isStaff && group.joinMode === "APPLY"
      ? await prisma.groupApplication.findUnique({
          where: { groupId_userId: { groupId: group.id, userId: user.id } },
          select: { status: true },
        })
      : null;

  // Non-members can only see APPLY-mode groups (staff already count as members).
  if (!isMember && group.joinMode !== "APPLY") {
    notFound();
  }

  const yourRoleLabel = membership
    ? membership.role
    : isStaff
      ? user.role === "MOD"
        ? "Mod"
        : "Admin"
      : null;

  return (
    <main className="flex-1 px-6 py-10">
      {isMember && (
        <SyncActiveGroup groupId={group.id} currentActiveId={currentActiveId} />
      )}
      <div className="mx-auto max-w-3xl">
        <Link
          href="/groups"
          className="font-body text-sm text-off-white/50 transition hover:text-off-white"
        >
          ← All groups
        </Link>

        <div className="mt-4 flex items-center gap-3">
          {group.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={group.imageUrl}
              alt=""
              className="h-12 w-12 shrink-0 rounded-xl object-cover border border-off-white/15"
            />
          ) : (
            <span
              className="h-5 w-5 shrink-0 rounded-full border border-off-white/20"
              style={{ backgroundColor: group.color }}
            />
          )}
          <h1 className="font-display text-5xl tracking-wide text-gradient">{group.name}</h1>
          {group.isHome && (
            <span className="rounded-md border border-cyan/40 px-2 py-0.5 font-body text-xs text-cyan">
              Home
            </span>
          )}
        </div>
        {group.description && (
          <p className="mt-2 font-body text-off-white/60">{group.description}</p>
        )}
        <p className="mt-2 font-body text-sm text-off-white/40">
          {group._count.members} members · {group._count.channels} channels
          {yourRoleLabel ? ` · your role: ${yourRoleLabel}` : ""}
        </p>

        {!membership && !isStaff && group.joinMode === "APPLY" && (
          <section className="glass mt-8 rounded-2xl p-6">
            {pendingApp?.status === "PENDING" ? (
              <p className="font-body text-sm text-cyan">
                Your application is pending review.
              </p>
            ) : pendingApp?.status === "REJECTED" ? (
              <div className="flex flex-col gap-3">
                <p className="font-body text-sm text-off-white/60">
                  Your previous application was declined. You can apply again.
                </p>
                <ApplyToGroupForm groupId={group.id} />
              </div>
            ) : (
              <ApplyToGroupForm groupId={group.id} />
            )}
          </section>
        )}

        {isMember && (
          <>
            <section className="mt-10">
              <h2 className="font-display text-2xl tracking-wide text-off-white/80">Channels</h2>
              <div className="mt-4 flex flex-col gap-2">
                {group.channels.length === 0 && (
                  <p className="glass rounded-xl p-4 font-body text-sm text-off-white/40">
                    No channels in this space yet.
                  </p>
                )}
                {group.channels.map((ch) => (
                  <Link
                    key={ch.id}
                    href={`/channels/${ch.id}`}
                    className="glass rounded-xl px-4 py-3 font-body text-sm text-off-white/80 transition hover:border-cyan/30"
                  >
                    #{ch.name}
                  </Link>
                ))}
              </div>
              {canManage && (
                <div className="glass mt-4 rounded-2xl p-4">
                  <p className="mb-3 font-body text-sm text-off-white/60">
                    Create a channel for this space. Group members will see it in chat.
                  </p>
                  <CreateGroupChannelForm groupId={group.id} />
                </div>
              )}
            </section>

            <section className="mt-10">
              <h2 className="font-display text-2xl tracking-wide text-off-white/80">Members</h2>
              <div className="mt-4 flex flex-col gap-2">
                {group.members.map((m) => (
                  <div
                    key={m.id}
                    className="glass flex items-center justify-between rounded-xl px-4 py-3"
                  >
                    <div>
                      <p className="font-body text-sm text-off-white">
                        {m.user.name || m.user.email}
                      </p>
                      <p className="font-body text-xs text-off-white/40">{m.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {isStaff && (
          <p className="mt-8 font-body text-sm text-off-white/40">
            Manage invites, roles, and channels in{" "}
            <Link href={`/admin/groups/${group.id}`} className="text-cyan hover:underline">
              Admin → Groups
            </Link>
            .
          </p>
        )}
      </div>
    </main>
  );
}
