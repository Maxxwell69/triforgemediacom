import { prisma } from "@/lib/prisma";

export type HubAnnouncement = {
  message: string;
  isActive: boolean;
  imageUrl?: string | null;
  videoUrl?: string | null;
};

/**
 * Dashboard banner. Newer Prisma clients select imageUrl/videoUrl, but those
 * columns may not exist until the announcement-media migration applies —
 * never let a missing column take down /home.
 */
export async function loadHubAnnouncement(): Promise<HubAnnouncement | null> {
  try {
    return await prisma.announcement.findUnique({
      where: { id: "global" },
      select: { message: true, isActive: true, imageUrl: true, videoUrl: true },
    });
  } catch (err) {
    console.error("announcement media columns unavailable:", err);
    try {
      return await prisma.announcement.findUnique({
        where: { id: "global" },
        select: { message: true, isActive: true },
      });
    } catch (err2) {
      console.error("announcement load failed:", err2);
      return null;
    }
  }
}
