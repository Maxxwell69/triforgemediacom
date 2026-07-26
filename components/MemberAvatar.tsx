// eslint-disable-next-line @next/next/no-img-element -- external TikTok CDN avatars aren't in next.config's image domains
export default function MemberAvatar({
  avatarUrl,
  initial,
  size = 44,
  textSize = "text-lg",
}: {
  avatarUrl: string | null;
  initial: string;
  size?: number;
  textSize?: string;
}) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt=""
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange to-cyan font-display ${textSize} text-charcoal`}
      style={{ width: size, height: size }}
    >
      {initial}
    </div>
  );
}
