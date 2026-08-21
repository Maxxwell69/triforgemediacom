"use client";

import { useState } from "react";
import { updateCourse } from "@/app/admin/courses/actions";
import ImageUploadField from "@/components/ImageUploadField";
import CourseGroupAccessFields from "@/components/admin/CourseGroupAccessFields";

type Group = { id: string; name: string; color: string; isHome?: boolean };

type Course = {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  category: string | null;
  isPublished: boolean;
  xpReward: number;
  completionGroupId: string | null;
  certificateEnabled: boolean;
  accessGroupIds: string[];
  progressionEnabled: boolean;
  progressionCategoryId: string | null;
  progressionLevelId: string | null;
};

type ProgressionOption = { id: string; name: string };

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60";

export default function CourseEditForm({
  course,
  groups,
  progression,
}: {
  course: Course;
  groups: Group[];
  progression?: {
    categories: ProgressionOption[];
    levels: ProgressionOption[];
  } | null;
}) {
  const [saved, setSaved] = useState(false);

  return (
    <form
      action={async (formData) => {
        await updateCourse(formData);
        setSaved(true);
      }}
      onChange={() => setSaved(false)}
      className="glass flex flex-col gap-3 rounded-2xl p-6"
    >
      <input type="hidden" name="id" value={course.id} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input name="title" defaultValue={course.title} required className={fieldClass} />
        <input
          name="category"
          defaultValue={course.category ?? ""}
          placeholder="Category (optional)"
          className={fieldClass}
        />
      </div>
      <textarea
        name="description"
        defaultValue={course.description ?? ""}
        rows={3}
        placeholder="Description"
        className={fieldClass}
      />
      <ImageUploadField
        name="thumbnailUrl"
        folder="course-thumbnails"
        defaultValue={course.thumbnailUrl}
        label="Thumbnail"
      />
      <CourseGroupAccessFields groups={groups} selectedGroupIds={course.accessGroupIds} />
      <label className="flex flex-col gap-1 font-body text-xs text-off-white/60">
        Completion group (optional)
        <select
          name="completionGroupId"
          defaultValue={course.completionGroupId ?? ""}
          className={fieldClass}
        >
          <option value="">None</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        <span className="text-off-white/40">
          Different from visibility — auto-adds members to this group when they finish the course.
        </span>
      </label>
      <div className="flex flex-wrap items-center gap-6">
        <label className="flex items-center gap-2 font-body text-sm text-off-white/70">
          XP reward
          <input
            type="number"
            name="xpReward"
            defaultValue={course.xpReward}
            min={0}
            max={100000}
            className={`${fieldClass} w-28`}
          />
        </label>
        <label className="flex items-center gap-2 font-body text-sm text-off-white/70">
          <input
            type="checkbox"
            name="isPublished"
            defaultChecked={course.isPublished}
            className="h-4 w-4 rounded border-off-white/30 bg-transparent accent-orange"
          />
          Published (visible to members)
        </label>
        <label className="flex items-center gap-2 font-body text-sm text-off-white/70">
          <input
            type="checkbox"
            name="certificateEnabled"
            defaultChecked={course.certificateEnabled}
            className="h-4 w-4 rounded border-off-white/30 bg-transparent accent-cyan"
          />
          Issue a certificate on completion
        </label>
      </div>
      {progression ? (
        <div className="rounded-xl border border-cyan/20 bg-cyan/5 p-4">
          <input type="hidden" name="progressionForm" value="1" />
          <label className="flex items-center gap-2 font-body text-sm text-off-white/80">
            <input
              type="checkbox"
              name="progressionEnabled"
              defaultChecked={course.progressionEnabled}
              className="h-4 w-4 rounded border-off-white/30 bg-transparent accent-orange"
            />
            Use in Creator Progression
          </label>
          <p className="mt-1 font-body text-xs text-off-white/45">
            Attach this Learning Center course to a progression level. Members see it on /progress at that
            rank, and open it in the LMS — not a separate progression lesson.
          </p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <select
              name="progressionCategoryId"
              defaultValue={course.progressionCategoryId ?? ""}
              className={fieldClass}
            >
              <option value="">Progression track (optional)</option>
              {progression.categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <select
              name="progressionLevelId"
              defaultValue={course.progressionLevelId ?? ""}
              className={fieldClass}
            >
              <option value="">Attach to level</option>
              {progression.levels.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : null}
      <button
        type="submit"
        className="self-start rounded-lg bg-cyan/90 px-6 py-2 font-body text-sm font-semibold text-charcoal transition hover:brightness-110"
      >
        {saved ? "Saved" : "Save course"}
      </button>
    </form>
  );
}
