"use client";

export default function MemberTypeAudienceFields({
  types,
  selectedIds,
  name = "memberTypeId",
}: {
  types: { id: string; name: string }[];
  selectedIds?: string[];
  name?: string;
}) {
  if (types.length === 0) return null;
  const selected = new Set(selectedIds ?? []);

  return (
    <div>
      <p className="font-body text-xs text-off-white/50">Limit to member types</p>
      <p className="mt-0.5 font-body text-[11px] text-off-white/35">
        Leave all unchecked so every type can see it. Staff always can.
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {types.map((type) => (
          <label
            key={type.id}
            className="inline-flex items-center gap-1.5 rounded-md border border-off-white/15 px-2 py-1 font-body text-xs text-off-white/80"
          >
            <input
              type="checkbox"
              name={name}
              value={type.id}
              defaultChecked={selected.has(type.id)}
              className="accent-orange"
            />
            {type.name}
          </label>
        ))}
      </div>
    </div>
  );
}
