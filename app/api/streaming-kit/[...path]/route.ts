import { readFile, stat } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getApiUserWithProfile, apiAuthErrorResponse } from "@/lib/apiAuth";
import { hubHas } from "@/lib/hub/modules";
import { STREAMING_KIT_ALLOWED_PATHS, STREAMING_KIT_SKU } from "@/lib/streamingKit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const KIT_ROOT = path.join(process.cwd(), "content", "streaming-kit");

const MIME: Record<string, string> = {
  ".png": "image/png",
  ".pdf": "application/pdf",
  ".zip": "application/zip",
};

function relPathFromParams(segments: string[]) {
  return segments.map((part) => decodeURIComponent(part)).join("/");
}

function isInsideRoot(root: string, candidate: string) {
  const rel = path.relative(root, candidate);
  return rel !== "" && !rel.startsWith("..") && !path.isAbsolute(rel);
}

function contentTypeFor(filePath: string) {
  return MIME[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";
}

export async function GET(req: Request, { params }: { params: { path: string[] } }) {
  if (!hubHas(STREAMING_KIT_SKU)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const auth = await getApiUserWithProfile();
  if ("error" in auth) {
    const { status, body } = apiAuthErrorResponse(auth.error);
    return NextResponse.json(body, { status });
  }

  const rel = relPathFromParams(params.path ?? []);
  if (!STREAMING_KIT_ALLOWED_PATHS.has(rel)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const abs = path.resolve(KIT_ROOT, ...rel.split("/"));
  if (!isInsideRoot(KIT_ROOT, abs)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let fileStat;
  try {
    fileStat = await stat(abs);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!fileStat.isFile()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = new URL(req.url);
  const ext = path.extname(abs).toLowerCase();
  const forceDownload = url.searchParams.get("download") === "1" || ext === ".zip";
  const filename = path.basename(abs);
  const buf = await readFile(abs);

  return new NextResponse(buf, {
    headers: {
      "Content-Type": contentTypeFor(abs),
      "Content-Length": String(fileStat.size),
      "Content-Disposition": `${forceDownload ? "attachment" : "inline"}; filename="${filename}"`,
      "Cache-Control": "private, max-age=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
