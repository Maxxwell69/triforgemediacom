import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { archiveProject, updateProject } from "../actions";
import ProjectMembersManager from "@/components/admin/ProjectMembersManager";
import ProjectTaskForm from "@/components/admin/ProjectTaskForm";
import ProjectTaskRow from "@/components/admin/ProjectTaskRow";

export const dynamic = "force-dynamic";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white outline-none focus:border-cyan/60";

export default async function AdminProjectDetailPage({
  params,
}: {
  params: { projectId: string };
}) {
  const [project, users, groups] = await Promise.all([
    prisma.project.findUnique({
      where: { id: params.projectId },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: { addedAt: "asc" },
        },
        tasks: {
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          include: {
            assignee: { select: { id: true, name: true, email: true } },
          },
        },
        group: { select: { id: true, name: true } },
      },
    }),
    prisma.user.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true },
    }),
    prisma.group.findMany({
      orderBy: [{ isHome: "desc" }, { name: "asc" }],
      select: { id: true, name: true },
    }),
  ]);

  if (!project) notFound();

  const memberIds = new Set(project.members.map((m) => m.userId));
  const members = project.members.map((m) => m.user);
  const nonMembers = users.filter((u) => !memberIds.has(u.id));

  const projectId = project.id;
  async function archiveAction() {
    "use server";
    await archiveProject(projectId);
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link
        href="/admin/projects"
        className="font-body text-sm text-off-white/50 transition hover:text-off-white"
      >
        ← All projects
      </Link>

      <h1 className="mt-4 font-display text-5xl tracking-wide text-gradient">{project.title}</h1>
      <p className="mt-2 font-body text-sm text-off-white/40">
        {project.status}
        {project.group ? ` · ${project.group.name}` : ""}
      </p>

      <section className="mt-10">
        <h2 className="font-display text-2xl tracking-wide text-off-white/80">Settings</h2>
        <form action={updateProject} className="glass mt-4 flex flex-col gap-3 rounded-2xl p-6">
          <input type="hidden" name="id" value={project.id} />
          <input name="title" defaultValue={project.title} required className={fieldClass} />
          <textarea
            name="description"
            defaultValue={project.description ?? ""}
            rows={3}
            className={fieldClass}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <select name="status" defaultValue={project.status} className={fieldClass}>
              <option value="PLANNING">Planning</option>
              <option value="ACTIVE">Active</option>
              <option value="ON_HOLD">On hold</option>
              <option value="DONE">Done</option>
              <option value="ARCHIVED">Archived</option>
            </select>
            <select name="groupId" defaultValue={project.groupId ?? ""} className={fieldClass}>
              <option value="">No group</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              className="rounded-lg bg-cyan/90 px-4 py-2 font-body text-sm font-semibold text-charcoal"
            >
              Save
            </button>
            <button
              formAction={archiveAction}
              className="rounded-lg border border-orange/40 px-4 py-2 font-body text-sm font-semibold text-orange"
            >
              Archive
            </button>
          </div>
        </form>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl tracking-wide text-off-white/80">Members</h2>
        <p className="mt-1 font-body text-sm text-off-white/50">
          Members can see this project and its tasks in My Projects.
        </p>
        <div className="glass mt-4 rounded-2xl p-6">
          <ProjectMembersManager
            projectId={project.id}
            members={members}
            nonMembers={nonMembers}
          />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl tracking-wide text-off-white/80">Tasks</h2>
        <div className="glass mt-4 rounded-2xl p-6">
          <ProjectTaskForm projectId={project.id} users={users} />
        </div>
        <div className="mt-4 flex flex-col gap-2">
          {project.tasks.length === 0 && (
            <p className="glass rounded-xl p-4 font-body text-sm text-off-white/40">
              No tasks yet.
            </p>
          )}
          {project.tasks.map((task) => (
            <ProjectTaskRow key={task.id} task={task} users={users} />
          ))}
        </div>
      </section>
    </main>
  );
}
