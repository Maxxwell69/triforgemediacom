"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/rbac";
import { getVideoEmbedUrl } from "@/lib/videoEmbed";

async function requireAdmin() {
  const session = await auth();
  if (!session || !isAdminRole(session.user.role)) {
    throw new Error("Not authorized");
  }
  // Re-validate against the database instead of trusting the JWT claim alone —
  // closes the window where a banned/demoted admin's existing session would
  // otherwise stay valid until it naturally expires.
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, status: true },
  });
  if (!dbUser || dbUser.status !== "ACTIVE" || !isAdminRole(dbUser.role)) {
    throw new Error("Not authorized");
  }
  return { ...session, user: { ...session.user, role: dbUser.role, status: dbUser.status } };
}

export async function setAnnouncement(formData: FormData) {
  const session = await requireAdmin();
  const message = String(formData.get("message") || "").trim();
  const rawVideo = String(formData.get("videoUrl") || "").trim();
  const videoUrl = rawVideo && !/^https?:\/\//i.test(rawVideo) ? `https://${rawVideo}` : rawVideo;

  if (!message) throw new Error("Announcement message can't be empty");
  if (videoUrl && !getVideoEmbedUrl(videoUrl)) {
    throw new Error("Paste a YouTube or Vimeo link, or leave the video field blank.");
  }

  await prisma.announcement.upsert({
    where: { id: "global" },
    update: {
      message,
      videoUrl: videoUrl || null,
      isActive: true,
      updatedByName: session.user.name || session.user.email,
    },
    create: {
      id: "global",
      message,
      videoUrl: videoUrl || null,
      isActive: true,
      updatedByName: session.user.name || session.user.email,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/home");
}

export async function clearAnnouncement() {
  await requireAdmin();

  await prisma.announcement.updateMany({
    where: { id: "global" },
    data: { isActive: false },
  });

  revalidatePath("/admin");
  revalidatePath("/home");
}
