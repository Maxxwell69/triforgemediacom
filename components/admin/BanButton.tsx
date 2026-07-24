"use client";

import { useTransition } from "react";
import { setUserBanned } from "@/app/admin/users/actions";

export default function BanButton({
  userId,
  banned,
  disabled,
}: {
  userId: string;
  banned: boolean;
  disabled?: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={disabled || isPending}
      onClick={() =>
        startTransition(async () => {
          await setUserBanned(userId, !banned);
        })
      }
      className={`rounded-lg border px-3 py-1 font-body text-xs font-semibold transition disabled:opacity-40 ${
        banned
          ? "border-cyan/40 text-cyan hover:bg-cyan/10"
          : "border-orange/40 text-orange hover:bg-orange/10"
      }`}
    >
      {banned ? "Unban" : "Ban"}
    </button>
  );
}
