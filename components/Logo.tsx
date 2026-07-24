import Image from "next/image";
import Link from "next/link";

// Source asset is 1024x409 (wordmark on a near-black backdrop that blends
// into the charcoal theme). Keep callers passing a height and let this
// component derive width from the fixed aspect ratio.
const ASPECT_RATIO = 1024 / 409;

export default function Logo({
  height = 40,
  href = "/",
  priority = false,
  className = "",
}: {
  height?: number;
  href?: string | null;
  priority?: boolean;
  className?: string;
}) {
  const width = Math.round(height * ASPECT_RATIO);

  const img = (
    <Image
      src="/brand/triforge-logo-transparent.png"
      alt="TriForge Media"
      width={width}
      height={height}
      priority={priority}
      className={className}
    />
  );

  if (!href) return img;

  return (
    <Link href={href} aria-label="TriForge Community home" className="inline-flex">
      {img}
    </Link>
  );
}
