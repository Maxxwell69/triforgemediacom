import { prisma } from "@/lib/prisma";

export const MN_GROUP_NAME = "MN";
export const MN_TAG_NAME = "MN";
export const CN_GROUP_NAME = "CN";

/**
 * Media Network (MN) = creators who already have an agency representing them
 * for live hosting. Creator Network (CN) = TriForge's own official creator
 * program, granted by an admin later (see the existing "CN" tag).
 *
 * Ensures the MN Group + Tag exist and returns their ids. Safe to call
 * repeatedly — idempotent via upsert on the unique `name`.
 */
async function ensureMnGroupAndTag() {
  const [group, tag] = await Promise.all([
    prisma.group.upsert({
      where: { name: MN_GROUP_NAME },
      update: {},
      create: {
        name: MN_GROUP_NAME,
        description: "Creators represented by an outside agency for live hosting.",
        color: "#00D4FF",
        grantsTikTaskAccess: true,
      },
    }),
    prisma.tag.upsert({
      where: { name: MN_TAG_NAME },
      update: {},
      create: {
        name: MN_TAG_NAME,
        description: "Represented by an outside agency for live hosting.",
        color: "#00D4FF",
        selfAssignable: false,
      },
    }),
  ]);
  return { groupId: group.id, tagId: tag.id };
}

/**
 * Adds or removes a user's MN Group membership + Tag based on their answer
 * to "do you have an agency representing you?" on the application form.
 * Called at application submission time (before any admin review) so the
 * queue and any automation downstream can already see the routing.
 */
export async function syncMnMembership(userId: string, hasAgency: boolean) {
  if (hasAgency) {
    const { groupId, tagId } = await ensureMnGroupAndTag();
    await Promise.all([
      prisma.groupMember.upsert({
        where: { userId_groupId: { userId, groupId } },
        update: {},
        create: { userId, groupId },
      }),
      prisma.userTag.upsert({
        where: { userId_tagId: { userId, tagId } },
        update: {},
        create: { userId, tagId },
      }),
    ]);
  } else {
    // Reapplying after previously answering "yes" — undo the MN routing.
    const group = await prisma.group.findUnique({ where: { name: MN_GROUP_NAME } });
    const tag = await prisma.tag.findUnique({ where: { name: MN_TAG_NAME } });
    await Promise.all([
      group ? prisma.groupMember.deleteMany({ where: { userId, groupId: group.id } }) : null,
      tag ? prisma.userTag.deleteMany({ where: { userId, tagId: tag.id } }) : null,
    ]);
  }
}
