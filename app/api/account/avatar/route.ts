import { NextRequest, NextResponse } from "next/server";
import { getApiUserWithProfile, apiAuthErrorResponse } from "@/lib/apiAuth";
import { uploadImage } from "@/lib/r2";
import { ALLOWED_IMAGE_MIME_TYPES } from "@/lib/uploadConstraints";
import { profileAvatarUrlSchema } from "@/lib/validations/account";
import { setUserProfileImage } from "@/lib/profileAvatar";

export const dynamic = "force-dynamic";

/** Upload a file as this member’s hub profile photo. */
export async function POST(req: NextRequest) {
  const auth = await getApiUserWithProfile();
  if ("error" in auth) {
    const { status, body } = apiAuthErrorResponse(auth.error);
    return NextResponse.json(body, { status });
  }
  if (auth.user.status !== "ACTIVE") {
    return NextResponse.json({ error: "Your account isn’t active yet." }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (
    !ALLOWED_IMAGE_MIME_TYPES.includes(
      file.type as (typeof ALLOWED_IMAGE_MIME_TYPES)[number]
    )
  ) {
    return NextResponse.json(
      { error: "Unsupported file type. Use JPG, PNG, WEBP, or GIF." },
      { status: 400 }
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadImage(
      "profile-avatars",
      { buffer, type: file.type, size: file.size },
      { fileStem: `${auth.user.id}-${Date.now()}` }
    );
    await setUserProfileImage(auth.user.id, url);
    return NextResponse.json({ imageUrl: url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

/** Paste an image URL, or send an empty string to remove the custom photo. */
export async function PATCH(req: NextRequest) {
  const auth = await getApiUserWithProfile();
  if ("error" in auth) {
    const { status, body } = apiAuthErrorResponse(auth.error);
    return NextResponse.json(body, { status });
  }
  if (auth.user.status !== "ACTIVE") {
    return NextResponse.json({ error: "Your account isn’t active yet." }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = profileAvatarUrlSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input" },
      { status: 400 }
    );
  }

  const imageUrl = parsed.data.imageUrl || null;
  await setUserProfileImage(auth.user.id, imageUrl);
  return NextResponse.json({ imageUrl });
}
