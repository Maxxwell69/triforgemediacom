"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { setActiveGroupAction } from "@/app/(community)/groups/activeGroupActions";

/** Sets the active space cookie when landing on a group or its channel. */
export default function SyncActiveGroup({
  groupId,
  currentActiveId,
}: {
  groupId: string;
  currentActiveId: string | null;
}) {
  const router = useRouter();
  const synced = useRef(false);

  useEffect(() => {
    if (synced.current) return;
    if (!groupId || groupId === currentActiveId) return;
    synced.current = true;
    void setActiveGroupAction(groupId).then(() => router.refresh());
  }, [groupId, currentActiveId, router]);

  return null;
}
