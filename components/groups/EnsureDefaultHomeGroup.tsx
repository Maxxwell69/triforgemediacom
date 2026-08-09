"use client";

import { useEffect, useRef } from "react";
import { setActiveGroupAction } from "@/app/(community)/groups/activeGroupActions";

/**
 * First visit / first sign-in: persist Home as the active space when no
 * group cookie exists yet so channels open on Home by default.
 */
export default function EnsureDefaultHomeGroup({
  homeGroupId,
  hasCookie,
}: {
  homeGroupId: string | null;
  hasCookie: boolean;
}) {
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current || hasCookie || !homeGroupId) return;
    ran.current = true;
    void setActiveGroupAction(homeGroupId);
  }, [homeGroupId, hasCookie]);

  return null;
}
