/**
 * Downloads screenshots from the LIVE Studio markdown files and re-hosts them on R2.
 * Writes scripts/live-studio-source/image-map.json for the seed.
 *
 *   npx tsx scripts/importLiveStudioImages.ts
 */
import "dotenv/config";
import { createHash } from "crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { LIVE_STUDIO_IMPORTED_MODULES } from "./liveStudioModuleIndex";

const SOURCE_DIR = join(process.cwd(), "scripts", "live-studio-source");
const MAP_PATH = join(SOURCE_DIR, "image-map.json");
const IMAGE_RE = /!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g;

function slug(alt: string, url: string) {
  const base =
    alt
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "shot";
  const hash = createHash("sha1").update(url).digest("hex").slice(0, 8);
  return `${base}-${hash}`;
}

function extFrom(url: string, contentType: string | null) {
  if (contentType?.includes("gif") || url.includes(".gif")) return { ext: "gif", type: "image/gif" };
  if (contentType?.includes("jpeg") || contentType?.includes("jpg") || url.includes(".jpg")) {
    return { ext: "jpg", type: "image/jpeg" };
  }
  if (contentType?.includes("webp") || url.includes(".webp")) return { ext: "webp", type: "image/webp" };
  return { ext: "png", type: "image/png" };
}

function collectUrls() {
  const found = new Map<string, string>();
  for (const mod of LIVE_STUDIO_IMPORTED_MODULES) {
    const markdown = readFileSync(join(SOURCE_DIR, mod.file), "utf8");
    for (const match of markdown.matchAll(IMAGE_RE)) {
      if (!found.has(match[2])) found.set(match[2], match[1].trim() || "LIVE Studio screenshot");
    }
  }
  return found;
}

function r2Client() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");
  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicUrl) {
    throw new Error("R2 is not configured.");
  }
  return {
    bucketName,
    publicUrl,
    client: new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    }),
  };
}

async function download(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  return { buffer, contentType: res.headers.get("content-type") };
}

async function main() {
  mkdirSync(SOURCE_DIR, { recursive: true });
  const existing: Record<string, string> = existsSync(MAP_PATH)
    ? JSON.parse(readFileSync(MAP_PATH, "utf8"))
    : {};
  const urls = collectUrls();
  const { client, bucketName, publicUrl } = r2Client();
  let uploaded = 0;
  let reused = 0;

  const pending = [...urls.entries()].filter(([url]) => {
    if (existing[url]) {
      reused += 1;
      return false;
    }
    return true;
  });
  const concurrency = 6;
  let cursor = 0;
  async function worker() {
    while (cursor < pending.length) {
      const index = cursor;
      cursor += 1;
      const [url, alt] = pending[index];
      const { buffer, contentType } = await download(url);
      const { ext, type } = extFrom(url, contentType);
      const key = `learn/tiktok-live-studio/${slug(alt, url)}.${ext}`;
      await client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body: buffer,
          ContentType: type,
        })
      );
      existing[url] = `${publicUrl}/${key}`;
      uploaded += 1;
      if (uploaded % 10 === 0 || uploaded === pending.length) {
        console.log(`uploaded ${uploaded}/${pending.length} · ${key}`);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, pending.length) }, () => worker()));

  writeFileSync(MAP_PATH, `${JSON.stringify(existing, null, 2)}\n`);
  console.log(`Done. ${uploaded} uploaded, ${reused} reused, ${Object.keys(existing).length} mapped.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
