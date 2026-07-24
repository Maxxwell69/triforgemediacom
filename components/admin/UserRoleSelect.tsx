"use client";

import { useTransition } from "react";
import { updateUserRole } from "@/app/admin/users/actions";

const ROLES = ["MEMBER", "CREATOR", "MOD", "ADMIN"];

export default function UserRoleSelect({
  userId,
  currentRole,
  disabled,
}: {
  userId: string;
  currentRole: string;
  disabled?: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      defaultValue={currentRole}
      disabled={disabled || isPending}
      onChange={(e) => {
        const role = e.target.value;
        startTransition(async () => {
          await updateUserRole(userId, role);
        });
      }}
      className="rounded-lg border border-off-white/15 bg-off-white/5 px-2 py-1 font-body text-sm text-off-white outline-none transition focus:border-cyan/60 disabled:opacity-40"
    >
      {ROLES.map((r) => (
        <option key={r} value={r}>
          {r}
        </option>
      ))}
    </select>
  );
}
