import type { Metadata } from "next";
import { Bebas_Neue, Outfit } from "next/font/google";
import VersionBadge from "@/components/VersionBadge";
import { HubBrandProvider } from "@/components/hub/HubBrandProvider";
import { bindClientHubSkus } from "@/lib/hub/modules";
import { loadRequestBrandKit } from "@/lib/hub/brandKit.server";
import { brandKitCssVars, brandKitGoogleFontsHref, DEFAULT_BRAND_KIT } from "@/lib/hub/brandKit";
import "./globals.css";

const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "TriForge Community",
  description:
    "The invite-only home base for TriForge Media creators — chat, TikTask, and everything you need to grow.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await bindClientHubSkus();
  const { kit, hubName, isClient } = await loadRequestBrandKit();
  const skin = isClient ? kit : DEFAULT_BRAND_KIT;
  const cssVars = isClient ? brandKitCssVars(skin) : undefined;
  const fontHref = isClient ? brandKitGoogleFontsHref(skin) : null;

  return (
    <html lang="en" style={cssVars}>
      <body
        className={`${bebasNeue.variable} ${outfit.variable} font-body antialiased bg-charcoal text-off-white ${
          isClient ? "hub-skin" : ""
        }`}
        style={cssVars}
      >
        {fontHref ? (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
            <link rel="stylesheet" href={fontHref} />
          </>
        ) : null}
        <HubBrandProvider logoUrl={isClient ? skin.logoUrl : null} hubName={isClient ? hubName : null}>
          {children}
          <VersionBadge />
        </HubBrandProvider>
      </body>
    </html>
  );
}
