import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import {
  ALLOWED_IMAGE_EXTENSIONS,
  ALLOWED_VIDEO_EXTENSIONS,
  MAX_UPLOAD_BYTES,
  MAX_VIDEO_UPLOAD_BYTES,
} from "@/lib/uploadConstraints";

export { MAX_UPLOAD_BYTES, MAX_VIDEO_UPLOAD_BYTES };

export function isR2Configured(): boolean {
  return !!(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME &&
    process.env.R2_PUBLIC_URL
  );
}

/** True when the URL is already hosted on our public R2 CDN. */
export function isR2PublicUrl(url: string): boolean {
  const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");
  return !!publicUrl && url.startsWith(`${publicUrl}/`);
}

function getR2Client() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "Uploads aren't configured yet. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY."
    );
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

function getBucketConfig() {
  const bucketName = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (!bucketName || !publicUrl) {
    throw new Error("Uploads aren't configured yet. Set R2_BUCKET_NAME and R2_PUBLIC_URL.");
  }
  return { bucketName, publicUrl: publicUrl.replace(/\/$/, "") };
}

function sniffImageMime(buffer: Buffer, headerType: string | null): string | null {
  const normalized = headerType?.split(";")[0]?.trim().toLowerCase() ?? null;
  if (normalized && ALLOWED_IMAGE_EXTENSIONS[normalized]) return normalized;
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  if (buffer.length >= 6 && buffer.toString("ascii", 0, 3) === "GIF") {
    return "image/gif";
  }
  return null;
}

/**
 * Uploads an image buffer to the R2 bucket under the given folder prefix
 * and returns its public URL. Throws on invalid type/size or missing config.
 * Pass `fileStem` to overwrite a stable key (e.g. member-avatars/{userId}.jpg).
 */
export async function uploadImage(
  folder: string,
  file: { buffer: Buffer; type: string; size: number },
  opts?: { fileStem?: string }
): Promise<string> {
  const extension = ALLOWED_IMAGE_EXTENSIONS[file.type];
  if (!extension) {
    throw new Error("Unsupported file type. Use JPG, PNG, WEBP, or GIF.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("File is too large. Max size is 5MB.");
  }

  const { bucketName, publicUrl } = getBucketConfig();
  const client = getR2Client();
  const stem = opts?.fileStem?.replace(/[^a-zA-Z0-9_-]/g, "") || randomUUID();
  if (!stem) {
    throw new Error("Invalid upload file name.");
  }
  const key = `${folder}/${stem}.${extension}`;

  await client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.type,
    })
  );

  return `${publicUrl}/${key}`;
}

/**
 * Download a remote image and store it on R2. Returns the public R2 URL,
 * or null if R2 isn't configured / the download fails.
 */
export async function mirrorRemoteImage(
  folder: string,
  sourceUrl: string,
  opts?: { fileStem?: string }
): Promise<string | null> {
  if (!isR2Configured()) return null;
  if (isR2PublicUrl(sourceUrl)) return sourceUrl;

  try {
    const res = await fetch(sourceUrl, {
      cache: "no-store",
      redirect: "follow",
      headers: {
        // Avoid hub Referer — TikTok CDN often rejects hotlinked avatar URLs.
        "User-Agent":
          "Mozilla/5.0 (compatible; TriForgeHub/1.0; +https://hub.triforgemedia.com)",
      },
    });
    if (!res.ok) {
      console.error(`mirrorRemoteImage failed (${res.status}):`, sourceUrl.slice(0, 120));
      return null;
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    const mime = sniffImageMime(buffer, res.headers.get("content-type"));
    if (!mime) {
      console.error("mirrorRemoteImage: unsupported image type from", sourceUrl.slice(0, 120));
      return null;
    }
    if (buffer.length === 0 || buffer.length > MAX_UPLOAD_BYTES) {
      console.error("mirrorRemoteImage: invalid size", buffer.length);
      return null;
    }

    return await uploadImage(
      folder,
      { buffer, type: mime, size: buffer.length },
      { fileStem: opts?.fileStem }
    );
  } catch (err) {
    console.error("mirrorRemoteImage error:", err);
    return null;
  }
}

/**
 * Presigned PUT for large webinar recordings (browser uploads directly to R2).
 * Bucket CORS must allow PUT from the hub origin.
 */
export async function createPresignedVideoUpload(opts: {
  webinarId: string;
  contentType: string;
  fileSize: number;
}) {
  const extension = ALLOWED_VIDEO_EXTENSIONS[opts.contentType];
  if (!extension) {
    throw new Error("Unsupported video type. Use MP4, WebM, or MOV.");
  }
  if (opts.fileSize <= 0 || opts.fileSize > MAX_VIDEO_UPLOAD_BYTES) {
    throw new Error("File is too large. Max size is 2GB.");
  }

  const { bucketName, publicUrl } = getBucketConfig();
  const client = getR2Client();
  const key = `webinar-recordings/${opts.webinarId}/${randomUUID()}.${extension}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: opts.contentType,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 60 * 60 });

  return {
    uploadUrl,
    publicUrl: `${publicUrl}/${key}`,
    key,
  };
}
