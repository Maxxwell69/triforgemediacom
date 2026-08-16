import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUserWithProfile, apiAuthErrorResponse } from "@/lib/apiAuth";
import { hubHas } from "@/lib/hub/modules";
import { createSignedShopDownloadUrl } from "@/lib/r2";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { grantId: string; fileId: string } }
) {
  if (!hubHas("shop")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const auth = await getApiUserWithProfile();
  if ("error" in auth) {
    const { status, body } = apiAuthErrorResponse(auth.error);
    return NextResponse.json(body, { status });
  }

  const grant = await prisma.shopDownloadGrant.findUnique({
    where: { id: params.grantId },
    include: {
      order: { select: { status: true } },
    },
  });
  if (!grant || grant.userId !== auth.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (grant.order.status !== "PAID" && grant.order.status !== "FULFILLING" && grant.order.status !== "FULFILLED") {
    return NextResponse.json({ error: "Order is not paid" }, { status: 403 });
  }

  const file = await prisma.shopProductFile.findFirst({
    where: { id: params.fileId, productId: grant.productId },
  });
  if (!file) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const url = await createSignedShopDownloadUrl(file.r2Key, file.fileName);
  return NextResponse.redirect(url);
}
