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
