"use client";

import { useMemo, useState } from "react";
import ImageUploadField from "@/components/ImageUploadField";
import {
  BODY_FONTS,
  DISPLAY_FONTS,
  parseBrandKit,
  validateBrandKit,
  type BrandKit,
} from "@/lib/hub/brandKit";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60";

function ColorField({
  name,
  label,
  value,
  onChange,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <label className="font-body text-xs font-semibold uppercase tracking-wide text-off-white/40">
      {label}
      <span className="mt-2 flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="h-10 w-12 cursor-pointer rounded border border-off-white/15 bg-transparent"
        />
        <input
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={fieldClass}
        />
      </span>
    </label>
  );
}

export default function BrandKitEditor({
  initialKit,
  hubName,
  action,
  resetAction,
  error,
  saved,
}: {
  initialKit: BrandKit;
  hubName: string;
  action: (formData: FormData) => void | Promise<void>;
  resetAction: () => void | Promise<void>;
  error?: string;
  saved?: boolean;
}) {
  const [kit, setKit] = useState<BrandKit>(initialKit);
  const issues = useMemo(() => validateBrandKit(parseBrandKit(kit)), [kit]);

  return (
    <form action={action} className="glass mt-8 flex flex-col gap-6 rounded-2xl p-6">
      <div>
        <p className="font-body text-[11px] uppercase tracking-wide text-off-white/35">Look</p>
        <h2 className="mt-1 font-display text-3xl tracking-wide">BRAND KIT</h2>
        <p className="mt-2 font-body text-sm text-off-white/55">
          This is how members see {hubName} — logo on the dashboard, button colors, type, and
          wallpaper. The left menu stays the hub name.
        </p>
      </div>

      {saved ? (
        <p className="rounded-lg border border-cyan/30 bg-cyan/10 px-4 py-2 font-body text-sm text-cyan">
          Brand kit saved. Open the hub in another tab to see it live.
        </p>
      ) : null}
      {error ? (
        <p className="rounded-lg border border-orange/30 bg-orange/10 px-4 py-2 font-body text-sm text-orange">
          {error}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,18rem)]">
        <div className="flex flex-col gap-5">
          <ImageUploadField
            name="logoUrl"
            folder="hub-logo"
            defaultValue={kit.logoUrl}
            label="Dashboard logo"
            onUrlChange={(logoUrl) => setKit((k) => ({ ...k, logoUrl: logoUrl || null }))}
          />
          <ImageUploadField
            name="backgroundImageUrl"
            folder="hub-background"
            defaultValue={kit.backgroundImageUrl}
            label="Background image"
            onUrlChange={(backgroundImageUrl) =>
              setKit((k) => ({ ...k, backgroundImageUrl: backgroundImageUrl || null }))
            }
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <ColorField
              name="canvas"
              label="Canvas"
              value={kit.colors.canvas}
              onChange={(canvas) => setKit((k) => ({ ...k, colors: { ...k.colors, canvas } }))}
            />
            <ColorField
              name="ink"
              label="Text"
              value={kit.colors.ink}
              onChange={(ink) => setKit((k) => ({ ...k, colors: { ...k.colors, ink } }))}
            />
            <ColorField
              name="primary"
              label="Primary"
              value={kit.colors.primary}
              onChange={(primary) => setKit((k) => ({ ...k, colors: { ...k.colors, primary } }))}
            />
            <ColorField
              name="secondary"
              label="Secondary"
              value={kit.colors.secondary}
              onChange={(secondary) => setKit((k) => ({ ...k, colors: { ...k.colors, secondary } }))}
            />
            <ColorField
              name="button"
              label="Buttons"
              value={kit.colors.button}
              onChange={(button) => setKit((k) => ({ ...k, colors: { ...k.colors, button } }))}
            />
            <ColorField
              name="buttonInk"
              label="Button text"
              value={kit.colors.buttonInk}
              onChange={(buttonInk) => setKit((k) => ({ ...k, colors: { ...k.colors, buttonInk } }))}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="font-body text-xs font-semibold uppercase tracking-wide text-off-white/40">
              Display font
              <select
                name="displayFont"
                value={kit.fonts.display}
                onChange={(e) =>
                  setKit((k) => ({
                    ...k,
                    fonts: { ...k.fonts, display: e.target.value as BrandKit["fonts"]["display"] },
                  }))
                }
                className={`${fieldClass} mt-2`}
              >
                {DISPLAY_FONTS.map((font) => (
                  <option key={font.id} value={font.id}>
                    {font.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="font-body text-xs font-semibold uppercase tracking-wide text-off-white/40">
              Body font
              <select
                name="bodyFont"
                value={kit.fonts.body}
                onChange={(e) =>
                  setKit((k) => ({
                    ...k,
                    fonts: { ...k.fonts, body: e.target.value as BrandKit["fonts"]["body"] },
                  }))
                }
                className={`${fieldClass} mt-2`}
              >
                {BODY_FONTS.map((font) => (
                  <option key={font.id} value={font.id}>
                    {font.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="font-body text-xs font-semibold uppercase tracking-wide text-off-white/40">
            Photo overlay {kit.overlay}%
            <input
              type="range"
              name="overlay"
              min={0}
              max={80}
              value={kit.overlay}
              onChange={(e) => setKit((k) => ({ ...k, overlay: Number(e.target.value) }))}
              className="mt-2 w-full"
            />
          </label>
        </div>

        <div
          className="overflow-hidden rounded-2xl border border-off-white/10 p-4"
          style={{
            background: kit.colors.canvas,
            color: kit.colors.ink,
            backgroundImage: kit.backgroundImageUrl
              ? `linear-gradient(${hexToRgba(kit.colors.canvas, kit.overlay / 100)}, ${hexToRgba(
                  kit.colors.canvas,
                  kit.overlay / 100
                )}), url(${kit.backgroundImageUrl})`
              : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <p className="font-body text-[10px] uppercase tracking-[0.2em] opacity-60">Preview</p>
          {kit.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={kit.logoUrl} alt="" className="mt-3 max-h-14 w-auto object-contain" />
          ) : null}
          <p
            className="mt-3 text-3xl tracking-wide"
            style={{ fontFamily: `"${previewDisplay(kit)}", sans-serif` }}
          >
            {hubName}
          </p>
          <p className="mt-2 font-body text-xs opacity-70" style={{ fontFamily: `"${previewBody(kit)}", sans-serif` }}>
            Sign in to continue
          </p>
          <button
            type="button"
            className="mt-4 rounded-lg px-4 py-2 font-body text-sm font-semibold"
            style={{ background: kit.colors.button, color: kit.colors.buttonInk }}
          >
            Sign in
          </button>
          <span
            className="ml-2 inline-flex rounded-full px-2 py-1 font-body text-[10px] font-semibold uppercase tracking-wide"
            style={{ background: `${kit.colors.secondary}22`, color: kit.colors.secondary }}
          >
            Live
          </span>
        </div>
      </div>

      {issues.length > 0 ? (
        <ul className="font-body text-xs text-orange">
          {issues.map((issue) => (
            <li key={issue.field}>{issue.message}</li>
          ))}
        </ul>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          className="w-fit rounded-lg bg-orange px-4 py-2 font-body text-sm font-semibold text-off-white transition hover:bg-orange/90"
        >
          Save brand kit
        </button>
        <button
          type="submit"
          formAction={resetAction}
          className="w-fit rounded-lg border border-off-white/15 px-4 py-2 font-body text-sm text-off-white/70 transition hover:border-cyan/40 hover:text-cyan"
        >
          Use TriForge defaults
        </button>
      </div>
    </form>
  );
}

function previewDisplay(kit: BrandKit) {
  return DISPLAY_FONTS.find((f) => f.id === kit.fonts.display)?.family ?? "Bebas Neue";
}

function previewBody(kit: BrandKit) {
  return BODY_FONTS.find((f) => f.id === kit.fonts.body)?.family ?? "Outfit";
}

function hexToRgba(hex: string, alpha: number) {
  const n = hex.replace("#", "");
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
