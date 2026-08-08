import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireProfile } from "@/lib/session";
import { isAdminRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { userCanSeeProject } from "@/lib/projects";
import MyTaskStatusSelect from "@/components/projects/MyTaskStatusSelect";

export const dynamic = "force-dynamic";

export default async function MemberProjectDetailPage({
  params,
}: {
  params: { projectId: string };
}) {
  const { user } = await requireProfile();

  if (isAdminRole(user.role)) {
    redirect(`/admin/projects/${params.projectId}`);
  }

  if (!(await userCanSeeProject(user.id, params.projectId))) {
    notFound();
  }

  const project = await prisma.project.findUnique({
    where: { id: params.projectId },
    include: {
      tasks: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        include: {
          assignee: { select: { id: true, name: true, email: true } },
        },
      },
      group: { select: { name: true } },
    },
  });
  if (!project || project.status === "ARCHIVED") notFound();

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/apps/projects"
          className="font-body text-sm text-off-white/50 transition hover:text-off-white"
        >
          ← My projects
        </Link>
        <h1 className="mt-4 font-display text-5xl tracking-wide text-gradient">
          {project.title}
        </h1>
        {project.description && (
          <p className="mt-2 font-body text-off-white/60">{project.description}</p>
        )}
        <p className="mt-2 font-body text-sm text-off-white/40">
          {project.status}
          {project.group ? ` · ${project.group.name}` : ""}
        </p>

        <section className="mt-10">
          <h2 className="font-display text-2xl tracking-wide text-off-white/80">Tasks</h2>
          <div className="mt-4 flex flex-col gap-2">
            {project.tasks.length === 0 && (
              <p className="glass rounded-xl p-4 font-body text-sm text-off-white/40">
                No tasks on this project yet.
              </p>
            )}
            {project.tasks.map((task) => {
              const mine = task.assigneeId === user.id;
              return (
                <div
                  key={task.id}
                  className="glass flex flex-col gap-2 rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-body text-sm font-medium text-off-white">{task.title}</p>
                    {task.description && (
                      <p className="mt-1 font-body text-xs text-off-white/50">{task.description}</p>
                    )}
                    <p className="mt-1 font-body text-xs text-off-white/40">
                      {task.assignee
                        ? `Assigned to ${task.assignee.name || task.assignee.email}`
                        : "Unassigned"}
                      {task.dueAt
                        ? ` · due ${task.dueAt.toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}`
                        : ""}
                    </p>
                  </div>
                  {mine ? (
                    <MyTaskStatusSelect taskId={task.id} status={task.status} />
                  ) : (
                    <span className="font-body text-xs text-off-white/40">{task.status}</span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
