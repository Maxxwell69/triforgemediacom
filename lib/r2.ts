import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

function getR2Client() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "Image uploads aren't configured yet. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY."
    );
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * Uploads an image buffer to the R2 bucket under the given folder prefix
 * and returns its public URL. Throws on invalid type/size or missing config.
 */
export async function uploadImage(
  folder: string,
  file: { buffer: Buffer; type: string; size: number }
): Promise<string> {
  const extension = ALLOWED_IMAGE_TYPES[file.type];
  if (!extension) {
    throw new Error("Unsupported file type. Use JPG, PNG, WEBP, or GIF.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("File is too large. Max size is 5MB.");
  }

  const bucketName = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (!bucketName || !publicUrl) {
    throw new Error(
      "Image uploads aren't configured yet. Set R2_BUCKET_NAME and R2_PUBLIC_URL."
    );
  }

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

  return `${publicUrl.replace(/\/$/, "")}/${key}`;
}
