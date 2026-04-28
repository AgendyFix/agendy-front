"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/tracking";

export function ScrollDepthTracker() {
  const milestones = useRef(new Set<number>());

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;

      const pct = Math.round((scrollTop / docHeight) * 100);

      for (const milestone of [25, 50, 75, 100]) {
        if (pct >= milestone && !milestones.current.has(milestone)) {
          milestones.current.add(milestone);
          trackEvent("scroll_depth", { depth: milestone, page: "landing" });
        }
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return null;
}
