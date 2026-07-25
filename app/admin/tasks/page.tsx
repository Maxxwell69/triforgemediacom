import { prisma } from "@/lib/prisma";
import { createTaskTemplate } from "./actions";
import TaskTemplateRow from "@/components/admin/TaskTemplateRow";
import { PLATFORM_LABELS } from "@/lib/platforms";
import { platformOptions } from "@/lib/validations/apply";
import { GOAL_OPTIONS } from "@/lib/goals";

export const dynamic = "force-dynamic";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60";

export default async function AdminTasksPage() {
  const templates = await prisma.taskTemplate.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-5xl tracking-wide">
        TASK <span className="text-gradient">TEMPLATES</span>
      </h1>
      <p className="mt-2 font-body text-off-white/60">
        Drives what shows up in each creator&apos;s TikTask list. No code deploy needed.
      </p>

      <form
        key={templates.length}
        action={createTaskTemplate}
        className="glass mt-8 flex flex-col gap-3 rounded-2xl p-6"
      >
        <h2 className="font-display text-xl tracking-wide text-off-white/80">
          New template
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <select name="platform" defaultValue="" className={fieldClass}>
            <option value="">Any platform</option>
            {platformOptions.map((p) => (
              <option key={p} value={p}>
                {PLATFORM_LABELS[p]}
              </option>
            ))}
          </select>
          <select name="goalKey" defaultValue="" className={fieldClass}>
            <option value="">Any goal</option>
            {GOAL_OPTIONS.map((g) => (
              <option key={g.key} value={g.key}>
                {g.label}
              </option>
            ))}
          </select>
        </div>
        <textarea
          name="taskText"
          rows={2}
          required
          placeholder="e.g. Post one TikTok video today"
          className={fieldClass}
        />
        <div className="flex items-center gap-3">
          <input
            type="number"
            name="xpValue"
            defaultValue={10}
            min={1}
            max={1000}
            required
            className={`${fieldClass} w-24`}
          />
          <button
            type="submit"
            className="rounded-lg bg-orange px-6 py-2 font-body font-semibold text-off-white shadow-glow transition hover:brightness-110"
          >
            Add template
          </button>
        </div>
      </form>

      <div className="mt-8 flex flex-col gap-2">
        {templates.length === 0 && (
          <p className="glass rounded-2xl p-8 text-center font-body text-off-white/50">
            No task templates yet.
          </p>
        )}
        {templates.map((t) => (
          <TaskTemplateRow key={t.id} template={t} />
        ))}
      </div>
    </main>
  );
}
