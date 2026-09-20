import Link from "next/link";
import { requireAdminPage } from "@/lib/session";
import { requireConversationsModule } from "@/lib/conversations";
import { getRequestHubContext } from "@/lib/hub/requestPrisma";
import { getClientHubResendStatus } from "@/lib/hub/resendSettings";
import { saveConversationSendingAction } from "../actions";

export const dynamic = "force-dynamic";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none focus:border-cyan/60";

export default async function ConversationSendingPage({
  searchParams,
}: {
  searchParams: { saved?: string; error?: string };
}) {
  requireConversationsModule();
  await requireAdminPage();
  const ctx = await getRequestHubContext();
  const isClient = ctx.kind === "client" || ctx.kind === "client-unprovisioned";
  const status = isClient ? await getClientHubResendStatus(ctx.hub.id) : null;

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/admin/conversations" className="font-body text-sm text-off-white/50 hover:text-off-white">
        &larr; Inbox
      </Link>
      <h1 className="mt-4 font-display text-5xl tracking-wide">
        SEND<span className="text-gradient">ING</span>
      </h1>
      <p className="mt-2 font-body text-sm text-off-white/50">
        Conversations and broadcasts from this hub use your Resend account so mail comes from your
        domain.
      </p>

      {searchParams.saved ? (
        <p className="mt-4 font-body text-sm text-cyan">Saved.</p>
      ) : null}
      {searchParams.error ? (
        <p className="mt-4 font-body text-sm text-orange">{searchParams.error}</p>
      ) : null}

      {!isClient ? (
        <p className="glass mt-8 rounded-2xl p-6 font-body text-sm text-off-white/60">
          Hub 0 uses the platform Resend key. Client hubs paste their own key here.
        </p>
      ) : (
        <form action={saveConversationSendingAction} className="glass mt-8 flex flex-col gap-4 rounded-2xl p-6">
          <div>
            <label className="font-body text-xs uppercase tracking-wide text-off-white/45">
              Resend API key
            </label>
            <input
              name="apiKey"
              type="password"
              autoComplete="off"
              placeholder={status?.hasKey ? "Key on file — paste a new one to replace" : "re_…"}
              className={`${fieldClass} mt-1`}
            />
            <p className="mt-1 font-body text-xs text-off-white/40">
              Stored encrypted. Create a key at resend.com, then verify your domain (SPF, DKIM,
              DMARC).
            </p>
          </div>
          <div>
            <label className="font-body text-xs uppercase tracking-wide text-off-white/45">
              From address
            </label>
            <input
              name="fromEmail"
              defaultValue={status?.fromEmail || ""}
              placeholder="Your Hub <hello@yourdomain.com>"
              className={`${fieldClass} mt-1`}
              required
            />
          </div>
          <label className="flex items-start gap-3 font-body text-sm text-off-white/70">
            <input
              type="checkbox"
              name="domainReady"
              defaultChecked={Boolean(status?.domainReady)}
              className="mt-1"
            />
            Domain is verified in Resend (SPF / DKIM / DMARC)
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="rounded-lg bg-orange px-5 py-2 font-body text-sm font-semibold text-off-white"
            >
              Save sending
            </button>
            {status?.hasKey ? (
              <button
                type="submit"
                name="clearKey"
                value="1"
                className="rounded-lg border border-off-white/15 px-4 py-2 font-body text-sm text-off-white/60"
              >
                Remove key
              </button>
            ) : null}
          </div>
        </form>
      )}
    </main>
  );
}
