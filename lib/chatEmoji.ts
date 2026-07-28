/** Curated emoji set for the composer picker + quick reactions. */
export const COMPOSER_EMOJI = [
  "😀", "😂", "🥰", "😍", "😎", "🤔", "😢", "😡",
  "👍", "👎", "👏", "🙌", "🔥", "💯", "✨", "🎉",
  "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍",
  "🚀", "💪", "✅", "👀", "🙏", "🤝", "🎮", "🎵",
] as const;

export const QUICK_REACTIONS = ["👍", "❤️", "😂", "🔥", "🎉", "👀"] as const;

export function isAllowedReactionEmoji(emoji: string): boolean {
  return (COMPOSER_EMOJI as readonly string[]).includes(emoji);
}
