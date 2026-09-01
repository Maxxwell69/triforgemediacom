import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { markNotificationsRead } from "./actions";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await requireUser();
  const notes = await prisma.hubNotification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 80,
  });
  const unread = notes.filter((n) => !n.readAt).length;
  if (unread > 0) {
    await prisma.hubNotification.updateMany({
      where: { userId: user.id, readAt: null },
      data: { readAt: new Date() },
    });
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl tracking-wide">
            NOTIFI<span className="text-gradient">CATIONS</span>
          </h1>
          <p className="mt-2 font-body text-sm text-off-white/55">
            {unread > 0 ? `${unread} unread` : "You're caught up."}
          </p>
        </div>
        {unread > 0 ? (
          <form action={markNotificationsRead}>
            <button type="submit" className="font-body text-xs text-cyan hover:underline">
              Mark all read
            </button>
          </form>
        ) : null}
      </div>

      <div className="mt-8 flex flex-col gap-2">
        {notes.length === 0 ? (
          <p className="font-body text-sm text-off-white/45">No notifications yet.</p>
        ) : (
          notes.map((note) => {
            const cardClass = `rounded-xl border p-4 ${
              note.readAt ? "border-off-white/10 bg-off-white/[0.02]" : "border-cyan/30 bg-cyan/5"
            }`;
            const inner = (
              <>
                <p className="font-body text-sm text-off-white">{note.title}</p>
                <p className="mt-1 font-body text-xs text-off-white/50">{note.body}</p>
                <p className="mt-2 font-body text-[11px] text-off-white/35">
                  {note.createdAt.toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </>
            );
            return note.href ? (
              <Link key={note.id} href={note.href} className={`${cardClass} block hover:border-cyan/50`}>
                {inner}
              </Link>
            ) : (
              <div key={note.id} className={cardClass}>
                {inner}
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
