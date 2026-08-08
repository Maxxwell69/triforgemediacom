import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { verifyBroadcastUnsubscribeToken } from "@/lib/broadcastUnsubscribe";
import SiteHeader from "@/components/SiteHeader";
import UnsubscribeClient from "./UnsubscribeClient";

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams?: { token?: string; done?: string; error?: string };
}) {
  const token = searchParams?.token || "";
  const alreadyDone = searchParams?.done === "1";
  const invalidHint = searchParams?.error === "invalid";

  const verified = token ? verifyBroadcastUnsubscribeToken(token) : null;
  let email: string | null = null;
  let optedIn = true;

  if (verified) {
    const user = await prisma.user.findUnique({
      where: { id: verified.userId },
      select: { email: true, broadcastEmailsOptIn: true },
    });
    if (user) {
      email = user.email;
      optedIn = user.broadcastEmailsOptIn;
    }
  }

  const invalid = invalidHint || !token || !verified || !email;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="glass w-full max-w-md rounded-2xl p-8">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-orange">
            TriForge Hub
          </p>
          <h1 className="mt-3 font-display text-4xl tracking-wide text-off-white">
            Email preferences
          </h1>

          {invalid ? (
            <p className="mt-4 font-body text-sm text-off-white/70">
              This unsubscribe link is invalid. If you&apos;re signed in, manage announcement emails
              from{" "}
              <Link href="/account" className="text-cyan underline-offset-2 hover:underline">
                your account
              </Link>
              .
            </p>
          ) : (
            <UnsubscribeClient
              token={token}
              email={email!}
              initiallyUnsubscribed={!optedIn || alreadyDone}
            />
          )}
        </div>
      </main>
    </div>
  );
}
