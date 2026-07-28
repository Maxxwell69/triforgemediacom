import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUserWithProfile, apiAuthErrorResponse } from "@/lib/apiAuth";
import { getMemberDisplayName, getMemberAvatarUrl } from "@/lib/memberDisplay";
import { isAdminRole } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  const result = await getApiUserWithProfile();
  if ("error" in result) {
    const { status, body } = apiAuthErrorResponse(result.error);
    return NextResponse.json(body, { status });
  }

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  const includeHidden = isAdminRole(result.user.role);

  const users = await prisma.user.findMany({
    where: {
      status: "ACTIVE",
      id: { not: result.user.id },
      ...(includeHidden ? {} : { hiddenFromDirectory: false }),
      ...(q.length > 0
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              {
                tiktokConnection: {
                  displayName: { contains: q, mode: "insensitive" },
                },
              },
            ],
          }
        : {}),
    },
    take: 12,
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      profile: { select: { platform: true } },
      tiktokConnection: { select: { displayName: true, avatarUrl: true } },
    },
    orderBy: { name: "asc" },
  });

  const members = users.map((u) => ({
    id: u.id,
    name: getMemberDisplayName(u),
    image: getMemberAvatarUrl(u) || u.image,
  }));

  return NextResponse.json({ members });
}
