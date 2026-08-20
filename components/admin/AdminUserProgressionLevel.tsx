import Link from "next/link";
import { hubHas } from "@/lib/hub/modules";
import { loadCreatorProgress } from "@/lib/progression/engine";
import {
  clearUserProgressionPlacement,
  setUserProgressionLevel,
} from "@/app/admin/progression/actions";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white outline-none focus:border-cyan/60";

export default async function AdminUserProgressionLevel({ userId }: { userId: string }) {
  if (!hubHas("progression")) return null;

  const progress = await loadCreatorProgress(userId);
  const enrolled = !!progress.profile?.enrolledAt;
  const levelName = progress.profile?.currentLevel?.name || (enrolled ? "Recruit" : "Not enrolled");
  const placedName = progress.profile?.adminPlacedLevel?.name;

  return (
    <section className="glass mt-6 rounded-2xl p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg tracking-wide text-off-white/80">CREATOR PROGRESSION</h2>
          <p className="mt-1 font-body text-sm text-off-white/55">
            {enrolled ? `${levelName} · ${progress.totalXp} XP` : "Not enrolled yet"}
            {placedName ? ` · placed at ${placedName}` : ""}
          </p>
        </div>
        <Link
          href={`/admin/progression/people/${userId}`}
          className="font-body text-xs text-cyan hover:underline"
        >
          Full progression record
        </Link>
      </div>
      <p className="mt-3 font-body text-sm text-off-white/55">
        Set their rank here. They stay at that level even without the XP or certs, and can still climb
        higher automatically.
      </p>
      <form action={setUserProgressionLevel} className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <input type="hidden" name="userId" value={userId} />
        <select
          name="levelId"
          required
          defaultValue={progress.profile?.currentLevel?.id || ""}
          className={fieldClass}
        >
          <option value="" disabled>
            Choose a level
          </option>
          {progress.levels.map((level) => (
            <option key={level.id} value={level.id}>
              {level.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="shrink-0 rounded-lg bg-orange px-4 py-2 font-body text-sm font-semibold text-off-white"
        >
          Set level
        </button>
      </form>
      {progress.profile?.adminPlacedLevelId ? (
        <form action={clearUserProgressionPlacement} className="mt-3">
          <input type="hidden" name="userId" value={userId} />
          <button type="submit" className="font-body text-xs text-off-white/50 underline hover:text-cyan">
            Clear placement and use earned rank only
          </button>
        </form>
      ) : null}
    </section>
  );
}
