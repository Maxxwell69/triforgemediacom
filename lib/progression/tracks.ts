export const SPECIALIZE_PREFIX = "Specialize: ";

export const SPECIALTY_TRACKS = [
  {
    name: "Engagement Host",
    description: "Chat energy, polls, shoutouts, and holding the live room.",
    accent: "cyan",
    focuses: ["Chat energy", "Polls", "Shoutouts", "Holding the live room"],
  },
  {
    name: "Gamer",
    description: "Gameplay, co-streams, and competitive live presence.",
    accent: "orange",
    focuses: ["Gameplay", "Co-streams", "Competitive live presence"],
  },
  {
    name: "Shop Owner",
    description: "Product live selling, catalog, and shop-driven streams.",
    accent: "cyan",
    focuses: ["Product live selling", "Catalog", "Shop-driven streams"],
  },
  {
    name: "Musician",
    description: "Performances, original music, and live-set hosting.",
    accent: "orange",
    focuses: ["Performances", "Original music", "Live-set hosting"],
  },
  {
    name: "Artist",
    description: "Making on stream — visual art, crafts, and process content.",
    accent: "cyan",
    focuses: ["Visual art", "Crafts", "Process content"],
  },
  {
    name: "Educator",
    description: "Teaching, tutorials, and expertise-led live sessions.",
    accent: "cyan",
    focuses: ["Teaching", "Tutorials", "Expertise-led lives"],
  },
  {
    name: "Community Builder",
    description: "Discord, fan clubs, events, and bringing people together.",
    accent: "orange",
    focuses: ["Discord", "Fan clubs", "Events", "Bringing people together"],
  },
] as const;

export const SPECIALTY_TRACK_NAMES = SPECIALTY_TRACKS.map((track) => track.name);

export const SPECIALTY_UNLOCK_LEVEL = "Rising Star";

export function isSpecialtyTrackName(name: string): boolean {
  return (SPECIALTY_TRACK_NAMES as readonly string[]).includes(name);
}

export function isSpecializeMissionName(name: string) {
  return name.startsWith(SPECIALIZE_PREFIX);
}

export function trackNameFromMission(name: string) {
  return name.startsWith(SPECIALIZE_PREFIX) ? name.slice(SPECIALIZE_PREFIX.length) : name;
}

export function specializeMissionName(track: string) {
  return `${SPECIALIZE_PREFIX}${track}`;
}

export function isSpecialtyDeepDiveTitle(title: string, track: string | null) {
  if (!title.startsWith("Skill Mastery Deep-Dive")) return false;
  if (!track) return false;
  return title === `Skill Mastery Deep-Dive — ${track}`;
}
