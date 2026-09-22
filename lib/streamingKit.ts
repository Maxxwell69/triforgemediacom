/** Hub 0 creator streaming overlays — files live in content/streaming-kit/. */

export const STREAMING_KIT_SKU = "streamingKit";

export type StreamingKitSurface = "charcoal" | "checker" | "light";

export type StreamingKitAsset = {
  key: string;
  name: string;
  use: string;
  path: string;
  folder: "01-logos" | "02-corner-marks" | "03-nameplates" | "04-camera-frames";
  width: number;
  height: number;
  bytes: number;
  preview: "wide" | "square" | "portrait";
};

export type StreamingKitPack = {
  key: string;
  name: string;
  description: string;
  path: string;
  bytes: number;
  kind: "zip" | "pdf";
};

export type StreamingKitGroup = {
  id: string;
  title: string;
  blurb: string;
  packPath?: string;
  assets: StreamingKitAsset[];
};

export const STREAMING_KIT_PALETTE = [
  { name: "Charcoal", hex: "#0A0A0A" },
  { name: "Electric Orange", hex: "#FD4802" },
  { name: "Deep Blue", hex: "#0E1A3D" },
  { name: "Neon Cyan", hex: "#00D4FF" },
  { name: "Off-White", hex: "#F5F5F5" },
] as const;

export const STREAMING_KIT_ASSETS: StreamingKitAsset[] = [
  {
    key: "01-logo-primary",
    name: "Logo — original color",
    use: "Default full brand mark on a dark scrim when the scene is busy.",
    path: "assets/01-logos/01-logo-primary.png",
    folder: "01-logos",
    width: 1983,
    height: 793,
    bytes: 747325,
    preview: "wide",
  },
  {
    key: "02-logo-white",
    name: "Logo — clean white",
    use: "Clean white wordmark for dark footage.",
    path: "assets/01-logos/02-logo-white.png",
    folder: "01-logos",
    width: 1774,
    height: 887,
    bytes: 300298,
    preview: "wide",
  },
  {
    key: "03-logo-orange-glow",
    name: "Logo — orange glow",
    use: "Warm orange glow for dark scenes.",
    path: "assets/01-logos/03-logo-orange-glow.png",
    folder: "01-logos",
    width: 1774,
    height: 887,
    bytes: 631659,
    preview: "wide",
  },
  {
    key: "04-logo-cyan-glow",
    name: "Logo — cyan glow",
    use: "Cyan glow with the original orange accents.",
    path: "assets/01-logos/04-logo-cyan-glow.png",
    folder: "01-logos",
    width: 1774,
    height: 887,
    bytes: 669751,
    preview: "wide",
  },
  {
    key: "05-logo-white-glow",
    name: "Logo — white glow",
    use: "Luminous white treatment for dark scenes.",
    path: "assets/01-logos/05-logo-white-glow.png",
    folder: "01-logos",
    width: 1774,
    height: 887,
    bytes: 512113,
    preview: "wide",
  },
  {
    key: "01-mark-primary",
    name: "Corner mark — primary",
    use: "Small F mark for a corner or compact brand placement.",
    path: "assets/02-corner-marks/01-mark-primary.png",
    folder: "02-corner-marks",
    width: 1254,
    height: 1254,
    bytes: 189765,
    preview: "square",
  },
  {
    key: "02-mark-white",
    name: "Corner mark — white",
    use: "White F mark for a quiet corner watermark.",
    path: "assets/02-corner-marks/02-mark-white.png",
    folder: "02-corner-marks",
    width: 1254,
    height: 1254,
    bytes: 172849,
    preview: "square",
  },
  {
    key: "03-mark-cyan-glow",
    name: "Corner mark — cyan glow",
    use: "Cyan-lit F mark for an accent corner.",
    path: "assets/02-corner-marks/03-mark-cyan-glow.png",
    folder: "02-corner-marks",
    width: 1254,
    height: 1254,
    bytes: 392388,
    preview: "square",
  },
  {
    key: "01-nameplate-white",
    name: "Nameplate — minimal white",
    use: "Minimal lower third. Add your name as a separate text layer above the empty line.",
    path: "assets/03-nameplates/01-nameplate-white.png",
    folder: "03-nameplates",
    width: 2172,
    height: 724,
    bytes: 136575,
    preview: "wide",
  },
  {
    key: "02-nameplate-forge-glow",
    name: "Nameplate — forge glow",
    use: "Glowing nameplate. Add your name over the blank dark panel.",
    path: "assets/03-nameplates/02-nameplate-forge-glow.png",
    folder: "03-nameplates",
    width: 2172,
    height: 724,
    bytes: 473722,
    preview: "wide",
  },
  {
    key: "01-camera-landscape",
    name: "Camera frame — horizontal",
    use: "Wide camera frame with an open transparent center. Fit the camera under the opening.",
    path: "assets/04-camera-frames/01-camera-landscape.png",
    folder: "04-camera-frames",
    width: 1672,
    height: 941,
    bytes: 345482,
    preview: "wide",
  },
  {
    key: "02-camera-portrait",
    name: "Camera frame — vertical",
    use: "Tall camera frame with an open transparent center. Fit the camera under the opening.",
    path: "assets/04-camera-frames/02-camera-portrait.png",
    folder: "04-camera-frames",
    width: 941,
    height: 1672,
    bytes: 245780,
    preview: "portrait",
  },
];

