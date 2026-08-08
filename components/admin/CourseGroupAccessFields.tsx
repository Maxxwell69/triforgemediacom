type Group = {
  id: string;
  name: string;
  color: string;
  isHome?: boolean;
};

/** Checkbox list for server forms — name="groupIds". Empty = open to everyone. */
export default function CourseGroupAccessFields({
  groups,
  selectedGroupIds = [],
}: {
  groups: Group[];
  selectedGroupIds?: string[];
}) {
  return (
    <fieldset className="rounded-xl border border-off-white/10 p-4">
      <legend className="px-1 font-body text-sm font-semibold text-off-white/80">
        Who can see this training
      </legend>
      <p className="mt-1 font-body text-xs text-off-white/45">
        Leave unchecked for everyone. Check groups to restrict — e.g. only Gaming sees this course,
        Shop Owners do not.
      </p>
      {groups.length === 0 ? (
        <p className="mt-3 font-body text-sm text-off-white/40">
          No groups yet. Create spaces in Admin → Groups first.
        </p>
      ) : (
        <div className="mt-3 flex flex-col gap-1">
          {groups.map((group) => (
            <label
              key={group.id}
              className="flex items-center gap-2 rounded-lg border border-off-white/10 px-3 py-2 font-body text-sm text-off-white/80 transition hover:border-cyan/30"
            >
              <input
                type="checkbox"
                name="groupIds"
                value={group.id}
                defaultChecked={selectedGroupIds.includes(group.id)}
                className="h-4 w-4 rounded border-off-white/30 bg-transparent accent-orange"
              />
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: group.color }}
              />
              {group.name}
              {group.isHome ? (
                <span className="text-xs text-cyan">(Home — almost everyone)</span>
              ) : null}
            </label>
          ))}
        </div>
      )}
    </fieldset>
  );
}
