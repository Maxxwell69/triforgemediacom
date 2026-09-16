import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireProfile } from "@/lib/session";
import { hubHas } from "@/lib/hub/modules";
import StreamingKitAssets from "@/components/streaming-kit/StreamingKitAssets";
import {
  STREAMING_KIT_GROUPS,
  STREAMING_KIT_PACKS,
  STREAMING_KIT_PALETTE,
  STREAMING_KIT_SKU,
  STREAMING_KIT_STEPS,
  formatKitBytes,
  streamingKitHref,
} from "@/lib/streamingKit";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Streaming kit · TriForge Community",
};

export default async function StreamingKitPage() {
  await requireProfile();
  if (!hubHas(STREAMING_KIT_SKU)) notFound();

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <p className="font-body text-[11px] uppercase tracking-wide text-off-white/35">
          Hub 0 · Forge creators
        </p>
        <h1 className="mt-1 font-display text-5xl tracking-wide">
          YOUR STREAM.{" "}
          <span className="text-gradient">THE FORGE BRAND.</span>
        </h1>
        <p className="mt-3 max-w-2xl font-body text-off-white/60">
          Twelve transparent PNGs for OBS, TikTok LIVE Studio, and any app with image
          layers. Static overlays — not prebuilt scenes. Download the files here; keep
          the original aspect ratio; type your name as its own text layer.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={streamingKitHref("downloads/TriForge_All_Images.zip", true)}
            className="rounded-lg bg-orange px-4 py-2 font-body text-sm font-semibold text-off-white transition hover:bg-orange/90"
          >
            Download all images
          </a>
          <a
            href={streamingKitHref("TriForge_Streaming_Kit_Guide.pdf", true)}
            className="rounded-lg border border-off-white/15 px-4 py-2 font-body text-sm text-off-white/80 transition hover:border-cyan/40 hover:text-cyan"
          >
            Creator guide PDF
          </a>
          <a
            href={streamingKitHref("TriForge_Original_Brand_Guidelines.pdf", true)}
            className="rounded-lg border border-off-white/15 px-4 py-2 font-body text-sm text-off-white/80 transition hover:border-cyan/40 hover:text-cyan"
          >
            Brand guidelines
          </a>
        </div>

        <section className="mt-12">
          <h2 className="font-display text-3xl tracking-wide text-off-white">Packs</h2>
          <p className="mt-1 font-body text-sm text-off-white/55">
            Category ZIPs plus the two PDFs. Signed-in Hub 0 members only.
          </p>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {STREAMING_KIT_PACKS.map((pack) => (
              <a
                key={pack.key}
                href={streamingKitHref(pack.path, true)}
                className="glass flex flex-col gap-2 rounded-2xl p-5 transition hover:border-cyan/40"
              >
                <p className="font-display text-lg tracking-wide text-off-white">{pack.name}</p>
                <p className="font-body text-sm text-off-white/55">{pack.description}</p>
                <p className="mt-auto font-body text-[11px] uppercase tracking-wide text-off-white/35">
                  {pack.kind.toUpperCase()} · {formatKitBytes(pack.bytes)}
                </p>
              </a>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-3xl tracking-wide text-off-white">How to use it</h2>
          <ol className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
            {STREAMING_KIT_STEPS.map((step) => (
              <li key={step.n} className="glass rounded-2xl p-5">
                <p className="font-display text-sm tracking-wide text-orange">{step.n}</p>
                <p className="mt-1 font-display text-xl tracking-wide text-off-white">{step.title}</p>
                <p className="mt-2 font-body text-sm text-off-white/60">{step.body}</p>
              </li>
            ))}
          </ol>
          <p className="mt-4 font-body text-sm text-off-white/45">
            OBS image sources:{" "}
            <Link
              href="https://obsproject.com/kb/image-sources"
              target="_blank"
              rel="noreferrer"
              className="text-cyan hover:underline"
            >
              obsproject.com/kb/image-sources
            </Link>
            . TikTok LIVE Studio uses its own image-import control — names vary by version.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-3xl tracking-wide text-off-white">Brand rules</h2>
          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="glass rounded-2xl p-5">
              <p className="font-display text-lg tracking-wide text-off-white">Palette</p>
              <ul className="mt-4 space-y-2">
                {STREAMING_KIT_PALETTE.map((swatch) => (
                  <li key={swatch.hex} className="flex items-center gap-3 font-body text-sm">
                    <span
                      className="h-8 w-8 shrink-0 rounded-md border border-off-white/15"
                      style={{ backgroundColor: swatch.hex }}
                    />
                    <span className="text-off-white">{swatch.name}</span>
                    <span className="text-off-white/40">{swatch.hex}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="glass rounded-2xl p-5">
              <p className="font-display text-lg tracking-wide text-off-white">Type &amp; space</p>
              <ul className="mt-4 space-y-2 font-body text-sm text-off-white/65">
                <li>Display: Bebas Neue. Body and names: Outfit. Names on stream: Outfit SemiBold.</li>
                <li>Clear zone around the visible logo equals the height of the F. Padding in the PNG is not enough on its own.</li>
                <li>Full mark minimum 120px wide. Corner icon minimum 32px.</li>
                <li>Do not stretch, skew, rotate, or retype the wordmark.</li>
                <li>Fonts are named here — they are not bundled in the kit. Install them on the PC that runs OBS.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-3xl tracking-wide text-off-white">Files</h2>
          <p className="mt-1 font-body text-sm text-off-white/55">
            All effects are static. Dark and checker previews are not in the assets. The glow
            nameplate’s dark plate is intentional so names stay readable.
          </p>
          <div className="mt-6">
            <StreamingKitAssets groups={STREAMING_KIT_GROUPS} />
          </div>
        </section>
      </div>
    </main>
  );
}
