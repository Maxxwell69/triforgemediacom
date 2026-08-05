import { requireProfile } from "@/lib/session";
import { getOrGenerateTodayTasks } from "@/lib/tiktask";
import { hasTikTaskAccess } from "@/lib/groups";
import TaskList from "@/components/tiktask/TaskList";

export const dynamic = "force-dynamic";

export default async function TikTaskPage() {
  const { user, profile } = await requireProfile();

  if (!(await hasTikTaskAccess(user.id))) {
    return (
      <main className="flex flex-1 items-center justify-center px-6">
        <p className="glass max-w-md rounded-2xl p-8 text-center font-body text-off-white/60">
          TikTask isn&apos;t available for your current group. Reach out to an admin if you think
          this is a mistake.
        </p>
      </main>
    );
  }

  const tasks = await getOrGenerateTodayTasks(profile.userId, profile);
  const doneCount = tasks.filter((t) => t.status === "DONE").length;

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-5xl tracking-wide">
          TODAY&apos;S <span className="text-gradient">TASKS</span>
        </h1>
        <p className="mt-2 font-body text-off-white/60">
          {doneCount}/{tasks.length} complete &middot; 🔥 {profile.streakCount} day streak
        </p>

        <div className="mt-8">
          <TaskList tasks={tasks} />
        </div>
      </div>
    </main>
  );
}
