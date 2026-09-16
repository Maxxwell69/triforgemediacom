"use client";

import { useTransition } from "react";
import type { UserRole } from "@prisma/client";
import { updateUserRole } from "@/app/admin/users/actions";
import { CLIENT_ASSIGNABLE_ROLES, PLATFORM_ASSIGNABLE_ROLES, ROLE_LABELS } from "@/lib/rbac";

export default function UserRoleSelect({
  userId,
  currentRole,
  disabled,
  clientHub = false,
}: {
  userId: string;
  currentRole: string;
  disabled?: boolean;
  clientHub?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const roles = clientHub ? CLIENT_ASSIGNABLE_ROLES : PLATFORM_ASSIGNABLE_ROLES;
  const options = roles.includes(currentRole as UserRole)
    ? roles
    : [currentRole as UserRole, ...roles];

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
      {options.map((r) => (
        <option key={r} value={r}>
          {ROLE_LABELS[r] ?? r}
        </option>
      ))}
    </select>
  );
}
