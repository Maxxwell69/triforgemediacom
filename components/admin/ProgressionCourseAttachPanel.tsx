import Link from "next/link";
import {
  attachCourseToLevel,
  attachCourseToSpecialty,
  detachCourseFromLevel,
  detachCourseFromSpecialty,
  setCourseProgressionSpecialty,
} from "@/app/admin/progression/actions";
import { SPECIALTY_TRACKS } from "@/lib/progression/tracks";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60";

type AttachedCourse = {
  id: string;
  title: string;
  isPublished: boolean;
  progressionSpecialty: string | null;
  progressionLevelId: string | null;
  progressionLevel?: { name: string } | null;
};

type AvailableCourse = { id: string; title: string };

type LevelOption = { id: string; name: string };

export default function ProgressionCourseAttachPanel({
  attached,
  available,
  levels,
  target,
}: {
  attached: AttachedCourse[];
  available: AvailableCourse[];
  levels?: LevelOption[];
  target: { kind: "level"; levelId: string } | { kind: "specialty"; specialty: string };
}) {
  const isLevel = target.kind === "level";

  return (
    <div className="mt-3 flex flex-col gap-3">
      {attached.length === 0 ? (
        <p className="font-body text-sm text-off-white/40">
          {isLevel
            ? "No Learning Center courses attached to this level yet."
            : "No Learning Center courses attached to this specialty yet."}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {attached.map((course) => (
            <li
              key={course.id}
              className="flex flex-col gap-2 rounded-xl border border-off-white/10 px-3 py-2 sm:flex-row sm:items-center"
            >
              <div className="min-w-0 flex-1">
                <Link
                  href={`/admin/courses/${course.id}`}
                  className="font-body text-sm text-off-white hover:text-cyan"
                >
                  {course.title}
                </Link>
                <p className="font-body text-xs text-off-white/40">
                  {course.isPublished ? "Published" : "Draft"}
                  {course.progressionLevel ? ` · ${course.progressionLevel.name}` : ""}
                  {course.progressionSpecialty ? ` · ${course.progressionSpecialty}` : ""}
                </p>
              </div>
              {isLevel ? (
                <form action={setCourseProgressionSpecialty} className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="courseId" value={course.id} />
                  <select
                    name="specialty"
                    defaultValue={course.progressionSpecialty ?? ""}
                    className={`${fieldClass} w-44`}
                  >
                    <option value="">All members at this level</option>
                    {SPECIALTY_TRACKS.map((track) => (
                      <option key={track.name} value={track.name}>
                        {track.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="rounded-lg border border-cyan/40 px-3 py-1.5 font-body text-xs text-cyan"
                  >
                    Save
                  </button>
                </form>
              ) : null}
              <form action={isLevel ? detachCourseFromLevel : detachCourseFromSpecialty}>
                <input type="hidden" name="courseId" value={course.id} />
                <button
                  type="submit"
                  className="rounded-lg border border-orange/40 px-3 py-1.5 font-body text-xs text-orange"
                >
                  Detach
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      {available.length === 0 ? (
        <p className="font-body text-xs text-off-white/40">
          Every course is already attached here. Create another in Admin → Courses.
        </p>
      ) : isLevel ? (
        <form action={attachCourseToLevel} className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <input type="hidden" name="levelId" value={target.levelId} />
          <label className="flex min-w-0 flex-1 flex-col gap-1 font-body text-xs text-off-white/50">
            Attach a course
            <select name="courseId" required className={fieldClass}>
              <option value="">Pick a course</option>
              {available.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </label>
          <label className="flex w-full flex-col gap-1 font-body text-xs text-off-white/50 sm:w-52">
            Specialty (optional)
            <select name="specialty" className={fieldClass}>
              <option value="">All members at this level</option>
              {SPECIALTY_TRACKS.map((track) => (
                <option key={track.name} value={track.name}>
                  {track.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="shrink-0 rounded-lg bg-cyan/90 px-4 py-2 font-body text-sm font-semibold text-charcoal"
          >
            Attach
          </button>
        </form>
      ) : (
        <form action={attachCourseToSpecialty} className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <input type="hidden" name="specialty" value={target.specialty} />
          <label className="flex min-w-0 flex-1 flex-col gap-1 font-body text-xs text-off-white/50">
            Attach a course
            <select name="courseId" required className={fieldClass}>
              <option value="">Pick a course</option>
              {available.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </label>
          {levels && levels.length > 0 ? (
            <label className="flex w-full flex-col gap-1 font-body text-xs text-off-white/50 sm:w-52">
              Level (optional)
              <select name="levelId" className={fieldClass}>
                <option value="">No level lock</option>
                {levels.map((level) => (
                  <option key={level.id} value={level.id}>
                    {level.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <button
            type="submit"
            className="shrink-0 rounded-lg bg-cyan/90 px-4 py-2 font-body text-sm font-semibold text-charcoal"
          >
            Attach
          </button>
        </form>
      )}
    </div>
  );
}
