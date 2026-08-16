import { deleteProgressionItem, reorderProgressionItem } from "@/app/admin/progression/actions";

export default function ProgressionRowTools({
  id,
  kind,
  canReorder = true,
}: {
  id: string;
  kind: "category" | "level" | "mission" | "module" | "certification" | "certTier" | "skill" | "badge";
  canReorder?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {canReorder ? (
        <>
          <form action={reorderProgressionItem}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="kind" value={kind} />
            <input type="hidden" name="direction" value="up" />
            <button type="submit" className="rounded-lg border border-off-white/15 px-2 py-1 font-body text-xs text-off-white/55 hover:text-cyan">
              Up
            </button>
          </form>
          <form action={reorderProgressionItem}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="kind" value={kind} />
            <input type="hidden" name="direction" value="down" />
            <button type="submit" className="rounded-lg border border-off-white/15 px-2 py-1 font-body text-xs text-off-white/55 hover:text-cyan">
              Down
            </button>
          </form>
        </>
      ) : null}
      <form action={deleteProgressionItem}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="kind" value={kind} />
        <button type="submit" className="rounded-lg border border-orange/40 px-2 py-1 font-body text-xs text-orange">
          Delete
        </button>
      </form>
    </div>
  );
}
