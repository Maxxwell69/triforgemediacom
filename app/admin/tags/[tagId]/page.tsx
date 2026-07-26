import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import TagMembersManager from "@/components/admin/TagMembersManager";

export const dynamic = "force-dynamic";

export default async function AdminTagDetailPage({ params }: { params: { tagId: string } }) {
  const [tag, allUsers] = await Promise.all([
    prisma.tag.findUnique({
      where: { id: params.tagId },
      include: {
        users: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    }),
    prisma.user.findMany({
      where: { status: { in: ["ACTIVE", "INVITED"] } },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true },
    }),
  ]);

  if (!tag) notFound();

  const memberIds = new Set(tag.users.map((ut) => ut.user.id));
  const members = tag.users.map((ut) => ut.user);
  const nonMembers = allUsers.filter((u) => !memberIds.has(u.id));

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link
        href="/admin/tags"
        className="font-body text-sm text-off-white/50 transition hover:text-off-white"
      >
        &larr; All tags
      </Link>
      <div className="mt-4 flex items-center gap-3">
        <span
          className="inline-flex shrink-0 items-center rounded-full border px-3 py-1 font-body text-sm font-semibold"
          style={{ borderColor: `${tag.color}66`, color: tag.color }}
        >
          {tag.name}
        </span>
        <h1 className="font-display text-4xl tracking-wide text-gradient">{tag.name}</h1>
      </div>
      {tag.description && <p className="mt-2 font-body text-off-white/60">{tag.description}</p>}
      <p className="mt-2 font-body text-sm text-off-white/40">
        {tag.selfAssignable
          ? "Members can add or remove this tag themselves from their account page."
          : "Admin-only \u2014 members can't add this tag themselves. Assign it below."}
      </p>

      <section className="mt-10">
        <h2 className="font-display text-2xl tracking-wide text-off-white/80">Members</h2>
        <div className="glass mt-4 rounded-2xl p-6">
          <TagMembersManager tagId={tag.id} members={members} nonMembers={nonMembers} />
        </div>
      </section>
    </main>
  );
}
