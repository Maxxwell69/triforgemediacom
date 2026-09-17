"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";

/**
 * Jump to the latest message when entering a room, and keep following the
 * bottom while the user hasn't scrolled up to read history.
 */
export function useScrollToLatest(
  scrollRef: RefObject<HTMLDivElement | null>,
  _bottomRef: RefObject<HTMLDivElement | null>,
  deps: {
    roomKey: string;
    messageCount: number;
    latestMessageId: string | null;
  }
) {
  const pinnedRef = useRef(true);

  const scrollToLatest = useCallback(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    // Only set scrollTop — scrollIntoView on a nested scroller jumps the
    // whole iOS Safari viewport and can look like the chat crashed.
    scroller.scrollTop = scroller.scrollHeight;
  }, [scrollRef]);

  const scheduleScroll = useCallback(() => {
    const run = () => scrollToLatest();
    run();
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      run();
      raf2 = requestAnimationFrame(run);
    });
    const t1 = window.setTimeout(run, 50);
    const t2 = window.setTimeout(run, 200);
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [scrollToLatest]);

  // Entering a channel / DM: always land on the newest message.
  useEffect(() => {
    pinnedRef.current = true;
    return scheduleScroll();
  }, [deps.roomKey, scheduleScroll]);

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;

    function onScroll() {
      if (!scroller) return;
      const distance =
        scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;
      pinnedRef.current = distance < 140;
    }

    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", onScroll);
  }, [scrollRef, deps.roomKey]);

  // Message list updates: follow latest while pinned (includes post-nav hydrate).
  useEffect(() => {
    if (!pinnedRef.current) return;
    return scheduleScroll();
  }, [deps.messageCount, deps.latestMessageId, scheduleScroll]);
}
