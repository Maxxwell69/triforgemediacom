// Shared between client components and the server-side upload route.
// Keep free of server-only imports (e.g. the S3 SDK) so it's safe in client bundles.

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const ALLOWED_IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/** Screen recordings / webinar replays uploaded via presigned R2 PUT. */
export const MAX_VIDEO_UPLOAD_BYTES = 2 * 1024 * 1024 * 1024; // 2GB

export const ALLOWED_VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
] as const;

export const ALLOWED_VIDEO_EXTENSIONS: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

/** Paid digital shop files (private R2 keys, signed download). */
export const MAX_SHOP_FILE_BYTES = 25 * 1024 * 1024; // 25MB

export const ALLOWED_SHOP_FILE_MIME_TYPES = [
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "application/epub+zip",
  "text/plain",
  "audio/mpeg",
  "audio/wav",
  "video/mp4",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const ALLOWED_SHOP_FILE_EXTENSIONS: Record<string, string> = {
  "application/pdf": "pdf",
  "application/zip": "zip",
  "application/x-zip-compressed": "zip",
  "application/epub+zip": "epub",
  "text/plain": "txt",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "video/mp4": "mp4",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
