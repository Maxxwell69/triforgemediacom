"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useHubBrand } from "@/components/hub/HubBrandProvider";

// Source asset is 1024x409 (wordmark on a near-black backdrop that blends
// into the charcoal theme). Keep callers passing a height and let this
// component derive width from the fixed aspect ratio.
const ASPECT_RATIO = 1024 / 409;

export default function Logo({
  height = 40,
  href = "/",
  priority = false,
  className = "",
  variant = "mark",
}: {
  height?: number;
  href?: string | null;
  priority?: boolean;
  className?: string;
  /** chrome = menu/header name only. mark = uploaded logo when the hub has one. */
  variant?: "chrome" | "mark";
}) {
  const brand = useHubBrand();
  const [broken, setBroken] = useState(false);
  const width = Math.round(height * ASPECT_RATIO);
  const custom = variant === "mark" && brand.logoUrl && !broken ? brand.logoUrl : null;
  const clientName = brand.hubName;

  const nameMark = clientName ? (
    <span
      className={`inline-flex items-center font-display tracking-wide text-off-white ${className}`}
      style={{ fontSize: Math.max(16, Math.round(height * 0.7)), lineHeight: 1 }}
    >
      {clientName}
    </span>
  ) : null;

  const img = custom ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={custom}
      alt={clientName || "Hub"}
      height={height}
      onError={() => setBroken(true)}
      className={`object-contain ${className}`}
      style={{ height, width: "auto", maxWidth: Math.round(height * 4) }}
    />
  ) : nameMark ? (
    nameMark
  ) : (
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
    <Link
      href={href}
      aria-label={brand.hubName ? `${brand.hubName} home` : "TriForge Community home"}
      className="inline-flex"
    >
      {img}
    </Link>
  );
}
