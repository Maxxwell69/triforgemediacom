import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createProject } from "./actions";

export const dynamic = "force-dynamic";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60";

export default async function AdminProjectsPage() {
  const [projects, groups] = await Promise.all([
    prisma.project.findMany({
      where: { status: { not: "ARCHIVED" } },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { tasks: true, members: true } },
        group: { select: { id: true, name: true, color: true } },
      },
    }),
    prisma.group.findMany({
      orderBy: [{ isHome: "desc" }, { name: "asc" }],
      select: { id: true, name: true },
    }),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-5xl tracking-wide">
        PROJECTS <span className="text-gradient">& TASKS</span>
      </h1>
      <p className="mt-2 font-body text-off-white/60">
        Assign hub work to members. Separate from TikTask daily habits — members only see
        projects they&apos;re added to.
      </p>

      <form action={createProject} className="glass mt-8 flex flex-col gap-3 rounded-2xl p-6">
        <h2 className="font-display text-xl tracking-wide text-off-white/80">New project</h2>
        <input name="title" required placeholder="Project title" className={fieldClass} />
        <textarea
          name="description"
          rows={3}
          placeholder="Optional description"
          className={fieldClass}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="font-body text-sm text-off-white/70">
            Status
            <select name="status" defaultValue="ACTIVE" className={`${fieldClass} mt-1`}>
              <option value="PLANNING">Planning</option>
              <option value="ACTIVE">Active</option>
              <option value="ON_HOLD">On hold</option>
              <option value="DONE">Done</option>
            </select>
          </label>
          <label className="font-body text-sm text-off-white/70">
            Group (optional)
            <select name="groupId" defaultValue="" className={`${fieldClass} mt-1`}>
              <option value="">No group</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button
          type="submit"
          className="self-start rounded-lg bg-orange px-6 py-2 font-body font-semibold text-off-white shadow-glow transition hover:brightness-110"
        >
          Create project
        </button>
      </form>

      <div className="mt-8 flex flex-col gap-2">
        {projects.length === 0 && (
          <p className="glass rounded-2xl p-8 text-center font-body text-off-white/50">
            No projects yet.
          </p>
        )}
        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/admin/projects/${project.id}`}
            className="glass flex items-center justify-between gap-4 rounded-xl p-4 transition hover:border-cyan/30"
          >
            <div className="min-w-0">
              <p className="truncate font-body text-sm font-medium text-off-white">
                {project.title}
              </p>
              <p className="truncate font-body text-xs text-off-white/40">
                {project.status}
                {project.group ? ` · ${project.group.name}` : ""}
                {" · "}
                {project._count.members} members · {project._count.tasks} tasks
              </p>
            </div>
            <span className="font-body text-sm text-off-white/40">→</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
