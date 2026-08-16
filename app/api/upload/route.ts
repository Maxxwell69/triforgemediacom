import { NextRequest, NextResponse } from "next/server";
import { getFreshSessionUser } from "@/lib/session";
import { isAdminRole } from "@/lib/rbac";
import { uploadImage } from "@/lib/r2";

// Folders an admin is allowed to upload into. Keeps uploads namespaced
// and prevents arbitrary path injection via the "folder" field.
const ALLOWED_FOLDERS = new Set([
  "course-thumbnails",
  "lesson-thumbnails",
  "reward-images",
  "host-avatars",
  "group-images",
  "chat-attachments",
  "shop-images",
]);

export async function POST(request: NextRequest) {
  const user = await getFreshSessionUser();
  if (!user || !isAdminRole(user.role)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const folder = formData.get("folder");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (typeof folder !== "string" || !ALLOWED_FOLDERS.has(folder)) {
    return NextResponse.json({ error: "Invalid upload folder" }, { status: 400 });
  }
  // Chat images are ADMIN-only (not mods).
  if (folder === "chat-attachments" && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only admins can upload chat images" }, { status: 403 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadImage(folder, {
      buffer,
      type: file.type,
      size: file.size,
    });
    return NextResponse.json({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
