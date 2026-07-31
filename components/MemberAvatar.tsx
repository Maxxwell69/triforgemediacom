// eslint-disable-next-line @next/next/no-img-element -- external TikTok CDN avatars aren't in next.config's image domains
export default function MemberAvatar({
  avatarUrl,
  initial,
  size = 44,
  textSize = "text-lg",
  online = false,
}: {
  avatarUrl: string | null;
  initial: string;
  size?: number;
  textSize?: string;
  /** Green presence dot — true when the member is currently on the hub. */
  online?: boolean;
}) {
  const dot = Math.max(10, Math.round(size * 0.28));

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt=""
          width={size}
          height={size}
          className="rounded-full object-cover"
          style={{ width: size, height: size }}
        />
      ) : (
        <div
          className={`flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-orange to-cyan font-display ${textSize} text-charcoal`}
        >
          {initial}
        </div>
      )}
      {online && (
        <span
          className="absolute bottom-0 right-0 rounded-full border-2 border-charcoal bg-emerald-400"
          style={{ width: dot, height: dot }}
          title="Online"
          aria-label="Online"
        />
      )}
    </div>
  );
}
