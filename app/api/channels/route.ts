import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUserWithProfile, apiAuthErrorResponse } from "@/lib/apiAuth";
import { meetsMinRole } from "@/lib/rbac";

export async function GET() {
  const result = await getApiUserWithProfile();
  if ("error" in result) {
    const { status, body } = apiAuthErrorResponse(result.error);
    return NextResponse.json(body, { status });
  }

  const channels = await prisma.channel.findMany({ orderBy: { createdAt: "asc" } });
  const visible = channels.filter((c) => meetsMinRole(result.user.role, c.minRole));

  return NextResponse.json({ channels: visible });
}
