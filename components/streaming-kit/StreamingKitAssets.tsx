"use client";

import { useState, type CSSProperties } from "react";
import type { StreamingKitGroup, StreamingKitSurface } from "@/lib/streamingKit";
import { formatKitBytes, streamingKitHref } from "@/lib/streamingKit";

const SURFACES: { id: StreamingKitSurface; label: string }[] = [
  { id: "charcoal", label: "Charcoal" },
  { id: "checker", label: "Checker" },
  { id: "light", label: "Light" },
];

function previewClass(kind: "wide" | "square" | "portrait") {
  if (kind === "portrait") return "mx-auto aspect-[9/16] max-h-72 w-auto";
  if (kind === "square") return "mx-auto aspect-square max-h-52 w-full max-w-[13rem]";
  return "aspect-[16/7] w-full";
}

function surfaceStyle(surface: StreamingKitSurface): CSSProperties {
  if (surface === "light") return { backgroundColor: "#F5F5F5" };
  if (surface === "charcoal") return { backgroundColor: "#0A0A0A" };
  return {
    backgroundColor: "#0A0A0A",
    backgroundImage:
      "linear-gradient(45deg, #1c1c1c 25%, transparent 25%), linear-gradient(-45deg, #1c1c1c 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1c1c1c 75%), linear-gradient(-45deg, transparent 75%, #1c1c1c 75%)",
    backgroundSize: "18px 18px",
    backgroundPosition: "0 0, 0 9px, 9px -9px, -9px 0",
  };
}

export default function StreamingKitAssets({ groups }: { groups: StreamingKitGroup[] }) {
  const [surface, setSurface] = useState<StreamingKitSurface>("charcoal");

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-body text-xs text-off-white/45">
          Preview backgrounds are not part of the files. Download the PNG, not a screenshot.
        </p>
        <div className="flex gap-1 rounded-lg border border-off-white/10 p-1">
          {SURFACES.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setSurface(option.id)}
              className={`rounded-md px-3 py-1 font-body text-xs transition ${
                surface === option.id
                  ? "bg-off-white/10 text-off-white"
                  : "text-off-white/45 hover:text-off-white"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 space-y-12">
        {groups.map((group) => (
          <section key={group.id} id={group.id}>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-3xl tracking-wide text-off-white">{group.title}</h2>
                <p className="mt-1 font-body text-sm text-off-white/55">{group.blurb}</p>
              </div>
              {group.packPath ? (
                <a
                  href={streamingKitHref(group.packPath, true)}
                  className="font-body text-sm text-cyan transition hover:underline"
                >
                  Download pack
                </a>
              ) : null}
            </div>
            <div
              className={`mt-5 grid gap-4 ${
                group.id === "frames" ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"
              }`}
            >
              {group.assets.map((asset) => (
                <article key={asset.key} className="glass flex flex-col overflow-hidden rounded-2xl">
                  <div
                    className="flex items-center justify-center p-4"
                    style={surfaceStyle(surface)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={streamingKitHref(asset.path)}
                      alt={asset.name}
                      className={`${previewClass(asset.preview)} object-contain`}
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <p className="font-body text-sm font-semibold text-off-white">{asset.name}</p>
                    <p className="font-body text-xs text-off-white/50">{asset.use}</p>
                    <p className="font-body text-[11px] uppercase tracking-wide text-off-white/35">
                      {asset.width} × {asset.height} · {formatKitBytes(asset.bytes)} · PNG
                    </p>
                    <a
                      href={streamingKitHref(asset.path, true)}
                      className="mt-auto inline-flex w-fit items-center rounded-lg bg-orange px-3 py-1.5 font-body text-xs font-semibold text-off-white transition hover:bg-orange/90"
                    >
                      Download PNG
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
