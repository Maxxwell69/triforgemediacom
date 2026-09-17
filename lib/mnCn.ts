import { prisma } from "@/lib/prisma";
import {
  CN_EFFECT_COLOR,
  CN_GROUP_NAME,
  CN_TAG_NAME,
  MN_GROUP_NAME,
  MN_TAG_NAME,
  networkBadgeColor,
  tagsNotShownAsGroups,
  type NetworkTrack,
} from "@/lib/mnCnDisplay";

export {
  CN_EFFECT_COLOR,
  CN_GROUP_NAME,
  CN_TAG_NAME,
  MN_GROUP_NAME,
  MN_TAG_NAME,
  networkBadgeColor,
  tagsNotShownAsGroups,
};
export type { NetworkTrack };

/**
 * Media Network (MN) = creators who already have an agency representing them
 * for live hosting (or outside US/Canada). Creator Network (CN) = TriForge's
 * Forge Creator Network pathway (US/CA, no agency).
 *
 * Both tracks get a matching Group + Tag so admin filters (members directory,
 * email broadcasts, etc.) can target them the same way.
 */

async function ensureGroupAndTag(
  name: string,
  opts: { groupDescription: string; tagDescription: string; color: string }
) {
  const [group, tag] = await Promise.all([
    prisma.group.upsert({
      where: { name },
      update: {},
      create: {
        name,
        description: opts.groupDescription,
        color: opts.color,
        grantsTikTaskAccess: true,
        // MN/CN are network categories — not spaces in the group rail / directory.
        showInList: false,
      },
    }),
    prisma.tag.upsert({
      where: { name },
      update: {},
      create: {
        name,
        description: opts.tagDescription,
        color: opts.color,
        selfAssignable: false,
      },
    }),
  ]);
  return { groupId: group.id, tagId: tag.id };
}

async function ensureMnGroupAndTag() {
  return ensureGroupAndTag(MN_GROUP_NAME, {
    groupDescription: "Creators represented by an outside agency for live hosting.",
    tagDescription: "Represented by an outside agency for live hosting.",
    color: "#00D4FF",
  });
}

async function ensureCnGroupAndTag() {
  return ensureGroupAndTag(CN_GROUP_NAME, {
    groupDescription: "Official TriForge Creator Network members.",
    tagDescription: "Forge Creator Network (CN) track members.",
    color: "#FD4802",
  });
}

async function setMembership(userId: string, groupId: string, tagId: string, on: boolean) {
  if (on) {
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
    await Promise.all([
      prisma.groupMember.deleteMany({ where: { userId, groupId } }),
      prisma.userTag.deleteMany({ where: { userId, tagId } }),
    ]);
  }
}

/** Keep application.answers.track in sync with the assigned CN/MN membership. */
async function persistApplicationTrack(userId: string, track: NetworkTrack) {
  const app = await prisma.application.findUnique({
    where: { userId },
    select: { id: true, answers: true },
  });
  if (!app) return;
  const prev =
    app.answers && typeof app.answers === "object" && !Array.isArray(app.answers)
      ? (app.answers as Record<string, unknown>)
      : {};
  if (prev.track === track) return;
  await prisma.application.update({
    where: { id: app.id },
    data: { answers: { ...prev, track } },
  });
}

/**
 * Puts the user on exactly one network track (CN or MN): assigns that
 * group+tag and clears the other so filters stay accurate. Also writes
 * application.answers.track so later page loads do not restore the apply-form
 * pathway.
 */
export async function syncNetworkMembership(userId: string, track: NetworkTrack) {
  const [mn, cn] = await Promise.all([ensureMnGroupAndTag(), ensureCnGroupAndTag()]);
  await Promise.all([
    setMembership(userId, mn.groupId, mn.tagId, track === "MN"),
    setMembership(userId, cn.groupId, cn.tagId, track === "CN"),
    persistApplicationTrack(userId, track),
  ]);
}

/**
 * @deprecated Prefer syncNetworkMembership(userId, track). Kept for call sites
 * that only know the agency boolean.
 */
export async function syncMnMembership(userId: string, inMediaNetwork: boolean) {
  await syncNetworkMembership(userId, inMediaNetwork ? "MN" : "CN");
}

