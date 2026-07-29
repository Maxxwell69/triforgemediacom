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

/**
 * Uploads an image buffer to the R2 bucket under the given folder prefix
 * and returns its public URL. Throws on invalid type/size or missing config.
 */
export async function uploadImage(
  folder: string,
  file: { buffer: Buffer; type: string; size: number }
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
  const key = `${folder}/${randomUUID()}.${extension}`;

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
