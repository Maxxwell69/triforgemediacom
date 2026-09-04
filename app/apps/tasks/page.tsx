import { requireProfile } from "@/lib/session";
import { hasPersonalTasksAccess, listPersonalTasks } from "@/lib/personalTasks";
import PersonalTaskBoard from "@/components/tasks/PersonalTaskBoard";

export const dynamic = "force-dynamic";

export default async function PersonalTasksPage() {
  const { user } = await requireProfile();

  if (!(await hasPersonalTasksAccess(user.id))) {
    return (
      <main className="flex flex-1 items-center justify-center px-6">
        <p className="glass max-w-md rounded-2xl p-8 text-center font-body text-off-white/60">
          Personal Tasks isn&apos;t enabled for your account yet. Ask an admin to turn it on.
        </p>
      </main>
    );
  }

  const tasks = await listPersonalTasks(user.id);
  const openCount = tasks.filter((t) => t.status !== "DONE").length;

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-5xl tracking-wide">
          MY <span className="text-gradient">TASKS</span>
        </h1>
        <p className="mt-2 font-body text-off-white/60">
          Private to-dos for you only — {openCount} open
          {tasks.length > 0 ? ` · ${tasks.length} total` : ""}.
        </p>

        <div className="mt-8">
          <PersonalTaskBoard
            tasks={tasks.map((t) => ({
              id: t.id,
              title: t.title,
              notes: t.notes,
              status: t.status,
              dueAt: t.dueAt ? t.dueAt.toISOString() : null,
              category: t.category,
            }))}
          />
        </div>
      </div>
    </main>
  );
}