function trackFromAnswers(answers: unknown): NetworkTrack | null {
  if (!answers || typeof answers !== "object") return null;
  const a = answers as Record<string, unknown>;
  if (a.track === "CN" || a.track === "MN") return a.track;

  // Older rows may only have hasAgency / country (pre-track field).
  const hasAgency = a.hasAgency === "yes" || a.hasAgency === true;
  const noAgency = a.hasAgency === "no" || a.hasAgency === false;
  if (hasAgency) return "MN";
  if (noAgency) {
    const country = typeof a.country === "string" ? a.country : "";
    if (country === "US" || country === "CA") return "CN";
    if (country) return "MN";
  }
  return null;
}

/**
 * Repair: assign CN/MN group+tag for users whose application track is set
 * but memberships were never written (the old apply/import path only synced
 * MN). Never overwrites an existing CN or MN assignment — admins can switch
 * tracks without a later page load putting the apply-form track back.
 */
export async function backfillNetworkMemberships(): Promise<{ updated: number }> {
  const [apps, cnTag, mnTag] = await Promise.all([
    prisma.application.findMany({
      select: {
        userId: true,
        answers: true,
        user: {
          select: {
            tags: { select: { tag: { select: { name: true } } } },
            groupMemberships: { select: { group: { select: { name: true } } } },
          },
        },
      },
    }),
    ensureCnGroupAndTag(),
    ensureMnGroupAndTag(),
  ]);
  void cnTag;
  void mnTag;

  let updated = 0;
  for (const app of apps) {
    const track = trackFromAnswers(app.answers);
    if (!track) continue;
    const names = new Set(
      [
        ...app.user.tags.map((t) => t.tag.name.toUpperCase()),
        ...app.user.groupMemberships.map((m) => m.group.name.toUpperCase()),
      ].filter(Boolean)
    );
    if (names.has(CN_TAG_NAME.toUpperCase()) || names.has(MN_TAG_NAME.toUpperCase())) continue;
    await syncNetworkMembership(app.userId, track);
    updated++;
  }
  return { updated };
}

/**
 * Resolve the user's CN/MN track from tag or group membership.
 * Returns null when neither track is assigned.
 */
export async function getUserNetworkTrack(
  userId: string
): Promise<NetworkTrack | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      tags: { select: { tag: { select: { name: true } } } },
      groupMemberships: { select: { group: { select: { name: true } } } },
    },
  });
  if (!user) return null;

  const names = new Set(
    [
      ...user.tags.map((t) => t.tag.name.toUpperCase()),
      ...user.groupMemberships.map((g) => g.group.name.toUpperCase()),
    ].filter(Boolean)
  );

  const hasCn = names.has(CN_TAG_NAME.toUpperCase());
  const hasMn = names.has(MN_TAG_NAME.toUpperCase());
  if (hasCn && !hasMn) return "CN";
  if (hasMn && !hasCn) return "MN";
  // Prefer tag if somehow both are present (shouldn't happen after sync).
  if (hasCn) return "CN";
  if (hasMn) return "MN";
  return null;
}

/**
 * Resolve emails for a network track — matches CN/MN tag, group, or
 * application.answers.track so broadcasts reach people even if one of the
 * three signals is missing.
 */
export async function resolveNetworkTrackEmails(
  track: NetworkTrack
): Promise<{ emails: string[]; label: string }> {
  await ensureMnGroupAndTag();
  await ensureCnGroupAndTag();

  const name = track === "CN" ? CN_TAG_NAME : MN_TAG_NAME;

  const users = await prisma.user.findMany({
    where: {
      status: { in: ["ACTIVE", "INVITED"] },
      OR: [
        { tags: { some: { tag: { name: { equals: name, mode: "insensitive" } } } } },
        { groupMemberships: { some: { group: { name: { equals: name, mode: "insensitive" } } } } },
        {
          application: {
            is: { answers: { path: ["track"], equals: track } },
          },
        },
      ],
    },
    select: { email: true },
  });

  const emails = Array.from(new Set(users.map((u) => u.email)));
  return {
    emails,
    label: track === "CN" ? "Creator Network (CN)" : "Media Network (MN)",
  };
}
