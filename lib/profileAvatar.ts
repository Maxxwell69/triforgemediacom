import "server-only";

import { revalidatePath } from "next/cache";
import { getControlPrisma } from "@/lib/hub/tenantPrisma";
import { getRequestHubContext } from "@/lib/hub/requestPrisma";

/** Persist a hub profile photo on control identity and this hub’s member row. */
export async function setUserProfileImage(userId: string, image: string | null) {
  const control = getControlPrisma();
  const identity = await control.user.update({
    where: { id: userId },
    data: { image },
    select: { email: true, id: true },
  });

  const ctx = await getRequestHubContext();
  if (ctx.kind === "client" && ctx.prisma) {
    await ctx.prisma.user.updateMany({
      where: { OR: [{ id: userId }, { email: identity.email }] },
      data: { image },
    });
  }

  revalidatePath("/account");
  revalidatePath("/account/profile");
  revalidatePath("/members");
  revalidatePath(`/members/${userId}`);
  revalidatePath("/home");
}
