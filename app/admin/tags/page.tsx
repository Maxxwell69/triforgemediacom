import { prisma } from "@/lib/prisma";
import { createTag } from "./actions";
import TagRow from "@/components/admin/TagRow";

export const dynamic = "force-dynamic";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60";

export default async function AdminTagsPage() {
  const tags = await prisma.tag.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { users: true } } },
  });

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-5xl tracking-wide">
        CREATOR <span className="text-gradient">TAGS</span>
      </h1>
      <p className="mt-2 font-body text-off-white/60">
        Tags let members describe what they do &mdash; Live Host, Gamer, Shop Owner, etc. &mdash;
        so they can be found in the member directory. Mark a tag self-assignable to let members
        add it themselves from their account page, or leave it admin-only to grant it yourself
        (e.g. an official &quot;CN&quot; designation).
      </p>

      <form
        key={tags.length}
        action={createTag}
        className="glass mt-8 flex flex-col gap-3 rounded-2xl p-6"
      >
        <h2 className="font-display text-xl tracking-wide text-off-white/80">New tag</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
          <input name="name" required placeholder="e.g. Live Host" className={fieldClass} />
          <input
            name="color"
            type="text"
            defaultValue="#00D4FF"
            required
            className={`${fieldClass} sm:w-32`}
          />
        </div>
        <textarea
          name="description"
          rows={2}
          placeholder="Optional description"
          className={fieldClass}
        />
        <label className="flex items-center gap-2 font-body text-sm text-off-white/70">
          <input
            type="checkbox"
            name="selfAssignable"
            defaultChecked
            className="h-4 w-4 rounded border-off-white/30 bg-transparent accent-orange"
          />
          Members can add/remove this tag themselves
        </label>
        <button
          type="submit"
          className="self-start rounded-lg bg-orange px-6 py-2 font-body font-semibold text-off-white shadow-glow transition hover:brightness-110"
        >
          Create tag
        </button>
      </form>

      <div className="mt-8 flex flex-col gap-2">
        {tags.length === 0 && (
          <p className="glass rounded-2xl p-8 text-center font-body text-off-white/50">
            No tags yet.
          </p>
        )}
        {tags.map((tag) => (
          <TagRow
            key={tag.id}
            tag={{
              id: tag.id,
              name: tag.name,
              description: tag.description,
              color: tag.color,
              selfAssignable: tag.selfAssignable,
              memberCount: tag._count.users,
            }}
          />
        ))}
      </div>
    </main>
  );
}
