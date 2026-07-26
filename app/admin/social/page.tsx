import { prisma } from "@/lib/prisma";
import { SOCIAL_PLATFORM_META, SOCIAL_PLATFORM_ORDER } from "@/lib/socialPlatforms";
import { setCompanySocial } from "./actions";

export const dynamic = "force-dynamic";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60";

export default async function AdminSocialPage() {
  const links = await prisma.companySocial.findMany();
  const linksByPlatform = new Map(links.map((l) => [l.platform, l]));

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-5xl tracking-wide">
        COMPANY <span className="text-gradient">SOCIAL</span>
      </h1>
      <p className="mt-2 font-body text-sm text-off-white/50">
        TriForge Media&apos;s official profiles. Any admin can set or update these — they show
        up as follow/share links on every member&apos;s dashboard. Leave a field blank and save
        to remove it.
      </p>

      <div className="mt-8 flex flex-col gap-4">
        {SOCIAL_PLATFORM_ORDER.map((platform) => {
          const meta = SOCIAL_PLATFORM_META[platform];
          const existing = linksByPlatform.get(platform);

          return (
            <form
              key={platform}
              action={setCompanySocial}
              className="glass flex flex-col gap-3 rounded-2xl p-5 sm:flex-row sm:items-center"
            >
              <input type="hidden" name="platform" value={platform} />
              <div className="flex w-40 shrink-0 items-center gap-2">
                <span className="text-xl" aria-hidden="true">
                  {meta.icon}
                </span>
                <span className="font-body text-sm font-semibold text-off-white">
                  {meta.label}
                </span>
              </div>
              <input
                name="url"
                type="url"
                defaultValue={existing?.url ?? ""}
                placeholder={meta.placeholder}
                className={fieldClass}
              />
              <button
                type="submit"
                className="shrink-0 rounded-lg border border-cyan/40 px-4 py-2 font-body text-xs font-semibold text-cyan transition hover:bg-cyan/10"
              >
                {existing ? "Update" : "Save"}
              </button>
            </form>
          );
        })}
      </div>
    </main>
  );
}
