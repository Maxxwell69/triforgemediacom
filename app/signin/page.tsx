import type { Metadata } from "next";
import nextDynamic from "next/dynamic";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Sign in — TriForge Hub",
  description: "Sign in to the TriForge Hub — community, TikTask, Learning Center, and more.",
};

const SignInScreen = nextDynamic(() => import("@/components/hub/SignInScreen"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-charcoal">
      <p className="font-body text-sm text-off-white/40">Loading…</p>
    </div>
  ),
});

export default function SignInPage() {
  return <SignInScreen />;
}
