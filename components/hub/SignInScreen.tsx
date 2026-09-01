"use client";

import Link from "next/link";
import HubSiteHeader from "@/components/hub/HubSiteHeader";
import HubSiteFooter from "@/components/hub/HubSiteFooter";
import SignInForm from "@/components/hub/SignInForm";

export default function SignInScreen() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(253,72,2,0.22), transparent 55%), radial-gradient(circle at 90% 80%, rgba(0,212,255,0.12), transparent 45%), radial-gradient(circle at 10% 90%, rgba(14,26,61,0.8), transparent 40%)",
        }}
      />
      <HubSiteHeader />
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-12">
        <p className="mb-3 text-xs uppercase tracking-[0.3em] text-cyan">TriForge Hub</p>
        <h1 className="mb-2 text-center font-display text-5xl tracking-wide sm:text-6xl">
          SIGN <span className="text-gradient">IN</span>
        </h1>
        <p className="mb-8 max-w-md text-center font-body text-sm text-off-white/55">
          Welcome back. Enter your invite-created credentials to open chat, TikTask, courses,
          and the rest of the Hub.
        </p>
        <SignInForm />
        <Link
          href="/"
          className="mt-10 font-body text-sm text-off-white/40 transition hover:text-cyan"
        >
          ← Back to the Hub
        </Link>
      </main>
      <HubSiteFooter />
    </div>
  );
}