export const STREAMING_KIT_PACKS: StreamingKitPack[] = [
  {
    key: "all-images",
    name: "All images",
    description: "Every PNG in one ZIP.",
    path: "downloads/TriForge_All_Images.zip",
    bytes: 4607584,
    kind: "zip",
  },
  {
    key: "logos",
    name: "Logos",
    description: "Five wordmark treatments.",
    path: "downloads/TriForge_Logos.zip",
    bytes: 2788983,
    kind: "zip",
  },
  {
    key: "corner-marks",
    name: "Corner marks",
    description: "Three F-mark watermarks.",
    path: "downloads/TriForge_Corner_Marks.zip",
    bytes: 693711,
    kind: "zip",
  },
  {
    key: "nameplates",
    name: "Nameplates",
    description: "Two lower-third plates.",
    path: "downloads/TriForge_Nameplates.zip",
    bytes: 572878,
    kind: "zip",
  },
  {
    key: "camera-frames",
    name: "Camera frames",
    description: "Horizontal and vertical frames.",
    path: "downloads/TriForge_Camera_Frames.zip",
    bytes: 552078,
    kind: "zip",
  },
  {
    key: "guide",
    name: "Branding kit guide",
    description: "Visual creator guide (PDF).",
    path: "TriForge_Streaming_Kit_Guide.pdf",
    bytes: 6117057,
    kind: "pdf",
  },
  {
    key: "brand-guide",
    name: "Brand guidelines",
    description: "Original identity reference (PDF).",
    path: "TriForge_Original_Brand_Guidelines.pdf",
    bytes: 1038260,
    kind: "pdf",
  },
];

export const STREAMING_KIT_GROUPS: StreamingKitGroup[] = [
  {
    id: "logos",
    title: "Logos",
    blurb: "Full wordmark. Keep aspect ratio. Minimum width 120px.",
    packPath: "downloads/TriForge_Logos.zip",
    assets: STREAMING_KIT_ASSETS.filter((a) => a.folder === "01-logos"),
  },
  {
    id: "marks",
    title: "Corner marks",
    blurb: "Compact F for a corner watermark. Minimum width 32px.",
    packPath: "downloads/TriForge_Corner_Marks.zip",
    assets: STREAMING_KIT_ASSETS.filter((a) => a.folder === "02-corner-marks"),
  },
  {
    id: "nameplates",
    title: "Nameplates",
    blurb: "Blank lower thirds. Type your name in Outfit SemiBold as a separate text layer.",
    packPath: "downloads/TriForge_Nameplates.zip",
    assets: STREAMING_KIT_ASSETS.filter((a) => a.folder === "03-nameplates"),
  },
  {
    id: "frames",
    title: "Camera frames",
    blurb: "Transparent openings. Place the PNG above the camera; crop the camera to the hole.",
    packPath: "downloads/TriForge_Camera_Frames.zip",
    assets: STREAMING_KIT_ASSETS.filter((a) => a.folder === "04-camera-frames"),
  },
];

export const STREAMING_KIT_ALLOWED_PATHS = new Set<string>([
  ...STREAMING_KIT_ASSETS.map((a) => a.path),
  ...STREAMING_KIT_PACKS.map((p) => p.path),
]);

export const STREAMING_KIT_STEPS = [
  {
    n: "01",
    title: "Download the PNGs",
    body: "Grab individual files or a ZIP pack below. Keep them in a permanent folder — OBS and LIVE Studio read the file path, so don’t leave them in Downloads.",
  },
  {
    n: "02",
    title: "Add an image source",
    body: "In OBS, add an Image source and pick a PNG. Put it above your camera or gameplay. PNG alpha is supported — no chroma key.",
  },
  {
    n: "03",
    title: "Fit the camera, not the PNG",
    body: "Frames have a transparent opening. Scale or crop the camera underneath. Keep the overlay’s aspect ratio — never stretch, skew, or rotate the mark.",
  },
  {
    n: "04",
    title: "Type your name separately",
    body: "Nameplates are blank on purpose. Add a text layer in Outfit SemiBold. No placeholder name is baked into the PNG.",
  },
  {
    n: "05",
    title: "Preview, then lock",
    body: "Check a private preview on both dark and bright content. On busy footage, sit the full-color logo on a dark scrim. Lock or group layers once it looks right.",
  },
] as const;

export function streamingKitHref(relPath: string, download = false) {
  const encoded = relPath.split("/").map(encodeURIComponent).join("/");
  return `/api/streaming-kit/${encoded}${download ? "?download=1" : ""}`;
}

export function formatKitBytes(bytes: number) {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${Math.round(bytes / 1_000)} KB`;
  return `${bytes} B`;
}
