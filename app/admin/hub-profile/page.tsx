import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/session";
import { getRequestHubContext } from "@/lib/hub/requestPrisma";
import ImageUploadField from "@/components/ImageUploadField";
import { saveHubDirectoryProfile } from "./actions";
import { clientHubPublicHost } from "@/lib/hub/host";

export const dynamic = "force-dynamic";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60";

export default async function AdminHubProfilePage({
  searchParams,
}: {
  searchParams: { saved?: string; error?: string };
}) {
  await requireAdminPage();
  const ctx = await getRequestHubContext();
  if (ctx.kind !== "client" && ctx.kind !== "client-unprovisioned") {
    notFound();
  }

  const hub = await ctx.control.clientHub.findUnique({
    where: { id: ctx.hub.id },
    select: {
      name: true,
      slug: true,
      tenantDbAt: true,
      directoryPublic: true,
      directoryDescription: true,
      directoryImageUrl: true,
    },
  });
  if (!hub) notFound();

  const provisioned = Boolean(hub.tenantDbAt);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="font-body text-[11px] uppercase tracking-wide text-off-white/35">
        Directory
      </p>
      <h1 className="mt-1 font-display text-5xl tracking-wide">
        HUB <span className="text-gradient">PROFILE</span>
      </h1>
      <p className="mt-2 font-body text-sm text-off-white/55">
        This is what people see on /hubs. Keep the hub private until you are ready, then
        list it on the public directory. Invited members still see it under Your hubs either
        way.
      </p>
      <p className="mt-2 font-body text-xs text-off-white/40">
        {hub.name} · {clientHubPublicHost(hub.slug)}
      </p>

      {searchParams.saved ? (
        <p className="mt-6 rounded-lg border border-cyan/30 bg-cyan/10 px-4 py-2 font-body text-sm text-cyan">
          Directory profile saved.
        </p>
      ) : null}
      {searchParams.error ? (
        <p className="mt-6 rounded-lg border border-orange/30 bg-orange/10 px-4 py-2 font-body text-sm text-orange">
          Could not save. Use an https image URL and a description up to 400 characters.
        </p>
      ) : null}

      <form action={saveHubDirectoryProfile} className="glass mt-8 flex flex-col gap-6 rounded-2xl p-6">
        <ImageUploadField
          name="directoryImageUrl"
          folder="hub-directory"
          defaultValue={hub.directoryImageUrl}
          label="Directory image"
        />

        <label className="font-body text-xs font-semibold uppercase tracking-wide text-off-white/40">
          Description
          <textarea
            name="directoryDescription"
            defaultValue={hub.directoryDescription ?? ""}
            rows={4}
            maxLength={400}
            placeholder="What this hub is for — who it is for, what happens here."
            className={`${fieldClass} mt-2`}
          />
        </label>

        <label className="flex items-start gap-3 rounded-xl border border-off-white/10 px-4 py-3">
          <input
            type="checkbox"
            name="directoryPublic"
            defaultChecked={hub.directoryPublic}
            className="mt-1"
          />
          <span>
            <span className="font-body text-sm text-off-white">List this hub on the public directory</span>
            <span className="mt-1 block font-body text-xs text-off-white/45">
              Unchecked keeps the hub private — it will not show in All hubs. Invited
              members still see it under Your hubs.
              {!provisioned
                ? " Provision the hub before a public listing can appear."
                : hub.directoryPublic
                  ? " This hub is live on the directory."
                  : " Currently private."}
            </span>
          </span>
        </label>

        <button
          type="submit"
          className="w-fit rounded-lg bg-orange px-4 py-2 font-body text-sm font-semibold text-off-white transition hover:bg-orange/90"
        >
          Save profile
        </button>
      </form>
    </main>
  );
}
