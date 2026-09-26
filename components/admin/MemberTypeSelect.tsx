"use client";

import { useTransition } from "react";
import { updateUserMemberType } from "@/app/admin/users/actions";

export default function MemberTypeSelect({
  userId,
  currentTypeId,
  types,
  disabled,
  disabledReason,
}: {
  userId: string;
  currentTypeId: string | null;
  types: { id: string; name: string }[];
  disabled?: boolean;
  disabledReason?: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const value = currentTypeId && types.some((t) => t.id === currentTypeId) ? currentTypeId : types[0]?.id ?? "";

  if (types.length === 0) return null;

  return (
    <select
      defaultValue={value}
      disabled={disabled || isPending || !value}
      title={disabledReason || "Member type"}
      onChange={(e) => {
        const id = e.target.value;
        startTransition(async () => {
          await updateUserMemberType(userId, id);
        });
      }}
      className="rounded-lg border border-off-white/15 bg-off-white/5 px-2 py-1 font-body text-sm text-off-white outline-none transition focus:border-cyan/60 disabled:opacity-40"
    >
      {types.map((t) => (
        <option key={t.id} value={t.id}>
          {t.name}
        </option>
      ))}
    </select>
  );
}
