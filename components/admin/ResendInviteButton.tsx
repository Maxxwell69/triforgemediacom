"use client";

import { useState, useTransition } from "react";
import { resendInvite } from "@/app/admin/users/actions";

export default function ResendInviteButton({ userId }: { userId: string }) {
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<"idle" | "sent" | "error">("idle");

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          try {
            await resendInvite(userId);
            setState("sent");
          } catch {
            setState("error");
          }
        })
      }
      className="shrink-0 rounded-lg border border-cyan/40 px-2.5 py-1 font-body text-xs font-semibold text-cyan transition hover:bg-cyan/10 disabled:opacity-60"
    >
      {state === "sent" ? "Sent!" : state === "error" ? "Failed — retry?" : "Resend invite"}
    </button>
  );
}
