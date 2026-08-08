"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { acceptGroupInvite } from "@/app/(community)/groups/actions";

export default function AcceptGroupInviteButton({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const result = await acceptGroupInvite(token);
            if (result.error) {
              setError(result.error);
              return;
            }
            router.push(result.groupId ? `/groups/${result.groupId}` : "/groups");
            router.refresh();
          })
        }
        className="rounded-lg bg-orange px-6 py-2.5 font-body text-sm font-semibold text-off-white shadow-glow transition hover:brightness-110 disabled:opacity-40"
      >
        {isPending ? "Joining…" : "Accept invite"}
      </button>
      {error && <p className="font-body text-sm text-orange">{error}</p>}
    </div>
  );
}
