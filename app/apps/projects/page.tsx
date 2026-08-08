import Link from "next/link";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/session";
import { isAdminRole } from "@/lib/rbac";
import { listVisibleProjectsForUser } from "@/lib/projects";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const { user } = await requireProfile();

  // Admins manage everything in the admin panel.
  if (isAdminRole(user.role)) {
    redirect("/admin/projects");
  }

  const projects = await listVisibleProjectsForUser(user.id);

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-5xl tracking-wide">
          MY <span className="text-gradient">PROJECTS</span>
        </h1>
        <p className="mt-2 font-body text-off-white/60">
          Hub work assigned to you. Separate from TikTask daily habits.
        </p>

        <div className="mt-8 flex flex-col gap-2">
          {projects.length === 0 && (
            <p className="glass rounded-2xl p-8 text-center font-body text-off-white/50">
              No projects assigned to you yet.
            </p>
          )}
          {projects.map((project) => {
            const myTasks = project.tasks.filter((t) => t.assigneeId === user.id);
            const done = myTasks.filter((t) => t.status === "DONE").length;
            return (
              <Link
                key={project.id}
                href={`/apps/projects/${project.id}`}
                className="glass flex items-center justify-between gap-4 rounded-xl p-4 transition hover:border-cyan/30"
              >
                <div className="min-w-0">
                  <p className="truncate font-body text-sm font-medium text-off-white">
                    {project.title}
                  </p>
                  <p className="truncate font-body text-xs text-off-white/40">
                    {project.status}
                    {myTasks.length > 0
                      ? ` · ${done}/${myTasks.length} of your tasks done`
                      : ` · ${project._count.tasks} tasks`}
                  </p>
                </div>
                <span className="font-body text-sm text-off-white/40">→</span>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
