"use client";

import { createContext, useContext, type ReactNode } from "react";

type HubBrandValue = {
  logoUrl: string | null;
  hubName: string | null;
};

const HubBrandContext = createContext<HubBrandValue>({ logoUrl: null, hubName: null });

export function HubBrandProvider({
  logoUrl,
  hubName,
  children,
}: HubBrandValue & { children: ReactNode }) {
  return (
    <HubBrandContext.Provider value={{ logoUrl, hubName }}>{children}</HubBrandContext.Provider>
  );
}

export function useHubBrand() {
  return useContext(HubBrandContext);
}
