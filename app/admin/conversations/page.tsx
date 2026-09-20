import Link from "next/link";
import { requireAdminPage } from "@/lib/session";
import { formatChatTime } from "@/lib/formatChatTime";
import {
  listOutreachConversations,
  listStaffForFilter,
  requireConversationsModule,
  searchConversationMembers,
  type ConversationStatusFilter,
} from "@/lib/conversations";
import { getMemberDisplayName } from "@/lib/memberDisplay";
import { startConversationAction } from "./actions";
import { getClientHubResendStatus } from "@/lib/hub/resendSettings";
import { getRequestHubContext } from "@/lib/hub/requestPrisma";

export const dynamic = "force-dynamic";

const fieldClass =
  "rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none focus:border-cyan/60";

export default async function AdminConversationsPage({
  searchParams,
}: {
  searchParams: { q?: string; admin?: string; status?: string; member?: string; error?: string };
}) {
  requireConversationsModule();
  const user = await requireAdminPage();
  const q = (searchParams.q || "").trim();
  const memberQ = (searchParams.member || "").trim();
  const adminId = (searchParams.admin || "").trim();
  const status = (["open", "closed", "all"].includes(searchParams.status || "")
    ? searchParams.status
    : "open") as ConversationStatusFilter;

  const [threads, staff, matches, ctx] = await Promise.all([
    listOutreachConversations({ q, adminId: adminId || undefined, status }),
    listStaffForFilter(),
    searchConversationMembers(memberQ, user.id),
    getRequestHubContext(),
  ]);

  const needsKey =
    ctx.kind === "client" || ctx.kind === "client-unprovisioned"
      ? !(await getClientHubResendStatus(ctx.hub.id)).hasKey
      : false;

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-5xl tracking-wide">
            CONVERSA<span className="text-gradient">TIONS</span>
          </h1>
          <p className="mt-2 font-body text-sm text-off-white/50">
            Email members from this hub. They reply here — not by hitting reply in their inbox.
          </p>
        </div>
        <Link
          href="/admin/conversations/settings"
          className="font-body text-sm text-cyan hover:underline"
        >
          Sending →
        </Link>
      </div>

      {needsKey ? (
        <p className="mt-6 rounded-xl border border-orange/30 bg-orange/10 px-4 py-3 font-body text-sm text-orange">
          Add this hub’s Resend key under Sending so outreach emails leave from your domain.
        </p>
      ) : null}

      {searchParams.error ? (
        <p className="mt-4 font-body text-sm text-orange">Couldn’t start that conversation.</p>
      ) : null}

      <section className="glass mt-8 rounded-2xl p-6">
        <h2 className="font-display text-xl tracking-wide text-off-white/80">Start a conversation</h2>
        <form className="mt-3 flex flex-wrap gap-2" action="/admin/conversations" method="get">
          <input
            name="member"
            defaultValue={memberQ}
            placeholder="Search members by name or email"
            className={`${fieldClass} min-w-[220px] flex-1`}
          />
          <button
            type="submit"
            className="rounded-lg border border-off-white/15 px-4 py-2 font-body text-sm text-off-white/80"
          >
            Search
          </button>
        </form>
        {memberQ.length >= 2 ? (
          <div className="mt-4 flex flex-col gap-2">
            {matches.length === 0 ? (
              <p className="font-body text-sm text-off-white/40">No active members match that.</p>
            ) : (
              matches.map((member) => (
                <form
                  key={member.id}
                  action={startConversationAction}
                  className="flex items-center justify-between gap-3 rounded-xl border border-off-white/10 px-3 py-2"
                >
                  <input type="hidden" name="memberId" value={member.id} />
                  <div>
                    <p className="font-body text-sm text-off-white">{getMemberDisplayName(member)}</p>
                    <p className="font-body text-xs text-off-white/40">{member.email}</p>
                  </div>
                  <button
                    type="submit"
                    className="rounded-lg bg-orange px-3 py-1.5 font-body text-xs font-semibold text-off-white"
                  >
                    Message
                  </button>
                </form>
              ))
            )}
          </div>
        ) : (
          <p className="mt-3 font-body text-xs text-off-white/40">Type at least two characters.</p>
        )}
      </section>

      <form className="mt-10 flex flex-wrap gap-2" action="/admin/conversations" method="get">
        <input name="q" defaultValue={q} placeholder="Filter by member" className={fieldClass} />
        <select name="admin" defaultValue={adminId} className={fieldClass}>
          <option value="">Any staff</option>
          {staff.map((row) => (
            <option key={row.id} value={row.id}>
              {row.name || row.email}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={status} className={fieldClass}>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
          <option value="all">All</option>
        </select>
        <button
          type="submit"
          className="rounded-lg border border-off-white/15 px-4 py-2 font-body text-sm text-off-white/80"
        >
          Filter
        </button>
      </form>

      <section className="mt-6 flex flex-col gap-2">
        {threads.length === 0 ? (
          <p className="font-body text-sm text-off-white/40">No conversations yet.</p>
        ) : (
          threads.map((thread) => {
            const member = thread.people.find((p) => p.id !== user.id) || thread.people[0];
            return (
              <Link
                key={thread.id}
                href={`/admin/conversations/${thread.id}`}
                className="glass flex flex-col gap-1 rounded-xl px-4 py-3 transition hover:border-cyan/40 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-body text-sm font-semibold text-off-white">
                    {member?.name || "Member"}
                    {thread.closedAt ? (
                      <span className="ml-2 font-body text-[10px] uppercase tracking-wide text-off-white/40">
                        Closed
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 line-clamp-1 font-body text-xs text-off-white/50">
                    {thread.lastPreview || "No messages yet"}
                  </p>
                </div>
                <p className="shrink-0 font-body text-xs text-off-white/35">
                  {thread.lastStaffName ? `Last staff: ${thread.lastStaffName} · ` : ""}
                  {formatChatTime(thread.lastAt)}
                </p>
              </Link>
            );
          })
        )}
      </section>
    </main>
  );
}
