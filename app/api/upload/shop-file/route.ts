import { NextRequest, NextResponse } from "next/server";
import { getFreshSessionUser } from "@/lib/session";
import { isAdminRole } from "@/lib/rbac";
import { hubHas } from "@/lib/hub/modules";
import { uploadPrivateShopFile } from "@/lib/r2";
import { ALLOWED_SHOP_FILE_MIME_TYPES, MAX_SHOP_FILE_BYTES } from "@/lib/uploadConstraints";
import { addProductFile } from "@/app/admin/shop/actions";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const user = await getFreshSessionUser();
  if (!user || !isAdminRole(user.role) || !hubHas("shop")) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const productId = formData.get("productId");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (typeof productId !== "string" || !productId) {
    return NextResponse.json({ error: "Missing product" }, { status: 400 });
  }
  if (!ALLOWED_SHOP_FILE_MIME_TYPES.includes(file.type as (typeof ALLOWED_SHOP_FILE_MIME_TYPES)[number])) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }
  if (file.size > MAX_SHOP_FILE_BYTES) {
    return NextResponse.json({ error: "File is too large. Max size is 25MB." }, { status: 400 });
  }

  try {
    const uploaded = await uploadPrivateShopFile({
      buffer: Buffer.from(await file.arrayBuffer()),
      type: file.type,
      size: file.size,
      fileName: file.name,
    });
    await addProductFile(productId, {
      r2Key: uploaded.key,
      fileName: uploaded.fileName,
      contentType: uploaded.contentType,
      sizeBytes: uploaded.sizeBytes,
    });
    return NextResponse.json({ ok: true, fileName: uploaded.fileName });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
