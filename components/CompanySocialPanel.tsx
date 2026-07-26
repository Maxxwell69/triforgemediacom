import { prisma } from "@/lib/prisma";
import { SOCIAL_PLATFORM_META, SOCIAL_PLATFORM_ORDER } from "@/lib/socialPlatforms";
import ShareButton from "@/components/ShareButton";

const COMPANY_URL = "https://triforgemedia.com";

export default async function CompanySocialPanel() {
  const links = await prisma.companySocial.findMany();
  if (links.length === 0) return null;

  const linksByPlatform = new Map(links.map((l) => [l.platform, l.url]));
  const ordered = SOCIAL_PLATFORM_ORDER.filter((p) => linksByPlatform.has(p));

  return (
    <div className="glass mt-8 flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-display text-lg tracking-wide text-off-white">Follow TriForge Media</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {ordered.map((platform) => {
            const meta = SOCIAL_PLATFORM_META[platform];
            return (
              <a
                key={platform}
                href={linksByPlatform.get(platform)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-full border border-off-white/15 px-3 py-1.5 font-body text-xs text-off-white/70 transition hover:border-cyan/40 hover:text-cyan"
              >
                <span aria-hidden="true">{meta.icon}</span>
                {meta.label}
              </a>
            );
          })}
        </div>
      </div>

      <ShareButton
        title="TriForge Media"
        text="Check out TriForge Media — the creator agency helping streamers, TikTokers, and live hosts grow."
        url={COMPANY_URL}
        label="Share TriForge Media"
      />
    </div>
  );
}
