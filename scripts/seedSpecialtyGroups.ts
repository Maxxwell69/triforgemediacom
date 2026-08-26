/**
 * Creates the six remaining specialization spaces (Gaming already exists)
 * with one #main channel each. Images stay empty so the default letter
 * avatar shows until you upload one in Admin → Groups.
 *
 *   npm run db:seed-specialty-groups
 *   npx tsx scripts/seedSpecialtyGroups.ts --staging
 *   ALLOW_PROD_DB_OPS=yes npx tsx scripts/seedSpecialtyGroups.ts --production
 */
import "dotenv/config";

function extractHost(url: string): string | null {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

const SPECIALTY_GROUPS = [
  {
    name: "Engagement Host",
    description: "Chat energy, polls, shoutouts, and holding the live room. All welcome.",
  },
  {
    name: "Shop Owner",
    description: "Product live selling, catalogs, and shop-driven streams. All welcome.",
  },
  {
    name: "Musician",
    description: "Performances, original music, and live-set hosting. All welcome.",
  },
  {
    name: "Artist",
    description: "Making on stream — visual art, crafts, and process content. All welcome.",
  },
  {
    name: "Educator",
    description: "Teaching, tutorials, and expertise-led live sessions. All welcome.",
  },
  {
    name: "Community Builder",
    description: "Discord, fan clubs, events, and bringing people together. All welcome.",
  },
] as const;

const CHANNEL_NAME = "main";
const CHANNEL_DESCRIPTION = "all general chat";
const DEFAULT_COLOR = "#FD4802";

async function main() {
  const production = process.argv.includes("--production");

  if (process.argv.includes("--staging") && process.env.STAGING_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.STAGING_DATABASE_URL;
  }

  if (production) {
    const prodUrl = process.env.PRODUCTION_DATABASE_URL;
    if (!prodUrl) {
      throw new Error("PRODUCTION_DATABASE_URL is not set.");
    }
    if (process.env.ALLOW_PROD_DB_OPS !== "yes") {
      throw new Error("Refusing production seed without ALLOW_PROD_DB_OPS=yes.");
    }
    const prodHost = process.env.PROD_DB_HOST?.trim();
    const urlHost = extractHost(prodUrl);
    if (prodHost && urlHost && !urlHost.includes(prodHost)) {
      throw new Error(
        `PRODUCTION_DATABASE_URL host (${urlHost}) does not match PROD_DB_HOST (${prodHost}).`
      );
    }
    process.env.DATABASE_URL = prodUrl;
  }

  await import("./guardDb");
  const { prisma } = await import("../lib/prisma");

  for (const spec of SPECIALTY_GROUPS) {
    let group = await prisma.group.findUnique({
      where: { name: spec.name },
      include: { channels: { select: { id: true, name: true } } },
    });

    if (!group) {
      group = await prisma.group.create({
        data: {
          name: spec.name,
          description: spec.description,
          color: DEFAULT_COLOR,
          imageUrl: null,
          grantsTikTaskAccess: true,
          showInList: true,
          canCreateEvents: false,
          joinMode: "APPLY",
        },
        include: { channels: { select: { id: true, name: true } } },
      });
      console.log(`Created group: ${spec.name}`);
    } else {
      console.log(`Group already exists: ${spec.name}`);
    }

    const hasMain = group.channels.some((ch) => ch.name === CHANNEL_NAME);
    if (hasMain) {
      console.log(`  channel #${CHANNEL_NAME} already attached`);
      continue;
    }

    await prisma.channel.create({
      data: {
        name: CHANNEL_NAME,
        description: CHANNEL_DESCRIPTION,
        minRole: "MEMBER",
        groups: { connect: { id: group.id } },
      },
    });
    console.log(`  created #${CHANNEL_NAME}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
