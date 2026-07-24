"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton({ className = "" }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className={
        className ||
        "font-body text-sm text-off-white/60 transition hover:text-orange"
      }
    >
      Sign out
    </button>
  );
}
