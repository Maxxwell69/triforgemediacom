"use client";

import { useTransition } from "react";
import { setHiddenFromDirectory } from "@/app/admin/users/actions";

export default function DirectoryVisibilityToggle({
  userId,
  hidden,
}: {
  userId: string;
  hidden: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      title={
        hidden
          ? "Hidden from the /members directory — click to show"
          : "Visible in the /members directory — click to hide (e.g. shared/figurehead accounts)"
      }
      onClick={() =>
        startTransition(async () => {
          await setHiddenFromDirectory(userId, !hidden);
        })
      }
      className={`rounded-lg border px-3 py-1 font-body text-xs transition disabled:opacity-60 ${
        hidden
          ? "border-off-white/10 text-off-white/30 hover:border-off-white/25 hover:text-off-white/50"
          : "border-off-white/15 text-off-white/70 hover:border-cyan/40 hover:text-cyan"
      }`}
    >
      {hidden ? "🙈 Hidden from directory" : "👁 In directory"}
    </button>
  );
}
