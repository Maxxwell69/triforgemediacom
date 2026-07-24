"use client";

import { useState } from "react";
import { updateTaskTemplate } from "@/app/admin/tasks/actions";
import { PLATFORM_LABELS } from "@/lib/platforms";
import { platformOptions } from "@/lib/validations/apply";
import { GOAL_OPTIONS } from "@/lib/goals";
import TaskTemplateActiveToggle from "./TaskTemplateActiveToggle";

type Template = {
  id: string;
  platform: string | null;
  goalKey: string | null;
  taskText: string;
  xpValue: number;
  isActive: boolean;
};

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white outline-none transition focus:border-cyan/60";

export default function TaskTemplateRow({ template }: { template: Template }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <form
        action={async (formData) => {
          await updateTaskTemplate(formData);
          setEditing(false);
        }}
        className="glass flex flex-col gap-3 rounded-xl p-4"
      >
        <input type="hidden" name="id" value={template.id} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <select name="platform" defaultValue={template.platform ?? ""} className={fieldClass}>
            <option value="">Any platform</option>
            {platformOptions.map((p) => (
              <option key={p} value={p}>
                {PLATFORM_LABELS[p]}
              </option>
            ))}
          </select>
          <select name="goalKey" defaultValue={template.goalKey ?? ""} className={fieldClass}>
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
          defaultValue={template.taskText}
          rows={2}
          required
          className={fieldClass}
        />
        <div className="flex items-center gap-3">
          <input
            type="number"
            name="xpValue"
            defaultValue={template.xpValue}
            min={1}
            max={1000}
            required
            className={`${fieldClass} w-24`}
          />
          <button
            type="submit"
            className="rounded-lg bg-cyan/90 px-4 py-1.5 font-body text-sm font-semibold text-charcoal transition hover:brightness-110"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="font-body text-sm text-off-white/50 hover:text-off-white"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div
      className={`glass flex items-center justify-between gap-4 rounded-xl p-4 ${
        !template.isActive ? "opacity-50" : ""
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className="font-body text-sm text-off-white/90">{template.taskText}</p>
        <p className="mt-1 font-body text-xs text-off-white/40">
          {template.platform
            ? PLATFORM_LABELS[template.platform as keyof typeof PLATFORM_LABELS]
            : "Any platform"}
          {" \u00b7 "}
          {template.goalKey
            ? GOAL_OPTIONS.find((g) => g.key === template.goalKey)?.label
            : "Any goal"}
          {" \u00b7 "}+{template.xpValue} XP
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-lg border border-off-white/15 px-3 py-1 font-body text-xs text-off-white/70 transition hover:border-cyan/40 hover:text-cyan"
        >
          Edit
        </button>
        <TaskTemplateActiveToggle id={template.id} isActive={template.isActive} />
      </div>
    </div>
  );
}
