"use client";

import { useState } from "react";
import { useHubBrand } from "@/components/hub/HubBrandProvider";

export default function HubDashboardLogo() {
  const brand = useHubBrand();
  const [broken, setBroken] = useState(false);
  if (!brand.logoUrl || !brand.hubName || broken) return null;

  return (
    <div className="mb-8">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={brand.logoUrl}
        alt={brand.hubName}
        onError={() => setBroken(true)}
        className="max-h-24 w-auto max-w-full object-contain sm:max-h-28"
      />
    </div>
  );
}
