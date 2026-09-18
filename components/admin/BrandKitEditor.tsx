"use client";

import { useMemo, useState } from "react";
import ImageUploadField from "@/components/ImageUploadField";
import {
  BODY_FONTS,
  DISPLAY_FONTS,
  parseBrandKit,
  validateBrandKit,
  type BrandKit,
  type SurfaceKit,
} from "@/lib/hub/brandKit";

const fieldClass =
  "w-full rounded-lg border border-off-white/15 bg-off-white/5 px-3 py-2 font-body text-sm text-off-white placeholder:text-off-white/30 outline-none transition focus:border-cyan/60";

type TabId = "dashboard" | "menu" | "groups" | "chat";

const TABS: { id: TabId; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "menu", label: "Menu" },
  { id: "groups", label: "Groups" },
  { id: "chat", label: "Chat" },
];

function ColorField({
  label,
  value,
  onChange,
}: {
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
        <input value={value} onChange={(e) => onChange(e.target.value)} className={fieldClass} />
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
  const [tab, setTab] = useState<TabId>("dashboard");
  const issues = useMemo(() => validateBrandKit(parseBrandKit(kit)), [kit]);

  function setSurface(key: keyof BrandKit["surfaces"], patch: Partial<SurfaceKit>) {
    setKit((k) => ({
      ...k,
      surfaces: { ...k.surfaces, [key]: { ...k.surfaces[key], ...patch } },
    }));
  }

  const preview =
    tab === "dashboard"
      ? {
          canvas: kit.colors.canvas,
          ink: kit.colors.ink,
          image: kit.backgroundImageUrl,
          overlay: kit.overlay,
          label: "Dashboard",
        }
      : {
          canvas: kit.surfaces[tab].canvas,
          ink: kit.surfaces[tab].ink,
          image: kit.surfaces[tab].backgroundImageUrl,
          overlay: kit.surfaces[tab].overlay,
          label: tab === "menu" ? "Menu" : tab === "groups" ? "Groups" : "Chat",
        };

  return (
    <form action={action} className="glass mt-8 flex flex-col gap-6 rounded-2xl p-6">
      <div>
        <p className="font-body text-[11px] uppercase tracking-wide text-off-white/35">Look</p>
        <h2 className="mt-1 font-display text-3xl tracking-wide">BRAND KIT</h2>
        <p className="mt-2 font-body text-sm text-off-white/55">
          Skin how members see {hubName}. Admin stays the TriForge look. Use the tabs for dashboard,
          menu, groups rail, and chat.
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

      <KitHiddenFields kit={kit} />

      <div className="flex flex-wrap gap-2">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-lg px-3 py-1.5 font-body text-sm transition ${
              tab === item.id
                ? "bg-orange text-off-white"
                : "border border-off-white/15 text-off-white/70 hover:border-cyan/40 hover:text-cyan"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,18rem)]">
        <div className="flex flex-col gap-5">
          {tab === "dashboard" ? (
            <DashboardFields kit={kit} setKit={setKit} />
          ) : (
            <SurfaceFields
              key={tab}
              surface={kit.surfaces[tab]}
              hint={
                tab === "menu"
                  ? "Wallpaper behind the left channel menu."
                  : tab === "groups"
                    ? "Wallpaper behind the group icon rail."
                    : "Wallpaper inside channel and DM chat."
              }
              onChange={(patch) => setSurface(tab, patch)}
            />
          )}
        </div>

        <div
          className="overflow-hidden rounded-2xl border border-off-white/10 p-4"
          style={{
            background: preview.canvas,
            color: preview.ink,
            backgroundImage: preview.image
              ? `linear-gradient(${hexToRgba(preview.canvas, preview.overlay / 100)}, ${hexToRgba(
                  preview.canvas,
                  preview.overlay / 100
                )}), url(${preview.image})`
              : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <p className="font-body text-[10px] uppercase tracking-[0.2em] opacity-60">{preview.label}</p>
          {tab === "dashboard" && kit.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={kit.logoUrl} alt="" className="mt-3 max-h-12 w-auto object-contain" />
          ) : null}
          <p
            className="mt-3 text-3xl tracking-wide"
            style={{ fontFamily: `"${previewDisplay(kit)}", sans-serif` }}
          >
            {tab === "dashboard" ? "Good morning" : tab === "menu" ? "Home" : tab === "groups" ? "H" : "# general"}
          </p>
          <p className="mt-1 text-xs opacity-70" style={{ fontFamily: `"${previewBody(kit)}", sans-serif` }}>
            {tab === "dashboard"
              ? `Home · ${hubName}`
              : tab === "menu"
                ? "Channels and member menu"
                : tab === "groups"
                  ? "Group switcher"
                  : "Messages stay readable over the wallpaper"}
          </p>
          {tab === "dashboard" ? (
            <>
              <div
                className="mt-4 rounded-xl border p-3"
                style={{
                  borderColor: `${kit.colors.ink}22`,
                  background: `${kit.colors.ink}12`,
                  fontFamily: `"${previewBody(kit)}", sans-serif`,
                }}
              >
                <p className="text-sm font-semibold">Chat</p>
                <p className="mt-1 text-[11px] opacity-70">Jump into the conversation.</p>
              </div>
              <button
                type="button"
                className="mt-4 rounded-lg px-4 py-2 font-body text-sm font-semibold"
                style={{
                  background: kit.colors.button,
                  color: kit.colors.buttonInk,
                  fontFamily: `"${previewBody(kit)}", sans-serif`,
                }}
              >
                Open
              </button>
            </>
          ) : null}
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

function DashboardFields({
  kit,
  setKit,
}: {
  kit: BrandKit;
  setKit: (update: (k: BrandKit) => BrandKit) => void;
}) {
  return (
    <>
      <ImageUploadField
        folder="hub-logo"
        defaultValue={kit.logoUrl}
        label="Dashboard logo"
        hint="Shows on the home dashboard above the greeting — not in the left menu."
        onUrlChange={(logoUrl) => setKit((k) => ({ ...k, logoUrl: logoUrl || null }))}
      />
      <ImageUploadField
        folder="hub-background"
        defaultValue={kit.backgroundImageUrl}
        label="Background image"
        hint="Wallpaper behind the dashboard and main pages."
        onUrlChange={(backgroundImageUrl) =>
          setKit((k) => ({ ...k, backgroundImageUrl: backgroundImageUrl || null }))
        }
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <ColorField
          label="Canvas"
          value={kit.colors.canvas}
          onChange={(canvas) => setKit((k) => ({ ...k, colors: { ...k.colors, canvas } }))}
        />
        <ColorField
          label="Text"
          value={kit.colors.ink}
          onChange={(ink) => setKit((k) => ({ ...k, colors: { ...k.colors, ink } }))}
        />
        <ColorField
          label="Primary"
          value={kit.colors.primary}
          onChange={(primary) => setKit((k) => ({ ...k, colors: { ...k.colors, primary } }))}
        />
        <ColorField
          label="Secondary"
          value={kit.colors.secondary}
          onChange={(secondary) => setKit((k) => ({ ...k, colors: { ...k.colors, secondary } }))}
        />
        <ColorField
          label="Buttons"
          value={kit.colors.button}
          onChange={(button) => setKit((k) => ({ ...k, colors: { ...k.colors, button } }))}
        />
        <ColorField
          label="Button text"
          value={kit.colors.buttonInk}
          onChange={(buttonInk) => setKit((k) => ({ ...k, colors: { ...k.colors, buttonInk } }))}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="font-body text-xs font-semibold uppercase tracking-wide text-off-white/40">
          Display font
          <select
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
          min={0}
          max={80}
          value={kit.overlay}
          onChange={(e) => setKit((k) => ({ ...k, overlay: Number(e.target.value) }))}
          className="mt-2 w-full"
        />
      </label>
    </>
  );
}

function SurfaceFields({
  surface,
  hint,
  onChange,
}: {
  surface: SurfaceKit;
  hint: string;
  onChange: (patch: Partial<SurfaceKit>) => void;
}) {
  return (
    <>
      <ImageUploadField
        folder="hub-background"
        defaultValue={surface.backgroundImageUrl}
        label="Background image"
        hint={hint}
        onUrlChange={(backgroundImageUrl) =>
          onChange({ backgroundImageUrl: backgroundImageUrl || null })
        }
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <ColorField
          label="Canvas"
          value={surface.canvas}
          onChange={(canvas) => onChange({ canvas })}
        />
        <ColorField label="Text" value={surface.ink} onChange={(ink) => onChange({ ink })} />
      </div>
      <label className="font-body text-xs font-semibold uppercase tracking-wide text-off-white/40">
        Photo overlay {surface.overlay}%
        <input
          type="range"
          min={0}
          max={80}
          value={surface.overlay}
          onChange={(e) => onChange({ overlay: Number(e.target.value) })}
          className="mt-2 w-full"
        />
      </label>
    </>
  );
}

function KitHiddenFields({ kit }: { kit: BrandKit }) {
  return (
    <>
      <input type="hidden" name="logoUrl" value={kit.logoUrl ?? ""} />
      <input type="hidden" name="backgroundImageUrl" value={kit.backgroundImageUrl ?? ""} />
      <input type="hidden" name="canvas" value={kit.colors.canvas} />
      <input type="hidden" name="ink" value={kit.colors.ink} />
      <input type="hidden" name="primary" value={kit.colors.primary} />
      <input type="hidden" name="secondary" value={kit.colors.secondary} />
      <input type="hidden" name="button" value={kit.colors.button} />
      <input type="hidden" name="buttonInk" value={kit.colors.buttonInk} />
      <input type="hidden" name="displayFont" value={kit.fonts.display} />
      <input type="hidden" name="bodyFont" value={kit.fonts.body} />
      <input type="hidden" name="overlay" value={String(kit.overlay)} />
      <input type="hidden" name="menuCanvas" value={kit.surfaces.menu.canvas} />
      <input type="hidden" name="menuInk" value={kit.surfaces.menu.ink} />
      <input type="hidden" name="menuBackgroundImageUrl" value={kit.surfaces.menu.backgroundImageUrl ?? ""} />
      <input type="hidden" name="menuOverlay" value={String(kit.surfaces.menu.overlay)} />
      <input type="hidden" name="groupsCanvas" value={kit.surfaces.groups.canvas} />
      <input type="hidden" name="groupsInk" value={kit.surfaces.groups.ink} />
      <input type="hidden" name="groupsBackgroundImageUrl" value={kit.surfaces.groups.backgroundImageUrl ?? ""} />
      <input type="hidden" name="groupsOverlay" value={String(kit.surfaces.groups.overlay)} />
      <input type="hidden" name="chatCanvas" value={kit.surfaces.chat.canvas} />
      <input type="hidden" name="chatInk" value={kit.surfaces.chat.ink} />
      <input type="hidden" name="chatBackgroundImageUrl" value={kit.surfaces.chat.backgroundImageUrl ?? ""} />
      <input type="hidden" name="chatOverlay" value={String(kit.surfaces.chat.overlay)} />
    </>
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
